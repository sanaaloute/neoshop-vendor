import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ReviewsHome } from "@/modules/reviews";

export default async function ReviewsRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("reviews")} className="max-w-6xl">
      <ReviewsHome />
    </FeaturePageShell>
  );
}
