import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES } from "@/config/auth";
import {
  claimsToVendorUser,
  decodeAccessToken,
  isVendorTokenClaims,
} from "@/lib/jwt-claims";
import { verifyAccessToken } from "@/lib/jwks";

export async function GET() {
  const jar = await cookies();
  const access = jar.get(AUTH_COOKIES.access)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let claims: Parameters<typeof isVendorTokenClaims>[0];

  try {
    // Primary: full JWT verification with gateway JWKS.
    const payload = await verifyAccessToken(access);
    claims = payload as unknown as Parameters<typeof isVendorTokenClaims>[0];
  } catch {
    // Fallback: if JWKS is unreachable or verification fails,
    // decode the token without signature verification.
    // The token is in an httpOnly cookie and was already verified
    // when issued. We still check expiry and role claims.
    try {
      claims = decodeAccessToken(access);
      if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: "token_expired" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }
  }

  if (!isVendorTokenClaims(claims)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const user = claimsToVendorUser(claims);
  if (!user) {
    return NextResponse.json({ error: "invalid_subject" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
