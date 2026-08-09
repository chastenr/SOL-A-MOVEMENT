"use server";

import { revalidatePath } from "next/cache";
import { paymentSettingFormSchema, type PaymentSettingFormValues } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | { success: true };

function toRow(data: PaymentSettingFormValues) {
  return {
    method: data.method,
    label: data.label,
    bank_name: data.bankName || null,
    account_name: data.accountName || null,
    account_number: data.accountNumber || null,
    qr_image_url: data.qrImageUrl || null,
    instructions: data.instructions || null,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  };
}

// requireAdmin() here + the payment_settings_write_admin RLS policy
// (is_admin()) are two independent layers — see src/lib/auth/require-role.ts.
export async function createPaymentSettingAction(values: PaymentSettingFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = paymentSettingFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_settings").insert(toRow(parsed.data));
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/settings/payments");
  revalidatePath("/purchases");
  return { success: true };
}

export async function updatePaymentSettingAction(
  id: string,
  values: PaymentSettingFormValues
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = paymentSettingFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_settings").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/settings/payments");
  revalidatePath("/purchases");
  return { success: true };
}

// Plain <form action={...}> handlers (no client-side error UI) — failures
// throw rather than returning a value, same convention as
// setServiceActiveAction.
export async function setPaymentSettingActiveAction(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_settings").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error("Something went wrong.");

  revalidatePath("/admin/settings/payments");
  revalidatePath("/purchases");
}

export async function deletePaymentSettingAction(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_settings").delete().eq("id", id);
  if (error) throw new Error("Something went wrong.");

  revalidatePath("/admin/settings/payments");
  revalidatePath("/purchases");
}
