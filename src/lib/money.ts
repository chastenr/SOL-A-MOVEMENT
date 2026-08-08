/** Formats integer centavos as a PHP display string, e.g. 620000 -> "₱6,200". */
export function centavosToPeso(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}
