import { vendorApiClient } from "@/services/api/client";

import type {
  AnalyticsDashboardResponse,
  AnalyticsInventoryResponse,
  AnalyticsOrdersResponse,
  AnalyticsOrdersTrendItem,
  AnalyticsProductsItem,
  AnalyticsProductsResponse,
} from "./types";

/** GET /vendors/me/analytics/dashboard — vendor dashboard KPIs and top products */
export async function getVendorAnalyticsDashboard() {
  const { data } = await vendorApiClient.get<AnalyticsDashboardResponse>("/api/v1/vendors/me/analytics/dashboard");
  return data;
}

/** GET /vendors/me/analytics/orders — vendor order trends over time */
export async function getVendorAnalyticsOrders(params?: {
  days?: number;
}): Promise<AnalyticsOrdersTrendItem[]> {
  const { data } = await vendorApiClient.get<AnalyticsOrdersResponse | AnalyticsOrdersTrendItem[]>("/api/v1/vendors/me/analytics/orders", { params });
  // Backend may wrap in { items } or return raw array
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

/** GET /vendors/me/analytics/products — vendor product performance summary */
export async function getVendorAnalyticsProducts(): Promise<AnalyticsProductsItem[]> {
  const { data } = await vendorApiClient.get<AnalyticsProductsResponse | AnalyticsProductsItem[]>("/api/v1/vendors/me/analytics/products");
  // Backend may wrap in { items } or return raw array
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

/** GET /vendors/me/analytics/inventory — inventory velocity over time */
export async function getVendorAnalyticsInventory(params?: {
  days?: number;
}): Promise<AnalyticsInventoryResponse> {
  const { data } = await vendorApiClient.get<AnalyticsInventoryResponse>("/api/v1/vendors/me/analytics/inventory", { params });
  return data;
}
