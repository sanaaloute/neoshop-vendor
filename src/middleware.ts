import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { AUTH_COOKIES, ONBOARDING_COOKIE } from "@/config/auth";
import {
  decodeAccessToken,
  isOnboardingCompleteClaims,
  isVendorTokenClaims,
} from "@/lib/jwt-claims";
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

function readAccessSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIES.access)?.value;
  if (!token) {
    return {
      ok: false as const,
      reason: "no_access" as const,
      hasRefresh: Boolean(request.cookies.get(AUTH_COOKIES.refresh)?.value),
    };
  }

  try {
    const claims = decodeAccessToken(token);

    if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
      return {
        ok: false as const,
        reason: "expired" as const,
        hasRefresh: Boolean(request.cookies.get(AUTH_COOKIES.refresh)?.value),
      };
    }

    if (!isVendorTokenClaims(claims)) {
      return { ok: false as const, reason: "role" as const, hasRefresh: false };
    }

    return { ok: true as const, claims };
  } catch {
    return {
      ok: false as const,
      reason: "malformed" as const,
      hasRefresh: Boolean(request.cookies.get(AUTH_COOKIES.refresh)?.value),
    };
  }
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

  const locale = getLocaleFromPath(pathname) || routing.defaultLocale;
  const prefix = `/${locale}`;
  const logicalPath = stripLocale(pathname);

  const session = readAccessSession(request);
  const wizardComplete =
    request.cookies.get(ONBOARDING_COOKIE.wizardComplete)?.value === "1";

  if (logicalPath === "/login" || logicalPath.startsWith("/login/")) {
    if (session.ok) {
      const onboardingDone =
        isOnboardingCompleteClaims(session.claims) || wizardComplete;
      if (!onboardingDone) {
        return NextResponse.redirect(
          new URL(`${prefix}/onboarding`, request.url)
        );
      }
      return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url));
    }
    return response;
  }

  if (!session.ok) {
    // If the access token is expired or missing but we have a refresh token,
    // let the request through — the client-side AuthProvider will
    // refresh the token. Redirecting here causes a jarring logout
    // flash on every SSR navigation after token expiry.
    if (
      session.hasRefresh &&
      (session.reason === "expired" || session.reason === "no_access")
    ) {
      return response;
    }

    const login = new URL(`${prefix}/login`, request.url);
    const nextPath =
      logicalPath === "/" ? `${prefix}/dashboard` : `${pathname}${request.nextUrl.search}`;
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
