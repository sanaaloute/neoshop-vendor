import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ProductEditor } from "@/modules/products";

export default function NewProductRoutePage() {
  return (
    <FeaturePageShell title="New product" className="max-w-6xl">
      <ProductEditor catalogProductId={null} />
    </FeaturePageShell>
  );
}
