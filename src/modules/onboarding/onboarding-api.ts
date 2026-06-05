"use client";

import { registerVendor, patchVendorOnboarding, postVendorDocument, deleteVendorDocument, submitVendorVerification } from "@/services/vendor/vendors-api";
import { uploadVendorOnboardingFiles } from "./upload-documents";
import type { OnboardingDraft, DraftDocument } from "./types";
import type { VendorDocumentType, VendorMeResponse } from "@/services/vendor/types";

// ── Step 1: Register vendor profile ──────────────────────────────

export async function syncRegisterStep(draft: OnboardingDraft) {
  const vendorType = draft.vendorType;
  if (!vendorType) throw new Error("Vendor type is required");
  const body = {
    vendorType,
    legalBusinessName: draft.basicInfo.legalBusinessName,
    tradeName: draft.basicInfo.tradeName || undefined,
    businessEmail: draft.basicInfo.businessEmail,
    businessPhone: draft.basicInfo.businessPhone,
    countryCode: draft.basicInfo.countryCode,
  };
  return registerVendor(body);
}

// ── Step 2: Update onboarding info ───────────────────────────────

export async function syncAddressStep(draft: OnboardingDraft) {
  const body = {
    legalBusinessName: draft.basicInfo.legalBusinessName,
    tradeName: draft.basicInfo.tradeName || undefined,
    businessEmail: draft.basicInfo.businessEmail,
    businessPhone: draft.basicInfo.businessPhone,
    countryCode: draft.basicInfo.countryCode,
    region: draft.addressInfo.region || undefined,
    city: draft.addressInfo.city || undefined,
    addressLine1: draft.addressInfo.addressLine1,
    postalCode: draft.addressInfo.postalCode || undefined,
  };
  return patchVendorOnboarding(body);
}

// ── Step 3: Documents ────────────────────────────────────────────

export type UploadResult = {
  success: DraftDocument[];
  failed: { id: string; file: File; error: Error }[];
};

export async function uploadDraftDocuments(
  files: File[],
  docType: VendorDocumentType,
  tempIds?: string[],
  onProgress?: (id: string, status: DraftDocument["status"], progress?: number) => void
): Promise<UploadResult> {
  const result: UploadResult = { success: [], failed: [] };

  const uploads = files.map(async (file, index) => {
    const id = tempIds?.[index] ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    onProgress?.(id, "uploading", 0);

    try {
      const { urls } = await uploadVendorOnboardingFiles([file], (p) => {
        if (p.phase === "start") onProgress?.(id, "uploading", 10);
        else if (p.phase === "done") onProgress?.(id, "uploading", 90);
        else if (p.phase === "error") onProgress?.(id, "error");
      });

      const fileUrl = urls[0];
      if (!fileUrl) throw new Error("Upload succeeded but no URL returned");

      const docMeta = await postVendorDocument({
        type: docType,
        fileUrl,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
      });

      const doc: DraftDocument = {
        id: docMeta.id ?? id,
        type: docType,
        fileUrl,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        status: "done",
      };

      onProgress?.(doc.id, "done", 100);
      result.success.push(doc);
      return doc;
    } catch (err) {
      onProgress?.(id, "error");
      result.failed.push({
        id,
        file,
        error: err instanceof Error ? err : new Error("Upload failed"),
      });
      return null;
    }
  });

  await Promise.all(uploads);
  return result;
}

export async function removeVendorDocument(documentId: string) {
  await deleteVendorDocument(documentId);
}

// ── Step 4: Submit for verification ──────────────────────────────

export async function syncSubmitVerification() {
  return submitVendorVerification();
}

// ── Hydration helper ─────────────────────────────────────────────

export function shouldHydrateFromProfile(profile: VendorMeResponse | null): boolean {
  if (!profile) return false;
  return profile.status === "REJECTED" || profile.status === "PENDING_ONBOARDING";
}
