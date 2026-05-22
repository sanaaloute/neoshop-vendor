import type { NotificationRecord } from "@/modules/notifications/types";
import type { OrderStatus } from "@/modules/orders/types";
import type { StockMovementType } from "@/modules/inventory/types";
import type { ChatMessage } from "@/modules/chat/types";

/**
 * Canonical Socket.IO event names and payload types for the vendor dashboard.
 * Align server emissions with these keys.
 */
export const REALTIME_EVENTS = {
  NOTIFICATION_CREATED: "notification:created",
  ORDER_UPDATED: "order:updated",
  INVENTORY_UPDATED: "inventory:updated",
  CHAT_MESSAGE: "chat:message",
  CHAT_TYPING: "chat:typing",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export type NotificationCreatedPayload = Omit<NotificationRecord, "read"> & {
  read?: boolean;
};

export type OrderUpdatedPayload = {
  orderId: string;
  status?: OrderStatus;
  /** Appended to order timeline when present */
  timelineNote?: string;
};

export type InventoryUpdatedPayload = {
  lineId: string;
  delta: number;
  movementType: StockMovementType;
  note?: string;
};

export type ChatMessagePayload = {
  threadId: string;
  message: ChatMessage;
};

export type ChatTypingPayload = {
  threadId: string;
  userId: string;
  isTyping: boolean;
};

export interface RealtimeEventPayloadMap {
  [REALTIME_EVENTS.NOTIFICATION_CREATED]: NotificationCreatedPayload;
  [REALTIME_EVENTS.ORDER_UPDATED]: OrderUpdatedPayload;
  [REALTIME_EVENTS.INVENTORY_UPDATED]: InventoryUpdatedPayload;
  [REALTIME_EVENTS.CHAT_MESSAGE]: ChatMessagePayload;
  [REALTIME_EVENTS.CHAT_TYPING]: ChatTypingPayload;
}
