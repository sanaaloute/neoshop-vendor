"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncPaymentStep } from "../onboarding-api";
import { paymentSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { PaymentInfo } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

export function PaymentStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft.payment);
  const shopId = useOnboardingWizardStore((s) => s.shopId);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const [stepError, setStepError] = useState<string | null>(null);
  const form = useForm<PaymentInfo>({
    resolver: zodResolver(paymentSchema),
    defaultValues: draft,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "payment");

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (data) => {
          setStepError(null);
          if (!shopId) {
            setStepError("Shop is missing. Go back to the Shop step.");
            return;
          }
          setApiBusy(true);
          try {
            patchSection("payment", data);
            await syncPaymentStep(shopId, data);
            setStep(5);
          } catch (e) {
            setStepError(
              httpErrorMessageForUser(e, "Could not save this step. Try again.")
            );
          } finally {
            setApiBusy(false);
          }
        })}
      >
        <VendorTextField
          control={form.control}
          name="accountHolder"
          label="Account holder"
          className="md:col-span-2"
        />
        <VendorTextField
          control={form.control}
          name="bankName"
          label="Bank name"
          className="md:col-span-2"
        />
        <VendorTextField
          control={form.control}
          name="ibanLast4"
          label="IBAN last 4 digits"
          placeholder="1234"
        />
        <VendorTextField
          control={form.control}
          name="routingHint"
          label="Routing / SWIFT reference"
          placeholder="NDEAFIHH"
          className="md:col-span-2"
        />
        {stepError ? (
          <p className="text-destructive md:col-span-2 text-sm" role="alert">
            {stepError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
