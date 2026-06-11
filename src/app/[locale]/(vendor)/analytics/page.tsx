import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";

const AnalyticsHome = dynamic(
  () =>
    import("@/modules/analytics").then((m) => ({ default: m.AnalyticsHome })),
  {
    loading: () => (
      <p className="text-muted-foreground text-sm">Loading…</p>
    ),
  }
);

export default async function AnalyticsRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("analytics")} className="max-w-6xl">
      <AnalyticsHome />
    </FeaturePageShell>
  );
}
