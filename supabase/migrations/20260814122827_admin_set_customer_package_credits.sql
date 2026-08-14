-- Let an admin set a package's available-credit balance atomically. The
-- existing delta-based adjustment RPC remains available for compatibility,
-- while this function matches the admin UI's explicit "new balance" field.

create or replace function public.admin_set_customer_package_credits(
  p_customer_package_id uuid,
  p_new_balance integer,
  p_reason text
) returns table (remaining_credits integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_package public.customer_packages;
  v_delta integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may update package credits';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required for a credit adjustment';
  end if;

  select cp.*
    into v_package
    from public.customer_packages as cp
   where cp.id = p_customer_package_id
   for update;

  if v_package.id is null then
    raise exception 'customer package % not found', p_customer_package_id;
  end if;

  if v_package.status not in ('active', 'exhausted') then
    raise exception 'credits can only be updated for an active or exhausted package';
  end if;

  if p_new_balance < 0 or p_new_balance > v_package.credit_count then
    raise exception 'new balance must be between 0 and %', v_package.credit_count;
  end if;

  v_delta := p_new_balance - v_package.remaining_credits;
  if v_delta = 0 then
    raise exception 'new balance must be different from the current balance';
  end if;

  update public.customer_packages as cp
     set remaining_credits = p_new_balance,
         status = case when p_new_balance = 0 then 'exhausted' else 'active' end,
         updated_at = now()
   where cp.id = p_customer_package_id;

  insert into public.package_credit_transactions
    (customer_package_id, amount, type, reason, balance_after, created_by)
  values
    (p_customer_package_id, v_delta, 'admin_adjustment', trim(p_reason), p_new_balance, auth.uid());

  insert into public.audit_logs
    (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values
    (auth.uid(), (select p.role from public.profiles as p where p.id = auth.uid()),
     'package.credits_adjusted', 'customer_package', p_customer_package_id,
     jsonb_build_object(
       'previous_balance', v_package.remaining_credits,
       'new_balance', p_new_balance,
       'delta', v_delta,
       'reason', trim(p_reason)
     ));

  return query select p_new_balance;
end;
$$;

revoke execute on function public.admin_set_customer_package_credits(uuid, integer, text) from public;
revoke execute on function public.admin_set_customer_package_credits(uuid, integer, text) from anon;
grant execute on function public.admin_set_customer_package_credits(uuid, integer, text) to authenticated;
