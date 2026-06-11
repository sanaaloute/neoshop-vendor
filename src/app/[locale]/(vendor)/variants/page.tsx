import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { VariantsHome } from "@/modules/variants";

export default async function VariantsRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("variants")} className="max-w-6xl">
      <VariantsHome />
    </FeaturePageShell>
  );
}
