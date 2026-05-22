"use client";

import { Loader2 } from "lucide-react";

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
      <div
        className={cn(
          "text-muted-foreground border-border/60 rounded-lg border border-dashed px-3 py-2 text-sm",
          className
        )}
      >
        <span className="text-foreground font-medium">
          Couldn’t connect to your marketplace.
        </span>{" "}
        Contact your administrator if this continues.
      </div>
    );
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "border-border/60 bg-primary/5 text-foreground flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm",
          className
        )}
      >
        <Loader2
          className="text-primary size-4 shrink-0 animate-spin"
          aria-hidden
        />
        <span>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm",
          className
        )}
      >
        <span className="font-medium">Something went wrong.</span> {error}
      </div>
    );
  }

  return null;
}
