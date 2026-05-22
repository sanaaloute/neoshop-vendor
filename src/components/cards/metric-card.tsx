"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "framer-motion";

import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { VendorMuted } from "@/components/layout/typography";

type MetricCardProps = Omit<ComponentProps<typeof DashboardCard>, "title"> & {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: { label: string; positive?: boolean };
  index?: number;
};

export function MetricCard({
  label,
  value,
  hint,
  delta,
  className,
  index = 0,
  ...props
}: MetricCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial={false}
      animate="show"
      transition={{ delay: index * 0.05 }}
    >
      <DashboardCard className={cn("gap-0 py-0", className)} {...props}>
        <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
          <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {label}
          </DashboardCardDescription>
          <DashboardCardTitle className="mt-1 text-2xl font-semibold tabular-nums">
            {value}
          </DashboardCardTitle>
          {delta ? (
            <VendorMuted
              className={cn(
                "mt-1 text-xs font-medium",
                delta.positive === false && "text-destructive",
                delta.positive === true && "text-emerald-400"
              )}
            >
              {delta.label}
            </VendorMuted>
          ) : null}
        </DashboardCardHeader>
        {hint ? (
          <DashboardCardContent className="px-4 py-3">
            <VendorMuted className="text-xs">{hint}</VendorMuted>
          </DashboardCardContent>
        ) : null}
      </DashboardCard>
    </motion.div>
  );
}
