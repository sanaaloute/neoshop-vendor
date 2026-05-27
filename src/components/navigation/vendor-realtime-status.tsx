"use client";

import { motion } from "framer-motion";
import { Wifi } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RealtimeState = "live" | "degraded" | "offline";

export function VendorRealtimeStatus({
  state = "live",
  className,
}: {
  state?: RealtimeState;
  className?: string;
}) {
  const label =
    state === "live"
      ? "Realtime connected"
      : state === "degraded"
        ? "Realtime reconnecting"
        : "Realtime offline";

  const dotClass =
    state === "live"
      ? "bg-green-400 shadow-[0_0_12px_rgba(34,197,94,0.55)]"
      : state === "degraded"
        ? "bg-red-400"
        : "bg-muted-foreground/60";

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "border-border/70 bg-card/40 text-muted-foreground inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium backdrop-blur-sm",
          className
        )}
      >
        <span className="relative flex size-2 items-center justify-center">
          <motion.span
            className={cn("absolute inline-flex size-2 rounded-full", dotClass)}
            animate={
              state === "live"
                ? { scale: [1, 1.25, 1], opacity: [1, 0.85, 1] }
                : {}
            }
            transition={
              state === "live"
                ? {
                    duration: 2.4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
                : undefined
            }
          />
        </span>
        <Wifi className="text-muted-foreground size-3.5" aria-hidden />
        <span className="hidden sm:inline">
          {state === "live"
            ? "Live"
            : state === "degraded"
              ? "Syncing"
              : "Offline"}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
