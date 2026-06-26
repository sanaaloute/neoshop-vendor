"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/routing";

import {
  getRequiredPermissionForPathname,
  type VendorPermission,
} from "@/lib/vendor-permissions";

import { PermissionGate } from "./permission-gate";

/**
 * Client-side permission gate keyed by the current route.
 * The server-side middleware is the authoritative check; this gate provides
 * a second layer for UI rendering and graceful fallback messages.
 */
export function PermissionRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const required = pathname
    ? getRequiredPermissionForPathname(pathname)
    : null;

  if (!required) return children;

  return (
    <PermissionGate
      permission={required as VendorPermission}
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      }
    >
      {children}
    </PermissionGate>
  );
}
