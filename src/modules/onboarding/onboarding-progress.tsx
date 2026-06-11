"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { ONBOARDING_STEP_COUNT } from "./types";
import { cn } from "@/lib/utils";

export function OnboardingProgress() {
  const t = useTranslations("onboarding");
  const step = useOnboardingWizardStore((s) => s.step);
  const progress = ((step + 1) / ONBOARDING_STEP_COUNT) * 100;

  const labels = [
    t("progress.stepLabel0"),
    t("progress.stepLabel1"),
    t("progress.stepLabel2"),
    t("progress.stepLabel3"),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Step chips */}
      <div className="flex items-center justify-between">
        {labels.map((label, idx) => {
          const status =
            idx < step ? "done" : idx === step ? "active" : "pending";
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={{
                    scale: status === "active" ? 1.1 : 1,
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-300",
                    status === "done" &&
                      "border-emerald-500/60 bg-emerald-500/15 text-emerald-300",
                    status === "active" &&
                      "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                    status === "pending" &&
                      "border-border/60 bg-card/50 text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </motion.div>
                <span
                  className={cn(
                    "hidden text-[10px] font-medium sm:block",
                    status === "active"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < ONBOARDING_STEP_COUNT - 1 && (
                <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-muted sm:mx-3">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    initial={false}
                    animate={{
                      width: idx < step ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Linear progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <p className="text-muted-foreground text-center text-xs">
        {t("progress.stepOf", { current: step + 1, total: ONBOARDING_STEP_COUNT })}
      </p>
    </div>
  );
}
