import { vendorApiClient } from "@/services/api/client";

import type { CatalogProductCompareRequest, CatalogProductCompareResponse, CatalogProductDetail, CatalogProductSummary, Paginated } from "./types";

/** GET /catalog/products — public product listing (useful for vendor panel preview) */
export async function listCatalogProducts(params?: {
  skip?: number;
  take?: number;
  categoryId?: string;
  shopSlug?: string;
  search?: string;
}) {
  const { data } = await vendorApiClient.get<Paginated<CatalogProductSummary>>(
    "/api/v1/catalog/products",
    { params }
  );
  return data;
}

/** GET /catalog/products/:productId — public product detail */
export async function getCatalogProduct(productId: string) {
  const { data } = await vendorApiClient.get<CatalogProductDetail>(`/api/v1/catalog/products/${productId}`);
  return data;
}

/** POST /catalog/products/compare — compare 2–4 products side-by-side */
export async function compareCatalogProducts(body: CatalogProductCompareRequest) {
  const { data } = await vendorApiClient.post<CatalogProductCompareResponse>("/api/v1/catalog/products/compare", body);
  return data;
}
