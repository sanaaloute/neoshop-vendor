import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { OrdersHome } from "@/modules/orders";

export default function OrdersRoutePage() {
  return (
    <FeaturePageShell title="Orders" className="max-w-6xl">
      <OrdersHome />
    </FeaturePageShell>
  );
}
