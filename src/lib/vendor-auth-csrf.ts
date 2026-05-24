import { randomBytes, timingSafeEqual } from "crypto";

import { AUTH_COOKIES } from "@/config/auth";

import { vendorHttpCookieBase } from "./vendor-http-cookie-base";

export const VENDOR_CSRF_HEADER = "x-csrf-token";

const CSRF_BYTES = 32;

/** Base64url-encoded CSRF secret length bounds (32 random bytes). */
export function isValidCsrfTokenShape(token: string): boolean {
  return (
    token.length >= 32 &&
    token.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(token)
  );
}

export function generateCsrfSecret(): string {
  return randomBytes(CSRF_BYTES).toString("base64url");
}

function timingSafeEqualUtf8(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * Double-submit cookie: caller must send the same value in `X-CSRF-Token` as in the httpOnly cookie.
 * Token is issued via GET /api/auth/csrf (same-origin); cross-site pages cannot read the response body.
 */
export function isValidVendorCsrfRequest(
  request: Request,
  cookieValue: string | undefined
): boolean {
  const header = request.headers.get(VENDOR_CSRF_HEADER)?.trim();
  if (
    !header ||
    !cookieValue ||
    !isValidCsrfTokenShape(header) ||
    !isValidCsrfTokenShape(cookieValue)
  ) {
    return false;
  }
  return timingSafeEqualUtf8(header, cookieValue);
}

export function vendorCsrfCookieOptions(maxAgeSeconds: number) {
  return {
    ...vendorHttpCookieBase(),
    maxAge: maxAgeSeconds,
  };
}

export function clearVendorCsrfCookie(jar: { delete: (name: string) => void }) {
  jar.delete(AUTH_COOKIES.csrf);
}

/** Ensures a valid CSRF cookie exists; returns the active secret for the JSON body. */
export function ensureVendorCsrfCookie(jar: {
  get: (name: string) => { value: string } | undefined;
  set: (
    name: string,
    value: string,
    options: ReturnType<typeof vendorCsrfCookieOptions>
  ) => void;
}): string {
  let token = jar.get(AUTH_COOKIES.csrf)?.value;
  if (!token || !isValidCsrfTokenShape(token)) {
    token = generateCsrfSecret();
    jar.set(
      AUTH_COOKIES.csrf,
      token,
      vendorCsrfCookieOptions(60 * 60 * 24 * 30)
    );
  }
  return token;
}
