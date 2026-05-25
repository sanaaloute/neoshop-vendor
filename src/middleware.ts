import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isApiPath(pathname) || isAssetPath(pathname)) {
    return NextResponse.next();
  }

  const session = readAccessSession(request);
  const wizardComplete =
    request.cookies.get(ONBOARDING_COOKIE.wizardComplete)?.value === "1";

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (session.ok) {
      const onboardingDone =
        isOnboardingCompleteClaims(session.claims) || wizardComplete;
      if (!onboardingDone) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!session.ok) {
    // If the access token is expired but we have a refresh token,
    // let the request through — the client-side AuthProvider will
    // refresh the token. Redirecting here causes a jarring logout
    // flash on every SSR navigation after token expiry.
    if (session.reason === "expired" && session.hasRefresh) {
      return NextResponse.next();
    }

    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const onboardingDone =
    isOnboardingCompleteClaims(session.claims) || wizardComplete;
  if (!onboardingDone && !isOnboardingPath(pathname)) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (onboardingDone && isOnboardingPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (onboardingDone && !isAccessDeniedRoute(pathname)) {
    const required = getRequiredPermissionForPathname(pathname);
    if (required) {
      const effective = resolvePermissionsFromClaims(session.claims);
      if (!hasPermission(effective, required)) {
        const denied = new URL("/access-denied", request.url);
        denied.searchParams.set("required", required);
        return NextResponse.redirect(denied);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
