/**
 * Named spacing for vendor layouts (maps to Tailwind scale).
 * Use Tailwind classes in UI; use these when you need numeric gaps in JS.
 */
export const vendorSpacing = {
  section: 24,
  cardGap: 16,
  inline: 12,
  tight: 8,
} as const;

export type VendorSpacingKey = keyof typeof vendorSpacing;
