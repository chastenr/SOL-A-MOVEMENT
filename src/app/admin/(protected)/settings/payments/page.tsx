import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { setPaymentSettingActiveAction, deletePaymentSettingAction } from "./actions";

export const metadata: Metadata = {
  title: "Payment Settings",
  robots: { index: false, follow: false },
};

type PaymentSettingRow = {
  id: string;
  method: string;
  label: string;
  bank_name: string | null;
  account_number: string | null;
  is_active: boolean;
  sort_order: number;
};

export default async function AdminPaymentSettingsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("id, method, label, bank_name, account_number, is_active, sort_order")
    .order("sort_order");

  const settings = (data as PaymentSettingRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Payment Settings</h1>
        <Button href="/admin/settings/payments/new">Add Payment Method</Button>
      </div>
      <p className="mt-1 text-sm text-charcoal/55">
        Bank/GCash details customers see at checkout on <code>/purchases/[id]</code> while paying manually.
        Only active methods are shown.
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&rsquo;t load payment settings. Has the database migration been run yet? ({error.message})
        </p>
      )}

      {!error && settings.length === 0 && (
        <p className="mt-8 text-charcoal/60">
          No payment methods yet — customers see &ldquo;payment instructions are being finalized&rdquo; until
          you add one.
        </p>
      )}

      {settings.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Bank / Account</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/settings/payments/${setting.id}`} className="font-medium text-charcoal hover:underline">
                      {setting.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {setting.bank_name ?? "—"}
                    {setting.account_number ? ` · ${setting.account_number}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        setting.is_active
                          ? "rounded-full bg-clay/10 px-2.5 py-1 text-xs text-clay"
                          : "rounded-full bg-charcoal/10 px-2.5 py-1 text-xs text-charcoal/50"
                      }
                    >
                      {setting.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <form action={setPaymentSettingActiveAction.bind(null, setting.id, !setting.is_active)}>
                        <button type="submit" className="text-xs underline underline-offset-2 hover:text-charcoal">
                          {setting.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                      <form action={deletePaymentSettingAction.bind(null, setting.id)}>
                        <button type="submit" className="text-xs text-charcoal/40 underline underline-offset-2 hover:text-red-600">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
