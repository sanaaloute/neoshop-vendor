import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { DisputesHome } from "@/modules/disputes";

export default async function DisputesRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("disputes")} className="max-w-6xl">
      <DisputesHome />
    </FeaturePageShell>
  );
}
