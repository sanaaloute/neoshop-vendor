"use client";

import { motion } from "framer-motion";

import { VendorForm, VendorTextField } from "@/components/forms";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { addressInfoSchema } from "@/modules/onboarding/schemas";
import type { AddressInfoSchema } from "@/modules/onboarding/schemas";
import { ONBOARDING_STEP_FORM_ID } from "@/modules/onboarding/onboarding-step-forms";
import { syncAddressStep } from "@/modules/onboarding/onboarding-api";
import { isFieldRequired } from "@/modules/onboarding/types";
import { AlertTriangle } from "lucide-react";

export function AddressStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const patchAddressInfo = useOnboardingWizardStore((s) => s.patchAddressInfo);

  const vendorType = draft.vendorType;

  const defaultValues: AddressInfoSchema = {
    region: draft.addressInfo.region,
    city: draft.addressInfo.city,
    addressLine1: draft.addressInfo.addressLine1,
    postalCode: draft.addressInfo.postalCode,
  };

  const onSubmit = async (data: AddressInfoSchema) => {
    setApiBusy(true);
    try {
      patchAddressInfo({
        region: data.region || "",
        city: data.city || "",
        addressLine1: data.addressLine1,
        postalCode: data.postalCode || "",
      });

      await syncAddressStep({
        ...draft,
        addressInfo: {
          region: data.region || "",
          city: data.city || "",
          addressLine1: data.addressLine1,
          postalCode: data.postalCode || "",
        },
      });

      setStep(2);
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <VendorForm
      id={ONBOARDING_STEP_FORM_ID}
      schema={addressInfoSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
    >
      {(form) => (
        <div className="flex flex-col gap-5">
          {vendorType === "COMPANY" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs leading-relaxed">
                As a registered company, you must provide a postal code. Business registration or tax certificate documents are recommended.
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <VendorTextField
              control={form.control}
              name="region"
              label="Region / State"
              placeholder="Abidjan"
            />
            <VendorTextField
              control={form.control}
              name="city"
              label="City"
              placeholder="Cocody"
            />
          </div>

          <VendorTextField
            control={form.control}
            name="addressLine1"
            label="Street Address"
            placeholder="Rue des Jardins, Lot 42"
          />

          <VendorTextField
            control={form.control}
            name="postalCode"
            label={isFieldRequired("postalCode", vendorType) ? "Postal Code *" : "Postal Code (Optional)"}
            placeholder="01 BP 1234"
          />
        </div>
      )}
    </VendorForm>
  );
}
