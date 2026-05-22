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
          <li key={`${row.label}-${i}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground truncate">
                {row.label}
              </span>
              <span className="text-foreground shrink-0 tabular-nums">
                {valuePrefix}
                {row.value.toLocaleString()}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <motion.div
                className="from-chart-2 via-chart-3 to-chart-1 h-full rounded-full bg-gradient-to-r"
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
