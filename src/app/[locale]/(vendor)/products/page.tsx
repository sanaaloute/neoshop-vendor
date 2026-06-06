import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ProductsHome } from "@/modules/products";

export default function ProductsRoutePage() {
  return (
    <FeaturePageShell title="Products">
      <ProductsHome />
    </FeaturePageShell>
  );
}
