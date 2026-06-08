export type ChatAuthorRole = "vendor" | "customer";

export type ChatAttachment = {
  id: string;
  filename: string;
  mime: string;
  sizeBytes: number;
};

export type ChatParticipant = {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  /** Raw role from the backend (vendor, customer, admin, super_admin, etc.) */
  role: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  /** authorRole is "vendor" when the sender is the current vendor; otherwise it keeps the peer's role */
  authorRole: ChatAuthorRole;
  /** The participant-specific sender ID (matches participants[].userId) */
  senderUserId?: string;
  body: string;
  sentAt: string;
  attachments?: ChatAttachment[];
  /** Delivery hint for optimistic rows */
  pending?: boolean;
  // Translation fields (only present when sender and receiver have different languages)
  translatedBody?: string;
  originalLanguage?: string;
  targetLanguage?: string;
};

export type ChatThread = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  /** The vendor's participant ID in this conversation (for role detection) */
  vendorChatId?: string;
  /** Cached participant info keyed by senderUserId (participants[].userId) */
  participantMap: Record<string, ChatParticipant>;
  orderRef?: string;
  /** ISO — messages from peer at or after this count as unread for badge */
  lastReadAt: string;
  messages: ChatMessage[];
};
