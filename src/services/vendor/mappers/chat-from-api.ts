import type { ChatMessage, ChatThread } from "@/modules/chat/types";

export function mapChatMessage(
  raw: Record<string, unknown>,
  threadId: string,
  vendorUserId: string
): ChatMessage {
  const sender = String(raw.senderUserId ?? "");
  return {
    id: String(raw.id),
    threadId,
    authorRole: sender === vendorUserId ? "vendor" : "customer",
    body: String(raw.body ?? ""),
    sentAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export function mapConversationToThread(
  raw: Record<string, unknown>,
  vendorUserId: string,
  messages: ChatMessage[] = []
): ChatThread {
  const participants = Array.isArray(raw.participants)
    ? (raw.participants as Record<string, unknown>[])
    : [];
  const peer =
    participants.find((p) => {
      const usr = p.user as Record<string, unknown> | undefined;
      const uid = String(p.userId ?? usr?.id ?? "");
      return uid !== vendorUserId;
    }) ?? participants[0];
  const usr = peer?.user as Record<string, unknown> | undefined;
  const u = (usr ?? peer) as Record<string, unknown> | undefined;
  const email = String(u?.email ?? "");
  const name = String(u?.name ?? u?.fullName ?? (email || "Customer"));

  const last = raw.lastMessage as Record<string, unknown> | undefined;
  const seedMsgs =
    messages.length > 0
      ? messages
      : last
        ? [
            mapChatMessage(
              {
                id: String(last.id ?? "last"),
                senderUserId: String(last.senderUserId ?? ""),
                body: last.body,
                createdAt: last.createdAt,
              },
              String(raw.id),
              vendorUserId
            ),
          ]
        : [];

  return {
    id: String(raw.id),
    customerName: name,
    customerEmail: email,
    orderRef: undefined,
    lastReadAt: new Date(0).toISOString(),
    messages: seedMsgs,
  };
}
