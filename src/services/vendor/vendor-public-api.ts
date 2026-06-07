import { vendorApiClient } from "@/services/api/client";

import type { Paginated, VendorPublicProfile, VendorPublicSummary } from "./types";

/** GET /vendors/public — vendor discovery list */
export async function listPublicVendors(params?: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  const { data } = await vendorApiClient.get<Paginated<VendorPublicSummary>>(
    "/api/v1/vendors/public",
    { params }
  );
  return data;
}

/** GET /vendors/public/:vendorId — public vendor profile */
export async function getPublicVendor(vendorId: string) {
  const { data } = await vendorApiClient.get<VendorPublicProfile>(`/api/v1/vendors/public/${vendorId}`);
  return data;
}
