import { isAxiosError } from "axios";

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
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
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
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      // Endpoint not available yet — return body as-is so UI still works
      return body as UserSettingsResponse;
    }
    throw e;
  }
}

/**
 * GET /users/me/viewed-products — list recently viewed products
 * @deprecated Not listed in the vendor API guide; may be removed in a future cleanup.
 */
export async function getViewedProducts() {
  const { data } = await vendorApiClient.get<ViewedProduct[]>("/api/v1/users/me/viewed-products");
  return data;
}

/**
 * POST /users/me/viewed-products — record a product view
 * @deprecated Not listed in the vendor API guide; may be removed in a future cleanup.
 */
export async function postViewedProduct(body: { productId: string }) {
  const { data } = await vendorApiClient.post<ViewedProduct>("/api/v1/users/me/viewed-products", body);
  return data;
}

export type RequestDeletionDto = {
  password: string;
};

/** POST /users/me/suspend — suspend the current user's account */
export async function suspendUserMe() {
  const { data } = await vendorApiClient.post<UserMeResponse>("/api/v1/users/me/suspend");
  return data;
}

/** POST /users/me/request-deletion — request account deletion */
export async function requestDeletionUserMe(body: RequestDeletionDto) {
  const { data } = await vendorApiClient.post<{ success: boolean; message?: string }>(
    "/api/v1/users/me/request-deletion",
    body
  );
  return data;
}
