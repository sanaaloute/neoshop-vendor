"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncTaxStep } from "../onboarding-api";
import { taxSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { TaxInfo } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

export function TaxStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft.tax);
  const paymentDraft = useOnboardingWizardStore((s) => s.draft.payment);
  const shopId = useOnboardingWizardStore((s) => s.shopId);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const [stepError, setStepError] = useState<string | null>(null);
  const form = useForm<TaxInfo>({
    resolver: zodResolver(taxSchema),
    defaultValues: draft,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "tax");

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
            patchSection("tax", data);
            await syncTaxStep(shopId, data, paymentDraft);
            setStep(6);
          } catch (e) {
            setStepError(
              httpErrorMessageForUser(e, "Could not save this step. Try again.")
            );
          } finally {
            setApiBusy(false);
          }
        })}
      >
        <Controller
          control={form.control}
          name="entityType"
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={field.name}>Entity type</Label>
              <select
                id={field.name}
                className={cn(
                  "border-input bg-background flex h-10 w-full max-w-md rounded-md border px-3 py-2 text-sm",
                  fieldState.invalid && "border-destructive"
                )}
                {...field}
              >
                <option value="company">Company</option>
                <option value="individual">Individual</option>
              </select>
              {fieldState.error?.message ? (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />
        <VendorTextField
          control={form.control}
          name="vatId"
          label="VAT / GST ID"
        />
        <VendorTextField control={form.control} name="taxId" label="Tax ID" />
        {stepError ? (
          <p className="text-destructive md:col-span-2 text-sm" role="alert">
            {stepError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
