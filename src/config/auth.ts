const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const VENDOR_ROLE = "vendor" as const;

/** Client-side API root (no trailing slash). Must match the gateway origin. */
export function getApiBaseUrl() {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
}

/** Server-side gateway URL (no trailing slash). Uses NEXT_PUBLIC_API_BASE_URL. */
export function getGatewayUrl() {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
}

/**
 * Build the upstream refresh URL.
 * Uses `NEXT_PUBLIC_API_BASE_URL`.
 * The path should NOT include `/api/v1` — it is prepended automatically.
 */
export function getAuthPaths() {
  const base = getGatewayUrl();
  const refreshPath =
    process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH ?? "/auth/refresh";
  const normalized = refreshPath.startsWith("/")
    ? refreshPath
    : `/${refreshPath}`;
  const fullPath = normalized.startsWith("/api/v1")
    ? normalized
    : `/api/v1${normalized}`;
  return {
    refreshUrl: `${base}${fullPath}`,
  };
}
