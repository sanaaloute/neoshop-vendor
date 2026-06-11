"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FeaturePageShell } from "@/components/layout/feature-page-shell";

export default function VendorErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // In production, send to an error tracking service (e.g. Sentry)
    console.error("Vendor route error:", error);
  }, [error]);

  return (
    <FeaturePageShell
      title={t("pageErrorTitle")}
      description={t("pageErrorDescription")}
      className="items-center justify-center text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">
          {error.message || t("pageErrorRetry")}
        </p>
        {error.digest ? (
          <p className="text-muted-foreground text-xs">
            Error ID: {error.digest}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={reset}>{t("tryAgain")}</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("reloadPage")}
          </Button>
        </div>
      </div>
    </FeaturePageShell>
  );
}
