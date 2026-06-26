import type {
  VendorLifecycleStatus,
  VendorMeResponse,
} from "@/services/vendor/types";

/** Vendor can edit the onboarding wizard (initial setup or after rejection). */
export function vendorShouldUseOnboardingWizard(
  status: VendorLifecycleStatus | null
): boolean {
  if (status == null) return false;
  return status === "PENDING_ONBOARDING" || status === "REJECTED";
}

/** True when the authenticated user must complete the vendor onboarding wizard. */
export function vendorNeedsOnboarding(
  profile: VendorMeResponse | null
): boolean {
  return !profile || vendorShouldUseOnboardingWizard(profile.status);
}

/** Catalog + messaging — backend also enforces on writes. */
export function vendorIsApprovedForOperations(
  status: VendorLifecycleStatus | null
): boolean {
  return status === "APPROVED";
}
