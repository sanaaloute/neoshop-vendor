export type ChatAuthorRole = "vendor" | "customer";

export type ChatAttachment = {
  id: string;
  filename: string;
  mime: string;
  sizeBytes: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  authorRole: ChatAuthorRole;
  body: string;
  sentAt: string;
  attachments?: ChatAttachment[];
  /** Delivery hint for optimistic rows */
  pending?: boolean;
};

export type ChatThread = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderRef?: string;
  /** ISO — messages from customer at or after this count as unread for badge */
  lastReadAt: string;
  messages: ChatMessage[];
};
