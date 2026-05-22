import { vendorApiClient } from "@/services/api/client";

import type {
  AnalyticsDashboardResponse,
  AnalyticsOrdersTrendItem,
  AnalyticsProductsItem,
} from "./types";

/** GET /vendors/me/analytics/dashboard — vendor dashboard KPIs and top products */
export async function getVendorAnalyticsDashboard() {
  const { data } = await vendorApiClient.get<AnalyticsDashboardResponse>("/api/v1/vendors/me/analytics/dashboard");
  return data;
}

/** GET /vendors/me/analytics/orders — vendor order trends over time */
export async function getVendorAnalyticsOrders(params?: {
  days?: number;
}) {
  const { data } = await vendorApiClient.get<AnalyticsOrdersTrendItem[]>("/api/v1/vendors/me/analytics/orders", { params });
  return data;
}

/** GET /vendors/me/analytics/products — vendor product performance summary */
export async function getVendorAnalyticsProducts() {
  const { data } = await vendorApiClient.get<AnalyticsProductsItem[]>("/api/v1/vendors/me/analytics/products");
  return data;
}
