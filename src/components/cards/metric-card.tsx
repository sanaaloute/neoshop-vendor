"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "framer-motion";

import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  DashboardCard,
  DashboardCardHeader,
} from "@/components/cards/dashboard-card";

type MetricCardProps = Omit<ComponentProps<typeof DashboardCard>, "title"> & {
  label: string;
  value: ReactNode;
  delta?: { label: string; positive?: boolean };
  index?: number;
  accent?: "primary" | "success" | "warning" | "info" | "danger";
};

const accentGlowMap = {
  primary: "shadow-glow-primary",
  success: "shadow-glow-success",
  warning: "shadow-glow-warning",
  info: "shadow-glow-info",
  danger: "shadow-glow-danger",
};

const accentTextMap = {
  primary: "text-primary text-glow-primary",
  success: "text-success text-glow-success",
  warning: "text-warning text-glow-warning",
  info: "text-info text-glow-info",
  danger: "text-danger text-glow-danger",
};

export function MetricCard({
  label,
  value,
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
      transition={{ delay: index * 0.08 }}
    >
      <DashboardCard
        className={cn(
          "group gap-0 py-0 overflow-hidden border-glow-primary",
          className
        )}
        {...props}
      >
        <DashboardCardHeader className="px-5 py-5 relative">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 transition-colors group-hover:text-muted-foreground/70">
            {label}
          </span>
          <div className="mt-2 text-[32px] font-bold tabular-nums tracking-tighter leading-none">
            {value}
          </div>
          {delta ? (
            <span
              className={cn(
                "mt-2 inline-block text-xs font-semibold",
                delta.positive === false && "text-danger",
                delta.positive === true && "text-success",
                delta.positive === undefined && "text-muted-foreground"
              )}
            >
              {delta.label}
            </span>
          ) : null}
        </DashboardCardHeader>
      </DashboardCard>
    </motion.div>
  );
}
