import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { OnboardingRedirectGate } from "@/modules/onboarding/onboarding-redirect-gate";
import { OnboardingWizard } from "@/modules/onboarding/onboarding-wizard";

import { OnboardingActions } from "./onboarding-actions";

export default async function OnboardingRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("onboarding")}>
      <OnboardingRedirectGate>
        <OnboardingWizard actionsSlot={<OnboardingActions />} />
      </OnboardingRedirectGate>
    </FeaturePageShell>
  );
}
