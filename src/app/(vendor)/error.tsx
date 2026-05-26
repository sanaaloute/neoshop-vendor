"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FeaturePageShell } from "@/components/layout/feature-page-shell";

export default function VendorErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send to an error tracking service (e.g. Sentry)
    console.error("Vendor route error:", error);
  }, [error]);

  return (
    <FeaturePageShell
      title="Something went wrong"
      className="items-center justify-center text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">
          We encountered an unexpected issue loading this page.
        </p>
        <p className="text-muted-foreground text-sm">
          {error.message || "Please try again or contact support if the problem persists."}
        </p>
        {error.digest ? (
          <p className="text-muted-foreground text-xs">
            Error ID: {error.digest}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </FeaturePageShell>
  );
}
