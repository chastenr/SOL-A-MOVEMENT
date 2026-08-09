-- Veora Wellness — lets an admin approve/reject a purchase straight from
-- "Pending" (no receipt uploaded yet), not only from "Proof Submitted".
--
-- Why: this studio verifies bank transfers manually (checking their own
-- bank/GCash app, or a screenshot sent over chat) rather than relying on
-- customers to use the in-app "upload receipt" step. Requiring
-- proof_submitted before Approve was blocking that real workflow — plenty
-- of legitimately-paid purchases were stuck on "Pending" with no way for
-- the admin to mark them paid.
--
-- The in-app receipt upload (pending_payment -> proof_submitted) still
-- exists and still works exactly as before for customers who use it —
-- this only widens what an admin can do, it doesn't remove anything.

create or replace function public.enforce_purchase_status_transition()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' and old.purchase_status is distinct from new.purchase_status then
    if not (
      (old.purchase_status = 'pending_payment' and new.purchase_status in ('proof_submitted', 'cancelled', 'expired', 'approved', 'rejected')) or
      (old.purchase_status = 'proof_submitted' and new.purchase_status in ('approved', 'rejected'))
    ) then
      raise exception 'illegal purchase_status transition: % -> %', old.purchase_status, new.purchase_status;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.approve_purchase(p_purchase_id uuid)
returns table (purchase_id uuid, customer_package_id uuid, already_processed boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases;
  v_package public.packages;
  v_credit_count integer;
  v_customer_package_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may approve purchases';
  end if;

  update public.purchases
     set purchase_status = 'approved', approved_by = auth.uid(), approved_at = now(), updated_at = now()
   where id = p_purchase_id and purchase_status in ('pending_payment', 'proof_submitted')
  returning * into v_purchase;

  if not found then
    select * into v_purchase from public.purchases where id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'approved' then
      select id into v_customer_package_id from public.customer_packages where purchase_id = p_purchase_id;
      return query select v_purchase.id, v_customer_package_id, true;
      return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;

  select * into v_package from public.packages where id = v_purchase.package_id;
  v_credit_count := coalesce(v_package.credit_count, 1); -- studio_rental products get a single "use"

  insert into public.customer_packages
    (user_id, purchase_id, package_id, package_name_snapshot, credit_count, remaining_credits,
     status, activated_at, expires_at)
  values (
    v_purchase.user_id, v_purchase.id, v_purchase.package_id, v_purchase.package_name_snapshot,
    v_credit_count, v_credit_count, 'active',
    case when v_package.expires_from = 'purchase' then now() else null end,
    case when v_package.expires_from = 'purchase' and v_package.validity_days is not null
         then now() + (v_package.validity_days || ' days')::interval
         else null end
  )
  returning id into v_customer_package_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'purchase.approved', 'purchase', v_purchase.id,
          jsonb_build_object('customer_package_id', v_customer_package_id,
                              'reference_number', v_purchase.reference_number));

  return query select v_purchase.id, v_customer_package_id, false;
end;
$$;

create or replace function public.reject_purchase(p_purchase_id uuid, p_reason text default null)
returns table (purchase_id uuid, already_processed boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may reject purchases';
  end if;

  update public.purchases
     set purchase_status = 'rejected', rejected_by = auth.uid(), rejected_at = now(),
         rejected_reason = p_reason, updated_at = now()
   where id = p_purchase_id and purchase_status in ('pending_payment', 'proof_submitted')
  returning * into v_purchase;

  if not found then
    select * into v_purchase from public.purchases where id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'rejected' then
      return query select v_purchase.id, true;
      return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'purchase.rejected', 'purchase', v_purchase.id,
          jsonb_build_object('reference_number', v_purchase.reference_number, 'reason', p_reason));

  return query select v_purchase.id, false;
end;
$$;
