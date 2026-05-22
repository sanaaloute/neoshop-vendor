import axios from "axios";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  createShop,
  listMyShops,
  updateShop,
} from "@/services/vendor/shops-api";
import type { VendorDocumentType } from "@/services/vendor/types";
import {
  patchVendorOnboarding,
  postVendorDocument,
  registerVendor,
  submitVendorVerification,
} from "@/services/vendor/vendors-api";

import type {
  BusinessInfo,
  DocumentInfo,
  PaymentInfo,
  ShippingInfo,
  ShopInfo,
  TaxInfo,
} from "./types";

export class OnboardingApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "OnboardingApiError";
  }
}

/** Vendor-safe text for any thrown sync/upload failure (used by `OnboardingApiError`). */
export function onboardingApiMessage(e: unknown): string {
  return httpErrorMessageForUser(e, "Request failed");
}

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  finland: "FI",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  estonia: "EE",
  latvia: "LV",
  lithuania: "LT",
  germany: "DE",
  france: "FR",
  spain: "ES",
  italy: "IT",
  poland: "PL",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  usa: "US",
};

export function normalizeCountryCode(country: string): string | undefined {
  const t = country.trim();
  if (!t) return undefined;
  if (t.length === 2) return t.toUpperCase();
  const key = t.toLowerCase();
  return COUNTRY_NAME_TO_ISO[key];
}

export function slugifyShopName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = (base.length >= 2 ? base : "shop") + "-" + suffix;
  return slug.slice(0, 80);
}

function mapDocLabelToType(label: string): VendorDocumentType {
  switch (label) {
    case "Business registration":
      return "BUSINESS_REGISTRATION";
    case "Government ID":
      return "IDENTITY";
    case "Proof of address":
      return "OTHER";
    case "Bank statement":
      return "BANK_PROOF";
    default:
      return "OTHER";
  }
}

function assertApiConfigured() {
  if (!getApiBaseUrl()) {
    throw new OnboardingApiError(
      "Your marketplace connection is not configured. Contact your administrator to finish setup."
    );
  }
}

function extractShopId(data: unknown): string | null {
  if (data && typeof data === "object" && "id" in data) {
    const id = (data as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function firstShopIdFromList(data: unknown): string | null {
  if (Array.isArray(data)) {
    const first = data[0] as { id?: string } | undefined;
    return first?.id ?? null;
  }
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items: { id?: string }[] }).items;
    return items[0]?.id ?? null;
  }
  return null;
}

export async function syncBusinessStep(business: BusinessInfo) {
  assertApiConfigured();
  const countryCode = normalizeCountryCode(business.country);
  if (!countryCode) {
    throw new OnboardingApiError(
      "Country must be a 2-letter ISO code (e.g. FI) or a supported country name. Without it, verification cannot be submitted."
    );
  }
  const registerBody = {
    legalBusinessName: business.legalName.trim(),
    taxId: business.registrationId.trim(),
    countryCode,
    businessEmail: business.businessEmail.trim(),
    businessPhone: business.businessPhone.trim(),
  };
  try {
    await registerVendor(registerBody);
  } catch (e) {
    if (axios.isAxiosError(e) && [400, 409, 422].includes(e.response?.status ?? 0)) {
      // Profile may already exist — continue with PATCH.
    } else {
      throw new OnboardingApiError(onboardingApiMessage(e), e);
    }
  }
  try {
    await patchVendorOnboarding({
      legalBusinessName: business.legalName.trim(),
      taxId: business.registrationId.trim(),
      countryCode,
      addressLine1: business.addressLine1.trim(),
      city: business.city.trim(),
      postalCode: business.postalCode.trim(),
      businessEmail: business.businessEmail.trim(),
      businessPhone: business.businessPhone.trim(),
    });
  } catch (e) {
    throw new OnboardingApiError(onboardingApiMessage(e), e);
  }
}

export async function syncShopStep(shop: ShopInfo): Promise<string> {
  assertApiConfigured();
  const slug = slugifyShopName(shop.shopName);
  let description = shop.description.trim();
  const w = shop.website.trim();
  if (w) {
    description = description ? `${description}\n\nWebsite: ${w}` : `Website: ${w}`;
  }

  let lastError: unknown;
  try {
    const data = await createShop({
      slug,
      name: shop.shopName.trim(),
      description: description || undefined,
    });
    const id = extractShopId(data);
    if (id) return id;
  } catch (e) {
    lastError = e;
    if (!axios.isAxiosError(e)) {
      throw new OnboardingApiError(onboardingApiMessage(e), e);
    }
    const status = e.response?.status;
    if (status !== 400 && status !== 409 && status !== 422) {
      throw new OnboardingApiError(onboardingApiMessage(e), e);
    }
  }

  const list = await listMyShops();
  const fromList = firstShopIdFromList(list);
  if (fromList) return fromList;

  throw new OnboardingApiError(
    lastError
      ? onboardingApiMessage(lastError)
      : "Could not create or load your shop. Try again or contact support.",
    lastError
  );
}

export async function syncDocumentsStep(documents: DocumentInfo) {
  assertApiConfigured();
  const { docTypes, fileUrls, fileNames } = documents;
  if (docTypes.length !== fileUrls.length) {
    throw new OnboardingApiError(
      "Provide exactly one HTTPS URL for each selected document type (same order)."
    );
  }
  for (let i = 0; i < docTypes.length; i++) {
    const url = fileUrls[i]?.trim();
    if (!url?.startsWith("https://")) {
      throw new OnboardingApiError(
        "Each document URL must be a valid https:// link (e.g. Supabase Storage)."
      );
    }
    const type = mapDocLabelToType(docTypes[i]);
    const fileName = fileNames[i]?.trim();
    try {
      await postVendorDocument({
        type,
        fileUrl: url,
        fileName: fileName || undefined,
      });
    } catch (e) {
      throw new OnboardingApiError(onboardingApiMessage(e), e);
    }
  }
}

export async function syncShippingStep(shopId: string, shipping: ShippingInfo) {
  assertApiConfigured();
  try {
    await updateShop(shopId, {
      shippingConfig: {
        originCountry: shipping.originCountry.trim(),
        carrier: shipping.carrier.trim(),
        processingDays: shipping.processingDays,
      },
    });
  } catch (e) {
    throw new OnboardingApiError(onboardingApiMessage(e), e);
  }
}

export async function syncPaymentStep(shopId: string, payment: PaymentInfo) {
  assertApiConfigured();
  try {
    await updateShop(shopId, {
      paymentConfig: {
        accountHolder: payment.accountHolder.trim(),
        bankName: payment.bankName.trim(),
        ibanLast4: payment.ibanLast4.trim(),
        routingHint: payment.routingHint.trim(),
      },
    });
  } catch (e) {
    throw new OnboardingApiError(onboardingApiMessage(e), e);
  }
}

export async function syncTaxStep(
  shopId: string,
  tax: TaxInfo,
  payment: PaymentInfo
) {
  assertApiConfigured();
  try {
    await patchVendorOnboarding({
      taxId: tax.taxId.trim(),
    });
    await updateShop(shopId, {
      paymentConfig: {
        accountHolder: payment.accountHolder.trim(),
        bankName: payment.bankName.trim(),
        ibanLast4: payment.ibanLast4.trim(),
        routingHint: payment.routingHint.trim(),
        vatId: tax.vatId.trim(),
        entityType: tax.entityType,
      },
    });
  } catch (e) {
    throw new OnboardingApiError(onboardingApiMessage(e), e);
  }
}

export async function syncReviewFinalize() {
  assertApiConfigured();
  try {
    await submitVendorVerification();
  } catch (e) {
    throw new OnboardingApiError(onboardingApiMessage(e), e);
  }
}
