/** Shared defaults for vendor httpOnly auth cookies (CSRF, tokens, onboarding flags). */
export function vendorHttpCookieBase() {
  return {
    httpOnly: true as const,
    /** Set COOKIE_SECURE=true in production if you serve exclusively over HTTPS. */
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax" as const,
    path: "/" as const,
  };
}
