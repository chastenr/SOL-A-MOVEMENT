import "server-only";
import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PackageDbRow } from "@/lib/catalog/packages";

// No 0/O/1/I/L — avoids visual ambiguity when a customer reads this back to
// support or types it into a bank transfer memo.
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSuffix(length = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => REF_ALPHABET[byte % REF_ALPHABET.length]).join("");
}

export function buildReferenceNumber(now: Date): string {
  return `VEO-${format(now, "yyyyMMdd")}-${randomSuffix()}`;
}

export type CreatePurchaseResult = { error: string } | { purchaseId: string };

/**
 * Creates the order/payment record BEFORE any payment instructions are
 * shown — the purchase row (status `pending_payment`) IS the payment
 * record; nothing here grants credits. Retries on a reference-number
 * collision (vanishingly rare) so a random duplicate never blocks checkout.
 */
export async function createPendingPurchase(userId: string, pkg: PackageDbRow): Promise<CreatePurchaseResult> {
  const supabase = await createSupabaseServerClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("purchases")
      .insert({
        user_id: userId,
        package_id: pkg.id,
        package_name_snapshot: pkg.name,
        price_centavos_snapshot: pkg.price_centavos,
        credit_count_snapshot: pkg.credit_count,
        reference_number: buildReferenceNumber(new Date()),
        subtotal_centavos: pkg.price_centavos,
        total_amount_centavos: pkg.price_centavos,
        currency: "PHP",
        payment_method: "bank_transfer",
        payment_provider: "manual_bank_transfer",
        purchase_status: "pending_payment",
      })
      .select("id")
      .single();

    if (!error && data) return { purchaseId: data.id };
    if (error && error.code !== "23505") {
      return { error: "Something went wrong creating your order. Please try again." };
    }
    // 23505 on reference_number: collision — loop and try a fresh suffix.
  }

  return { error: "Something went wrong creating your order. Please try again." };
}
