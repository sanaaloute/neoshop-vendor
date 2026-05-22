import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { DisputesHome } from "@/modules/disputes";

export default function DisputesRoutePage() {
  return (
    <FeaturePageShell title="Disputes" className="max-w-6xl">
      <DisputesHome />
    </FeaturePageShell>
  );
}
