/**
 * Vendor messaging — split inbox, attachments, realtime (WebSocket + demo transport).
 * @module modules/chat
 */

export { MessagingHome } from "./messaging-home";
export {
  useVendorChatRealtime,
  type ChatRealtimeEvent,
} from "./use-vendor-chat-realtime";
export type {
  ChatThread,
  ChatMessage,
  ChatAttachment,
  ChatAuthorRole,
  ChatParticipant,
} from "./types";
