import { vendorApiClient } from "@/services/api/client";

import type { CatalogProductDetail, CatalogProductSummary, Paginated } from "./types";

/** GET /catalog/products — public product listing (useful for vendor panel preview) */
export async function listCatalogProducts(params?: {
  page?: number;
  limit?: number;
  categoryId?: string;
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
