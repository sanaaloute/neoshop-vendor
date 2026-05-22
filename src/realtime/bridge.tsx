"use client";

import { useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { mapGatewayOrderDetailToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import { getOrder } from "@/services/vendor/orders-api";
import { useNotificationsStore } from "@/store/notifications-store";
import { useOrdersStore } from "@/store/orders-store";
import { useInventoryStore } from "@/store/inventory-store";

import { REALTIME_EVENTS } from "./registry";
import type {
  InventoryUpdatedPayload,
  NotificationCreatedPayload,
  OrderUpdatedPayload,
} from "./registry";
import { useRealtimeContext } from "./context";

/** Maps Socket.IO payloads into Zustand when the gateway is configured. */
export function RealtimeStoreBridge() {
  const { socket } = useRealtimeContext();

  useEffect(() => {
    if (!socket) return;

    const onNotification = (payload: NotificationCreatedPayload) => {
      useNotificationsStore.getState().ingestPush({
        ...payload,
        read: payload.read ?? false,
      });
    };

    const onOrder = async (payload: OrderUpdatedPayload) => {
      const { orderId } = payload;
      if (!orderId || !getApiBaseUrl()) return;
      try {
        const raw = await getOrder(orderId);
        useOrdersStore
          .getState()
          .upsertOrder(
            mapGatewayOrderDetailToVendorOrder(raw as Record<string, unknown>)
          );
      } catch {
        /* ignore transient fetch errors */
      }
    };

    const onInventory = (payload: InventoryUpdatedPayload) => {
      useInventoryStore
        .getState()
        .adjustStock(
          payload.lineId,
          payload.delta,
          payload.movementType,
          payload.note
        );
    };

    socket.on(REALTIME_EVENTS.NOTIFICATION_CREATED, onNotification);
    socket.on(REALTIME_EVENTS.ORDER_UPDATED, onOrder);
    socket.on(REALTIME_EVENTS.INVENTORY_UPDATED, onInventory);

    return () => {
      socket.off(REALTIME_EVENTS.NOTIFICATION_CREATED, onNotification);
      socket.off(REALTIME_EVENTS.ORDER_UPDATED, onOrder);
      socket.off(REALTIME_EVENTS.INVENTORY_UPDATED, onInventory);
    };
  }, [socket]);

  return null;
}
