import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  rows?: number;
  className?: string;
  /** Optional slot for a compact toolbar skeleton */
  header?: ReactNode;
};

export function LoadingState({
  label = "Loading…",
  rows = 4,
  className,
  header,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/40 shadow-vendor-card dark:bg-card/30 flex flex-col gap-3 rounded-xl border p-4 ring-1 ring-white/5 backdrop-blur-sm",
        className
      )}
      aria-busy
      aria-live="polite"
    >
      {header}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <VendorMuted className="text-xs">{label}</VendorMuted>
      </div>
      <div className="space-y-2 pt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
