"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  FileText,
  Building2,
  User,
  MapPin,
  Mail,
  Phone,
  Globe,
  Send,
} from "lucide-react";

import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";
import { ONBOARDING_STEP_FORM_ID } from "@/modules/onboarding/onboarding-step-forms";
import { syncSubmitVerification } from "@/modules/onboarding/onboarding-api";
import { missingFields, draftIsComplete } from "@/modules/onboarding/types";
import { createReviewSchema } from "@/modules/onboarding/schemas";
import type { ReviewSchema } from "@/modules/onboarding/schemas";
import { VendorForm } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/feedback/loading-button";

import { COUNTRIES } from "@/modules/onboarding/countries";

const countryName = (code: string) => {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
};

export function ReviewSubmitStepForm() {
  const t = useTranslations("onboarding");
  const draft = useOnboardingWizardStore((s) => s.draft);
  const apiBusy = useOnboardingWizardStore((s) => s.apiBusy);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const resetWizard = useOnboardingWizardStore((s) => s.resetWizard);
  const profile = useVendorProfileStore((s) => s.profile);
  const loadProfile = useVendorProfileStore((s) => s.load);
  const router = useRouter();

  const reviewSchema = createReviewSchema((key: string) => t(key));

  const [submitError, setSubmitError] = useState<string | null>(null);

  const isRejected = profile?.status === "REJECTED";
  const rejectionReason = profile?.rejectionReason;

  const incomplete = !draftIsComplete(draft);
  const missing = missingFields(draft);

  const onSubmit = async (_data: ReviewSchema) => {
    setSubmitError(null);
    setApiBusy(true);
    try {
      await syncSubmitVerification();
      await loadProfile({ force: true });
      resetWizard();
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("steps.review.submissionFailed");
      setSubmitError(msg);
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <VendorForm
      id={ONBOARDING_STEP_FORM_ID}
      schema={reviewSchema}
      defaultValues={{ acceptedTerms: draft.acceptedTerms }}
      onSubmit={onSubmit}
    >
      {(form) => (
        <div className="flex flex-col gap-5">
          {/* Rejection banner */}
          {isRejected && rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-amber-200">
                  {t("steps.review.previousSubmissionRejected")}
                </span>
                <span className="text-xs leading-relaxed text-amber-100/80">
                  {rejectionReason}
                </span>
                <span className="text-[10px] text-amber-100/60">
                  {t("steps.review.updateAndSubmitAgain")}
                </span>
              </div>
            </motion.div>
          )}

          {/* Summary card */}
          <div className="glass-card shadow-glass overflow-hidden rounded-xl">
            <div className="border-border/50 bg-card/60 border-b px-5 py-3">
              <h3 className="text-sm font-semibold">
                {t("steps.review.applicationSummary")}
              </h3>
            </div>
            <div className="flex flex-col gap-4 p-5">
              {/* Vendor type */}
              <SummaryRow
                icon={draft.vendorType === "COMPANY" ? Building2 : User}
                label={t("steps.review.vendorType")}
                value={draft.vendorType}
              />

              {/* Basic info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SummaryRow
                  icon={Building2}
                  label={t("steps.review.legalName")}
                  value={draft.basicInfo.legalBusinessName}
                />
                {draft.basicInfo.tradeName && (
                  <SummaryRow
                    icon={Building2}
                    label={t("steps.review.tradeName")}
                    value={draft.basicInfo.tradeName}
                  />
                )}
                <SummaryRow
                  icon={Mail}
                  label={t("steps.review.email")}
                  value={draft.basicInfo.businessEmail}
                />
                <SummaryRow
                  icon={Phone}
                  label={t("steps.review.phone")}
                  value={draft.basicInfo.businessPhone}
                />
                <SummaryRow
                  icon={Globe}
                  label={t("steps.review.country")}
                  value={countryName(draft.basicInfo.countryCode)}
                />
              </div>

              <div className="bg-border/40 h-px" />

              {/* Address */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SummaryRow
                  icon={MapPin}
                  label={t("steps.review.address")}
                  value={draft.addressInfo.addressLine1}
                />
                {draft.addressInfo.city && (
                  <SummaryRow
                    icon={MapPin}
                    label={t("steps.review.city")}
                    value={draft.addressInfo.city}
                  />
                )}
                {draft.addressInfo.region && (
                  <SummaryRow
                    icon={MapPin}
                    label={t("steps.review.region")}
                    value={draft.addressInfo.region}
                  />
                )}
                {draft.addressInfo.postalCode && (
                  <SummaryRow
                    icon={MapPin}
                    label={t("steps.review.postalCode")}
                    value={draft.addressInfo.postalCode}
                  />
                )}
              </div>

              <div className="bg-border/40 h-px" />

              {/* Documents */}
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t("steps.review.documents", {
                    count: draft.documents.filter((d) => d.status === "done")
                      .length,
                  })}
                </span>
                <div className="flex flex-wrap gap-2">
                  {draft.documents
                    .filter((d) => d.status === "done")
                    .map((doc) => (
                      <Badge
                        key={doc.id}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1 pr-2.5 pl-2 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        {doc.fileName}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Missing fields alert */}
          {incomplete && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {t("steps.review.missingInfo")}
                </span>
                <ul className="list-disc pl-4">
                  {missing.map((m) => (
                    <li key={m}>{t(`steps.missingFields.${m}` as const)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Terms checkbox */}
          <div className="border-border/40 bg-card/40 flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="acceptedTerms"
              checked={form.watch("acceptedTerms")}
              onCheckedChange={(v: boolean) =>
                form.setValue("acceptedTerms", v, { shouldValidate: true })
              }
              className="mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="acceptedTerms"
                className="cursor-pointer text-sm font-medium"
              >
                {t("steps.review.confirmAccurate")}
              </Label>
              <p className="text-muted-foreground text-xs">
                {t("steps.review.termsDescription")}
              </p>
              {form.formState.errors.acceptedTerms && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.acceptedTerms.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {submitError}
            </motion.div>
          )}

          {/* Submit button */}
          <div className="border-border/40 flex items-center justify-between gap-3 border-t pt-5">
            <Button
              type="button"
              variant="link"
              onClick={() => useOnboardingWizardStore.getState().setStep(2)}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("wizard.back")}
            </Button>
            <LoadingButton
              type="submit"
              loading={apiBusy}
              loadingText={t("steps.review.submitting")}
              disabled={incomplete}
              className="gap-2 px-5 py-2.5"
            >
              <Send className="h-4 w-4" />
              {t("steps.review.submitForVerification")}
            </LoadingButton>
          </div>
        </div>
      )}
    </VendorForm>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
      <div className="flex flex-col">
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
          {label}
        </span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
