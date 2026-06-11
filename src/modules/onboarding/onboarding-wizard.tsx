"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { ActiveOnboardingStep } from "./onboarding-step-forms";
import { OnboardingProgress } from "./onboarding-progress";


type OnboardingWizardProps = {
  actionsSlot?: ReactNode;
};

export function OnboardingWizard({ actionsSlot }: OnboardingWizardProps) {
  const t = useTranslations("onboarding");
  const step = useOnboardingWizardStore((s) => s.step);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const apiBusy = useOnboardingWizardStore((s) => s.apiBusy);
  const isFirst = step === 0;

  const stepDescriptions = [
    t("wizard.stepDescription0"),
    t("wizard.stepDescription1"),
    t("wizard.stepDescription2"),
    t("wizard.stepDescription3"),
  ];

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 animate-page-enter">
      {actionsSlot ? (
        <div className="flex justify-end">{actionsSlot}</div>
      ) : null}

      <OnboardingProgress />

      <Card className="glass-card shadow-glass border-border/60 p-5 md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold tracking-tight">
              {t(`progress.stepLabel${step}`)}
            </h2>
            <p className="text-muted-foreground text-xs">
              {stepDescriptions[step]}
            </p>
          </div>
        </div>

        <ActiveOnboardingStep />

        {/* Navigation buttons — only for steps 0, 1 (step 2 has its own continue, step 3 has submit) */}
        {step !== 2 && step !== 3 && (
          <div className="border-border/40 mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={isFirst || apiBusy}
              onClick={() => setStep(step - 1)}
            >
              {t("wizard.back")}
            </Button>
            <Button
              type="submit"
              form="vendor-onboarding-step-form"
              disabled={apiBusy}
            >
              {apiBusy ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("wizard.saving")}
                </span>
              ) : (
                t("wizard.continue")
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
