import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { PayoutsHome } from "@/modules/payouts";

export default function PayoutsRoutePage() {
  return (
    <FeaturePageShell title="Payouts" className="max-w-6xl">
      <PayoutsHome />
    </FeaturePageShell>
  );
}
