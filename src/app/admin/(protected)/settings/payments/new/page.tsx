import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/require-role";
import type { PaymentSettingFormValues } from "@/lib/validations";
import { PaymentSettingForm } from "@/components/admin/PaymentSettingForm";

export const metadata: Metadata = {
  title: "Add Payment Method",
  robots: { index: false, follow: false },
};

const DEFAULT_VALUES: PaymentSettingFormValues = {
  method: "bank_transfer",
  label: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  qrImageUrl: "",
  instructions: "",
  isActive: true,
  sortOrder: 0,
};

export default async function NewPaymentSettingPage() {
  await requireSuperAdmin();
  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Add Payment Method</h1>
      <div className="mt-6">
        <PaymentSettingForm defaultValues={DEFAULT_VALUES} />
      </div>
    </div>
  );
}
