import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pricing as staticPricing, type PricingOption } from "@/data/pricing";
import { centavosToPeso } from "@/lib/money";

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

function mapRow(row: PackageRow): PricingOption {
  return {
    slug: row.slug,
    name: row.name,
    price: centavosToPeso(row.price_centavos),
    originalPrice: row.original_price_centavos != null ? centavosToPeso(row.original_price_centavos) : undefined,
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

export type PackageDbRow = {
  id: string;
  slug: string;
  name: string;
  price_centavos: number;
  credit_count: number | null;
  validity_description: string;
  included_services: string[];
};

/**
 * Raw DB row (with the real `id`/`price_centavos`) for checkout — unlike
 * `getPricingOptionBySlug`, this has NO static fallback: a purchase must
 * reference a real `packages.id`, so checkout can only proceed against a
 * live database row. Returns null if the package doesn't exist, is
 * inactive, or the database isn't reachable — callers must treat all three
 * the same way (checkout unavailable), never fabricate a package.
 */
export async function getPackageRowBySlug(slug: string): Promise<PackageDbRow | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("packages")
      .select("id, slug, name, price_centavos, credit_count, validity_description, included_services")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return data as PackageDbRow;
  } catch {
    return null;
  }
}
