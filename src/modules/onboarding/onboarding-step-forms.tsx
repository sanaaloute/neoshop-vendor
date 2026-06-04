"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { TypeBasicStepForm } from "./steps/type-basic-step-form";
import { AddressStepForm } from "./steps/address-step-form";
import { DocumentsStepForm } from "./steps/documents-step-form";
import { ReviewSubmitStepForm } from "./steps/review-submit-step-form";

export const ONBOARDING_STEP_FORM_ID = "vendor-onboarding-step-form";

export function ActiveOnboardingStep() {
  const step = useOnboardingWizardStore((s) => s.step);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {step === 0 && <TypeBasicStepForm />}
        {step === 1 && <AddressStepForm />}
        {step === 2 && <DocumentsStepForm />}
        {step === 3 && <ReviewSubmitStepForm />}
      </motion.div>
    </AnimatePresence>
  );
}
