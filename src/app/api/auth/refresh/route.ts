import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIES,
  getAuthPaths,
  getGatewayUrl,
} from "@/config/auth";
import { maxAgeFromJwtOrFallback } from "@/lib/jwt-claims";
import {
  clearVendorCsrfCookie,
  isValidVendorCsrfRequest,
} from "@/lib/vendor-auth-csrf";
import { vendorHttpCookieBase } from "@/lib/vendor-http-cookie-base";

function cookieBase() {
  return vendorHttpCookieBase();
}

export async function POST(request: Request) {
  const gateway = getGatewayUrl();
  if (!gateway) {
    // If no gateway URL is configured, we can't refresh against an external
    // service. Return 503 but DO NOT delete cookies — the client may retry.
    return NextResponse.json({ error: "gateway_not_configured" }, { status: 503 });
  }

  const jar = await cookies();
  const csrfCookie = jar.get(AUTH_COOKIES.csrf)?.value;
  if (!isValidVendorCsrfRequest(request, csrfCookie)) {
    return NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
  }

  const refresh = jar.get(AUTH_COOKIES.refresh)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "missing_refresh" }, { status: 401 });
  }

  const { refreshUrl } = getAuthPaths();
  const sessionId = jar.get(AUTH_COOKIES.sessionId)?.value;
  const refreshBody: Record<string, string> = { refreshToken: refresh };
  if (sessionId) {
    refreshBody.sessionId = sessionId;
  }

  let upstream: Response;
  try {
    upstream = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshBody),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "gateway_unreachable" }, { status: 504 });
  }

  if (!upstream.ok) {
    const status = upstream.status;
    // Only permanently clear cookies on definitive auth failures.
    // Transient errors (5xx, network issues) should preserve cookies
    // so the client can retry refresh later.
    const isAuthError = status === 401 || status === 403;
    if (isAuthError) {
      jar.delete(AUTH_COOKIES.access);
      jar.delete(AUTH_COOKIES.refresh);
      jar.delete(AUTH_COOKIES.sessionId);
      clearVendorCsrfCookie(jar);
    }
    return NextResponse.json({ error: "refresh_failed" }, { status: isAuthError ? 401 : 502 });
  }

  const payload = (await upstream.json()) as {
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
  };

  if (!payload.accessToken) {
    // Upstream returned OK but no access token — this is a broken response.
    // Don't delete cookies; let the client retry.
    return NextResponse.json({ error: "invalid_upstream" }, { status: 502 });
  }

  if (payload.sessionId) {
    jar.set(AUTH_COOKIES.sessionId, payload.sessionId, {
      ...cookieBase(),
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  jar.set(AUTH_COOKIES.access, payload.accessToken, {
    ...cookieBase(),
    // Derive max-age from the JWT expiry so stolen/forged tokens have a short
    // window. Fall back to one hour if the token has no exp claim.
    maxAge: maxAgeFromJwtOrFallback(payload.accessToken, 60 * 60),
  });

  if (payload.refreshToken) {
    jar.set(AUTH_COOKIES.refresh, payload.refreshToken, {
      ...cookieBase(),
      maxAge: maxAgeFromJwtOrFallback(payload.refreshToken, 60 * 60 * 24 * 30),
    });
  }

  return NextResponse.json({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? refresh,
    sessionId: payload.sessionId ?? sessionId,
  });
}
