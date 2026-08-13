import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { services as staticServices, type Service, type ServiceCategory } from "@/data/services";

type ServiceRow = {
  slug: string;
  name: string;
  category: string;
  short_description: string;
  description: string;
  duration: string;
  level: string;
  instructor: string | null;
  starting_price: string | null;
  class_variants: string[] | null;
  image_src: string;
  image_alt: string;
  image_credit: string | null;
};

function mapRow(row: ServiceRow): Service {
  const catalogDefaults = staticServices.find((service) => service.slug === row.slug);

  return {
    slug: row.slug,
    name: row.name,
    category: row.category as ServiceCategory,
    shortDescription: row.short_description,
    description: row.description,
    duration: row.duration,
    level: row.level,
    benefits: catalogDefaults?.benefits,
    instructor: row.instructor ?? undefined,
    startingPrice: row.starting_price ?? undefined,
    classVariants: row.class_variants?.length ? row.class_variants : undefined,
    image: {
      src: row.image_src,
      alt: row.image_alt,
      credit: row.image_credit ?? undefined,
    },
  };
}

/**
 * Admin-editable services catalog, backed by `public.services`. Falls back
 * to the static `src/data/services.ts` list (unconfigured Supabase, network
 * error, or the migration not having run yet) so the site never breaks.
 */
export async function getServices(): Promise<Service[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("services")
      .select("slug, name, category, short_description, description, duration, level, instructor, starting_price, class_variants, image_src, image_alt, image_credit")
      .eq("is_active", true)
      .order("sort_order");

    if (error || !data || data.length === 0) return staticServices;
    return data.map(mapRow);
  } catch {
    return staticServices;
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  const services = await getServices();
  return services.find((service) => service.slug === slug);
}
