"use server";

import { revalidatePath } from "next/cache";
import { grantPackageSchema, adjustCreditsSchema, type GrantPackageValues, type AdjustCreditsValues } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildReferenceNumber } from "@/lib/purchases";
import { centavosToPeso } from "@/lib/money";
import { sendPurchaseApprovedEmail } from "@/lib/email";

type ActionResult = { error: string } | { success: true };

/**
 * Grants a package for free — creates an already-approved $0 purchase +
 * active customer_packages row via admin_grant_package() (migration 0009),
 * then emails the customer the same "payment confirmed" notice a real
 * purchase would get, so the experience is identical either way.
 */
export async function grantPackageAction(values: GrantPackageValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = grantPackageSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();

  const { data: pkg } = await supabase.from("packages").select("name").eq("id", parsed.data.packageId).single();
  if (!pkg) return { error: "That package could not be found." };

  let referenceNumber = buildReferenceNumber(new Date());
  let error: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error: rpcError } = await supabase.rpc("admin_grant_package", {
      p_user_id: parsed.data.userId,
      p_package_id: parsed.data.packageId,
      p_reference_number: referenceNumber,
      p_reason: parsed.data.reason || null,
    });
    if (!rpcError) {
      error = null;
      break;
    }
    if (rpcError.code !== "23505") {
      error = rpcError;
      break;
    }
    referenceNumber = buildReferenceNumber(new Date());
  }

  if (error) return { error: "Something went wrong. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, email")
    .eq("id", parsed.data.userId)
    .single();

  if (profile) {
    void sendPurchaseApprovedEmail({
      customerEmail: profile.email,
      customerFirstName: profile.first_name || profile.email,
      packageName: pkg.name,
      referenceNumber,
      amountFormatted: centavosToPeso(0),
    });
  }

  revalidatePath(`/admin/customers/${parsed.data.userId}`);
  revalidatePath("/admin/payments");
  return { success: true };
}

export async function adjustCreditsAction(values: AdjustCreditsValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = adjustCreditsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { data: pkgRow } = await supabase
    .from("customer_packages")
    .select("user_id")
    .eq("id", parsed.data.customerPackageId)
    .single();

  const { error } = await supabase.rpc("admin_set_customer_package_credits", {
    p_customer_package_id: parsed.data.customerPackageId,
    p_new_balance: parsed.data.newBalance,
    p_reason: parsed.data.reason,
  });

  if (error) return { error: error.message || "Something went wrong. Please try again." };

  if (pkgRow) revalidatePath(`/admin/customers/${pkgRow.user_id}`);
  revalidatePath("/admin/customers");
  if (pkgRow) {
    revalidatePath("/account");
    revalidatePath("/account/book");
    revalidatePath("/account/packages");
  }
  return { success: true };
}
