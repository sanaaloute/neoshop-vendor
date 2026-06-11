import type { VendorDocumentType, VendorType } from "@/services/vendor/types";

export type BasicInfo = {
  legalBusinessName: string;
  tradeName: string;
  businessEmail: string;
  businessPhone: string;
  countryCode: string;
};

export type AddressInfo = {
  region: string;
  city: string;
  addressLine1: string;
  postalCode: string;
};

export type DraftDocument = {
  id: string; // client-side temp id
  type: VendorDocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  status: "uploading" | "done" | "error";
  progress?: number;
  /** Storage bucket name (e.g. "vendor-documents") */
  storageBucket?: string;
  /** Storage object path (e.g. "vendor-uuid/filename.pdf") */
  storagePath?: string;
};

export type OnboardingDraft = {
  vendorType: VendorType | "";
  basicInfo: BasicInfo;
  addressInfo: AddressInfo;
  documents: DraftDocument[];
  acceptedTerms: boolean;
};

export const ONBOARDING_STEP_LABELS = [
  "Business Info",
  "Address",
  "Documents",
  "Review",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_LABELS.length;

export function emptyOnboardingDraft(): OnboardingDraft {
  return {
    vendorType: "",
    basicInfo: {
      legalBusinessName: "",
      tradeName: "",
      businessEmail: "",
      businessPhone: "",
      countryCode: "",
    },
    addressInfo: {
      region: "",
      city: "",
      addressLine1: "",
      postalCode: "",
    },
    documents: [],
    acceptedTerms: false,
  };
}

/** Required fields per vendor type before submission */
export function getRequiredFields(type: VendorType | ""): string[] {
  const base = [
    "legalBusinessName",
    "businessEmail",
    "businessPhone",
    "countryCode",
    "addressLine1",
  ];
  if (type === "COMPANY") {
    return [...base, "postalCode"];
  }
  return base;
}

export function isFieldRequired(
  field: string,
  vendorType: VendorType | ""
): boolean {
  const required = getRequiredFields(vendorType);
  return required.includes(field);
}

export function draftIsComplete(draft: OnboardingDraft): boolean {
  const t = draft.vendorType;
  if (!t) return false;
  const b = draft.basicInfo;
  const a = draft.addressInfo;
  if (!b.legalBusinessName || !b.businessEmail || !b.businessPhone || !b.countryCode) return false;
  if (!a.addressLine1) return false;
  if (t === "COMPANY" && !a.postalCode) return false;
  if (draft.documents.filter((d) => d.status === "done").length === 0) return false;
  return true;
}

export function missingFields(draft: OnboardingDraft): string[] {
  const missing: string[] = [];
  const t = draft.vendorType;
  if (!t) missing.push("vendorType");
  const b = draft.basicInfo;
  if (!b.legalBusinessName) missing.push("legalBusinessName");
  if (!b.businessEmail) missing.push("businessEmail");
  if (!b.businessPhone) missing.push("businessPhone");
  if (!b.countryCode) missing.push("country");
  const a = draft.addressInfo;
  if (!a.addressLine1) missing.push("address");
  if (t === "COMPANY" && !a.postalCode) missing.push("postalCode");
  if (draft.documents.filter((d) => d.status === "done").length === 0) missing.push("documents");
  return missing;
}
