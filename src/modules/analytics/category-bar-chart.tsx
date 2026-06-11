"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

import type { AnalyticsBarRow } from "./types";

type CategoryBarChartProps = {
  data: AnalyticsBarRow[];
  className?: string;
  height?: number;
  valueFormatter?: (n: number) => string;
};

export function CategoryBarChart({
  data,
  className,
  height = 280,
  valueFormatter = (n) => n.toLocaleString(),
}: CategoryBarChartProps) {
  const t = useTranslations("analytics");
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={height}
      >
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 6"
            className="stroke-border/60"
            horizontal
          />
          <XAxis
            type="number"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{
              fill: "color-mix(in oklch, var(--color-muted) 35%, transparent)",
            }}
            contentStyle={{
              background: "var(--color-popover)",
              border:
                "1px solid color-mix(in oklch, var(--color-border) 80%, transparent)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "var(--color-popover-foreground)",
            }}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return [Number.isFinite(n) ? valueFormatter(n) : "", t("revenue")];
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--color-chart-2)"
            radius={[0, 6, 6, 0]}
            maxBarSize={28}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
