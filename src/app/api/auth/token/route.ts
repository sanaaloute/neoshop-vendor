import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIES } from "@/config/auth";

/** Hydrates client-side axios with the current httpOnly access token (same-origin only). */
export async function GET() {
  const jar = await cookies();
  const access = jar.get(AUTH_COOKIES.access)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ accessToken: access });
}
