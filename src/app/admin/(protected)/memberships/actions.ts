"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const membershipIdSchema = z.string().uuid();
const notesSchema = z.string().trim().max(500);

function refreshMembershipViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/memberships");
  revalidatePath("/admin/notifications");
  revalidatePath("/account");
  revalidatePath("/account/book");
}

export async function recordMembershipPaymentAction(membershipId: string, formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const parsedId = membershipIdSchema.safeParse(membershipId);
  const reference = notesSchema.safeParse(String(formData.get("reference") ?? ""));
  const notes = notesSchema.safeParse(String(formData.get("notes") ?? ""));
  if (!parsedId.success || !reference.success || !notes.success) throw new Error("Invalid membership payment details.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_record_membership_payment", {
    p_membership_id: parsedId.data,
    p_payment_reference: reference.data || null,
    p_notes: notes.data || null,
  });
  if (error) throw new Error("The membership payment could not be recorded.");
  refreshMembershipViews();
}

export async function setMembershipStatusAction(
  membershipId: string,
  status: "active" | "suspended" | "cancelled",
  formData: FormData
): Promise<void> {
  await requireSuperAdmin();
  const parsedId = membershipIdSchema.safeParse(membershipId);
  const parsedStatus = z.enum(["active", "suspended", "cancelled"]).safeParse(status);
  const notes = notesSchema.safeParse(String(formData.get("notes") ?? ""));
  if (!parsedId.success || !parsedStatus.success || !notes.success) throw new Error("Invalid membership update.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_membership_status", {
    p_membership_id: parsedId.data,
    p_status: parsedStatus.data,
    p_notes: notes.data || null,
  });
  if (error) throw new Error("The membership status could not be updated.");
  refreshMembershipViews();
}

export async function markMembershipPaymentIssueAction(
  membershipId: string,
  issue: "past_due" | "failed"
): Promise<void> {
  await requireSuperAdmin();
  const parsedId = membershipIdSchema.safeParse(membershipId);
  const parsedIssue = z.enum(["past_due", "failed"]).safeParse(issue);
  if (!parsedId.success || !parsedIssue.success) throw new Error("Invalid membership payment update.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_mark_membership_payment_issue", {
    p_membership_id: parsedId.data,
    p_issue: parsedIssue.data,
    p_notes: null,
  });
  if (error) throw new Error("The membership payment status could not be updated.");
  refreshMembershipViews();
}
