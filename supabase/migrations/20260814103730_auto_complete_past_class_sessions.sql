-- Automatically close class sessions after their actual end time. Booking
-- attendance remains separate so staff can still record attended/no-show for
-- each customer without changing credits or cancelled bookings.
create or replace function public.complete_past_class_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed integer := 0;
begin
  with completed_sessions as (
    update public.class_sessions
       set status = 'completed',
           booking_enabled = false,
           updated_at = now()
     where status = 'scheduled'
       and end_at <= now()
     returning id
  ), audited_sessions as (
    insert into public.audit_logs
      (actor_id, actor_role, action, entity_type, entity_id, metadata)
    select null, null, 'class_session.auto_completed', 'class_session', id,
           jsonb_build_object('reason', 'end_time_passed')
      from completed_sessions
    returning 1
  )
  select count(*)::integer into v_completed from audited_sessions;

  return v_completed;
end;
$$;

revoke execute on function public.complete_past_class_sessions() from public, authenticated, anon;
grant execute on function public.complete_past_class_sessions() to service_role;

-- Clean up existing historical rows immediately when this migration lands;
-- later rows are handled by the nightly cron before new sessions are created.
select public.complete_past_class_sessions();
