import { vendorApiClient } from "@/services/api/client";

import type { UpdateUserMeDto, UserMeResponse, ViewedProduct } from "./types";

/** GET /users/me — full profile of the current user */
export async function getUserMe() {
  const { data } = await vendorApiClient.get<UserMeResponse>("/api/v1/users/me");
  return data;
}

/** PATCH /users/me — update current user profile */
export async function patchUserMe(body: UpdateUserMeDto) {
  const { data } = await vendorApiClient.patch<UserMeResponse>("/api/v1/users/me", body);
  return data;
}

export type UserSettingsResponse = {
  orderUpdates?: boolean;
  promoMessages?: boolean;
  emailNewsletter?: boolean;
  pushEnabled?: boolean;
  preferredLanguage?: string | null;
};

export type UpdateUserSettingsDto = {
  orderUpdates?: boolean;
  promoMessages?: boolean;
  emailNewsletter?: boolean;
  pushEnabled?: boolean;
  preferredLanguage?: string;
};

/** GET /users/me/settings — notification/settings preferences (includes language) */
export async function getUserSettings() {
  try {
    const { data } = await vendorApiClient.get<UserSettingsResponse>("/api/v1/users/me/settings");
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      // Endpoint not available yet — return empty defaults so UI still works
      return {} as UserSettingsResponse;
    }
    throw e;
  }
}

/** PATCH /users/me/settings — update settings preferences (including language) */
export async function patchUserSettings(body: UpdateUserSettingsDto) {
  try {
    const { data } = await vendorApiClient.patch<UserSettingsResponse>("/api/v1/users/me/settings", body);
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      // Endpoint not available yet — return body as-is so UI still works
      return body as UserSettingsResponse;
    }
    throw e;
  }
}

/** GET /users/me/viewed-products — list recently viewed products */
export async function getViewedProducts() {
  const { data } = await vendorApiClient.get<ViewedProduct[]>("/api/v1/users/me/viewed-products");
  return data;
}

/** POST /users/me/viewed-products — record a product view */
export async function postViewedProduct(body: { productId: string }) {
  const { data } = await vendorApiClient.post<ViewedProduct>("/api/v1/users/me/viewed-products", body);
  return data;
}
