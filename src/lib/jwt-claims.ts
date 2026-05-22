import { decodeJwt } from "jose/jwt/decode";
import type { JWTPayload } from "jose";

import { VENDOR_ROLE } from "@/config/auth";
import {
  normalizeVendorTeamRole,
  resolvePermissionsFromClaims,
} from "@/lib/vendor-permissions";
import type { VendorUser } from "@/types/auth";

const APP_ROLES = ["customer", "vendor", "admin", "super_admin"] as const;

export type VendorJwtPayload = JWTPayload & {
  email?: string;
  role?: string | string[];
  roles?: string[];
  user_metadata?: { role?: string; [key: string]: unknown };
  app_metadata?: { role?: string; [key: string]: unknown };
  onboardingComplete?: boolean;
  onboarding_complete?: boolean;
  vendor_team_role?: string;
  vendorTeamRole?: string;
  team_role?: string;
  vendor_permissions?: string[];
  vendorPermissions?: string[];
  permissions?: string[];
};

function isKnownAppRole(value: string): value is (typeof APP_ROLES)[number] {
  return (APP_ROLES as readonly string[]).includes(value);
}

/**
 * NeoShop app role from JWT: the gateway stores role in
 * `user_metadata.role` / `app_metadata.role` or top-level `role`.
 * The top-level `role: "authenticated"` must not be treated as the app role.
 */
export function getAppRoleFromClaims(
  claims: VendorJwtPayload
): string | undefined {
  const fromUserMeta =
    typeof claims.user_metadata?.role === "string"
      ? claims.user_metadata.role
      : undefined;
  const fromAppMeta =
    typeof claims.app_metadata?.role === "string"
      ? claims.app_metadata.role
      : undefined;
  const fromMeta = fromUserMeta ?? fromAppMeta;
  if (fromMeta && isKnownAppRole(fromMeta)) return fromMeta;

  if (typeof claims.role === "string") {
    if (claims.role === "authenticated") return undefined;
    return claims.role;
  }
  if (Array.isArray(claims.role) && claims.role.length > 0) {
    return claims.role[0];
  }
  if (claims.roles?.length) return claims.roles[0];
  return undefined;
}

/** Decode without verification (client-side or quick inspection). */
export function decodeAccessToken(token: string): VendorJwtPayload {
  return decodeJwt(token) as VendorJwtPayload;
}

export function getTokenExpSeconds(token: string): number | undefined {
  const { exp } = decodeAccessToken(token);
  return typeof exp === "number" ? exp : undefined;
}

/** Like {@link getTokenExpSeconds} but never throws (e.g. opaque refresh tokens are not JWTs). */
export function getTokenExpSecondsSafe(token: string): number | undefined {
  try {
    return getTokenExpSeconds(token);
  } catch {
    return undefined;
  }
}

/** Cookie max-age from JWT `exp` when decodable; otherwise `fallbackSeconds` (use for opaque refresh tokens). */
export function maxAgeFromJwtOrFallback(
  token: string,
  fallbackSeconds: number
): number {
  const exp = getTokenExpSecondsSafe(token);
  if (!exp) return fallbackSeconds;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(exp - now, 60);
}

export function isVendorTokenClaims(claims: VendorJwtPayload): boolean {
  return getAppRoleFromClaims(claims) === VENDOR_ROLE;
}

export function isOnboardingCompleteClaims(claims: VendorJwtPayload): boolean {
  return Boolean(claims.onboardingComplete ?? claims.onboarding_complete);
}

export function claimsToVendorUser(
  claims: VendorJwtPayload
): VendorUser | null {
  const sub = typeof claims.sub === "string" ? claims.sub : undefined;
  if (!sub) return null;
  const email =
    typeof claims.email === "string"
      ? claims.email
      : typeof claims.preferred_username === "string"
        ? claims.preferred_username
        : "";

  const appRole = getAppRoleFromClaims(claims);
  const role =
    appRole ??
    (typeof claims.role === "string" && claims.role !== "authenticated"
      ? claims.role
      : claims.roles?.[0] ??
        (Array.isArray(claims.role) ? claims.role[0] : undefined) ??
        "customer");

  const teamRole = normalizeVendorTeamRole(
    claims.vendor_team_role ?? claims.vendorTeamRole ?? claims.team_role
  );
  const permissions = resolvePermissionsFromClaims(claims);

  return {
    id: sub,
    email,
    role,
    teamRole,
    permissions,
    onboardingComplete: isOnboardingCompleteClaims(claims),
  };
}
