import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { OrdersHome } from "@/modules/orders";

export default async function OrdersRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("orders")} className="max-w-6xl">
      <OrdersHome />
    </FeaturePageShell>
  );
}
