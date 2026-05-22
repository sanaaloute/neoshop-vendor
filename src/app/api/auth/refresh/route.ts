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
    jar.delete(AUTH_COOKIES.access);
    jar.delete(AUTH_COOKIES.refresh);
    jar.delete(AUTH_COOKIES.sessionId);
    clearVendorCsrfCookie(jar);
    return NextResponse.json({ error: "refresh_failed" }, { status: 401 });
  }

  const payload = (await upstream.json()) as {
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
  };

  if (!payload.accessToken) {
    jar.delete(AUTH_COOKIES.access);
    jar.delete(AUTH_COOKIES.refresh);
    jar.delete(AUTH_COOKIES.sessionId);
    clearVendorCsrfCookie(jar);
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
    maxAge: maxAgeFromJwtOrFallback(payload.accessToken, 60 * 15),
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
  });
}
