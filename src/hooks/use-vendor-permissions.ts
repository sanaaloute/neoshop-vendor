"use client";

import { useCallback, useMemo } from "react";

import {
  hasPermission,
  resolveEffectivePermissionsForUser,
  type VendorPermission,
} from "@/lib/vendor-permissions";
import { useAuthStore } from "@/store/auth-store";

export function useVendorPermissions() {
  const user = useAuthStore((s) => s.user);

  const permissions = useMemo(
    () => resolveEffectivePermissionsForUser(user),
    [user]
  );

  const can = useCallback(
    (p: VendorPermission) => hasPermission(permissions, p),
    [permissions]
  );

  return {
    can,
    permissions,
    teamRole: user?.teamRole ?? "owner",
  };
}
