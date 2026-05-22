/**
 * Onboarding — KYC, catalog bootstrap, checklist.
 * @module modules/onboarding
 */

export { OnboardingWizard } from "./onboarding-wizard";
export { OnboardingProgress } from "./onboarding-progress";
export {
  ActiveOnboardingStep,
  ONBOARDING_STEP_FORM_ID,
} from "./onboarding-step-forms";
export * from "./types";
export * from "./schemas";
export {
  uploadVendorOnboardingFiles,
  type VendorOnboardingUploadProgress,
} from "./upload-documents";
