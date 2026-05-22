import { vendorApiClient } from "@/services/api/client";

export type ShippingMethod = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  baseCost: number;
  currency: string;
  enabled: boolean;
};

/** GET /shipping/methods — list available shipping methods */
export async function listShippingMethods() {
  const { data } = await vendorApiClient.get<ShippingMethod[]>("/api/v1/shipping/methods");
  return data;
}

/** POST /shipping/rates — calculate shipping rates for a cart/address */
export async function calculateShippingRates(body: {
  addressId?: string;
  items: { variantId: string; quantity: number }[];
}) {
  const { data } = await vendorApiClient.post<
    Array<{
      methodId: string;
      methodName: string;
      cost: number;
      currency: string;
      estimatedDays: number;
    }>
  >("/api/v1/shipping/rates", body);
  return data;
}
