/**
 * Socket.IO realtime layer — provider, typed registry, hooks, store bridges.
 *
 * Set `NEXT_PUBLIC_SOCKET_IO_URL` (e.g. `http://localhost:3001`) to enable.
 *
 * @module realtime
 */

export { VendorRealtimeProvider } from "./vendor-realtime-provider";
export {
  RealtimeContextProvider,
  RealtimeContext,
  useRealtimeContext,
} from "./context";
export type { RealtimeContextValue } from "./context";
export type { RealtimeUiPhase } from "@/store/realtime-store";
export {
  REALTIME_EVENTS,
  type RealtimeEventName,
  type RealtimeEventPayloadMap,
  type NotificationCreatedPayload,
  type OrderUpdatedPayload,
  type InventoryUpdatedPayload,
  type ChatMessagePayload,
  type ChatTypingPayload,
} from "./registry";
export { createVendorSocket } from "./create-socket";
export type { VendorSocket } from "./create-socket";
export { RealtimeStoreBridge } from "./bridge";
export {
  useRealtimeEvent,
  useNotificationRealtimeEvents,
  useOrderRealtimeEvents,
  useInventoryRealtimeEvents,
  useChatMessageRealtimeEvents,
  useChatTypingRealtimeEvents,
  useRealtimeVendorStatus,
} from "./hooks";
