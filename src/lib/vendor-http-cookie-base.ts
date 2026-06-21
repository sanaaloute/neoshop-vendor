/** Shared defaults for vendor httpOnly auth cookies (CSRF, tokens, onboarding flags). */
export function vendorHttpCookieBase() {
  // Default to secure in production unless explicitly disabled.
  // For local HTTP development, set COOKIE_SECURE=false.
  const secure =
    process.env.COOKIE_SECURE === "false"
      ? false
      : process.env.COOKIE_SECURE === "true" ||
        process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/" as const,
  };
}
