import { type NextRequest, NextResponse } from "next/server";

import { getGatewayUrl } from "@/config/auth";

type AllowedMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function proxyToGateway(
  request: NextRequest,
  method: AllowedMethod
): Promise<Response> {
  const gateway = getGatewayUrl();
  if (!gateway) {
    return NextResponse.json(
      { error: "gateway_not_configured" },
      { status: 503 }
    );
  }

  const { pathname, search } = new URL(request.url);
  const upstreamUrl = `${gateway}${pathname}${search}`;

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("Accept", accept);

  let body: BodyInit | undefined;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    const ct = contentType ?? "";
    if (ct.includes("multipart/form-data")) {
      body = await request.arrayBuffer();
    } else if (ct.includes("application/json")) {
      body = JSON.stringify(await request.json());
    } else {
      body = await request.text();
    }
  }

  const upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (
      key.toLowerCase() === "content-encoding" ||
      key.toLowerCase() === "transfer-encoding"
    ) {
      return;
    }
    responseHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  return proxyToGateway(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyToGateway(request, "POST");
}

export async function PUT(request: NextRequest) {
  return proxyToGateway(request, "PUT");
}

export async function PATCH(request: NextRequest) {
  return proxyToGateway(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  return proxyToGateway(request, "DELETE");
}
