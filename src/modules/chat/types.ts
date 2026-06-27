export type ChatAuthorRole = "vendor" | "customer";

export type ChatMessageType = "text" | "image" | "mixed" | "document";

export type ChatAttachment = {
  id: string;
  /** Display URL (HTTPS) returned by the chat attachment upload endpoint. */
  fileUrl?: string;
  /** Storage object path; used to refresh an expired display URL through /storage/read-urls. */
  storagePath?: string;
  /** Storage bucket name; used when refreshing the display URL. */
  storageBucket?: string;
  /** Original file name (alias kept for backwards compatibility). */
  filename?: string;
  fileName?: string;
  /** MIME type (alias kept for backwards compatibility). */
  mime?: string;
  mimeType?: string;
  /** Size in bytes (alias kept for backwards compatibility). */
  sizeBytes?: number;
  fileSize?: number;
  /** Temporary signed URL for rendering (present on send responses and Socket.IO events). */
  signedUrl?: string;
  expiresIn?: number;
};

export type ChatParticipant = {
  id: string;
  userId: string;
  joinedAt: string;
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
  /** Internal thread identifier (alias for conversationId). */
  threadId: string;
  /** API-aligned conversation identifier. */
  conversationId: string;
  messageType: ChatMessageType;
  /** authorRole is "vendor" when the sender is the current vendor; otherwise it keeps the peer's role */
  authorRole: ChatAuthorRole;
  /** The participant-specific sender ID (matches participants[].userId) */
  senderUserId: string;
  body: string | null;
  /** Internal alias for createdAt. */
  sentAt: string;
  /** API-aligned ISO creation time (same value as sentAt). */
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
  /** API-aligned participants array. */
  participants: ChatParticipant[];
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
