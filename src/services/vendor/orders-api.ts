import { vendorApiClient } from "@/services/api/client";

import type {
  ApiOrderStatus,
  OrderStatsResponse,
  OrderTrackingResponse,
  Paginated,
  UpdateOrderStatusDto,
  VendorCustomerFromApi,
} from "./types";

/** GET /orders/vendor — list orders for the authenticated vendor */
export async function listVendorOrders(params?: {
  status?: ApiOrderStatus;
}) {
  const { data } = await vendorApiClient.get<Paginated<unknown>>("/api/v1/orders/vendor", {
    params,
  });
  return data;
}

/** GET /orders/vendor/stats — order count breakdown by status */
export async function getVendorOrderStats() {
  const { data } = await vendorApiClient.get<OrderStatsResponse>("/api/v1/orders/vendor/stats");
  return data;
}

/** GET /orders/vendor/customers — list unique customers who ordered from this vendor */
export async function listVendorCustomers() {
  const { data } = await vendorApiClient.get<Paginated<VendorCustomerFromApi>>("/api/v1/orders/vendor/customers");
  return data;
}

/** GET /orders/:orderId */
export async function getOrder(orderId: string) {
  const { data } = await vendorApiClient.get(`/api/v1/orders/${orderId}`);
  return data;
}

/** GET /orders/:orderId/tracking — get tracking events for an order */
export async function getOrderTracking(orderId: string) {
  const { data } = await vendorApiClient.get<OrderTrackingResponse>(`/api/v1/orders/${orderId}/tracking`);
  return data;
}

/** PATCH /orders/:orderId/status */
export async function patchOrderStatus(orderId: string, body: UpdateOrderStatusDto) {
  const { data } = await vendorApiClient.patch(`/api/v1/orders/${orderId}/status`, body);
  return data;
}
