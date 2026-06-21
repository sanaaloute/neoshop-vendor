import { vendorApiClient } from "@/services/api/client";

import type {
  BulkCreateVariantsDto,
  BulkDeleteVariantsDto,
  BulkUpdateVariantsDto,
  CreateVariantDto,
  PaginatedProductVariants,
  ProductVariant,
  UpdateVariantDto,
} from "./types";

/** GET /products/:productId/variants */
export async function listVariants(productId: string) {
  const { data } = await vendorApiClient.get<PaginatedProductVariants>(
    `/api/v1/products/${productId}/variants`
  );
  return data;
}

/** POST /products/:productId/variants */
export async function createVariant(productId: string, body: CreateVariantDto) {
  const { data } = await vendorApiClient.post<ProductVariant>(
    `/api/v1/products/${productId}/variants`,
    body
  );
  return data;
}

/** PATCH /products/:productId/variants/:variantId */
export async function updateVariant(
  productId: string,
  variantId: string,
  body: UpdateVariantDto
) {
  const { data } = await vendorApiClient.patch<ProductVariant>(
    `/api/v1/products/${productId}/variants/${variantId}`,
    body
  );
  return data;
}

/** DELETE /products/:productId/variants/:variantId */
export async function deleteVariant(productId: string, variantId: string) {
  await vendorApiClient.delete(`/api/v1/products/${productId}/variants/${variantId}`);
}

/** POST /products/:productId/variants/bulk */
export async function createVariantsBulk(
  productId: string,
  body: BulkCreateVariantsDto
) {
  const { data } = await vendorApiClient.post<ProductVariant[]>(
    `/api/v1/products/${productId}/variants/bulk`,
    body
  );
  return data;
}

/** PATCH /products/:productId/variants/bulk */
export async function updateVariantsBulk(
  productId: string,
  body: BulkUpdateVariantsDto
) {
  const { data } = await vendorApiClient.patch<ProductVariant[]>(
    `/api/v1/products/${productId}/variants/bulk`,
    body
  );
  return data;
}

/** POST /products/:productId/variants/bulk-delete */
export async function deleteVariantsBulk(
  productId: string,
  body: BulkDeleteVariantsDto
) {
  const { data } = await vendorApiClient.post<{ deletedCount: number }>(
    `/api/v1/products/${productId}/variants/bulk-delete`,
    body
  );
  return data;
}
