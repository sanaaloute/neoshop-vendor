import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIES, getGatewayUrl } from "@/config/auth";
import {
  isValidVendorCsrfRequest,
  VENDOR_CSRF_HEADER,
} from "@/lib/vendor-auth-csrf";
import { validateMultipartUpload } from "@/lib/upload-proxy-validation";

type AllowedMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

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

  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Mutating proxy requests must come from the same origin. This prevents
  // CSRF against the proxy from third-party sites. GET requests are also
  // restricted to same-origin for defense-in-depth.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const auth = request.headers.get("authorization");

  // If the client didn't send an Authorization header, try to attach the
  // httpOnly access cookie. When we do this, require CSRF double-submit for
  // mutating methods.
  let cookieAuth: string | undefined;
  if (!auth) {
    const jar = await cookies();
    const access = jar.get(AUTH_COOKIES.access)?.value;
    if (access) {
      if (isMutating) {
        const csrfCookie = jar.get(AUTH_COOKIES.csrf)?.value;
        if (!isValidVendorCsrfRequest(request, csrfCookie)) {
          return NextResponse.json(
            { error: "csrf_mismatch", header: VENDOR_CSRF_HEADER },
            { status: 403 }
          );
        }
      }
      cookieAuth = `Bearer ${access}`;
    }
  }

  const { pathname, search } = new URL(request.url);
  const upstreamUrl = `${gateway}${pathname}${search}`;

  const headers = new Headers();
  if (auth) {
    headers.set("Authorization", auth);
  } else if (cookieAuth) {
    headers.set("Authorization", cookieAuth);
  }
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("Accept", accept);
  const sessionId = request.headers.get("x-session-id");
  if (sessionId) headers.set("x-session-id", sessionId);

  let body: BodyInit | undefined;
  if (isMutating) {
    const ct = contentType ?? "";
    if (ct.includes("multipart/form-data")) {
      const formData = await request.formData();
      const validation = validateMultipartUpload(pathname, formData);
      if (validation) {
        return NextResponse.json(
          { error: validation.error, message: validation.message },
          { status: 400 }
        );
      }
      body = formData;
      // Let fetch generate the correct multipart boundary.
      headers.delete("Content-Type");
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

  // Only forward a conservative allow-list of response headers. Avoid leaking
  // upstream Set-Cookie or other sensitive headers.
  const responseHeaders = new Headers();
  const allowed = new Set([
    "content-type",
    "content-length",
    "cache-control",
    "etag",
    "x-request-id",
    "x-correlation-id",
  ]);
  upstream.headers.forEach((value, key) => {
    if (allowed.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
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
