"use server";

import { revalidatePath } from "next/cache";
import { packageFormSchema, type PackageFormValues } from "@/lib/validations";
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

function toCentavos(value: number | string): number {
  return Math.round(Number(value) * 100);
}

function toRow(data: PackageFormValues) {
  return {
    slug: data.slug,
    name: data.name,
    category: data.category,
    package_group: data.packageGroup,
    service_slug: data.serviceSlug || null,
    price_centavos: toCentavos(data.price),
    original_price_centavos: data.originalPrice ? toCentavos(data.originalPrice) : null,
    credit_count: data.creditCount ? Number(data.creditCount) : null,
    validity_description: data.validityDescription,
    validity_days: data.validityDays ? Number(data.validityDays) : null,
    expires_from: data.expiresFrom,
    description: data.description,
    included_services: parseLines(data.includedServices),
    conditions: parseLines(data.conditions),
    is_recommended: data.isRecommended,
    recommended_label: data.isRecommended ? data.recommendedLabel || null : null,
    is_founder_offer: data.isFounderOffer,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  };
}

// Every admin write goes through requireAdmin() here AND relies on the
// packages_write_admin RLS policy (is_admin()) as a second, independent
// layer — a bug in this check alone would not be enough to let a customer
// write to the catalog.
export async function createPackageAction(values: PackageFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = packageFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("packages").insert(toRow(parsed.data));

  if (error) {
    if (error.code === "23505") return { error: "A package with this slug already exists." };
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/packages");
  revalidatePath("/pricing");
  return { success: true };
}

export async function updatePackageAction(id: string, values: PackageFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = packageFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("packages").update(toRow(parsed.data)).eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "A package with this slug already exists." };
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/packages");
  revalidatePath("/pricing");
  return { success: true };
}

// Used as a plain `<form action={...}>` handler (no client-side error UI),
// so failures throw rather than returning a value — Next.js surfaces an
// uncaught Server Action error via the nearest error boundary.
export async function setPackageActiveAction(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("packages").update({ is_active: isActive }).eq("id", id);

  if (error) throw new Error("Something went wrong while updating this package.");

  revalidatePath("/admin/packages");
  revalidatePath("/pricing");
}
