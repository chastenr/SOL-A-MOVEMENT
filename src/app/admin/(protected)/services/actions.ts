"use server";

import { revalidatePath } from "next/cache";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | { success: true };

function parseLines(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toRow(data: ServiceFormValues) {
  return {
    slug: data.slug,
    name: data.name,
    category: data.category,
    short_description: data.shortDescription,
    description: data.description,
    duration: data.duration,
    level: data.level,
    instructor: data.instructor || null,
    starting_price: data.startingPrice || null,
    class_variants: parseLines(data.classVariants),
    image_src: data.imageSrc,
    image_alt: data.imageAlt,
    image_credit: data.imageCredit || null,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  };
}

// requireAdmin() here + the services_write_admin RLS policy (is_admin()) are
// two independent layers — see src/lib/auth/require-role.ts.
export async function createServiceAction(values: ServiceFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").insert(toRow(parsed.data));

  if (error) {
    if (error.code === "23505") return { error: "A service with this slug already exists." };
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  revalidatePath("/book");
  return { success: true };
}

export async function updateServiceAction(id: string, values: ServiceFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update(toRow(parsed.data)).eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "A service with this slug already exists." };
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  revalidatePath("/book");
  return { success: true };
}

// Used as a plain `<form action={...}>` handler (no client-side error UI),
// so failures throw rather than returning a value — Next.js surfaces an
// uncaught Server Action error via the nearest error boundary.
export async function setServiceActiveAction(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);

  if (error) throw new Error("Something went wrong while updating this service.");

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  revalidatePath("/book");
}
