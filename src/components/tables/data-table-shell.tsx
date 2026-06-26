"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "framer-motion";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Shimmer } from "@/components/ui/skeleton";
import { VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainerFast } from "@/lib/motion";

type DataTableShellProps = {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  loadingRows?: number;
} & Pick<ComponentProps<"div">, "className">;

export function DataTableShell({
  title,
  description,
  toolbar,
  footer,
  children,
  className,
  loading = false,
  loadingRows = 5,
}: DataTableShellProps) {
  return (
    <motion.section
      className={cn(
        "border-border/60 bg-card/50 shadow-vendor-card dark:bg-card/40 flex flex-col gap-3 rounded-xl border p-3 ring-1 ring-white/5 backdrop-blur-sm dark:ring-white/10",
        className
      )}
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      {(title || description || toolbar) && (
        <header className="flex flex-col gap-3 px-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="font-heading text-sm font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <VendorMuted className="text-xs">{description}</VendorMuted>
            ) : null}
          </div>
          {toolbar ? (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </header>
      )}
      <ScrollArea className="border-border/50 max-h-[min(70vh,720px)] rounded-lg border">
        <div className="min-w-0 overflow-x-auto">
          {loading ? (
            <motion.div
              className="space-y-2 p-4"
              variants={staggerContainerFast}
              initial="hidden"
              animate="show"
            >
              <motion.div
                className="bg-card/60 border-border/60 mb-2 flex items-center gap-2 rounded-lg border p-3 backdrop-blur-sm"
                variants={fadeUp}
              >
                <Spinner size="sm" variant="premium" />
                <VendorMuted className="text-xs">Loading data…</VendorMuted>
              </motion.div>
              {Array.from({ length: loadingRows }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  transition={{ delay: i * 0.05 }}
                >
                  <Shimmer
                    className={cn(
                      "h-10 w-full rounded-md",
                      i % 2 === 1 && "w-[92%]"
                    )}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            children
          )}
        </div>
      </ScrollArea>
      {footer ? (
        <footer className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {footer}
        </footer>
      ) : null}
    </motion.section>
  );
}
