import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { PayoutsHome } from "@/modules/payouts";

export default async function PayoutsRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("payouts")} className="max-w-6xl">
      <PayoutsHome />
    </FeaturePageShell>
  );
}
