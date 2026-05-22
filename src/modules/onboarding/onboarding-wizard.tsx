"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import {
  ActiveOnboardingStep,
  ONBOARDING_STEP_FORM_ID,
} from "./onboarding-step-forms";
import { OnboardingProgress } from "./onboarding-progress";
import { ONBOARDING_STEP_COUNT, ONBOARDING_STEP_LABELS } from "./types";

type OnboardingWizardProps = {
  actionsSlot?: ReactNode;
};

export function OnboardingWizard({ actionsSlot }: OnboardingWizardProps) {
  const step = useOnboardingWizardStore((s) => s.step);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const apiBusy = useOnboardingWizardStore((s) => s.apiBusy);
  const label = ONBOARDING_STEP_LABELS[step] ?? ONBOARDING_STEP_LABELS[0];
  const isLast = step === ONBOARDING_STEP_COUNT - 1;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {actionsSlot ? (
        <div className="flex justify-end">{actionsSlot}</div>
      ) : null}

      <OnboardingProgress step={step} />

      <Card className="border-border/80 shadow-vendor-card p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
        </div>

        <ActiveOnboardingStep step={step} />

        <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || apiBusy}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          <Button
            type="submit"
            form={ONBOARDING_STEP_FORM_ID}
            disabled={apiBusy}
          >
            {apiBusy
              ? "Saving…"
              : isLast
                ? "Submit application"
                : "Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
