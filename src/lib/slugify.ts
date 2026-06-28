/** URL-safe slug from a human-readable string. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Backend attribute code: lowercase, starts with a letter, and contains only
 * letters, numbers and underscores. Collapses separators into a single
 * underscore and prefixes with `attr_` if the cleaned name would start with a
 * digit.
 */
export function toAttributeCode(input: string): string {
  let code = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  if (/^[0-9]/.test(code)) {
    code = `attr_${code}`;
  }

  return code || `attr_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}
