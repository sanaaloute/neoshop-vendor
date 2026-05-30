import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ProductEditor } from "@/modules/products";

export default function NewProductRoutePage() {
  return (
    <FeaturePageShell className="max-w-7xl">
      <ProductEditor catalogProductId={null} />
    </FeaturePageShell>
  );
}
