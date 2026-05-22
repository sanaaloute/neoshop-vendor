import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ProductEditor } from "@/modules/products";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductRoutePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <FeaturePageShell title="Edit product" className="max-w-6xl">
      <ProductEditor catalogProductId={id} />
    </FeaturePageShell>
  );
}
