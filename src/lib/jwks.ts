import { createLocalJWKSet, jwtVerify } from "jose";
import type { JSONWebKeySet } from "jose";

import { getGatewayUrl } from "@/config/auth";

let cachedKeySet: ReturnType<typeof createLocalJWKSet> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

function getJwksUrl(): string {
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
export async function getKeySet(): Promise<ReturnType<typeof createLocalJWKSet>> {
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

const AUTH_ISSUER = process.env.AUTH_ISSUER;
const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE ?? "authenticated";

/** Verify an access token with the gateway JWKS. Returns the decoded payload. */
export async function verifyAccessToken(token: string) {
  const keySet = await getKeySet();
  const { payload } = await jwtVerify(token, keySet, {
    ...(AUTH_ISSUER ? { issuer: AUTH_ISSUER } : {}),
    audience: AUTH_AUDIENCE,
    algorithms: ["ES256"],
    clockTolerance: 60,
  });
  return payload;
}
