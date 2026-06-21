import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES } from "@/config/auth";
import { claimsToVendorUser, isVendorTokenClaims } from "@/lib/jwt-claims";
import { verifyAccessToken } from "@/lib/jwks";

export async function GET() {
  const jar = await cookies();
  const access = jar.get(AUTH_COOKIES.access)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let claims: Parameters<typeof isVendorTokenClaims>[0];

  try {
    // Full JWT verification with gateway JWKS. Fail closed on any error.
    const payload = await verifyAccessToken(access);
    claims = payload as unknown as Parameters<typeof isVendorTokenClaims>[0];
  } catch (err) {
    const message = err instanceof Error ? err.message : "verification_failed";
    return NextResponse.json(
      { error: "invalid_token", message },
      { status: 401 }
    );
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
