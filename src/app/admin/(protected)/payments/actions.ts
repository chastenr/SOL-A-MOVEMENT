"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { centavosToPeso } from "@/lib/money";
import { sendPurchaseApprovedEmail, sendPurchaseRejectedEmail } from "@/lib/email";

type ActionResult = { error: string } | { success: true; alreadyProcessed: boolean };

// approve_purchase()/reject_purchase() only return an idempotent
// already_processed:true for a repeat of the SAME action — re-approving
// something that's since been rejected (or vice versa, e.g. two admins
// reviewing the same payment on stale pages) still raises this raw Postgres
// message. Map it to something a non-technical admin can act on.
function friendlyPurchaseActionError(message: string): string {
  if (message.includes("is not awaiting approval")) {
    return "This payment has already been reviewed by someone else — refresh the page to see its current status.";
  }
  if (message.includes("not found")) {
    return "This payment could not be found — it may have been removed.";
  }
  return message || "Something went wrong. Please try again.";
}

/**
 * Approval is atomic (see approve_purchase() in migration 0001): it can only
 * move a purchase out of `proof_submitted` once, so a double-click or two
 * admins racing both land on the same idempotent "already processed"
 * result — neither can issue a second set of credits. Email is sent AFTER
 * the RPC commits and is skipped on an already-processed repeat call, so
 * clicking Approve twice doesn't resend the confirmation.
 */
export async function approvePurchaseAction(purchaseId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("approve_purchase", { p_purchase_id: purchaseId }).single();
  if (error) return { error: friendlyPurchaseActionError(error.message) };

  const result = data as { purchase_id: string; customer_package_id: string; already_processed: boolean };

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${purchaseId}`);

  if (!result.already_processed) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("user_id, package_name_snapshot, reference_number, total_amount_centavos")
      .eq("id", purchaseId)
      .single();

    if (purchase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, email")
        .eq("id", purchase.user_id)
        .single();

      void sendPurchaseApprovedEmail({
        customerEmail: profile?.email ?? "",
        customerFirstName: profile?.first_name || "there",
        packageName: purchase.package_name_snapshot,
        referenceNumber: purchase.reference_number,
        amountFormatted: centavosToPeso(purchase.total_amount_centavos),
      });
    }
  }

  return { success: true, alreadyProcessed: result.already_processed };
}

export async function rejectPurchaseAction(purchaseId: string, reason: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .rpc("reject_purchase", { p_purchase_id: purchaseId, p_reason: reason || null })
    .single();
  if (error) return { error: friendlyPurchaseActionError(error.message) };

  const result = data as { purchase_id: string; already_processed: boolean };

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${purchaseId}`);

  if (!result.already_processed) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("user_id, package_name_snapshot, reference_number, total_amount_centavos")
      .eq("id", purchaseId)
      .single();

    if (purchase) {
      const { data: profile } = await supabase.from("profiles").select("first_name, email").eq("id", purchase.user_id).single();
      void sendPurchaseRejectedEmail({
        customerEmail: profile?.email ?? "",
        customerFirstName: profile?.first_name || "there",
        packageName: purchase.package_name_snapshot,
        referenceNumber: purchase.reference_number,
        amountFormatted: centavosToPeso(purchase.total_amount_centavos),
        reason,
      });
    }
  }

  return { success: true, alreadyProcessed: result.already_processed };
}
