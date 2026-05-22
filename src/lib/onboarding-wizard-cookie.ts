import { fetchCsrfToken } from "@/services/auth-session-client";
import type { VendorLifecycleStatus } from "@/services/vendor/types";

/**
 * Middleware treats the vendor as past the local wizard when this cookie is set
 * (`/api/onboarding/complete`). Align it with API truth so navigation is not stuck on `/onboarding`.
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
  status: VendorLifecycleStatus
): Promise<void> {
  try {
    if (vendorStatusShouldSetWizardCompleteCookie(status)) {
      const csrf = await fetchCsrfToken();
      await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      });
    } else if (vendorStatusShouldClearWizardCompleteCookie(status)) {
      const csrf = await fetchCsrfToken();
      await fetch("/api/onboarding/complete", {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      });
    }
  } catch {
    // non-fatal — gates still use GET /vendors/me
  }
}
