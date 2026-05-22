import type { VendorLifecycleStatus } from "@/services/vendor/types";

/** Vendor can edit the onboarding wizard (initial setup or after rejection). */
export function vendorShouldUseOnboardingWizard(
  status: VendorLifecycleStatus | null
): boolean {
  if (status == null) return false;
  return status === "PENDING_ONBOARDING" || status === "REJECTED";
}

/** Catalog + messaging — backend also enforces on writes. */
export function vendorIsApprovedForOperations(
  status: VendorLifecycleStatus | null
): boolean {
  return status === "APPROVED";
}
