import { vendorApiClient } from "@/services/api/client";

import type {
  ApiOrderStatus,
  OrderStatsResponse,
  Paginated,
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
  VendorCustomerFromApi,
} from "./types";

/** GET /orders/vendor — list orders for the authenticated vendor. */
export async function listVendorOrders(params?: {
  status?: ApiOrderStatus;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const { data } = await vendorApiClient.get<Paginated<unknown>>(
    "/api/v1/orders/vendor",
    {
      params,
    }
  );
  return data;
}

/** GET /orders/vendor/stats — order count breakdown by status */
export async function getVendorOrderStats() {
  const { data } = await vendorApiClient.get<OrderStatsResponse>(
    "/api/v1/orders/vendor/stats"
  );
  return data;
}

/** GET /orders/vendor/customers — list unique customers who ordered from this vendor */
export async function listVendorCustomers() {
  const { data } = await vendorApiClient.get<Paginated<VendorCustomerFromApi>>(
    "/api/v1/orders/vendor/customers"
  );
  return data;
}

/** GET /orders/:orderId */
export async function getOrder(orderId: string) {
  const { data } = await vendorApiClient.get(`/api/v1/orders/${orderId}`);
  return data;
}

/** PATCH /orders/:orderId/tracking — set or update the carrier tracking number */
export async function patchOrderTracking(
  orderId: string,
  body: UpdateOrderTrackingDto
) {
  const { data } = await vendorApiClient.patch(
    `/api/v1/orders/${orderId}/tracking`,
    body
  );
  return data;
}

/** PATCH /orders/:orderId/status — fulfillment status change */
export async function patchOrderStatus(
  orderId: string,
  body: UpdateOrderStatusDto
) {
  const { data } = await vendorApiClient.patch(
    `/api/v1/orders/${orderId}/status`,
    body
  );
  return data;
}
