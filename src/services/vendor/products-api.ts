import { vendorApiClient } from "@/services/api/client";

import type {
  ApiProductStatus,
  CreateProductAttributeDto,
  CreateProductAttributeValueDto,
  CreateProductDto,
  Paginated,
  ProductStatsResponse,
  UpdateProductDto,
} from "./types";

/** GET /products/me */
export async function listMyProducts(params?: {
  status?: ApiProductStatus;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const { data } = await vendorApiClient.get<Paginated<unknown>>("/api/v1/products/me", {
    params,
  });
  return data;
}

/** GET /products/me/stats — product count breakdown by status */
export async function getProductStats() {
  const { data } = await vendorApiClient.get<ProductStatsResponse>("/api/v1/products/me/stats");
  return data;
}

/** GET /products/:productId */
export async function getProduct(productId: string) {
  const { data } = await vendorApiClient.get(`/api/v1/products/${productId}`);
  return data;
}

/** POST /products */
export async function createProduct(body: CreateProductDto) {
  const { data } = await vendorApiClient.post("/api/v1/products", body);
  return data;
}

/** PATCH /products/:productId */
export async function updateProduct(productId: string, body: UpdateProductDto) {
  const { data } = await vendorApiClient.patch(`/api/v1/products/${productId}`, body);
  return data;
}

/** DELETE /products/:productId */
export async function deleteProduct(productId: string) {
  await vendorApiClient.delete(`/api/v1/products/${productId}`);
}

/** PUT /products/:productId/categories */
export async function setProductCategories(
  productId: string,
  body: { categoryIds?: string[] }
) {
  const { data } = await vendorApiClient.put(
    `/api/v1/products/${productId}/categories`,
    body
  );
  return data;
}

/** POST /products/:productId/media */
export async function attachProductMedia(
  productId: string,
  body: {
    url: string;
    alt?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }
) {
  const { data } = await vendorApiClient.post(
    `/api/v1/products/${productId}/media`,
    body
  );
  return data;
}

/** DELETE /products/:productId/media/:mediaId */
export async function deleteProductMedia(productId: string, mediaId: string) {
  await vendorApiClient.delete(`/api/v1/products/${productId}/media/${mediaId}`);
}

/** POST /products/:productId/attributes — define a dynamic attribute dimension */
export async function createProductAttribute(
  productId: string,
  body: CreateProductAttributeDto
) {
  const { data } = await vendorApiClient.post(
    `/api/v1/products/${productId}/attributes`,
    body
  );
  return data;
}

/** POST /products/:productId/attributes/:attributeId/values — append selectable values */
export async function createProductAttributeValue(
  productId: string,
  attributeId: string,
  body: CreateProductAttributeValueDto
) {
  const { data } = await vendorApiClient.post(
    `/api/v1/products/${productId}/attributes/${attributeId}/values`,
    body
  );
  return data;
}

/** DELETE /products/:productId/attributes/:attributeId — remove an attribute dimension */
export async function deleteProductAttribute(productId: string, attributeId: string) {
  await vendorApiClient.delete(`/api/v1/products/${productId}/attributes/${attributeId}`);
}

/** DELETE /products/:productId/attributes/:attributeId/values/:valueId — remove a single attribute value */
export async function deleteProductAttributeValue(
  productId: string,
  attributeId: string,
  valueId: string
) {
  await vendorApiClient.delete(
    `/api/v1/products/${productId}/attributes/${attributeId}/values/${valueId}`
  );
}
