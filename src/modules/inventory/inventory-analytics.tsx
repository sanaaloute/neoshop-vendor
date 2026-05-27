"use client";

import { useMemo } from "react";

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
        label="On hand (filtered)"
        value={formatCompact(stats.totalOnHand)}
        hint="Units physically in selected scope."
        index={0}
      />
      <MetricCard
        label="Available to promise"
        value={formatCompact(stats.available)}
        hint="On hand minus reservations."
        index={1}
      />
      <MetricCard
        label="Reserved"
        value={formatCompact(stats.totalReserved)}
        hint="Allocated to open orders / holds."
        index={2}
      />
      <MetricCard
        label="Low-stock SKUs"
        value={stats.low}
        hint={
          stats.critical > 0
            ? `${stats.critical} critical vs buffer`
            : "Within buffer"
        }
        delta={
          stats.low > 0
            ? { label: "Review cards below", positive: false }
            : { label: "All above reorder", positive: true }
        }
        index={3}
      />
    </div>
  );
}
