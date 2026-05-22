"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { AnalyticsGeoSlice } from "./types";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "color-mix(in oklch, var(--color-chart-1) 65%, var(--color-muted))",
];

type GeoPieChartProps = {
  data: AnalyticsGeoSlice[];
  className?: string;
  height?: number;
};

export function GeoPieChart({
  data,
  className,
  height = 260,
}: GeoPieChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={height}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={88}
            paddingAngle={2}
            isAnimationActive
            animationDuration={900}
          >
            {data.map((d, i) => (
              <Cell
                key={`${d.name}-${i}`}
                fill={COLORS[i % COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border:
                "1px solid color-mix(in oklch, var(--color-border) 80%, transparent)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "var(--color-popover-foreground)",
            }}
            formatter={(value, _name, item) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              return [
                formatCurrency(Number.isFinite(n) ? n : 0),
                String(item.payload?.name ?? ""),
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
