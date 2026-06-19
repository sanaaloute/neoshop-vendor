export type VendorTeamRole = "owner" | "manager" | "staff";

/** JWT fields used to derive vendor permissions (avoid importing JWT types here). */
export type PermissionsClaimsInput = {
  vendor_permissions?: unknown;
  vendorPermissions?: unknown;
  permissions?: unknown;
  vendor_team_role?: unknown;
  vendorTeamRole?: unknown;
  team_role?: unknown;
};

export type VendorPermission =
  | "products"
  | "orders"
  | "payouts"
  | "analytics"
  | "chat"
  | "reviews";

export const VENDOR_PERMISSIONS: readonly VendorPermission[] = [
  "products",
  "orders",
  "payouts",
  "analytics",
  "chat",
  "reviews",
] as const;

/** Default capability matrix when JWT does not send explicit `vendor_permissions`. */
export const ROLE_PERMISSIONS: Record<VendorTeamRole, VendorPermission[]> = {
  owner: [...VENDOR_PERMISSIONS],
  manager: [...VENDOR_PERMISSIONS],
  staff: ["products", "orders", "chat", "reviews"],
};

export function normalizeVendorTeamRole(raw: unknown): VendorTeamRole {
  const s = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (s === "manager" || s === "staff" || s === "owner") return s;
  return "owner";
}

const KNOWN = new Set<string>(VENDOR_PERMISSIONS);

function normalizePermissionToken(raw: unknown): VendorPermission | null {
  if (typeof raw !== "string") return null;
  const p = raw.toLowerCase().trim();
  return KNOWN.has(p) ? (p as VendorPermission) : null;
}

/** Effective permissions from JWT claims (explicit list wins over role matrix). */
export function resolvePermissionsFromClaims(
  claims: PermissionsClaimsInput
): VendorPermission[] {
  const rawList =
    claims.vendor_permissions ?? claims.vendorPermissions ?? claims.permissions;
  if (Array.isArray(rawList) && rawList.length > 0) {
    const out: VendorPermission[] = [];
    const seen = new Set<VendorPermission>();
    for (const item of rawList) {
      const p = normalizePermissionToken(item);
      if (p && !seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
    return out;
  }

  const role = normalizeVendorTeamRole(
    claims.vendor_team_role ?? claims.vendorTeamRole ?? claims.team_role
  );
  return [...ROLE_PERMISSIONS[role]];
}

type PermissionsUserLike = {
  permissions?: VendorPermission[];
  teamRole?: string;
} | null;

export function resolveEffectivePermissionsForUser(
  user: PermissionsUserLike
): VendorPermission[] {
  if (!user) return [];
  if (user.permissions?.length) {
    const seen = new Set<VendorPermission>();
    const out: VendorPermission[] = [];
    for (const p of user.permissions) {
      if (KNOWN.has(p) && !seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
    return out;
  }
  const role = user.teamRole ?? "owner";
  return [...ROLE_PERMISSIONS[normalizeVendorTeamRole(role)]];
}

export function hasPermission(
  effective: readonly VendorPermission[],
  required: VendorPermission
): boolean {
  return effective.includes(required);
}

/**
 * First path segment(s) → permission required for that area.
 * `null` means any authenticated vendor may access (e.g. dashboard, settings).
 */
export function getRequiredPermissionForPathname(
  pathname: string
): VendorPermission | null {
  const clean = pathname.replace(/^\/+/, "");
  const seg = clean.split("/")[0] ?? "";
  if (!seg) return null;

  if (seg === "products" || seg === "inventory" || seg === "variants") {
    return "products";
  }
  if (seg === "orders" || seg === "disputes") {
    return "orders";
  }
  if (seg === "payouts") return "payouts";
  if (seg === "analytics") return "analytics";
  if (seg === "chat") return "chat";
  if (seg === "reviews") return "reviews";

  return null;
}

export function isAccessDeniedRoute(pathname: string): boolean {
  return (
    pathname === "/access-denied" || pathname.startsWith("/access-denied/")
  );
}
