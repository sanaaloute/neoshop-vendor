"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { vendorShouldUseOnboardingWizard } from "@/lib/vendor-lifecycle";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

type OnboardingRedirectGateProps = { children: ReactNode };

/**
 * After submit-verification, `GET /vendors/me` shows e.g. PENDING_VERIFICATION — the
 * wizard must not stay visible even if the JWT `onboardingComplete` flag lags.
 */
export function OnboardingRedirectGate({ children }: OnboardingRedirectGateProps) {
  const router = useRouter();
  const profile = useVendorProfileStore((s) => s.profile);
  const loading = useVendorProfileStore((s) => s.loading);
  const fetched = useVendorProfileStore((s) => s.fetched);
  const load = useVendorProfileStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!fetched || !profile) return;
    if (!vendorShouldUseOnboardingWizard(profile.status)) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [fetched, profile, router]);

  if (!fetched && (loading || !profile)) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        Checking vendor profile…
      </div>
    );
  }

  if (fetched && profile && !vendorShouldUseOnboardingWizard(profile.status)) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        Redirecting to dashboard…
      </div>
    );
  }

  return <>{children}</>;
}
