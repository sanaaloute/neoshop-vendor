import { FeaturePageShell } from "@/components/layout/feature-page-shell";

import { DashboardHome } from "@/modules/dashboard";

export default function DashboardRoutePage() {
  return (
    <FeaturePageShell title="Dashboard">
      <DashboardHome />
    </FeaturePageShell>
  );
}
