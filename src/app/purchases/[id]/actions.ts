"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";
import { centavosToPeso } from "@/lib/money";
import { sendPaymentProofSubmittedEmail } from "@/lib/email";

type ActionResult = { error: string } | { success: true };

/**
 * "I Have Paid" — flips pending_payment -> proof_submitted. This is a plain
 * RLS-enforced update (see purchases_update_own_mark_paid in migration
 * 0001), not an RPC: the policy's USING/WITH CHECK clauses already make the
 * exact-one-legal-transition guarantee, and it can only ever move the
 * customer's OWN purchase, never anyone else's.
 *
 * Deliberately does NOT grant credits — only an admin's approve_purchase()
 * does that.
 */
export async function markPaidAction(purchaseId: string): Promise<ActionResult> {
  const user = await requireUser();

  const rateLimitKey = await getActionClientKey("mark-paid", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 10 * 60 * 1000, max: 10 })) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error, count } = await supabase
    .from("purchases")
    .update({ purchase_status: "proof_submitted" }, { count: "exact" })
    .eq("id", purchaseId)
    .eq("user_id", user.id)
    .select("package_name_snapshot, reference_number, total_amount_centavos")
    .single();

  if (error) return { error: "Something went wrong. Please try again." };
  if (!count) return { error: "This order can no longer be marked as paid." };

  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/admin/payments");

  // Fire-and-forget, same convention as the existing /api/book route —
  // email delivery never blocks or fails the customer-facing response.
  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
  void sendPaymentProofSubmittedEmail({
    customerEmail: user.email,
    customerFirstName: profile?.first_name || user.email,
    packageName: data.package_name_snapshot,
    referenceNumber: data.reference_number,
    amountFormatted: centavosToPeso(data.total_amount_centavos),
  });

  return { success: true };
}
