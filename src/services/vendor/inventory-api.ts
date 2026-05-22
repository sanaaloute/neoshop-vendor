import { vendorApiClient } from "@/services/api/client";

/** GET /inventory/variants/:variantId */
export async function getVariantInventory(variantId: string) {
  const { data } = await vendorApiClient.get(`/api/v1/inventory/variants/${variantId}`);
  return data;
}

/** PATCH /inventory/variants/:variantId */
export async function setVariantQuantity(
  variantId: string,
  body: { quantity: number }
) {
  const { data } = await vendorApiClient.patch(`/api/v1/inventory/variants/${variantId}`, body);
  return data;
}

/** POST /inventory/variants/:variantId/adjust */
export async function adjustVariantQuantity(
  variantId: string,
  body: { delta: number }
) {
  const { data } = await vendorApiClient.post(`/api/v1/inventory/variants/${variantId}/adjust`, body);
  return data;
}
