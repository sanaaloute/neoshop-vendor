import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { CustomersHome } from "@/modules/customers";

export default function CustomersRoutePage() {
  return (
    <FeaturePageShell title="Customers" className="max-w-6xl">
      <CustomersHome />
    </FeaturePageShell>
  );
}
