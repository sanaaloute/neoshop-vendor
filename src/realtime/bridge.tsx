"use client";

import { useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { mapGatewayOrderDetailToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import { getOrder } from "@/services/vendor/orders-api";
import { getVendorMe } from "@/services/vendor/vendors-api";
import { useNotificationsStore } from "@/store/notifications-store";
import { useOrdersStore } from "@/store/orders-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

import { REALTIME_EVENTS } from "./registry";
import {
  chatMessageSchema,
  inventoryUpdatedSchema,
  notificationCreatedSchema,
  orderUpdatedSchema,
  vendorUpdatedSchema,
} from "./schemas";
import type {
  InventoryUpdatedPayload,
  NotificationCreatedPayload,
  OrderUpdatedPayload,
  ChatMessagePayload,
  VendorUpdatedPayload,
} from "./registry";
import { useRealtimeContext } from "./context";

/** Maps Socket.IO payloads into Zustand when the gateway is configured. */
export function RealtimeStoreBridge() {
  const { socket } = useRealtimeContext();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const currentUserIds = [userId, vendorId].filter((id): id is string => Boolean(id));
  const currentUserIdsKey = currentUserIds.join(",");

  useEffect(() => {
    if (!socket) return;

    const onNotification = (raw: unknown) => {
      const parsed = notificationCreatedSchema.safeParse(raw);
      if (!parsed.success) return;
      const payload = parsed.data as NotificationCreatedPayload;
      useNotificationsStore.getState().ingestPush({
        ...payload,
        read: payload.read ?? false,
      });
    };

    const onOrder = async (raw: unknown) => {
      const parsed = orderUpdatedSchema.safeParse(raw);
      if (!parsed.success) return;
      const payload = parsed.data as OrderUpdatedPayload;
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

    const onInventory = (raw: unknown) => {
      const parsed = inventoryUpdatedSchema.safeParse(raw);
      if (!parsed.success) return;
      const payload = parsed.data as InventoryUpdatedPayload;
      useInventoryStore
        .getState()
        .adjustStock(
          payload.lineId,
          payload.delta,
          payload.movementType,
          payload.note
        );
    };

    const onChatMessage = (raw: unknown) => {
      const parsed = chatMessageSchema.safeParse(raw);
      if (!parsed.success) return;
      const payload = parsed.data as ChatMessagePayload;
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

      const attachments: import("@/modules/chat/types").ChatAttachment[] | undefined =
        payload.attachments?.map((a) => ({
          id: a.id ?? "",
          fileUrl: a.fileUrl ?? "",
          fileName: a.fileName,
          filename: a.fileName,
          mimeType: a.mimeType,
          mime: a.mimeType,
          fileSize: a.fileSize,
          sizeBytes: a.fileSize,
          signedUrl: a.signedUrl,
          expiresIn: a.expiresIn,
        }));

      const createdAt =
        payload.createdAt && !isNaN(Date.parse(payload.createdAt))
          ? payload.createdAt
          : new Date().toISOString();
      const messageType = payload.messageType ?? "text";

      state.mergeIncomingMessage({
        id: payload.id,
        threadId: payload.conversationId,
        conversationId: payload.conversationId,
        messageType,
        authorRole: isFromVendor ? "vendor" : "customer",
        senderUserId: payload.senderUserId,
        body: payload.body ?? null,
        sentAt: createdAt,
        createdAt,
        attachments,
        translatedBody: payload.translatedBody,
        originalLanguage: payload.originalLanguage,
        targetLanguage: payload.targetLanguage,
      });

      // Auto-mark read if the conversation is currently open and message is from peer
      if (isOpen && !isFromVendor) {
        state.markThreadRead(payload.conversationId);
      }
    };

    const onVendorUpdated = async (raw: unknown) => {
      const parsed = vendorUpdatedSchema.safeParse(raw);
      if (!parsed.success) return;
      const payload = parsed.data as VendorUpdatedPayload;
      const profile = useVendorProfileStore.getState().profile;
      if (!profile || payload.vendorId !== profile.id) return;
      if (!getApiBaseUrl()) return;
      try {
        const refreshed = await getVendorMe();
        useVendorProfileStore.getState().setProfile(refreshed);
      } catch {
        // Fall back to updating just the status from the payload
        useVendorProfileStore.getState().setProfile({
          ...profile,
          status: payload.status,
          rejectionReason: payload.rejectionReason ?? profile.rejectionReason,
        });
      }
    };

    socket.on(REALTIME_EVENTS.NOTIFICATION_CREATED, onNotification);
    socket.on(REALTIME_EVENTS.ORDER_UPDATED, onOrder);
    socket.on(REALTIME_EVENTS.INVENTORY_UPDATED, onInventory);
    socket.on(REALTIME_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(REALTIME_EVENTS.VENDOR_UPDATED, onVendorUpdated);

    return () => {
      socket.off(REALTIME_EVENTS.NOTIFICATION_CREATED, onNotification);
      socket.off(REALTIME_EVENTS.ORDER_UPDATED, onOrder);
      socket.off(REALTIME_EVENTS.INVENTORY_UPDATED, onInventory);
      socket.off(REALTIME_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(REALTIME_EVENTS.VENDOR_UPDATED, onVendorUpdated);
    };
  }, [socket, currentUserIdsKey, currentUserIds]);

  return null;
}
