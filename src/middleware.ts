import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

function getEnvOrigin(key: string): string | null {
  try {
    const url = process.env[key];
    if (!url) return null;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const apiOrigin = getEnvOrigin("NEXT_PUBLIC_API_BASE_URL");
const supabaseOrigin = getEnvOrigin("NEXT_PUBLIC_SUPABASE_URL");
const socketOrigin = getEnvOrigin("NEXT_PUBLIC_SOCKET_IO_URL") ?? apiOrigin;

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data:${apiOrigin ? ` ${apiOrigin}` : ""}${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self'",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${socketOrigin ? ` ${socketOrigin}` : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

import { routing } from "@/i18n/routing";
import { AUTH_COOKIES, ONBOARDING_COOKIE } from "@/config/auth";
import {
  decodeAccessToken,
  isOnboardingCompleteClaims,
  isVendorTokenClaims,
} from "@/lib/jwt-claims";
import { verifyAccessToken } from "@/lib/jwks";
import {
  getRequiredPermissionForPathname,
  hasPermission,
  isAccessDeniedRoute,
  resolvePermissionsFromClaims,
} from "@/lib/vendor-permissions";

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api");
}

function isOnboardingPath(pathname: string) {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

function getLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(en|fr|zh)(?:\/|$)/);
  return match ? match[1] : null;
}

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|fr|zh)(\/|$)/, "/");
}

async function readAccessSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIES.access)?.value;
  const hasRefresh = Boolean(request.cookies.get(AUTH_COOKIES.refresh)?.value);

  if (!token) {
    return {
      ok: false as const,
      reason: "no_access" as const,
      hasRefresh,
    };
  }

  let claims: Parameters<typeof isVendorTokenClaims>[0];

  try {
    // Verify the JWT signature with the gateway JWKS. This prevents forged
    // tokens from passing middleware routing/permission checks.
    const payload = await verifyAccessToken(token);
    claims = payload as unknown as Parameters<typeof isVendorTokenClaims>[0];
  } catch (err) {
    // Verification failed (bad signature, issuer, audience, or JWKS error).
    // Decode only to check expiry so we can give the client a chance to refresh
    // when the token is simply expired.
    // eslint-disable-next-line no-console
    console.log("[middleware/verify] verifyAccessToken failed:", err instanceof Error ? err.message : err);
    try {
      claims = decodeAccessToken(token);
      if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
        return {
          ok: false as const,
          reason: "expired" as const,
          hasRefresh,
        };
      }
    } catch {
      // Malformed token.
      return {
        ok: false as const,
        reason: "malformed" as const,
        hasRefresh,
      };
    }

    // Token decoded but could not be verified: treat as invalid.
    return {
      ok: false as const,
      reason: "invalid_signature" as const,
      hasRefresh,
    };
  }

  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
    return { ok: false as const, reason: "expired" as const, hasRefresh };
  }

  if (!isVendorTokenClaims(claims)) {
    return { ok: false as const, reason: "role" as const, hasRefresh: false };
  }

  return { ok: true as const, claims };
}

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isApiPath(pathname) || isAssetPath(pathname)) {
    return NextResponse.next();
  }

  // Run intl middleware first for locale detection and routing
  const response = handleI18nRouting(request);

  // If intl middleware wants to redirect, let it
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // Generate a per-request nonce and apply a strict CSP to HTML responses.
  const nonce = generateNonce();
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce));
  response.headers.set("x-nonce", nonce);

  const locale = getLocaleFromPath(pathname) || routing.defaultLocale;
  const prefix = `/${locale}`;
  const logicalPath = stripLocale(pathname);

  const session = await readAccessSession(request);
  const wizardComplete =
    request.cookies.get(ONBOARDING_COOKIE.wizardComplete)?.value === "1";

  if (logicalPath === "/login" || logicalPath.startsWith("/login/")) {
    if (session.ok) {
      const onboardingDone =
        isOnboardingCompleteClaims(session.claims) || wizardComplete;
      // eslint-disable-next-line no-console
      console.log("[middleware] login page, session ok, onboardingDone:", onboardingDone);
      if (!onboardingDone) {
        return NextResponse.redirect(
          new URL(`${prefix}/onboarding`, request.url)
        );
      }
      return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url));
    }
    // eslint-disable-next-line no-console
    console.log("[middleware] login page, session not ok:", session.reason, "hasRefresh:", session.hasRefresh);
    return response;
  }

  if (!session.ok) {
    // If the access token is expired or missing but we have a refresh token,
    // let the request through — the client-side AuthProvider will refresh.
    // For invalid signatures, malformed tokens, or wrong roles, force login.
    if (
      session.hasRefresh &&
      (session.reason === "expired" || session.reason === "no_access")
    ) {
      // eslint-disable-next-line no-console
      console.log("[middleware] letting through for client refresh, reason:", session.reason);
      return response;
    }

    // eslint-disable-next-line no-console
    console.log("[middleware] redirecting to login, reason:", session.reason, "pathname:", pathname);

    const login = new URL(`${prefix}/login`, request.url);

    // Build a locale-agnostic next path so next-intl can prepend the correct
    // locale after login. Avoid echoing an existing `next` param to prevent
    // loops like /fr/login?next=/fr/fr/fr/dashboard.
    const nextSearch = new URLSearchParams(request.nextUrl.searchParams);
    nextSearch.delete("next");
    const nextSearchString = nextSearch.toString();
    const nextPath =
      logicalPath === "/"
        ? "/dashboard"
        : `${logicalPath}${nextSearchString ? `?${nextSearchString}` : ""}`;
    login.searchParams.set("next", nextPath);
    return NextResponse.redirect(login);
  }

  const onboardingDone =
    isOnboardingCompleteClaims(session.claims) || wizardComplete;
  if (!onboardingDone && !isOnboardingPath(logicalPath)) {
    return NextResponse.redirect(new URL(`${prefix}/onboarding`, request.url));
  }

  if (onboardingDone && isOnboardingPath(logicalPath)) {
    return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url));
  }

  if (onboardingDone && !isAccessDeniedRoute(logicalPath)) {
    const required = getRequiredPermissionForPathname(logicalPath);
    if (required) {
      const effective = resolvePermissionsFromClaims(session.claims);
      if (!hasPermission(effective, required)) {
        const denied = new URL(`${prefix}/access-denied`, request.url);
        denied.searchParams.set("required", required);
        return NextResponse.redirect(denied);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
