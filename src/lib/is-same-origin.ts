/**
 * Best-effort same-origin check for server-side routes.
 *
 * Browsers omit the `Origin` header on many same-origin GET requests, so we
 * fall back to `Referer` and `Sec-Fetch-Site`. The CSRF double-submit cookie
 * remains the primary defense; this check is defense-in-depth.
 */
export function isSameOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin") {
    return true;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // No origin indicators available. Reject unless the request is from a
  // same-origin context signaled by the browser.
  return false;
}
