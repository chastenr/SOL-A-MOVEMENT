"use server";

import { redirect } from "next/navigation";
import { requireVerifiedCustomer } from "@/lib/auth/require-role";
import { getPackageRowBySlug } from "@/lib/catalog/packages";
import { createPendingPurchase } from "@/lib/purchases";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";

// Plain <form action> — no client-side error UI on this step, so failures
// redirect back to checkout with a flag rather than returning a value.
export async function createPurchaseAction(packageSlug: string): Promise<void> {
  const user = await requireVerifiedCustomer(`/checkout/${packageSlug}`);

  const rateLimitKey = await getActionClientKey("checkout", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 10 * 60 * 1000, max: 10 })) {
    redirect(`/checkout/${packageSlug}?error=rate_limited`);
  }

  const pkg = await getPackageRowBySlug(packageSlug);
  if (!pkg) redirect("/pricing");

  const result = await createPendingPurchase(user.id, pkg);
  if ("error" in result) {
    redirect(`/checkout/${packageSlug}?error=1`);
  }

  redirect(`/purchases/${result.purchaseId}`);
}
