"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PayoutToolbarProps = {
  onExportSnapshot: () => void;
  onExportTransactions: () => void;
  className?: string;
};

export function PayoutToolbar({
  onExportSnapshot,
  onExportTransactions,
  className,
}: PayoutToolbarProps) {
  const t = useTranslations("payouts.toolbar");
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onExportSnapshot}
      >
        <Download className="size-3.5" aria-hidden />
        {t("exportFullReport")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onExportTransactions}
      >
        <Download className="size-3.5" aria-hidden />
        {t("exportTransactions")}
      </Button>
    </div>
  );
}
