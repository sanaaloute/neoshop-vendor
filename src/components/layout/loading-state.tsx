"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Shimmer } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainerFast } from "@/lib/motion";

type LoadingStateProps = {
  label?: string;
  rows?: number;
  className?: string;
  /** Optional slot for a compact toolbar skeleton */
  header?: ReactNode;
  /** Show a premium spinner alongside the label */
  showSpinner?: boolean;
  /** Variation for full page vs inline */
  variant?: "default" | "compact" | "fullscreen";
};

export function LoadingState({
  label,
  rows = 4,
  className,
  header,
  showSpinner = true,
  variant = "default",
}: LoadingStateProps) {
  const t = useTranslations("common");
  const displayLabel = label ?? t("loading");
  const isFullscreen = variant === "fullscreen";

  return (
    <motion.div
      className={cn(
        isFullscreen
          ? "fixed inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm"
          : "border-border/60 bg-card/40 shadow-vendor-card dark:bg-card/30 flex flex-col gap-3 rounded-xl border p-4 ring-1 ring-white/5 backdrop-blur-sm",
        className
      )}
      variants={staggerContainerFast}
      initial="hidden"
      animate="show"
      aria-busy
      aria-live="polite"
    >
      {isFullscreen ? (
        <motion.div
          className="bg-card/90 shadow-vendor-card border-border/60 flex flex-col items-center gap-4 rounded-2xl border p-8 ring-1 ring-white/5 backdrop-blur-xl"
          variants={fadeUp}
        >
          <Spinner size="xl" />
          <VendorMuted className="text-sm font-medium">{displayLabel}</VendorMuted>
        </motion.div>
      ) : (
        <>
          {header}
          <motion.div className="space-y-2" variants={fadeUp}>
            <div className="flex items-center gap-2">
              {showSpinner && <Spinner size="sm" />}
              <Shimmer className="h-4 w-40" />
            </div>
            <VendorMuted className="text-xs">{displayLabel}</VendorMuted>
          </motion.div>
          <motion.div className="space-y-2 pt-1" variants={fadeUp}>
            {Array.from({ length: rows }).map((_, i) => (
              <Shimmer
                key={i}
                className={cn(
                  "h-9 w-full rounded-lg",
                  variant === "compact" && "h-7",
                  i % 3 === 1 && "w-[90%]",
                  i % 3 === 2 && "w-[75%]"
                )}
              />
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
