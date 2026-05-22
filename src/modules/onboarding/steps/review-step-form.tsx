"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncReviewFinalize } from "../onboarding-api";
import { reviewSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { ReviewAck } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

export function ReviewStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const resetWizard = useOnboardingWizardStore((s) => s.resetWizard);
  const form = useForm<ReviewAck>({
    resolver: zodResolver(reviewSchema),
    defaultValues: draft.review,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "review");
  const router = useRouter();
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const submitLock = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className="grid gap-6"
        onSubmit={form.handleSubmit(async (data) => {
          if (submitLock.current) return;
          submitLock.current = true;
          setSubmitError(null);
          setApiBusy(true);
          try {
            patchSection("review", data);
            await syncReviewFinalize();
            const { useVendorProfileStore } = await import(
              "@/store/vendor-profile-store"
            );
            await useVendorProfileStore.getState().load({ force: true });
            const { fetchCsrfToken } = await import(
              "@/services/auth-session-client"
            );
            const csrf = await fetchCsrfToken();
            const res = await fetch("/api/onboarding/complete", {
              method: "POST",
              credentials: "include",
              headers: { "X-CSRF-Token": csrf },
            });
            if (!res.ok) throw new Error("complete_failed");
            resetWizard();
            router.replace("/dashboard");
            router.refresh();
          } catch (e) {
            setSubmitError(
              e instanceof Error && e.message === "complete_failed"
                ? "Could not mark onboarding complete. Try again."
                : httpErrorMessageForUser(
                    e,
                    "Could not finish onboarding. Try again."
                  )
            );
            submitLock.current = false;
          } finally {
            setApiBusy(false);
          }
        })}
      >
        <Card className="border-border/80 bg-muted/20 p-4 text-sm">
          <h3 className="mb-3 font-medium">Summary</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Legal name</dt>
              <dd>{draft.business.legalName || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Business contact</dt>
              <dd>
                {draft.business.businessEmail || "—"} ·{" "}
                {draft.business.businessPhone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Shop</dt>
              <dd>{draft.shop.shopName || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Documents</dt>
              <dd>{draft.documents.docTypes.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>
                {draft.shipping.originCountry || "—"} ·{" "}
                {draft.shipping.carrier || "—"} ·{" "}
                {draft.shipping.processingDays}d
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payout</dt>
              <dd>{draft.payment.bankName || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>
                {draft.tax.entityType} · VAT {draft.tax.vatId || "—"} · Tax ID{" "}
                {draft.tax.taxId || "—"}
              </dd>
            </div>
          </dl>
        </Card>
        <Controller
          control={form.control}
          name="acceptedTerms"
          render={({ field, fieldState }) => (
            <label className="border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                className="accent-primary mt-1 size-4"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={fieldState.invalid}
              />
              <span className="text-sm leading-snug">
                I confirm the information is accurate and I accept the vendor
                terms, payout policy, and marketplace rules.
              </span>
            </label>
          )}
        />
        {form.formState.errors.acceptedTerms?.message ? (
          <p className="text-destructive text-xs">
            {form.formState.errors.acceptedTerms.message}
          </p>
        ) : null}
        {submitError ? (
          <p className="text-destructive text-xs" role="alert">
            {submitError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
