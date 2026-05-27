"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Progress } from "@/components/ui/progress";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type AnalyticsSeriesPoint = {
  label: string;
  value: number;
};

type AnalyticsWidgetProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** 0–100 for primary progress */
  primaryProgress?: number;
  series?: AnalyticsSeriesPoint[];
  className?: string;
  index?: number;
};

export function AnalyticsWidget({
  title,
  subtitle,
  action,
  primaryProgress,
  series,
  className,
  index = 0,
}: AnalyticsWidgetProps) {
  const max = series?.length
    ? Math.max(...series.map((s) => s.value), 1)
    : undefined;

  return (
    <motion.div
      variants={fadeUp}
      initial={false}
      animate="show"
      transition={{ delay: index * 0.05 }}
    >
      <DashboardCard className={cn("gap-0 py-0", className)}>
        <DashboardCardHeader className="border-border/50 flex flex-row items-start justify-between gap-3 border-b px-4 py-3">
          <div className="space-y-1">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {subtitle ?? "Insight"}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {title}
            </DashboardCardTitle>
          </div>
          {action}
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-4 px-4 py-4">
          {typeof primaryProgress === "number" ? (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Progress</span>
                <span className="text-foreground tabular-nums">
                  {Math.round(primaryProgress)}%
                </span>
              </div>
              <Progress value={primaryProgress} />
            </div>
          ) : null}
          {series?.length ? (
            <ul className="space-y-3">
              {series.map((row) => {
                const pct = max ? Math.round((row.value / max) * 100) : 0;
                return (
                  <li key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground tabular-nums">
                        {row.value}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="from-chart-1 via-chart-3 to-chart-5 h-full rounded-full bg-gradient-to-r"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </DashboardCardContent>
      </DashboardCard>
    </motion.div>
  );
}
