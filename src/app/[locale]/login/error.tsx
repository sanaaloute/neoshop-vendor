"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FeaturePageShell } from "@/components/layout/feature-page-shell";

export default function LoginErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Login route error:", error);
  }, [error]);

  return (
    <FeaturePageShell
      title="Sign-in unavailable"
      description="We could not load the sign-in page."
      className="min-h-dvh max-w-full items-center justify-center text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">
          {error.message || "Please try again in a moment."}
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
