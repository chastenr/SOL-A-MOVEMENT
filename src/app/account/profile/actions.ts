"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePhoneE164 } from "@/lib/phone";

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  mobileNumber: z.string().trim().min(1, "Mobile number is required."),
  birthday: z.string().trim().optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ActionResult = { error: string } | { success: true };

export async function updateProfileAction(values: ProfileFormValues): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const mobileNumber = normalizePhoneE164(parsed.data.mobileNumber);
  if (!mobileNumber) return { error: "Enter a valid mobile number." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("profiles").select("mobile_number").eq("id", user.id).single();
  const phoneChanged = existing?.mobile_number !== mobileNumber;

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      mobile_number: mobileNumber,
      birthday: parsed.data.birthday || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Something went wrong. Please try again." };

  // A verified phone factor is tied to the exact number that was verified —
  // if the customer changes their number here, the old verification no
  // longer describes it, so require re-verification rather than leaving a
  // stale "verified" flag pointing at a number that's no longer current.
  if (phoneChanged) {
    await supabase.rpc("clear_phone_verification");
  }

  revalidatePath("/account/profile");
  revalidatePath("/account");
  return { success: true };
}
