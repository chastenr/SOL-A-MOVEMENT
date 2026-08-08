import type { Metadata } from "next";
import type { PackageFormValues } from "@/lib/validations";
import { PackageForm } from "@/components/admin/PackageForm";

export const metadata: Metadata = {
  title: "Create Package",
  robots: { index: false, follow: false },
};

const DEFAULT_VALUES: PackageFormValues = {
  slug: "",
  name: "",
  category: "classic",
  packageGroup: "package",
  serviceSlug: "",
  price: 0,
  originalPrice: "",
  creditCount: "",
  validityDescription: "",
  validityDays: "",
  expiresFrom: "purchase",
  description: "",
  includedServices: "",
  conditions: "",
  isRecommended: false,
  recommendedLabel: "",
  isFounderOffer: false,
  isActive: true,
  sortOrder: 0,
};

export default function NewPackagePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Create Package</h1>
      <div className="mt-6">
        <PackageForm defaultValues={DEFAULT_VALUES} />
      </div>
    </div>
  );
}
