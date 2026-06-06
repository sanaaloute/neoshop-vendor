import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { DashboardHome } from "@/modules/dashboard/dashboard-home";

export default async function DashboardPage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("dashboard")}>
      <DashboardHome />
    </FeaturePageShell>
  );
}
