"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncShopStep } from "../onboarding-api";
import { shopSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { ShopInfo } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

export function ShopStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft.shop);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const setShopId = useOnboardingWizardStore((s) => s.setShopId);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const [stepError, setStepError] = useState<string | null>(null);
  const form = useForm<ShopInfo>({
    resolver: zodResolver(shopSchema),
    defaultValues: draft,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "shop");

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (data) => {
          setStepError(null);
          setApiBusy(true);
          try {
            patchSection("shop", data);
            const id = await syncShopStep(data);
            setShopId(id);
            setStep(2);
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
          name="shopName"
          label="Shop display name"
          placeholder="Acme Wholesale"
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Shop description</Label>
              <p className="text-muted-foreground text-xs">
                Describe what you sell and who you serve (min. 20 characters).
              </p>
              <Textarea
                id={field.name}
                rows={4}
                placeholder="We supply…"
                aria-invalid={fieldState.invalid}
                {...field}
              />
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
          name="website"
          label="Website (optional)"
          placeholder="https://example.com"
          type="url"
        />
        {stepError ? (
          <p className="text-destructive text-sm" role="alert">
            {stepError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
