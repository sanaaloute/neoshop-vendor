import type { ChatMessage, ChatThread } from "@/modules/chat/types";

function isCurrentUser(senderId: string, currentUserIds: string[]): boolean {
  return currentUserIds.some((id) => id.length > 0 && id === senderId);
}

export function mapChatMessage(
  raw: Record<string, unknown>,
  threadId: string,
  currentUserIds: string[]
): ChatMessage {
  const sender = String(raw.senderUserId ?? "");
  return {
    id: String(raw.id),
    threadId,
    authorRole: isCurrentUser(sender, currentUserIds) ? "vendor" : "customer",
    body: String(raw.body ?? ""),
    sentAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export function mapConversationToThread(
  raw: Record<string, unknown>,
  currentUserIds: string[],
  messages: ChatMessage[] = []
): ChatThread {
  const participants = Array.isArray(raw.participants)
    ? (raw.participants as Record<string, unknown>[])
    : [];
  const peer =
    participants.find((p) => {
      const usr = p.user as Record<string, unknown> | undefined;
      const uid = String(p.userId ?? usr?.id ?? "");
      return !isCurrentUser(uid, currentUserIds);
    }) ?? participants[0];
  const usr = peer?.user as Record<string, unknown> | undefined;
  const u = (usr ?? peer) as Record<string, unknown> | undefined;
  const email = String(u?.email ?? "");
  const phone = String(u?.phone ?? u?.phoneNumber ?? u?.mobile ?? "");
  const name = String(
    u?.name ?? u?.fullName ?? (email || phone || "Customer")
  );

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
              currentUserIds
            ),
          ]
        : [];

  return {
    id: String(raw.id),
    customerName: name,
    customerEmail: email,
    customerPhone: phone || undefined,
    orderRef: undefined,
    lastReadAt: new Date(0).toISOString(),
    messages: seedMsgs,
  };
}
