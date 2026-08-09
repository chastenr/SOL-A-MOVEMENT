-- Veora Wellness — fixes a real bug: uploading a payment receipt silently
-- failed to attach it to the purchase.
--
-- Root cause: "purchases_update_own_mark_paid" (migration 0001) only
-- allowed an update whose WITH CHECK left the row at purchase_status =
-- 'proof_submitted'. The receipt-upload route (/api/purchases/[id]/receipt)
-- updates only `receipt_url`, leaving purchase_status at 'pending_payment'
-- (the customer hasn't clicked "I Have Paid" yet) — so RLS silently
-- rejected that update (0 rows affected, no error raised — the exact
-- "UPDATE needs a matching WITH CHECK on the NEW row" RLS trap). The route
-- never checked that update's result, so it reported success anyway while
-- purchases.receipt_url stayed null, and "I Have Paid" then correctly (but
-- confusingly) refused with "Please upload a payment receipt before
-- confirming" — the receipt genuinely was never attached.
--
-- Fix: widen the WITH CHECK to also allow the row to stay at
-- 'pending_payment' — a customer can still only ever touch their OWN row,
-- and only while it's still pending; they still can never set it to
-- 'approved'/'rejected'/etc, only 'pending_payment' or 'proof_submitted'.

drop policy if exists "purchases_update_own_mark_paid" on public.purchases;

create policy "purchases_update_own_mark_paid" on public.purchases for update
  to authenticated
  using (user_id = auth.uid() and purchase_status = 'pending_payment')
  with check (user_id = auth.uid() and purchase_status in ('pending_payment', 'proof_submitted'));
