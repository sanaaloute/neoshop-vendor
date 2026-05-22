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

  try {
    const payload = await verifyAccessToken(access);
    const claims = payload as unknown as Parameters<typeof isVendorTokenClaims>[0];
    if (!isVendorTokenClaims(claims)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const user = claimsToVendorUser(claims);
    if (!user) {
      return NextResponse.json({ error: "invalid_subject" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
}
