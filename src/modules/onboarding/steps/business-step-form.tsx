"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncBusinessStep } from "../onboarding-api";
import { businessSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { BusinessInfo } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

export function BusinessStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft.business);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const accountEmail = useAuthStore((s) => s.user?.email ?? "");
  const [stepError, setStepError] = useState<string | null>(null);
  const form = useForm<BusinessInfo>({
    resolver: zodResolver(businessSchema),
    defaultValues: draft,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "business");

  useEffect(() => {
    if (!accountEmail) return;
    const current = form.getValues("businessEmail")?.trim();
    if (!current) {
      form.setValue("businessEmail", accountEmail, { shouldValidate: true });
    }
  }, [accountEmail, form]);

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (data) => {
          setStepError(null);
          setApiBusy(true);
          try {
            patchSection("business", data);
            await syncBusinessStep(data);
            setStep(1);
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
          name="legalName"
          label="Legal business name"
          placeholder="Acme Oy"
          className="md:col-span-2"
        />
        <VendorTextField
          control={form.control}
          name="registrationId"
          label="Registration / business ID"
          placeholder="1234567-8"
        />
        <VendorTextField
          control={form.control}
          name="country"
          label="Country"
          placeholder="Finland"
        />
        <VendorTextField
          control={form.control}
          name="businessEmail"
          label="Business email"
          placeholder="orders@example.com"
          type="email"
          autoComplete="email"
        />
        <VendorTextField
          control={form.control}
          name="businessPhone"
          label="Business phone"
          placeholder="+358 40 123 4567"
          autoComplete="tel"
        />
        <VendorTextField
          control={form.control}
          name="addressLine1"
          label="Street address"
          placeholder="Mannerheimintie 1"
          className="md:col-span-2"
        />
        <VendorTextField control={form.control} name="city" label="City" />
        <VendorTextField
          control={form.control}
          name="postalCode"
          label="Postal code"
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
