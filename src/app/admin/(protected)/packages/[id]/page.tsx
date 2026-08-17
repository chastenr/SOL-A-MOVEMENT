import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PackageFormValues } from "@/lib/validations";
import { PackageForm } from "@/components/admin/PackageForm";

export const metadata: Metadata = {
  title: "Edit Package",
  robots: { index: false, follow: false },
};

type PackageDetailRow = {
  id: string;
  slug: string;
  name: string;
  category: PackageFormValues["category"];
  package_group: PackageFormValues["packageGroup"];
  service_slug: string | null;
  price_centavos: number;
  original_price_centavos: number | null;
  credit_count: number | null;
  validity_description: string;
  validity_days: number | null;
  expires_from: PackageFormValues["expiresFrom"];
  description: string;
  included_services: string[] | null;
  conditions: string[] | null;
  is_recommended: boolean;
  recommended_label: string | null;
  is_founder_offer: boolean;
  is_active: boolean;
  sort_order: number;
  entitlement_type: "credits" | "unlimited";
  membership_duration_months: number | null;
};

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("packages").select("*").eq("id", id).single();

  if (!data) notFound();
  const pkg = data as PackageDetailRow;

  const defaultValues: PackageFormValues = {
    slug: pkg.slug,
    name: pkg.name,
    category: pkg.category,
    packageGroup: pkg.package_group,
    serviceSlug: (pkg.service_slug as PackageFormValues["serviceSlug"]) || "",
    price: pkg.price_centavos / 100,
    originalPrice: pkg.original_price_centavos != null ? pkg.original_price_centavos / 100 : "",
    creditCount: pkg.credit_count ?? "",
    validityDescription: pkg.validity_description,
    validityDays: pkg.validity_days ?? "",
    expiresFrom: pkg.expires_from,
    description: pkg.description,
    includedServices: (pkg.included_services ?? []).join("\n"),
    conditions: (pkg.conditions ?? []).join("\n"),
    isRecommended: pkg.is_recommended,
    recommendedLabel: pkg.recommended_label ?? "",
    isFounderOffer: pkg.is_founder_offer,
    isActive: pkg.is_active,
    sortOrder: pkg.sort_order,
    entitlementType: pkg.entitlement_type,
    membershipDurationMonths: pkg.membership_duration_months ?? "",
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Edit Package</h1>
      <div className="mt-6">
        <PackageForm packageId={pkg.id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
