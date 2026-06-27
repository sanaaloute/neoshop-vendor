import { vendorApiClient } from "@/services/api/client";

const CHAT_UPLOAD_TIMEOUT_MS = 120_000;

export type ChatMessageAttachmentInput = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  storagePath?: string;
  storageBucket?: string;
};

/** POST /chat/conversations — open or resume a conversation with a user or vendor */
export async function createConversation(body: { withUserId?: string; withVendorId?: string }) {
  const { data } = await vendorApiClient.post("/api/v1/chat/conversations", body);
  return data;
}

/** GET /chat/conversations */
export async function listConversations() {
  const { data } = await vendorApiClient.get("/api/v1/chat/conversations");
  return data;
}

/** GET /chat/conversations/:conversationId */
export async function getConversation(conversationId: string) {
  const { data } = await vendorApiClient.get(`/api/v1/chat/conversations/${conversationId}`);
  return data;
}

/** GET /chat/conversations/:conversationId/messages */
export async function listConversationMessages(
  conversationId: string,
  params?: { skip?: number; take?: number }
) {
  const { data } = await vendorApiClient.get(`/api/v1/chat/conversations/${conversationId}/messages`, { params });
  return data;
}

/** POST /chat/conversations/:conversationId/messages */
export async function postConversationMessage(
  conversationId: string,
  body: { body?: string; attachments?: ChatMessageAttachmentInput[] }
) {
  const { data } = await vendorApiClient.post(`/api/v1/chat/conversations/${conversationId}/messages`, body);
  return data;
}

/** POST /chat/conversations/:conversationId/attachments — upload a single image or PDF */
export async function uploadChatAttachment(conversationId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await vendorApiClient.post<{
    id: string;
    messageId: string | null;
    fileUrl: string;
    storagePath?: string;
    storageBucket?: string;
    mimeType: string;
    fileSize: number;
    fileName: string;
    signedUrl: string;
    expiresIn: number;
    createdAt: string;
  }>(`/api/v1/chat/conversations/${conversationId}/attachments`, form, {
    timeout: CHAT_UPLOAD_TIMEOUT_MS,
    // Let Axios set the multipart boundary automatically
  });
  return data;
}

/** DELETE /chat/conversations/:conversationId/messages/:messageId */
export async function deleteConversationMessage(
  conversationId: string,
  messageId: string
) {
  const { data } = await vendorApiClient.delete(
    `/api/v1/chat/conversations/${conversationId}/messages/${messageId}`
  );
  return data;
}
