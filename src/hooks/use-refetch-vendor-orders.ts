"use client";

import { useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { mapGatewayOrderToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import { listVendorOrders } from "@/services/vendor/orders-api";
import { useOrdersStore } from "@/store/orders-store";

/** Reloads GET /orders/vendor into the orders store when the gateway is configured. */
export function useRefetchVendorOrders() {
  const replaceOrders = useOrdersStore((s) => s.replaceOrders);

  return useCallback(async () => {
    if (!getApiBaseUrl()) return;
    const data = await listVendorOrders();
    replaceOrders(
      data.items.map((r) => mapGatewayOrderToVendorOrder(r as Record<string, unknown>))
    );
  }, [replaceOrders]);
}
