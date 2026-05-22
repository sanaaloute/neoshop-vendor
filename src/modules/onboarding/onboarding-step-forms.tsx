"use client";

import {
  BusinessStepForm,
  DocumentsStepForm,
  PaymentStepForm,
  ReviewStepForm,
  ShippingStepForm,
  ShopStepForm,
  TaxStepForm,
} from "./steps";

export const ONBOARDING_STEP_FORM_ID = "vendor-onboarding-step-form";

type ActiveOnboardingStepProps = {
  step: number;
};

export function ActiveOnboardingStep({ step }: ActiveOnboardingStepProps) {
  switch (step) {
    case 0:
      return <BusinessStepForm />;
    case 1:
      return <ShopStepForm />;
    case 2:
      return <DocumentsStepForm />;
    case 3:
      return <ShippingStepForm />;
    case 4:
      return <PaymentStepForm />;
    case 5:
      return <TaxStepForm />;
    case 6:
      return <ReviewStepForm />;
    default:
      return null;
  }
}
