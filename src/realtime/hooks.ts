"use client";

import { useCallback, useEffect, useRef } from "react";

import { useRealtimeStore } from "@/store/realtime-store";

import {
  REALTIME_EVENTS,
  type RealtimeEventName,
  type RealtimeEventPayloadMap,
  type SubscribeOrderResponse,
} from "./registry";
import { useRealtimeContext } from "./context";

/** Subscribe to a typed Socket.IO event (handler kept fresh via ref). */
export function useRealtimeEvent<E extends RealtimeEventName>(
  event: E,
  handler: (payload: RealtimeEventPayloadMap[E]) => void
) {
  const { socket } = useRealtimeContext();
  const cb = useRef(handler);
  cb.current = handler;

  useEffect(() => {
    if (!socket) return;
    const ev = event as string;
    const listener = (...args: unknown[]) => {
      cb.current(args[0] as RealtimeEventPayloadMap[E]);
    };
    socket.on(ev, listener);
    return () => void socket.off(ev, listener);
  }, [socket, event]);
}

export function useNotificationRealtimeEvents(
  handler: (
    payload: RealtimeEventPayloadMap[typeof REALTIME_EVENTS.NOTIFICATION_CREATED]
  ) => void
) {
  useRealtimeEvent(REALTIME_EVENTS.NOTIFICATION_CREATED, handler);
}

export function useOrderRealtimeEvents(
  handler: (
    payload: RealtimeEventPayloadMap[typeof REALTIME_EVENTS.ORDER_UPDATED]
  ) => void
) {
  useRealtimeEvent(REALTIME_EVENTS.ORDER_UPDATED, handler);
}

export function useInventoryRealtimeEvents(
  handler: (
    payload: RealtimeEventPayloadMap[typeof REALTIME_EVENTS.INVENTORY_UPDATED]
  ) => void
) {
  useRealtimeEvent(REALTIME_EVENTS.INVENTORY_UPDATED, handler);
}

export function useChatMessageRealtimeEvents(
  handler: (
    payload: RealtimeEventPayloadMap[typeof REALTIME_EVENTS.CHAT_MESSAGE]
  ) => void
) {
  useRealtimeEvent(REALTIME_EVENTS.CHAT_MESSAGE, handler);
}

export function useChatTypingRealtimeEvents(
  handler: (
    payload: RealtimeEventPayloadMap[typeof REALTIME_EVENTS.CHAT_TYPING]
  ) => void
) {
  useRealtimeEvent(REALTIME_EVENTS.CHAT_TYPING, handler);
}

export function useVendorUpdatedRealtimeEvents(
  handler: (
    payload: RealtimeEventPayloadMap[typeof REALTIME_EVENTS.VENDOR_UPDATED]
  ) => void
) {
  useRealtimeEvent(REALTIME_EVENTS.VENDOR_UPDATED, handler);
}

/**
 * Subscribe to a specific order room for targeted updates.
 * Admins get this automatically; vendors/customers only if they own the order.
 */
export function useOrderSubscription() {
  const { socket } = useRealtimeContext();

  const subscribe = useCallback(
    (orderId: string): Promise<SubscribeOrderResponse> => {
      return new Promise((resolve) => {
        if (!socket?.connected) {
          resolve({ ok: false });
          return;
        }
        socket.emit(
          "neoshop.subscribe.order",
          { orderId },
          (response: SubscribeOrderResponse) => {
            resolve(response);
          }
        );
      });
    },
    [socket]
  );

  return { subscribe };
}

/** Maps provider phase to the vendor shell status pill (Socket.IO disabled → offline). */
export function useRealtimeVendorStatus(): "live" | "degraded" | "offline" {
  const phase = useRealtimeStore((s) => s.phase);
  const enabled = useRealtimeStore((s) => s.enabled);
  if (!enabled) return "offline";
  if (phase === "offline") return "offline";
  if (phase === "live") return "live";
  return "degraded";
}
