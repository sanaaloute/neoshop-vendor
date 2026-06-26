"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { AlertTriangle } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

import { vendorShouldUseOnboardingWizard } from "@/lib/vendor-lifecycle";
import { useVendorProfileStore } from "@/store/vendor-profile-store";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { shouldHydrateFromProfile } from "@/modules/onboarding/onboarding-api";

type OnboardingRedirectGateProps = { children: ReactNode };

export function OnboardingRedirectGate({
  children,
}: OnboardingRedirectGateProps) {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const profile = useVendorProfileStore((s) => s.profile);
  const loading = useVendorProfileStore((s) => s.loading);
  const fetched = useVendorProfileStore((s) => s.fetched);
  const load = useVendorProfileStore((s) => s.load);
  const hydrateFromProfile = useOnboardingWizardStore(
    (s) => s.hydrateFromProfile
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!fetched || !profile) return;

    // Hydrate draft from profile if rejected or partially filled
    if (shouldHydrateFromProfile(profile)) {
      hydrateFromProfile(profile);
    }

    if (!vendorShouldUseOnboardingWizard(profile.status)) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [fetched, profile, router, hydrateFromProfile]);

  if (!fetched && (loading || !profile)) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm">
        <Spinner size="sm" />
        {t("redirectGate.checkingProfile")}
      </div>
    );
  }

  if (fetched && profile && !vendorShouldUseOnboardingWizard(profile.status)) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm">
        <Spinner size="sm" />
        {t("redirectGate.redirecting")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {profile?.status === "REJECTED" && profile.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-amber-200">
              {t("redirectGate.previousSubmissionRejected")}
            </span>
            <span className="text-xs leading-relaxed text-amber-100/80">
              {profile.rejectionReason}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
