import dynamic from "next/dynamic";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";

const AnalyticsHome = dynamic(
  () =>
    import("@/modules/analytics").then((m) => ({ default: m.AnalyticsHome })),
  {
    loading: () => (
      <p className="text-muted-foreground text-sm">Loading analytics…</p>
    ),
  }
);

export default function AnalyticsRoutePage() {
  return (
    <FeaturePageShell title="Analytics" className="max-w-6xl">
      <AnalyticsHome />
    </FeaturePageShell>
  );
}
