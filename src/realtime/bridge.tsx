"use client";

import { useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { mapGatewayOrderDetailToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import { getOrder } from "@/services/vendor/orders-api";
import { useNotificationsStore } from "@/store/notifications-store";
import { useOrdersStore } from "@/store/orders-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

import { REALTIME_EVENTS } from "./registry";
import type {
  InventoryUpdatedPayload,
  NotificationCreatedPayload,
  OrderUpdatedPayload,
  ChatMessagePayload,
} from "./registry";
import { useRealtimeContext } from "./context";

/** Maps Socket.IO payloads into Zustand when the gateway is configured. */
export function RealtimeStoreBridge() {
  const { socket } = useRealtimeContext();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const currentUserIds = [userId, vendorId].filter((id): id is string => Boolean(id));

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

    const onChatMessage = (payload: ChatMessagePayload) => {
      const state = useChatStore.getState();
      const selectedId = state.selectedThreadId;
      const isOpen = selectedId === payload.conversationId;

      // Determine vendor IDs: auth IDs + any vendorChatId discovered from loaded threads
      const thread = state.threads.find((t) => t.id === payload.conversationId);
      const vendorIds = [
        ...currentUserIds,
        ...(thread?.vendorChatId ? [thread.vendorChatId] : []),
      ];
      const isFromVendor = vendorIds.includes(payload.senderUserId);
      const now = new Date().toISOString();

      state.mergeIncomingMessage({
        id: payload.id,
        threadId: payload.conversationId,
        authorRole: isFromVendor ? "vendor" : "customer",
        senderUserId: payload.senderUserId,
        body: payload.body,
        sentAt: payload.createdAt,
      });

      // Auto-mark read if the conversation is currently open and message is from peer
      if (isOpen && !isFromVendor) {
        state.markThreadRead(payload.conversationId);
      }
    };

    socket.on(REALTIME_EVENTS.NOTIFICATION_CREATED, onNotification);
    socket.on(REALTIME_EVENTS.ORDER_UPDATED, onOrder);
    socket.on(REALTIME_EVENTS.INVENTORY_UPDATED, onInventory);
    socket.on(REALTIME_EVENTS.CHAT_MESSAGE, onChatMessage);

    return () => {
      socket.off(REALTIME_EVENTS.NOTIFICATION_CREATED, onNotification);
      socket.off(REALTIME_EVENTS.ORDER_UPDATED, onOrder);
      socket.off(REALTIME_EVENTS.INVENTORY_UPDATED, onInventory);
      socket.off(REALTIME_EVENTS.CHAT_MESSAGE, onChatMessage);
    };
  }, [socket, currentUserIds.join(",")]);

  return null;
}
