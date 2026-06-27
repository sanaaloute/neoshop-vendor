import { getApiBaseUrl } from "@/config/auth";

/**
 * Resolve a backend image/avatar URL for use in an <img> src.
 * - Absolute URLs (http/https/data/blob) are returned as-is.
 * - Paths starting with "/" are prefixed with the API base URL.
 * - Everything else is returned as-is so callers can decide.
 */
export function resolveImageUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed) return undefined;

  // Absolute URLs and data/blob URLs pass through.
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^data:/i.test(trimmed) ||
    /^blob:/i.test(trimmed)
  ) {
    return trimmed;
  }

  // Root-relative paths: prepend the API gateway origin.
  if (trimmed.startsWith("/")) {
    const base = getApiBaseUrl();
    return base ? `${base}${trimmed}` : trimmed;
  }

  return trimmed;
}
