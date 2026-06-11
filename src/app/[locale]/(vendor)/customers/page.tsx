import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { CustomersHome } from "@/modules/customers";

export default async function CustomersRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("customers")} className="max-w-6xl">
      <CustomersHome />
    </FeaturePageShell>
  );
}
