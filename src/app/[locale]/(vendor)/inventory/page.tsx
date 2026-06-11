import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { InventoryHome } from "@/modules/inventory";

export default async function InventoryRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("inventory")} className="max-w-6xl">
      <InventoryHome />
    </FeaturePageShell>
  );
}
