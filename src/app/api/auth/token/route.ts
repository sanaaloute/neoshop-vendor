import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES } from "@/config/auth";
import {
  isValidVendorCsrfRequest,
  VENDOR_CSRF_HEADER,
} from "@/lib/vendor-auth-csrf";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Hydrates client-side axios with the current httpOnly access token.
 * This endpoint is protected by same-origin + CSRF double-submit to reduce
 * the impact of XSS reading the token. Prefer migrating API calls through the
 * same-origin proxy so the token never leaves the server.
 */
export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const jar = await cookies();
  const csrfCookie = jar.get(AUTH_COOKIES.csrf)?.value;
  if (!isValidVendorCsrfRequest(request, csrfCookie)) {
    return NextResponse.json(
      { error: "csrf_mismatch", header: VENDOR_CSRF_HEADER },
      { status: 403 }
    );
  }

  const access = jar.get(AUTH_COOKIES.access)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ accessToken: access });
}
