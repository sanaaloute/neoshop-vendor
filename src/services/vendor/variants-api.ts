import { vendorApiClient } from "@/services/api/client";

import type { CreateVariantDto, UpdateVariantDto } from "./types";

/** GET /products/:productId/variants */
export async function listVariants(productId: string) {
  const { data } = await vendorApiClient.get(`/api/v1/products/${productId}/variants`);
  return data;
}

/** POST /products/:productId/variants */
export async function createVariant(productId: string, body: CreateVariantDto) {
  const { data } = await vendorApiClient.post(`/api/v1/products/${productId}/variants`, body);
  return data;
}

/** PATCH /products/:productId/variants/:variantId */
export async function updateVariant(
  productId: string,
  variantId: string,
  body: UpdateVariantDto
) {
  const { data } = await vendorApiClient.patch(`/api/v1/products/${productId}/variants/${variantId}`, body);
  return data;
}

/** DELETE /products/:productId/variants/:variantId */
export async function deleteVariant(productId: string, variantId: string) {
  await vendorApiClient.delete(`/api/v1/products/${productId}/variants/${variantId}`);
}
