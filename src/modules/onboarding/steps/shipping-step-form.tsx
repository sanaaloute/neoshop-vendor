"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncShippingStep } from "../onboarding-api";
import { shippingSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { ShippingInfo } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

export function ShippingStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft.shipping);
  const shopId = useOnboardingWizardStore((s) => s.shopId);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const [stepError, setStepError] = useState<string | null>(null);
  const form = useForm<ShippingInfo>({
    resolver: zodResolver(shippingSchema),
    defaultValues: draft,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "shipping");

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
            patchSection("shipping", data);
            await syncShippingStep(shopId, data);
            setStep(4);
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
          name="originCountry"
          label="Ship-from country"
          className="md:col-span-2"
        />
        <VendorTextField
          control={form.control}
          name="carrier"
          label="Preferred carrier"
          placeholder="Posti, DHL, …"
          className="md:col-span-2"
        />
        <Controller
          control={form.control}
          name="processingDays"
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Processing time (days)</Label>
              <Input
                id={field.name}
                type="number"
                min={1}
                max={60}
                placeholder="3"
                aria-invalid={fieldState.invalid}
                value={Number.isFinite(field.value) ? String(field.value) : ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  field.onChange(raw === "" ? NaN : Number.parseInt(raw, 10));
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              {fieldState.error?.message ? (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
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
