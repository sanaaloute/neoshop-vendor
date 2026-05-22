import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES, ONBOARDING_COOKIE } from "@/config/auth";
import { isValidVendorCsrfRequest } from "@/lib/vendor-auth-csrf";
import { vendorHttpCookieBase } from "@/lib/vendor-http-cookie-base";

function cookieBase() {
  return {
    ...vendorHttpCookieBase(),
    maxAge: 60 * 60 * 24 * 180,
  };
}

/** Marks local wizard complete until JWT `onboardingComplete` is issued by the API. */
export async function POST(request: Request) {
  const jar = await cookies();
  if (!isValidVendorCsrfRequest(request, jar.get(AUTH_COOKIES.csrf)?.value)) {
    return NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
  }
  jar.set(ONBOARDING_COOKIE.wizardComplete, "1", cookieBase());
  return NextResponse.json({ ok: true });
}

/** Clears the flag when the vendor returns to editable onboarding (e.g. REJECTED). */
export async function DELETE(request: Request) {
  const jar = await cookies();
  if (!isValidVendorCsrfRequest(request, jar.get(AUTH_COOKIES.csrf)?.value)) {
    return NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
  }
  jar.delete(ONBOARDING_COOKIE.wizardComplete);
  return NextResponse.json({ ok: true });
}
