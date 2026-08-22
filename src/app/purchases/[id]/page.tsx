import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { centavosToPeso } from "@/lib/money";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { PurchasePaymentActions } from "@/components/checkout/PurchasePaymentActions";

export const metadata: Metadata = {
  title: "Your Order",
  robots: { index: false, follow: false },
};

type PurchaseRow = {
  id: string;
  package_name_snapshot: string;
  price_centavos_snapshot: number;
  reference_number: string;
  total_amount_centavos: number;
  currency: string;
  purchase_status: "pending_payment" | "proof_submitted" | "approved" | "rejected" | "cancelled" | "expired";
  rejected_reason: string | null;
  receipt_url: string | null;
};

type PaymentSettingRow = {
  method: string;
  label: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  qr_image_url: string | null;
  instructions: string | null;
};

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: purchaseData } = await supabase
    .from("purchases")
    .select(
      "id, package_name_snapshot, price_centavos_snapshot, reference_number, total_amount_centavos, currency, purchase_status, rejected_reason, receipt_url, user_id"
    )
    .eq("id", id)
    .single();

  if (!purchaseData || purchaseData.user_id !== user.id) notFound();
  const purchase = purchaseData as PurchaseRow & { user_id: string };

  const { data: settingsData } = await supabase
    .from("payment_settings")
    .select("method, label, account_name, account_number, bank_name, qr_image_url, instructions")
    .eq("is_active", true)
    .order("sort_order");
  const paymentSettings = (settingsData ?? []) as PaymentSettingRow[];

  return (
    <section className="mx-auto max-w-2xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading eyebrow="Your Order" heading={purchase.package_name_snapshot} />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-6 sm:p-8">
        <div className="flex items-baseline justify-between">
          <p className="text-charcoal/60">Amount Due</p>
          <p className="font-display text-3xl text-charcoal">{centavosToPeso(purchase.total_amount_centavos)}</p>
        </div>
        <p className="mt-1 text-xs uppercase tracking-[0.1em] text-charcoal/45">
          Reference: <span className="text-charcoal">{purchase.reference_number}</span>
        </p>

        {purchase.purchase_status === "pending_payment" && (
          <>
            <div className="mt-6 space-y-5 border-t border-charcoal/10 pt-6">
              {paymentSettings.length === 0 ? (
                <p className="text-sm text-charcoal/60">
                  Payment instructions are being finalized. Please check back shortly or contact us with your
                  reference number above.
                </p>
              ) : (
                paymentSettings.map((setting) => (
                  <div key={setting.label} className="rounded-xl bg-cream/50 p-4">
                    <p className="text-xs uppercase tracking-[0.1em] text-charcoal/45">{setting.label}</p>
                    {setting.bank_name && <p className="mt-1 text-charcoal">{setting.bank_name}</p>}
                    {setting.account_name && <p className="text-charcoal/70">{setting.account_name}</p>}
                    {setting.account_number && <p className="text-charcoal/70">{setting.account_number}</p>}
                    {setting.qr_image_url && (
                      // Plain <img>, not next/image: the URL is admin-entered
                      // at runtime (payment_settings.qr_image_url) and may not
                      // be on an allow-listed image host — this is a
                      // customer-facing payment page, so it must render
                      // regardless rather than throw on an unconfigured host.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={setting.qr_image_url}
                        alt={`${setting.label} QR code`}
                        width={200}
                        height={200}
                        className="mt-3 rounded-lg"
                      />
                    )}
                    {setting.instructions && <p className="mt-2 text-sm text-charcoal/60">{setting.instructions}</p>}
                  </div>
                ))
              )}
            </div>

            <PurchasePaymentActions purchaseId={purchase.id} hasReceipt={Boolean(purchase.receipt_url)} />
          </>
        )}

        {purchase.purchase_status === "proof_submitted" && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-charcoal/10 bg-cream/50 px-4 py-4">
            <Clock size={18} className="mt-0.5 shrink-0 text-charcoal/50" aria-hidden />
            <div>
              <p className="text-charcoal">Waiting for payment confirmation.</p>
              <p className="mt-1 text-sm text-charcoal/60">
                We&rsquo;ve received your payment notice and will confirm it shortly. You&rsquo;ll get an email once
                it&rsquo;s approved.
              </p>
            </div>
          </div>
        )}

        {purchase.purchase_status === "approved" && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="text-emerald-800">Payment approved — your booking access is active.</p>
              <Button href="/account" size="md" className="mt-3">
                Go to My Account
              </Button>
            </div>
          </div>
        )}

        {purchase.purchase_status === "rejected" && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
            <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
            <div>
              <p className="text-red-800">This payment could not be verified.</p>
              {purchase.rejected_reason && <p className="mt-1 text-sm text-red-700">{purchase.rejected_reason}</p>}
              <Button href="/contact" size="md" variant="secondary" className="mt-3">
                Contact Us
              </Button>
            </div>
          </div>
        )}
      </AnimatedSection>
    </section>
  );
}
