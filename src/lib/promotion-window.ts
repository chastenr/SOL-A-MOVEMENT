export const SEPTEMBER_PRE_OPENING_PROMOTION = {
  startsAt: "2026-09-01T00:00:00+08:00",
  endsAt: "2026-10-01T00:00:00+08:00",
  discountPercent: 9,
  eligiblePackageSlugs: [
    "3-class-package",
    "6-class-package",
    "veora-unlimited",
    "6-month-unlimited",
    "12-month-unlimited",
  ],
} as const;

export function calculatePromotionalPriceCentavos(regularPriceCentavos: number, discountPercent: number): number {
  if (discountPercent <= 0 || discountPercent >= 10) {
    throw new RangeError("Veora promotional discounts must be greater than 0% and less than 10%.");
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
