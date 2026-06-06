import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ShopSettingsHome } from "@/modules/shop";

export default function ShopRoutePage() {
  return (
    <FeaturePageShell title="Shop settings" className="max-w-6xl">
      <ShopSettingsHome />
    </FeaturePageShell>
  );
}
