import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { VariantsHome } from "@/modules/variants";

export default function VariantsRoutePage() {
  return (
    <FeaturePageShell title="Variants" className="max-w-6xl">
      <VariantsHome />
    </FeaturePageShell>
  );
}
