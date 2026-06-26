import type { VendorLifecycleStatus } from "@/services/vendor/types";

/**
 * Previously synced an onboarding-wizard cookie used by middleware. Auth and
 * onboarding routing are now handled client-side, so this helper is kept as a
 * no-op to avoid changing callers.
 */
export function vendorStatusShouldSetWizardCompleteCookie(
  status: VendorLifecycleStatus
): boolean {
  return (
    status === "PENDING_VERIFICATION" ||
    status === "UNDER_REVIEW" ||
    status === "APPROVED" ||
    status === "SUSPENDED"
  );
}

export function vendorStatusShouldClearWizardCompleteCookie(
  status: VendorLifecycleStatus
): boolean {
  return status === "PENDING_ONBOARDING" || status === "REJECTED";
}

export async function syncOnboardingWizardCookie(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  status: VendorLifecycleStatus
): Promise<void> {
  // No-op: onboarding state is resolved from /vendors/me and enforced by
  // client-side guards. Keeping this function avoids churn in profile-store.
}
