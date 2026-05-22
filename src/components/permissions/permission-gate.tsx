"use client";

import type { ReactNode } from "react";

import type { VendorPermission } from "@/lib/vendor-permissions";
import { useVendorPermissions } from "@/hooks/use-vendor-permissions";

type PermissionGateProps = {
  permission: VendorPermission;
  children: ReactNode;
  /** Rendered when the current member lacks this permission */
  fallback?: ReactNode;
};

/** Hide or swap UI when the signed-in vendor role lacks a capability. */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = useVendorPermissions();
  if (!can(permission)) return fallback;
  return children;
}
