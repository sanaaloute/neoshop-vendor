import type { ShopSettingsState } from "./types";

export function getDefaultShopSettings(): ShopSettingsState {
  return {
    profile: {
      shopName: "",
      slug: "",
      tagline: "",
      description: "",
    },
    branding: {
      logoDataUrl: null,
      logoFileName: null,
      bannerDataUrl: null,
      bannerFileName: null,
    },
    shipping: {
      processingDaysMin: 1,
      processingDaysMax: 3,
      freeShippingThresholdUsd: "",
      carriersNote: "",
    },
    returnPolicy: {
      windowDays: 30,
      restockingFeePercent: 0,
      details: "",
    },
    business: {
      legalName: "",
      einMasked: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      supportEmail: "",
      supportPhone: "",
    },
    verification: {
      status: "pending",
      submittedAt: "",
      reviewerNote: "",
    },
    payout: {
      frequency: "",
      minimumPayoutUsd: "",
      taxFormOnFile: false,
    },
  };
}
