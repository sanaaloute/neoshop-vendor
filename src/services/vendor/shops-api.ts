import { vendorApiClient } from "@/services/api/client";

import type { CreateShopDto, UpdateShopDto } from "./types";

/** POST /shops */
export async function createShop(body: CreateShopDto) {
  const { data } = await vendorApiClient.post("/api/v1/shops", body);
  return data;
}

/** GET /shops/me */
export async function listMyShops() {
  const { data } = await vendorApiClient.get("/api/v1/shops/me");
  return data;
}

/** GET /shops/public/{slug} — published storefront-safe payload */
export async function getShopPublicBySlug(slug: string) {
  const { data } = await vendorApiClient.get(`/api/v1/shops/public/${encodeURIComponent(slug)}`);
  return data;
}

/** PATCH /shops/:shopId */
export async function updateShop(shopId: string, body: UpdateShopDto) {
  const { data } = await vendorApiClient.patch(`/api/v1/shops/${shopId}`, body);
  return data;
}
