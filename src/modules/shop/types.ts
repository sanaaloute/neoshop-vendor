export type ShopVerificationStatus =
  | "none"
  | "pending"
  | "verified"
  | "rejected";

export type PayoutFrequency = "weekly" | "biweekly" | "monthly" | "";

export type ShopProfile = {
  shopName: string;
  slug: string;
  tagline: string;
  description: string;
};

export type ShopBranding = {
  logoDataUrl: string | null;
  logoFileName: string | null;
  bannerDataUrl: string | null;
  bannerFileName: string | null;
};

export type ShippingRules = {
  processingDaysMin: number;
  processingDaysMax: number;
  /** USD — empty means no free-shipping threshold */
  freeShippingThresholdUsd: string;
  carriersNote: string;
};

export type ReturnPolicy = {
  windowDays: number;
  restockingFeePercent: number;
  details: string;
};

export type BusinessDetails = {
  legalName: string;
  einMasked: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  supportEmail: string;
  supportPhone: string;
};

export type VerificationState = {
  status: ShopVerificationStatus;
  submittedAt: string | null;
  reviewerNote: string;
};

export type PayoutSettings = {
  frequency: PayoutFrequency;
  minimumPayoutUsd: string;
  taxFormOnFile: boolean;
};

export type ShopSettingsState = {
  profile: ShopProfile;
  branding: ShopBranding;
  shipping: ShippingRules;
  returnPolicy: ReturnPolicy;
  business: BusinessDetails;
  verification: VerificationState;
  payout: PayoutSettings;
};
