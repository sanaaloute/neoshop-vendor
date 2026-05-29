/** Explicit locale keeps SSR and browser output identical (undefined uses different defaults). */
const NUMBER_LOCALE = "en-US";

export function formatCurrency(
  value: number,
  currency = "CNY",
  maximumFractionDigits = 0
) {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`;
}
