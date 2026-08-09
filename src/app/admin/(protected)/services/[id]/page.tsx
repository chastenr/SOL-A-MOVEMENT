import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceFormValues } from "@/lib/validations";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const metadata: Metadata = {
  title: "Edit Service",
  robots: { index: false, follow: false },
};

type ServiceDetailRow = {
  id: string;
  slug: ServiceFormValues["slug"];
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
  is_active: boolean;
  sort_order: number;
};

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("services").select("*").eq("id", id).single();

  if (!data) notFound();
  const service = data as ServiceDetailRow;

  const defaultValues: ServiceFormValues = {
    slug: service.slug,
    name: service.name,
    category: service.category,
    shortDescription: service.short_description,
    description: service.description,
    duration: service.duration,
    level: service.level,
    instructor: service.instructor ?? "",
    startingPrice: service.starting_price ?? "",
    classVariants: (service.class_variants ?? []).join("\n"),
    imageSrc: service.image_src,
    imageAlt: service.image_alt,
    imageCredit: service.image_credit ?? "",
    isActive: service.is_active,
    sortOrder: service.sort_order,
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Edit Service</h1>
      <div className="mt-6">
        <ServiceForm serviceId={service.id} defaultValues={defaultValues} lockSlug />
      </div>
    </div>
  );
}
