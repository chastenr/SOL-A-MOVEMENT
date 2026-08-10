-- Speeds up the admin panel's list pages (Bookings, Calendar, Payments,
-- Customers). Every one of them runs an `order by <col> desc limit N` query
-- with no matching index, so Postgres has to sequentially scan and sort the
-- *entire* table on every page load — and it gets slower every day as more
-- bookings/purchases/customers are added, even though only ~200 rows are
-- ever displayed at once.

-- src/lib/admin/bookings.ts: getAdminBookings() — backs /admin/bookings (no
-- filters applied by default) and /admin/calendar (every month/week/day
-- navigation re-runs this). Both order by booked_at desc with no index on
-- that column at all.
create index class_bookings_booked_at_idx on public.class_bookings (booked_at desc);

-- Same query, but with the Bookings page's status filter (Confirmed/
-- Completed/Cancelled/No Show) applied at the database level.
create index class_bookings_status_booked_at_idx on public.class_bookings (status, booked_at desc);

-- src/lib/admin/customers.ts / users.ts: both always filter role and order
-- by created_at desc. The old single-column role index can't satisfy the
-- ordering, so Postgres index-scans by role and then sorts every matching
-- row before applying the limit. Superseded by the composite below.
drop index public.profiles_role_idx;
create index profiles_role_created_idx on public.profiles (role, created_at desc);

-- src/lib/admin/payments.ts: getAdminPurchases() — backs /admin/payments.
-- The default "All" tab has no status filter and orders by created_at desc
-- across the whole table; the existing (user_id, created_at) index doesn't
-- apply here since there's no user filter.
create index purchases_created_idx on public.purchases (created_at desc);

-- Same query with a status tab selected (Pending/Proof Submitted/Paid/
-- Rejected). Supersedes the old single-column status index.
drop index public.purchases_status_idx;
create index purchases_status_created_idx on public.purchases (purchase_status, created_at desc);

-- src/lib/admin/audit-logs.ts: getAuditLogs() with an `action` filter
-- applied (the existing created_at-only index already covers the
-- unfiltered "All actions" view).
create index audit_logs_action_created_idx on public.audit_logs (action, created_at desc);
