import type { Metadata } from "next";
import type { ServiceFormValues } from "@/lib/validations";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const metadata: Metadata = {
  title: "Create Service",
  robots: { index: false, follow: false },
};

const DEFAULT_VALUES: ServiceFormValues = {
  slug: "mat-pilates",
  name: "",
  category: "",
  shortDescription: "",
  description: "",
  duration: "",
  level: "",
  instructor: "",
  startingPrice: "",
  classVariants: "",
  imageSrc: "",
  imageAlt: "",
  imageCredit: "",
  isActive: true,
  sortOrder: 0,
};

export default function NewServicePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Create Service</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        The 6 service slugs are fixed (they&rsquo;re shared with packages and class scheduling) — use this only
        to recreate a service row if one was removed.
      </p>
      <div className="mt-6">
        <ServiceForm defaultValues={DEFAULT_VALUES} />
      </div>
    </div>
  );
}
