import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pricing as staticPricing, type PricingOption } from "@/data/pricing";

type PricingGroups = typeof staticPricing;

type PackageRow = {
  slug: string;
  name: string;
  package_group: keyof typeof GROUP_TO_KEY;
  service_slug: string | null;
  price_centavos: number;
  original_price_centavos: number | null;
  credit_count: number | null;
  validity_description: string;
  description: string;
  included_services: string[] | null;
  conditions: string[] | null;
  is_recommended: boolean;
  recommended_label: string | null;
};

const GROUP_TO_KEY = {
  intro_offer: "introOffers",
  single_session: "singleSessions",
  package: "packages",
  membership: "memberships",
  private_session: "privateSessions",
  special_offer: "specialOffers",
} as const;

function formatCentavos(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}

function mapRow(row: PackageRow): PricingOption {
  return {
    slug: row.slug,
    name: row.name,
    price: formatCentavos(row.price_centavos),
    originalPrice: row.original_price_centavos != null ? formatCentavos(row.original_price_centavos) : undefined,
    sessions: row.credit_count ?? undefined,
    validity: row.validity_description,
    description: row.description,
    includedServices: row.included_services ?? [],
    conditions: row.conditions?.length ? row.conditions : undefined,
    recommended: row.is_recommended || undefined,
    recommendedLabel: row.recommended_label ?? undefined,
    serviceSlug: row.service_slug ?? undefined,
  };
}

/**
 * Admin-editable pricing catalog, backed by `public.packages`. Falls back to
 * the static `src/data/pricing.ts` groups (unconfigured Supabase, network
 * error, or the migration not having run yet) so the site never breaks.
 */
export async function getPricingGroups(): Promise<PricingGroups> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("packages")
      .select(
        "slug, name, package_group, service_slug, price_centavos, original_price_centavos, credit_count, validity_description, description, included_services, conditions, is_recommended, recommended_label"
      )
      .eq("is_active", true)
      .order("sort_order");

    if (error || !data || data.length === 0) return staticPricing;

    const grouped: PricingGroups = {
      introOffers: [],
      singleSessions: [],
      packages: [],
      memberships: [],
      privateSessions: [],
      specialOffers: [],
    };

    for (const row of data as PackageRow[]) {
      const key = GROUP_TO_KEY[row.package_group];
      if (key) grouped[key].push(mapRow(row));
    }

    return grouped;
  } catch {
    return staticPricing;
  }
}

export async function getPricingOptionBySlug(slug: string): Promise<PricingOption | undefined> {
  const groups = await getPricingGroups();
  return Object.values(groups)
    .flat()
    .find((option) => option.slug === slug);
}
