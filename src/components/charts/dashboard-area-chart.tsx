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
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.55} />
              <stop offset="60%" stopColor={accentColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
            </linearGradient>
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="color-mix(in oklch, var(--color-border) 25%, transparent)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, opacity: 0.5 }}
            dy={6}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "color-mix(in oklch, var(--color-popover) 80%, transparent)",
              border: "1px solid color-mix(in oklch, var(--color-primary) 30%, transparent)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--color-popover-foreground)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 0 20px color-mix(in oklch, var(--color-primary) 15%, transparent)",
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
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            filter={`url(#glow-${gradientId})`}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
