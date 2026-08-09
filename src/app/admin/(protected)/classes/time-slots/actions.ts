"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Plain <form action={...}> handler (no client-side error UI) — failures
// throw rather than returning a value, same convention as
// setPaymentSettingActiveAction.
export async function setClassTimeSlotActiveAction(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("class_time_slots").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error("Something went wrong.");

  revalidatePath("/admin/classes/time-slots");
  revalidatePath("/admin/classes/new");
}
