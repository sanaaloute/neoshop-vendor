import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { OnboardingRedirectGate } from "@/modules/onboarding/onboarding-redirect-gate";
import { OnboardingWizard } from "@/modules/onboarding/onboarding-wizard";

import { OnboardingActions } from "./onboarding-actions";

export default function OnboardingRoutePage() {
  return (
    <FeaturePageShell title="Vendor Onboarding">
      <OnboardingRedirectGate>
        <OnboardingWizard actionsSlot={<OnboardingActions />} />
      </OnboardingRedirectGate>
    </FeaturePageShell>
  );
}
