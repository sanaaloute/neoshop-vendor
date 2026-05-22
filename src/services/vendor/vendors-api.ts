import { vendorApiClient } from "@/services/api/client";

import type {
  CreateVendorDocumentDto,
  RegisterVendorDto,
  UpdateVendorOnboardingDto,
  VendorMeResponse,
} from "./types";

/** POST /vendors/me/register */
export async function registerVendor(body: RegisterVendorDto) {
  const { data } = await vendorApiClient.post("/api/v1/vendors/me/register", body);
  return data;
}

/** GET /vendors/me */
export async function getVendorMe() {
  const { data } = await vendorApiClient.get<VendorMeResponse>("/api/v1/vendors/me");
  return data;
}

/** PATCH /vendors/me/onboarding */
export async function patchVendorOnboarding(body: UpdateVendorOnboardingDto) {
  const { data } = await vendorApiClient.patch("/api/v1/vendors/me/onboarding", body);
  return data;
}

/** POST /vendors/me/documents */
export async function postVendorDocument(body: CreateVendorDocumentDto) {
  const { data } = await vendorApiClient.post("/api/v1/vendors/me/documents", body);
  return data;
}

/** DELETE /vendors/me/documents/:documentId */
export async function deleteVendorDocument(documentId: string) {
  await vendorApiClient.delete(`/api/v1/vendors/me/documents/${documentId}`);
}

/** POST /vendors/me/submit-verification */
export async function submitVendorVerification() {
  const { data } = await vendorApiClient.post("/api/v1/vendors/me/submit-verification",
    {}
  );
  return data;
}
