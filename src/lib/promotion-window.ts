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
