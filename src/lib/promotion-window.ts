export const OPENING_PROMOTION = {
  startsAt: "2026-08-22T00:00:00+08:00",
  endsAt: "2026-10-01T00:00:00+08:00",
  eligiblePackageSlugs: [
    "6-month-unlimited",
    "12-month-unlimited",
  ],
} as const;

export function calculatePromotionalPriceCentavos(regularPriceCentavos: number, discountPercent: number): number {
  if (discountPercent <= 0 || discountPercent > 50) {
    throw new RangeError("Veora promotional discounts must be greater than 0% and no more than 50%.");
  }
  return Math.round(regularPriceCentavos * (1 - discountPercent / 100));
}

export function isPromotionActive(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (!startsAt && !endsAt) return false;

  const startsOnTime = !startsAt || now >= new Date(startsAt).getTime();
  const endsOnTime = !endsAt || now < new Date(endsAt).getTime();
  return startsOnTime && endsOnTime;
}
