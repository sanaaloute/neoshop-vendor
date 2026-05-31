"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Spinner, CircularProgress } from "@/components/ui/spinner";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { overlayFade } from "@/lib/motion";

type ProgressOverlayProps = {
  open: boolean;
  title?: string;
  description?: string;
  progress?: number;
  variant?: "spinner" | "circular" | "linear" | " fullscreen";
  className?: string;
};

export function ProgressOverlay({
  open,
  title = "Processing…",
  description,
  progress,
  variant = "spinner",
  className,
}: ProgressOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "bg-background/70 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md",
            className
          )}
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.div
            className="bg-card/90 shadow-vendor-card border-border/60 flex flex-col items-center gap-4 rounded-2xl border p-8 ring-1 ring-white/5 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {variant === "circular" && typeof progress === "number" ? (
              <CircularProgress
                value={progress}
                size={64}
                strokeWidth={4}
                showPercentage
              />
            ) : variant === "linear" && typeof progress === "number" ? (
              <div className="w-56 space-y-3">
                <Spinner size="lg" />
                <Progress value={progress}>
                  <ProgressTrack className="h-2">
                    <ProgressIndicator className="progress-striped rounded-full" />
                  </ProgressTrack>
                </Progress>
              </div>
            ) : (
              <Spinner size="xl" />
            )}
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold">{title}</p>
              {description ? (
                <p className="text-muted-foreground max-w-[16rem] text-xs">
                  {description}
                </p>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Inline progress status for operations within cards/pages */
export function InlineProgress({
  status,
  progress,
  className,
}: {
  status: ReactNode;
  progress?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Spinner size="xs" />
        <span className="text-muted-foreground text-xs">{status}</span>
      </div>
      {typeof progress === "number" && (
        <Progress value={progress}>
          <ProgressTrack className="h-1.5">
            <ProgressIndicator className="rounded-full" />
          </ProgressTrack>
        </Progress>
      )}
    </div>
  );
}
