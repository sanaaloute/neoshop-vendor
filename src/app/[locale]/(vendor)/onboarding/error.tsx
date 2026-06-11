"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FeaturePageShell } from "@/components/layout/feature-page-shell";

export default function OnboardingErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("Onboarding route error:", error);
  }, [error]);

  return (
    <FeaturePageShell
      title={t("onboardingInterrupted")}
      description={t("onboardingInterruptedDescription")}
    >
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">
          {error.message || t("onboardingInterruptedRetry")}
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
