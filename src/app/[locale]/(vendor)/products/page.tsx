import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ProductsHome } from "@/modules/products";

export default async function ProductsRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("products")}>
      <ProductsHome />
    </FeaturePageShell>
  );
}
