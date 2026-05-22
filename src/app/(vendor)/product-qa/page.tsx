import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { QaHome } from "@/modules/qa";

export default function ProductQaPage() {
  return (
    <FeaturePageShell title="Product Q&A" className="max-w-6xl">
      <QaHome />
    </FeaturePageShell>
  );
}
