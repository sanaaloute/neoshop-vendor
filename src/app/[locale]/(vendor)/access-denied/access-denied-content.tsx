"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldOff } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { VendorPermission } from "@/lib/vendor-permissions";

export function AccessDeniedContent() {
  const t = useTranslations("accessDenied");
  const params = useSearchParams();
  const required = params.get("required") as VendorPermission | null;

  const labelMap: Record<VendorPermission, string> = {
    products: t("productsAndCatalog"),
    orders: t("orders"),
    payouts: t("payouts"),
    analytics: t("analytics"),
    chat: t("chat"),
  };

  const label = required && labelMap[required] ? labelMap[required] : t("thisArea");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <ShieldOff className="text-muted-foreground size-7" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("description", { area: label })}
        </p>
      </div>
      <Link href="/dashboard" className={buttonVariants()}>
        {t("backToDashboard")}
      </Link>
    </div>
  );
}
