"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FeaturePageShell } from "@/components/layout/feature-page-shell";

export default function LoginErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("Login route error:", error);
  }, [error]);

  return (
    <FeaturePageShell
      title={t("signInUnavailable")}
      description={t("signInUnavailableDescription")}
      className="min-h-dvh max-w-full items-center justify-center text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">
          {error.message || t("signInUnavailableRetry")}
        </p>
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
