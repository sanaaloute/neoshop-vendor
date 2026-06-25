import { createLocalJWKSet, decodeJwt, jwtVerify } from "jose";
import type { JSONWebKeySet } from "jose";

import { getGatewayUrl } from "@/config/auth";

const AUTH_ISSUER = process.env.AUTH_ISSUER;
const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE ?? "authenticated";
const VERIFY_SIGNATURE = process.env.JWT_VERIFY_SIGNATURE !== "false";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const JWKS_URL = process.env.JWKS_URL;
const JWT_ALGORITHMS =
  process.env.JWT_ALGORITHMS?.split(",").map((a) => a.trim()) ??
  (SUPABASE_JWT_SECRET ? ["HS256"] : ["ES256", "HS256"]);

let cachedKeySet: ReturnType<typeof createLocalJWKSet> | null = null;
let cachedUrl: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

function deriveJwksUrl(issuer: string | undefined): string {
  if (JWKS_URL) return JWKS_URL;

  const configuredIssuer = AUTH_ISSUER ?? issuer;
  if (configuredIssuer) {
    try {
      const url = new URL(configuredIssuer);
      // Supabase auth issuer: https://<project>.supabase.co/auth/v1
      // Supabase JWKS:        https://<project>.supabase.co/.well-known/jwks.json
      if (url.pathname.startsWith("/auth/v1")) {
        return `${url.origin}/.well-known/jwks.json`;
      }
    } catch {
      // fall through
    }
  }

  const gateway = getGatewayUrl();
  if (!gateway) {
    throw new Error("gateway_not_configured");
  }
  return `${gateway}/auth/v1/.well-known/jwks.json`;
}

async function fetchKeySet(
  url: string
): Promise<ReturnType<typeof createLocalJWKSet>> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`jwks_fetch_failed: ${res.status}`);
  }
  const jwks = (await res.json()) as JSONWebKeySet;
  return createLocalJWKSet(jwks);
}

/** Returns a cached JWK set for the given URL, refreshing if stale. */
export async function getKeySet(
  url: string
): Promise<ReturnType<typeof createLocalJWKSet>> {
  const now = Date.now();
  if (cachedKeySet && cachedUrl === url && now - cachedAt < CACHE_TTL_MS) {
    return cachedKeySet;
  }
  cachedKeySet = await fetchKeySet(url);
  cachedUrl = url;
  cachedAt = now;
  return cachedKeySet;
}

/** Clear the cache (useful after deploy or key rotation). */
export function clearKeySetCache() {
  cachedKeySet = null;
  cachedUrl = null;
  cachedAt = 0;
}

function matchesAudience(actual: unknown, expected: string): boolean {
  if (actual === expected) return true;
  if (Array.isArray(actual)) return actual.includes(expected);
  return false;
}

function assertRequiredClaims(payload: Record<string, unknown>) {
  if (typeof payload.exp !== "number") {
    throw new Error("missing_exp");
  }
  if (payload.exp * 1000 < Date.now()) {
    throw new Error("token_expired");
  }
  if (AUTH_ISSUER && payload.iss !== AUTH_ISSUER) {
    throw new Error("issuer_mismatch");
  }
  const issuer = AUTH_ISSUER ?? payload.iss;
  if (typeof issuer !== "string" || issuer.length === 0) {
    throw new Error("missing_issuer");
  }
  if (!matchesAudience(payload.aud, AUTH_AUDIENCE)) {
    throw new Error("audience_mismatch");
  }
}

/** Verify an access token. Returns the decoded payload. */
export async function verifyAccessToken(token: string) {
  // When the gateway signs tokens with a symmetric algorithm (e.g. Supabase
  // HS256) and does not expose a JWKS endpoint, signature verification can be
  // disabled via JWT_VERIFY_SIGNATURE=false. The token is still decoded and
  // checked for expiry, issuer, and audience.
  if (!VERIFY_SIGNATURE) {
    const payload = decodeJwt(token);
    assertRequiredClaims(payload as Record<string, unknown>);
    return payload;
  }

  // If a Supabase JWT secret is provided, verify HS256 tokens directly.
  if (SUPABASE_JWT_SECRET) {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      ...(AUTH_ISSUER ? { issuer: AUTH_ISSUER } : {}),
      audience: AUTH_AUDIENCE,
      algorithms: JWT_ALGORITHMS,
      clockTolerance: 60,
    });
    return payload;
  }

  const decoded = decodeJwt(token);
  const url = deriveJwksUrl(decoded.iss);
  const keySet = await getKeySet(url);
  const { payload } = await jwtVerify(token, keySet, {
    ...(AUTH_ISSUER ? { issuer: AUTH_ISSUER } : {}),
    audience: AUTH_AUDIENCE,
    algorithms: JWT_ALGORITHMS,
    clockTolerance: 60,
  });
  return payload;
}
