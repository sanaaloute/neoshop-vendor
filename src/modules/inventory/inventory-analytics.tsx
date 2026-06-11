"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { MetricCard } from "@/components/cards/metric-card";
import { formatCompact } from "@/lib/format";

import type { InventoryLine } from "./types";
import { availableToPromise, isLowStock } from "./types";

type InventoryAnalyticsProps = {
  lines: InventoryLine[];
  liveKey: string;
};

export function InventoryAnalytics({
  lines,
  liveKey,
}: InventoryAnalyticsProps) {
  const t = useTranslations("inventory");

  const stats = useMemo(() => {
    const totalOnHand = lines.reduce((s, l) => s + l.onHand, 0);
    const totalReserved = lines.reduce((s, l) => s + l.reserved, 0);
    const low = lines.filter((l) => isLowStock(l)).length;
    const critical = lines.filter(
      (l) => l.onHand <= Math.max(0, l.reorderPoint - 10)
    ).length;
    const available = lines.reduce((s, l) => s + availableToPromise(l), 0);
    return { totalOnHand, totalReserved, low, critical, available };
  }, [lines]);

  return (
    <div key={liveKey} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label={t("onHandFiltered")}
        value={formatCompact(stats.totalOnHand)}
        hint={t("onHandHint")}
        index={0}
      />
      <MetricCard
        label={t("availableToPromise")}
        value={formatCompact(stats.available)}
        hint={t("atpHint")}
        index={1}
      />
      <MetricCard
        label={t("reserved")}
        value={formatCompact(stats.totalReserved)}
        hint={t("reservedHint")}
        index={2}
      />
      <MetricCard
        label={t("lowStockSkus")}
        value={stats.low}
        hint={
          stats.critical > 0
            ? t("criticalVsBuffer", { count: stats.critical })
            : t("withinBuffer")
        }
        delta={
          stats.low > 0
            ? { label: t("reviewCards"), positive: false }
            : { label: t("allAboveReorder"), positive: true }
        }
        index={3}
      />
    </div>
  );
}
