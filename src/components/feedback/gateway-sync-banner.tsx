"use client";

import { motion, AnimatePresence } from "framer-motion";

import { Spinner } from "@/components/ui/spinner";
import { getApiBaseUrl } from "@/config/auth";
import { cn } from "@/lib/utils";

type GatewaySyncBannerProps = {
  loading: boolean;
  error: string | null;
  className?: string;
};

export function GatewaySyncBanner({
  loading,
  error,
  className,
}: GatewaySyncBannerProps) {
  const api = getApiBaseUrl();

  if (!api) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "text-muted-foreground border-border/60 rounded-lg border border-dashed px-3 py-2 text-sm",
          className
        )}
      >
        <span className="text-foreground font-medium">
          Couldn&apos;t connect to your marketplace.
        </span>{" "}
        Contact your administrator if this continues.
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loading"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "border-border/60 bg-primary/5 text-foreground flex items-center gap-2 overflow-hidden rounded-lg border border-dashed px-3 py-2 text-sm",
            className
          )}
        >
          <Spinner size="sm" variant="primary" />
          <span>Syncing data from marketplace…</span>
        </motion.div>
      )}
      {error && !loading && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm",
            className
          )}
        >
          <span className="font-medium">Something went wrong.</span> {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
