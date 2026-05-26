"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type MiniBarDatum = { label: string; value: number };

type DashboardMiniBarsProps = {
  data: MiniBarDatum[];
  className?: string;
  valuePrefix?: string;
};

export function DashboardMiniBars({
  data,
  className,
  valuePrefix = "",
}: DashboardMiniBarsProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((row, i) => {
        const pct = Math.round((row.value / max) * 100);
        return (
          <li key={`${row.label}-${i}`} className="group space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground/60 truncate text-[11px] font-medium transition-colors group-hover:text-muted-foreground">
                {row.label}
              </span>
              <span className="text-foreground/80 shrink-0 tabular-nums text-[11px] font-semibold">
                {valuePrefix}
                {row.value.toLocaleString()}
              </span>
            </div>
            <div className="bg-muted/30 h-1.5 overflow-hidden rounded-full">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-chart-2 via-chart-1 to-chart-3"
                style={{
                  filter: "drop-shadow(0 0 4px color-mix(in oklch, var(--color-chart-1) 50%, transparent))",
                }}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 26,
                  delay: i * 0.04,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
