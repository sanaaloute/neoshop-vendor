import { NextResponse } from "next/server";

/**
 * Vendor Panel health endpoint.
 *
 * The backend health monitor `HEAD`s this URL first;
 * on 405 it falls back to `GET` and expects a 2xx response.
 */
function buildResponse() {
  return NextResponse.json({
    status: "ok",
    service: "vendor-panel",
    buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown",
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return buildResponse();
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
