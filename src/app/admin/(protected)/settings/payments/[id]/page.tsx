import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PaymentSettingFormValues } from "@/lib/validations";
import { PaymentSettingForm } from "@/components/admin/PaymentSettingForm";

export const metadata: Metadata = {
  title: "Edit Payment Method",
  robots: { index: false, follow: false },
};

type PaymentSettingDetailRow = {
  id: string;
  method: PaymentSettingFormValues["method"];
  label: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  qr_image_url: string | null;
  instructions: string | null;
  is_active: boolean;
  sort_order: number;
};

export default async function EditPaymentSettingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("payment_settings").select("*").eq("id", id).single();

  if (!data) notFound();
  const setting = data as PaymentSettingDetailRow;

  const defaultValues: PaymentSettingFormValues = {
    method: setting.method,
    label: setting.label,
    bankName: setting.bank_name ?? "",
    accountName: setting.account_name ?? "",
    accountNumber: setting.account_number ?? "",
    qrImageUrl: setting.qr_image_url ?? "",
    instructions: setting.instructions ?? "",
    isActive: setting.is_active,
    sortOrder: setting.sort_order,
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Edit Payment Method</h1>
      <div className="mt-6">
        <PaymentSettingForm settingId={setting.id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
