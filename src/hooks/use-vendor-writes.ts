import { vendorIsApprovedForOperations } from "@/lib/vendor-lifecycle";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

/**
 * Server still enforces writes; this is UX-only.
 * Only `APPROVED` may mutate catalog and order fulfillment flows.
 */
export function useVendorWritesAllowed() {
  const status = useVendorProfileStore((s) => s.profile?.status ?? null);
  const canWrite = vendorIsApprovedForOperations(status);
  return {
    status,
    canWriteCatalog: canWrite,
    canWriteOrders: canWrite,
  };
}
