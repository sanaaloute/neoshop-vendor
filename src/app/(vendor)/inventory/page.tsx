import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { InventoryHome } from "@/modules/inventory";

export default function InventoryRoutePage() {
  return (
    <FeaturePageShell title="Inventory" className="max-w-6xl">
      <InventoryHome />
    </FeaturePageShell>
  );
}
