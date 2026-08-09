-- Veora Wellness — admin package granting + manual credit adjustment.
-- Additive, run after 0001-0008.
--
-- Two new admin-only capabilities, both requested directly by the client:
--   1. Grant a customer a package for free (a comp/promo) without them
--      going through the purchase/payment-proof flow at all.
--   2. Manually correct a customer's remaining credits, with a required
--      reason and a full ledger entry — never a silent balance edit.
--
-- Same pattern as every other privileged RPC in this project: SECURITY
-- DEFINER, re-checks is_admin() internally, writes an audit_logs row, never
-- trusts a client-supplied balance.

-- =========================================================================
-- 1. A distinct payment_method value for granted packages, so the admin
--    payments list can tell "real money came in" apart from a comp at a
--    glance rather than lumping it under 'other'.
-- =========================================================================

alter type public.payment_method add value 'complimentary';

-- =========================================================================
-- 2. admin_grant_package() — creates an already-approved $0 purchase +
--    customer_packages row in one transaction. Reuses the exact same
--    credit/expiry math as approve_purchase() (migration 0001/0008) so a
--    granted package behaves identically to a paid one from here on.
-- =========================================================================

create or replace function public.admin_grant_package(
  p_user_id uuid,
  p_package_id uuid,
  p_reference_number text,
  p_reason text default null
) returns table (purchase_id uuid, customer_package_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_package public.packages;
  v_purchase_id uuid;
  v_credit_count integer;
  v_customer_package_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may grant packages';
  end if;

  select * into v_package from public.packages where id = p_package_id;
  if v_package.id is null then
    raise exception 'package % not found', p_package_id;
  end if;

  v_credit_count := coalesce(v_package.credit_count, 1);

  insert into public.purchases
    (user_id, package_id, package_name_snapshot, price_centavos_snapshot, credit_count_snapshot,
     reference_number, subtotal_centavos, total_amount_centavos, currency, payment_method,
     payment_provider, purchase_status, approved_by, approved_at)
  values (
    p_user_id, p_package_id, v_package.name, 0, v_package.credit_count,
    p_reference_number, 0, 0, 'PHP', 'complimentary', 'manual_bank_transfer',
    'approved', auth.uid(), now()
  )
  returning id into v_purchase_id;

  insert into public.customer_packages
    (user_id, purchase_id, package_id, package_name_snapshot, credit_count, remaining_credits,
     status, activated_at, expires_at)
  values (
    p_user_id, v_purchase_id, p_package_id, v_package.name, v_credit_count, v_credit_count, 'active',
    case when v_package.expires_from = 'purchase' then now() else null end,
    case when v_package.expires_from = 'purchase' and v_package.validity_days is not null
         then now() + (v_package.validity_days || ' days')::interval
         else null end
  )
  returning id into v_customer_package_id;

  insert into public.package_credit_transactions
    (customer_package_id, purchase_id, amount, type, reason, balance_after, created_by)
  values (v_customer_package_id, v_purchase_id, v_credit_count, 'package_purchased',
          coalesce(p_reason, 'Complimentary grant by admin'), v_credit_count, auth.uid());

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'package.granted', 'customer_package', v_customer_package_id,
          jsonb_build_object('user_id', p_user_id, 'package_id', p_package_id, 'reason', p_reason));

  return query select v_purchase_id, v_customer_package_id;
end;
$$;

revoke execute on function public.admin_grant_package(uuid, uuid, text, text) from public;
grant execute on function public.admin_grant_package(uuid, uuid, text, text) to authenticated;

-- =========================================================================
-- 3. admin_adjust_customer_package_credits() — the only sanctioned way to
--    directly change remaining_credits outside the normal booking/refund
--    RPCs. Guarded by the same CHECK constraint as everything else
--    (remaining_credits between 0 and credit_count) — the guarded UPDATE's
--    WHERE clause is what actually enforces this atomically, not just the
--    application layer.
-- =========================================================================

create or replace function public.admin_adjust_customer_package_credits(
  p_customer_package_id uuid,
  p_delta integer,
  p_reason text
) returns table (remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_credit_count integer;
  v_new_remaining integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may adjust package credits';
  end if;
  if p_delta = 0 then
    raise exception 'adjustment amount must not be zero';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required for a credit adjustment';
  end if;

  select credit_count into v_credit_count from public.customer_packages where id = p_customer_package_id for update;
  if v_credit_count is null then
    raise exception 'customer package % not found', p_customer_package_id;
  end if;

  update public.customer_packages
     set remaining_credits = remaining_credits + p_delta,
         status = case
           when remaining_credits + p_delta <= 0 then 'exhausted'
           when status = 'exhausted' and remaining_credits + p_delta > 0 then 'active'
           else status
         end,
         updated_at = now()
   where id = p_customer_package_id
     and remaining_credits + p_delta >= 0
     and remaining_credits + p_delta <= credit_count
  returning remaining_credits into v_new_remaining;

  if v_new_remaining is null then
    raise exception 'adjustment would put remaining credits outside the allowed range (0 to %)', v_credit_count;
  end if;

  insert into public.package_credit_transactions
    (customer_package_id, amount, type, reason, balance_after, created_by)
  values (p_customer_package_id, p_delta, 'admin_adjustment', p_reason, v_new_remaining, auth.uid());

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'package.credits_adjusted', 'customer_package', p_customer_package_id,
          jsonb_build_object('delta', p_delta, 'reason', p_reason, 'new_balance', v_new_remaining));

  return query select v_new_remaining;
end;
$$;

revoke execute on function public.admin_adjust_customer_package_credits(uuid, integer, text) from public;
grant execute on function public.admin_adjust_customer_package_credits(uuid, integer, text) to authenticated;

-- =========================================================================
-- Manual verification (Supabase SQL editor, once applied):
-- =========================================================================
--
-- -- As an admin: grant a package to a specific customer (replace ids).
-- select * from public.admin_grant_package(
--   '<customer-auth-uid>', '<package-id>', 'VEO-TEST-00001', 'QA check'
-- );
-- -- Then confirm: select * from public.customer_packages where purchase_id =
-- -- (select id from public.purchases where reference_number = 'VEO-TEST-00001');
--
-- -- Adjust credits on that same customer_package (replace id):
-- select * from public.admin_adjust_customer_package_credits('<customer-package-id>', -1, 'QA check');
-- select * from public.admin_adjust_customer_package_credits('<customer-package-id>', 1, 'QA check revert');
--
-- -- As a non-admin (should raise "forbidden"):
-- set local request.jwt.claims = '{"sub":"<a-customer-uid>"}';
-- select * from public.admin_grant_package('<any-uid>', '<any-package-id>', 'VEO-TEST-00002', null);
