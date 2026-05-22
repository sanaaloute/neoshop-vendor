"use client";

import { AlertTriangle } from "lucide-react";

import type { VendorLifecycleStatus } from "@/services/vendor/types";

type VendorWriteGuardBannerProps = {
  area: "catalog" | "orders";
  status: VendorLifecycleStatus | null;
};

export function VendorWriteGuardBanner({
  area,
  status,
}: VendorWriteGuardBannerProps) {
  if (status === "APPROVED") return null;

  const title =
    status === "SUSPENDED"
      ? "Account suspended"
      : "Awaiting NeoShop approval";

  const body =
    status === "SUSPENDED"
      ? "This account cannot change catalog or orders. Contact support if this is unexpected."
      : area === "catalog"
        ? "You can review the catalog UI, but creating, editing, publishing, or deleting products stays disabled until your vendor account is approved."
        : "You can open orders and print documents, but status changes and fulfillment updates stay disabled until your vendor account is approved.";

  return (
    <div
      className="border-amber-500/35 bg-amber-500/10 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 flex gap-3 rounded-lg border px-4 py-3 text-sm"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 opacity-90">{body}</p>
        {status ? (
          <p className="mt-2 text-xs opacity-75">Status: {status}</p>
        ) : null}
      </div>
    </div>
  );
}
