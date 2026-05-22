import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ensureVendorCsrfCookie } from "@/lib/vendor-auth-csrf";

/** Issues or reuses an httpOnly CSRF cookie and returns the token for the `X-CSRF-Token` header. */
export async function GET() {
  const jar = await cookies();
  const csrfToken = ensureVendorCsrfCookie(jar);
  return NextResponse.json({ csrfToken });
}
