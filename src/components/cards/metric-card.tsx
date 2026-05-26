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
  accent?: "primary" | "success" | "warning" | "info" | "danger";
};

const accentMap = {
  primary: "from-primary/15 to-transparent",
  success: "from-success/15 to-transparent",
  warning: "from-warning/15 to-transparent",
  info: "from-info/15 to-transparent",
  danger: "from-danger/15 to-transparent",
};

export function MetricCard({
  label,
  value,
  hint,
  delta,
  className,
  index = 0,
  accent = "primary",
  ...props
}: MetricCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial={false}
      animate="show"
      transition={{ delay: index * 0.05 }}
    >
      <DashboardCard className={cn("gap-0 py-0 overflow-hidden", className)} {...props}>
        <div
          className={cn(
            "pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-radial opacity-40 blur-2xl",
            accentMap[accent]
          )}
        />

        <DashboardCardHeader className="border-border/40 border-b px-4 py-3.5 relative">
          <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
            {label}
          </DashboardCardDescription>
          <DashboardCardTitle className="mt-1.5 text-[26px] font-bold tabular-nums tracking-tight">
            {value}
          </DashboardCardTitle>
          {delta ? (
            <VendorMuted
              className={cn(
                "mt-1.5 text-xs font-medium",
                delta.positive === false && "text-danger",
                delta.positive === true && "text-success"
              )}
            >
              {delta.label}
            </VendorMuted>
          ) : null}
        </DashboardCardHeader>
        {hint ? (
          <DashboardCardContent className="relative px-4 py-3">
            <VendorMuted className="text-xs leading-relaxed">{hint}</VendorMuted>
          </DashboardCardContent>
        ) : null}
      </DashboardCard>
    </motion.div>
  );
}
