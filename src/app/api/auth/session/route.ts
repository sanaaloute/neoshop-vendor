import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES, ONBOARDING_COOKIE } from "@/config/auth";
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
  const jar = await cookies();
  const csrfCookie = jar.get(AUTH_COOKIES.csrf)?.value;
  if (!isValidVendorCsrfRequest(request, csrfCookie)) {
    return NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
  }

  const body = (await request.json()) as {
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
  };

  if (!body.accessToken || !body.refreshToken) {
    return NextResponse.json({ error: "missing_tokens" }, { status: 400 });
  }

  // eslint-disable-next-line no-console
  console.log("[auth/session] setting access cookie, sessionId:", body.sessionId ? "yes" : "no", "token prefix:", body.accessToken.slice(0, 20) + "...");

  jar.set(AUTH_COOKIES.access, body.accessToken, {
    ...cookieBase(),
    // Derive max-age from the JWT expiry so stolen/forged tokens have a short
    // window. Fall back to one hour if the token has no exp claim.
    maxAge: maxAgeFromJwtOrFallback(body.accessToken, 60 * 60),
  });
  jar.set(AUTH_COOKIES.refresh, body.refreshToken, {
    ...cookieBase(),
    maxAge: maxAgeFromJwtOrFallback(body.refreshToken, 60 * 60 * 24 * 30),
  });
  if (body.sessionId) {
    jar.set(AUTH_COOKIES.sessionId, body.sessionId, {
      ...cookieBase(),
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const jar = await cookies();
  if (!isValidVendorCsrfRequest(request, jar.get(AUTH_COOKIES.csrf)?.value)) {
    return NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
  }
  jar.delete(AUTH_COOKIES.access);
  jar.delete(AUTH_COOKIES.refresh);
  jar.delete(AUTH_COOKIES.sessionId);
  clearVendorCsrfCookie(jar);
  jar.delete(ONBOARDING_COOKIE.wizardComplete);
  return NextResponse.json({ ok: true });
}
