"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Loader2,
} from "lucide-react";

import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";
import { ONBOARDING_STEP_FORM_ID } from "@/modules/onboarding/onboarding-step-forms";
import { syncSubmitVerification } from "@/modules/onboarding/onboarding-api";
import { missingFields, draftIsComplete } from "@/modules/onboarding/types";
import { reviewSchema } from "@/modules/onboarding/schemas";
import type { ReviewSchema } from "@/modules/onboarding/schemas";
import { VendorForm } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


import { COUNTRIES } from "@/modules/onboarding/countries";

const countryName = (code: string) => {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
};

export function ReviewSubmitStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft);
  const apiBusy = useOnboardingWizardStore((s) => s.apiBusy);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const resetWizard = useOnboardingWizardStore((s) => s.resetWizard);
  const profile = useVendorProfileStore((s) => s.profile);
  const loadProfile = useVendorProfileStore((s) => s.load);
  const router = useRouter();

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
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
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
                <span className="font-semibold text-amber-200 text-sm">
                  Your previous submission was rejected
                </span>
                <span className="text-amber-100/80 text-xs leading-relaxed">
                  {rejectionReason}
                </span>
                <span className="text-amber-100/60 text-[10px]">
                  Please update the required information and submit again.
                </span>
              </div>
            </motion.div>
          )}

          {/* Summary card */}
          <div className="glass-card shadow-glass overflow-hidden rounded-xl">
            <div className="border-b border-border/50 bg-card/60 px-5 py-3">
              <h3 className="font-semibold text-sm">Application Summary</h3>
            </div>
            <div className="flex flex-col gap-4 p-5">
              {/* Vendor type */}
              <SummaryRow
                icon={draft.vendorType === "COMPANY" ? Building2 : User}
                label="Vendor Type"
                value={draft.vendorType}
              />

              {/* Basic info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SummaryRow icon={Building2} label="Legal Name" value={draft.basicInfo.legalBusinessName} />
                {draft.basicInfo.tradeName && (
                  <SummaryRow icon={Building2} label="Trade Name" value={draft.basicInfo.tradeName} />
                )}
                <SummaryRow icon={Mail} label="Email" value={draft.basicInfo.businessEmail} />
                <SummaryRow icon={Phone} label="Phone" value={draft.basicInfo.businessPhone} />
                <SummaryRow icon={Globe} label="Country" value={countryName(draft.basicInfo.countryCode)} />
              </div>

              <div className="h-px bg-border/40" />

              {/* Address */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SummaryRow icon={MapPin} label="Address" value={draft.addressInfo.addressLine1} />
                {draft.addressInfo.city && (
                  <SummaryRow icon={MapPin} label="City" value={draft.addressInfo.city} />
                )}
                {draft.addressInfo.region && (
                  <SummaryRow icon={MapPin} label="Region" value={draft.addressInfo.region} />
                )}
                {draft.addressInfo.postalCode && (
                  <SummaryRow icon={MapPin} label="Postal Code" value={draft.addressInfo.postalCode} />
                )}
              </div>

              <div className="h-px bg-border/40" />

              {/* Documents */}
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Documents ({draft.documents.filter((d) => d.status === "done").length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {draft.documents
                    .filter((d) => d.status === "done")
                    .map((doc) => (
                      <Badge
                        key={doc.id}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1 pl-2 pr-2.5 text-xs"
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
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Some required information is missing:</span>
                <ul className="list-disc pl-4">
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Terms checkbox */}
          <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/40 p-4">
            <Checkbox
              id="acceptedTerms"
              checked={form.watch("acceptedTerms")}
              onCheckedChange={(v: boolean) => form.setValue("acceptedTerms", v, { shouldValidate: true })}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="acceptedTerms" className="cursor-pointer text-sm font-medium">
                I confirm the information is accurate
              </Label>
              <p className="text-muted-foreground text-xs">
                By submitting, you agree that all provided information and documents are true and accurate. False information may result in account suspension.
              </p>
              {form.formState.errors.acceptedTerms && (
                <p className="text-destructive text-xs">{form.formState.errors.acceptedTerms.message}</p>
              )}
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive text-xs"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {submitError}
            </motion.div>
          )}

          {/* Submit button */}
          <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-5">
            <button
              type="button"
              onClick={() => useOnboardingWizardStore.getState().setStep(2)}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={incomplete || apiBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {apiBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </button>
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
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
