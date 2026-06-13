/** Explicit locale keeps SSR and browser output identical (undefined uses different defaults). */
const NUMBER_LOCALE = "en-US";

function toNumber(value: string | number): number {
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: "¥",
  XOF: "CFA",
};

export function formatCurrency(
  value: string | number,
  currency = "CNY",
  maximumFractionDigits = 0
) {
  const formatted = new Intl.NumberFormat(NUMBER_LOCALE, {
    style: "decimal",
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(toNumber(value));
  const symbol = CURRENCY_SYMBOLS[currency] ?? CURRENCY_SYMBOLS.CNY;
  return `${symbol}${formatted}`;
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
