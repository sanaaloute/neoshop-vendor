import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

function getEnvOrigin(key: string): string | null {
  try {
    const url = process.env[key];
    if (!url) return null;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Derive the Supabase origin from AUTH_ISSUER when NEXT_PUBLIC_SUPABASE_URL is not set. */
function getSupabaseOrigin(): string | null {
  const explicit = getEnvOrigin("NEXT_PUBLIC_SUPABASE_URL");
  if (explicit) return explicit;
  try {
    const issuer = process.env.AUTH_ISSUER;
    if (!issuer) return null;
    const url = new URL(issuer);
    // AUTH_ISSUER looks like https://<project>.supabase.co/auth/v1
    if (/\.supabase\.co$/i.test(url.hostname)) {
      return url.origin;
    }
    return null;
  } catch {
    return null;
  }
}

const apiOrigin = getEnvOrigin("NEXT_PUBLIC_API_BASE_URL");
const supabaseOrigin = getSupabaseOrigin();
const socketOrigin = getEnvOrigin("NEXT_PUBLIC_SOCKET_IO_URL") ?? apiOrigin;

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com"
      : `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: https://*.supabase.co${apiOrigin ? ` ${apiOrigin}` : ""}${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self'",
    `connect-src 'self' wss:${apiOrigin ? ` ${apiOrigin}` : ""}${socketOrigin ? ` ${socketOrigin} wss://${new URL(socketOrigin).host}` : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const handleI18nRouting = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Run intl middleware first for locale detection and routing
  const response = handleI18nRouting(request);

  // If intl middleware wants to redirect, let it
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // Generate a per-request nonce and apply a strict CSP to HTML responses.
  const nonce = generateNonce();
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce));
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
