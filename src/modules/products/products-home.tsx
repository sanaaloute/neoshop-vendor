"use client";

import { useProductStats } from "@/hooks/use-product-stats";
import { ProductsList } from "./products-list";

export function ProductsHome() {
  const { stats, loading: statsLoading } = useProductStats();

  return (
    <div className="flex flex-col gap-4">
      {stats && !statsLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(
            [
              ["Draft", stats.draft],
              ["Pending", stats.pending_review],
              ["Published", stats.published],
              ["Hidden", stats.hidden],
              ["Archived", stats.archived],
              ["Rejected", stats.rejected],
            ] as const
          ).map(([label, count]) => (
            <div
              key={label}
              className="bg-muted/40 border-border/60 flex flex-col rounded-lg border px-3 py-2"
            >
              <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                {label}
              </span>
              <span className="text-foreground text-lg font-semibold tabular-nums">
                {count}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <ProductsList />
    </div>
  );
}
