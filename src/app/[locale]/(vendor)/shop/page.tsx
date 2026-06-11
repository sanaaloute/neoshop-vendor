import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ShopSettingsHome } from "@/modules/shop";

export default async function ShopRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("shopSettings")} className="max-w-6xl">
      <ShopSettingsHome />
    </FeaturePageShell>
  );
}
