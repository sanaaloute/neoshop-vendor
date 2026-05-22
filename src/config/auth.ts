const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const AUTH_COOKIES = {
  access: "nv_access",
  refresh: "nv_refresh",
  /** Server session id from POST /api/v1/auth/sessions or refresh response */
  sessionId: "nv_session_id",
  /** HttpOnly double-submit token; pair with `X-CSRF-Token` on mutating same-origin routes */
  csrf: "nv_csrf",
} as const;

/** Set when the vendor completes the local wizard; replace with JWT claim after API sync. */
export const ONBOARDING_COOKIE = {
  wizardComplete: "nv_onboarding_wizard",
} as const;

/** Client-side API root (no trailing slash). Leave empty to use same-origin proxy routes. */
export function getApiBaseUrl() {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
}

/** Server-side gateway URL (no trailing slash). Falls back to NEXT_PUBLIC_API_BASE_URL. */
export function getGatewayUrl() {
  return trimTrailingSlash(
    process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  );
}

/**
 * Build the upstream refresh URL.
 * Uses `API_GATEWAY_URL` (server) or `NEXT_PUBLIC_API_BASE_URL` (client/direct).
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

export const VENDOR_ROLE = "vendor" as const;
