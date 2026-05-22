export type BusinessInfo = {
  legalName: string;
  registrationId: string;
  country: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  /** Contact email for the business (often same as account email). */
  businessEmail: string;
  businessPhone: string;
};

export type ShopInfo = {
  shopName: string;
  description: string;
  website: string;
};

export type DocumentInfo = {
  docTypes: string[];
  notes: string;
  fileNames: string[];
  /** One HTTPS URL per selected document type (same order as `docTypes`). */
  fileUrls: string[];
};

export type ShippingInfo = {
  originCountry: string;
  carrier: string;
  processingDays: number;
};

export type PaymentInfo = {
  accountHolder: string;
  bankName: string;
  ibanLast4: string;
  routingHint: string;
};

export type TaxInfo = {
  entityType: "company" | "individual";
  vatId: string;
  taxId: string;
};

export type ReviewAck = {
  acceptedTerms: boolean;
};

export type OnboardingDraft = {
  business: BusinessInfo;
  shop: ShopInfo;
  documents: DocumentInfo;
  shipping: ShippingInfo;
  payment: PaymentInfo;
  tax: TaxInfo;
  review: ReviewAck;
};

export const ONBOARDING_STEP_LABELS = [
  "Business",
  "Shop",
  "Documents",
  "Shipping",
  "Payment",
  "Tax",
  "Review",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_LABELS.length;

export function emptyOnboardingDraft(): OnboardingDraft {
  return {
    business: {
      legalName: "",
      registrationId: "",
      country: "",
      addressLine1: "",
      city: "",
      postalCode: "",
      businessEmail: "",
      businessPhone: "",
    },
    shop: {
      shopName: "",
      description: "",
      website: "",
    },
    documents: {
      docTypes: [],
      notes: "",
      fileNames: [],
      fileUrls: [],
    },
    shipping: {
      originCountry: "",
      carrier: "",
      processingDays: 3,
    },
    payment: {
      accountHolder: "",
      bankName: "",
      ibanLast4: "",
      routingHint: "",
    },
    tax: {
      entityType: "company",
      vatId: "",
      taxId: "",
    },
    review: {
      acceptedTerms: false,
    },
  };
}
