import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { QaHome } from "@/modules/qa";

export default async function ProductQaPage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("productQa")} className="max-w-6xl">
      <QaHome />
    </FeaturePageShell>
  );
}
