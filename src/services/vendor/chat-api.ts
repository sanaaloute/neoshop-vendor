import { vendorApiClient } from "@/services/api/client";

/** POST /chat/conversations — open or resume a conversation with a customer */
export async function createConversation(body: { withUserId: string }) {
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
  body: { body: string }
) {
  const { data } = await vendorApiClient.post(`/api/v1/chat/conversations/${conversationId}/messages`, body);
  return data;
}
