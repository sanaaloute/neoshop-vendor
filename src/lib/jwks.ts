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
  (SUPABASE_JWT_SECRET ? ["HS256"] : ["ES256"]);

let cachedKeySet: ReturnType<typeof createLocalJWKSet> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

function getJwksUrl(): string {
  if (JWKS_URL) return JWKS_URL;

  const gateway = getGatewayUrl();
  if (!gateway) {
    throw new Error("gateway_not_configured");
  }
  return `${gateway}/auth/v1/.well-known/jwks.json`;
}

async function fetchKeySet(): Promise<ReturnType<typeof createLocalJWKSet>> {
  const url = getJwksUrl();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`jwks_fetch_failed: ${res.status}`);
  }
  const jwks = (await res.json()) as JSONWebKeySet;
  return createLocalJWKSet(jwks);
}

/** Returns a cached JWK set, refreshing if stale. Safe for Edge / serverless. */
export async function getKeySet(): Promise<
  ReturnType<typeof createLocalJWKSet>
> {
  const now = Date.now();
  if (cachedKeySet && now - cachedAt < CACHE_TTL_MS) {
    return cachedKeySet;
  }
  cachedKeySet = await fetchKeySet();
  cachedAt = now;
  return cachedKeySet;
}

/** Clear the cache (useful after deploy or key rotation). */
export function clearKeySetCache() {
  cachedKeySet = null;
  cachedAt = 0;
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
  if (payload.aud !== AUTH_AUDIENCE) {
    throw new Error("audience_mismatch");
  }
}

/** Verify an access token with the gateway JWKS. Returns the decoded payload. */
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

  const keySet = await getKeySet();
  const { payload } = await jwtVerify(token, keySet, {
    ...(AUTH_ISSUER ? { issuer: AUTH_ISSUER } : {}),
    audience: AUTH_AUDIENCE,
    algorithms: JWT_ALGORITHMS,
    clockTolerance: 60,
  });
  return payload;
}
