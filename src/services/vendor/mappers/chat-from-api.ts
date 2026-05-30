import type { ChatMessage, ChatParticipant, ChatThread } from "@/modules/chat/types";

function extractParticipantId(
  p: Record<string, unknown> | undefined
): string {
  if (!p) return "";
  const usr = p.user as Record<string, unknown> | undefined;
  return String(p.userId ?? usr?.id ?? "");
}

function mapParticipant(
  p: Record<string, unknown> | undefined
): ChatParticipant | undefined {
  if (!p) return undefined;
  const usr = p.user as Record<string, unknown> | undefined;
  const u = (usr ?? p) as Record<string, unknown> | undefined;
  if (!u) return undefined;

  const id = String(u.id ?? "");
  if (!id) return undefined;

  const roleStr = String(u.role ?? "").toLowerCase();
  const role: ChatParticipant["role"] =
    roleStr === "vendor" ? "vendor" : "customer";

  return {
    id,
    name: String(u.name ?? ""),
    surname: String(u.surname ?? ""),
    email: String(u.email ?? "") || undefined,
    phone: String(u.phone ?? u.phoneNumber ?? u.mobile ?? "") || undefined,
    avatarUrl:
      (typeof u.avatarUrl === "string" && u.avatarUrl) ||
      (typeof u.avatar === "string" && u.avatar) ||
      undefined,
    role,
  };
}

function isCurrentUser(senderId: string, currentUserIds: string[]): boolean {
  if (!senderId) return false;
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

  // Build participant map from full profiles
  const participantMap: Record<string, ChatParticipant> = {};
  for (const p of participants) {
    const participant = mapParticipant(p);
    if (participant) {
      participantMap[participant.id] = participant;
    }
  }

  // Identify the vendor participant by role, then extract their chat ID
  const vendorParticipant = participants.find((p) => {
    const usr = p.user as Record<string, unknown> | undefined;
    return String(usr?.role ?? "").toLowerCase() === "vendor";
  });
  const vendorParticipantId = extractParticipantId(vendorParticipant);

  // Build the full set of IDs that represent the current vendor user
  const vendorIds = [
    ...currentUserIds,
    ...(vendorParticipantId ? [vendorParticipantId] : []),
  ];

  // Peer = the participant who is NOT the vendor
  const peer =
    participants.find((p) => {
      return !isCurrentUser(extractParticipantId(p), vendorIds);
    }) ?? participants[0];

  const peerParticipant = mapParticipant(peer);
  const name = peerParticipant
    ? `${peerParticipant.name}${peerParticipant.surname ? ` ${peerParticipant.surname}` : ""}`.trim() || "Customer"
    : "Customer";

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
              vendorIds
            ),
          ]
        : [];

  return {
    id: String(raw.id),
    customerName: name,
    customerEmail: peerParticipant?.email ?? "",
    customerPhone: peerParticipant?.phone,
    vendorChatId: vendorParticipantId || undefined,
    participantMap,
    orderRef: undefined,
    lastReadAt: new Date(0).toISOString(),
    messages: seedMsgs,
  };
}
