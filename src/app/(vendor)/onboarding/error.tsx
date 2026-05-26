"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FeaturePageShell } from "@/components/layout/feature-page-shell";

export default function OnboardingErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding route error:", error);
  }, [error]);

  return (
    <FeaturePageShell
      title="Onboarding interrupted"
    >
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">
          We ran into a problem while setting up your vendor account.
        </p>
        <p className="text-muted-foreground text-sm">
          {error.message || "Please try again or contact support."}
        </p>
        <div className="flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </FeaturePageShell>
  );
}
