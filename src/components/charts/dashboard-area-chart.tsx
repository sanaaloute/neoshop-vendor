"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

export type AreaDatum = { label: string; value: number };

type DashboardAreaChartProps = {
  data: AreaDatum[];
  className?: string;
  height?: number;
  gradientId: string;
  /** CSS color for stroke / gradient stops, e.g. `var(--color-chart-2)` */
  accentColor?: string;
};

export function DashboardAreaChart({
  data,
  className,
  height = 220,
  gradientId,
  accentColor = "var(--color-chart-1)",
}: DashboardAreaChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={height}
      >
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.45} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            className="stroke-border/60"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            dy={6}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "var(--color-popover)",
              border:
                "1px solid color-mix(in oklch, var(--color-border) 80%, transparent)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "var(--color-popover-foreground)",
            }}
            formatter={(value) => [
              typeof value === "number"
                ? value.toLocaleString()
                : String(value ?? ""),
              "",
            ]}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={accentColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
