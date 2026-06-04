"use client";

import { useEffect } from "react";
import { User, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { VendorForm, VendorTextField, VendorCountrySelect } from "@/components/forms";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";
import { basicInfoSchema } from "@/modules/onboarding/schemas";
import type { BasicInfoSchema } from "@/modules/onboarding/schemas";
import { ONBOARDING_STEP_FORM_ID } from "@/modules/onboarding/onboarding-step-forms";
import { syncRegisterStep, shouldHydrateFromProfile } from "@/modules/onboarding/onboarding-api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const vendorTypeOptions = [
  {
    value: "INDIVIDUAL" as const,
    label: "Individual",
    description: "Solo sellers, artisans, freelancers",
    icon: User,
  },
  {
    value: "COMPANY" as const,
    label: "Company",
    description: "Registered businesses, LLCs, corporations",
    icon: Building2,
  },
];

export function TypeBasicStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const patchBasicInfo = useOnboardingWizardStore((s) => s.patchBasicInfo);
  const setVendorType = useOnboardingWizardStore((s) => s.setVendorType);
  const setRegistered = useOnboardingWizardStore((s) => s.setRegistered);
  const registered = useOnboardingWizardStore((s) => s.registered);
  const profile = useVendorProfileStore((s) => s.profile);

  const defaultValues: BasicInfoSchema = {
    vendorType: (draft.vendorType || "INDIVIDUAL") as "INDIVIDUAL" | "COMPANY",
    legalBusinessName: draft.basicInfo.legalBusinessName,
    tradeName: draft.basicInfo.tradeName,
    businessEmail: draft.basicInfo.businessEmail,
    businessPhone: draft.basicInfo.businessPhone,
    countryCode: draft.basicInfo.countryCode,
  };

  useEffect(() => {
    if (profile && shouldHydrateFromProfile(profile)) {
      useOnboardingWizardStore.getState().hydrateFromProfile(profile);
    }
  }, [profile]);

  const onSubmit = async (data: BasicInfoSchema) => {
    setApiBusy(true);
    try {
      patchBasicInfo({
        legalBusinessName: data.legalBusinessName,
        tradeName: data.tradeName,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        countryCode: data.countryCode,
      });
      setVendorType(data.vendorType);

      if (!registered) {
        await syncRegisterStep({
          ...useOnboardingWizardStore.getState().draft,
          vendorType: data.vendorType,
          addressInfo: {
            ...useOnboardingWizardStore.getState().draft.addressInfo,
          },
        });
        setRegistered(true);
      }

      setStep(1);
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <VendorForm
      id={ONBOARDING_STEP_FORM_ID}
      schema={basicInfoSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
    >
      {(form) => {
        const watchType = form.watch("vendorType");

        return (
          <div className="flex flex-col gap-5">
            {/* Vendor Type Selector */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vendorTypeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = watchType === opt.value;
                return (
                  <motion.div
                    key={opt.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => form.setValue("vendorType", opt.value, { shouldValidate: true })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          form.setValue("vendorType", opt.value, { shouldValidate: true });
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-2 p-4 transition-all duration-200",
                        active
                          ? "border-primary bg-primary/10 shadow-glass"
                          : "border-border/60 bg-card/50 hover:border-primary/40 hover:bg-card"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">{opt.label}</span>
                          <span className="text-muted-foreground text-xs">{opt.description}</span>
                        </div>
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {form.formState.errors.vendorType && (
              <p className="text-destructive text-xs">{form.formState.errors.vendorType.message}</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <VendorTextField
                control={form.control}
                name="legalBusinessName"
                label="Legal Business Name"
                description={watchType === "INDIVIDUAL" ? "Can be your personal name or trade name" : "Registered business name"}
                placeholder="Amina's Handmade Crafts"
              />
              <VendorTextField
                control={form.control}
                name="tradeName"
                label="Trade Name (Optional)"
                placeholder="Amina Crafts"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <VendorTextField
                control={form.control}
                name="businessEmail"
                label="Business Email"
                type="email"
                placeholder="contact@example.com"
              />
              <VendorTextField
                control={form.control}
                name="businessPhone"
                label="Business Phone"
                type="tel"
                placeholder="+22501234567"
              />
            </div>

            <VendorCountrySelect
              control={form.control}
              name="countryCode"
              label="Country"
              placeholder="Select country"
            />
          </div>
        );
      }}
    </VendorForm>
  );
}
