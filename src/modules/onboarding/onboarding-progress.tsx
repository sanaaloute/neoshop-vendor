"use client";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { ONBOARDING_STEP_COUNT, ONBOARDING_STEP_LABELS } from "./types";

type OnboardingProgressProps = {
  step: number;
  className?: string;
};

export function OnboardingProgress({
  step,
  className,
}: OnboardingProgressProps) {
  const safeStep = Math.max(0, Math.min(ONBOARDING_STEP_COUNT - 1, step));
  const pct = Math.round(((safeStep + 1) / ONBOARDING_STEP_COUNT) * 100);

  return (
    <div className={cn("space-y-4", className)}>
      <ol className="flex flex-wrap gap-2">
        {ONBOARDING_STEP_LABELS.map((label, i) => {
          const done = i < safeStep;
          const active = i === safeStep;
          return (
            <li key={label}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors md:text-sm",
                  done && "border-primary/40 bg-primary/10 text-foreground",
                  active &&
                    "border-primary bg-primary/15 text-foreground ring-primary/30 ring-2",
                  !done &&
                    !active &&
                    "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                <span className="text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                <span>{label}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <Progress value={pct}>
        <div className="flex w-full items-center gap-2">
          <ProgressLabel>
            Step {safeStep + 1} of {ONBOARDING_STEP_COUNT}
          </ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
    </div>
  );
}
