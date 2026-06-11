"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("vendorWriteGuard");

  if (status === "APPROVED") return null;

  const title =
    status === "SUSPENDED"
      ? t("accountSuspended")
      : t("awaitingApproval");

  const body =
    status === "SUSPENDED"
      ? t("suspendedBody")
      : area === "catalog"
        ? t("catalogBody")
        : t("ordersBody");

  return (
    <div
      className="border-red-500/35 bg-red-500/10 text-red-950 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100 flex gap-3 rounded-lg border px-4 py-3 text-sm"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 opacity-90">{body}</p>
        {status ? (
          <p className="mt-2 text-xs opacity-75">{t("status", { status })}</p>
        ) : null}
      </div>
    </div>
  );
}
