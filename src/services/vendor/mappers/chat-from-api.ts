import type { ChatAttachment, ChatMessage, ChatParticipant, ChatThread } from "@/modules/chat/types";

/** Extracts the participant-specific ID (senderUserId in messages). */
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

  const id = extractParticipantId(p);
  if (!id) return undefined;

  const firstName = String(u.name ?? "");
  const lastName = String(u.surname ?? "");
  const displayName = `${firstName} ${lastName}`.trim();

  return {
    id,
    name: displayName || firstName || "User",
    surname: lastName || undefined,
    email: String(u.email ?? "") || undefined,
    phone: String(u.phone ?? u.phoneNumber ?? u.mobile ?? "") || undefined,
    avatarUrl:
      (typeof u.avatarUrl === "string" && u.avatarUrl) ||
      (typeof u.avatar === "string" && u.avatar) ||
      undefined,
    role: String(u.role ?? "customer").toLowerCase(),
  };
}

function isVendorSender(senderId: string, currentUserIds: string[]): boolean {
  if (!senderId) return false;
  return currentUserIds.some((id) => id.length > 0 && id === senderId);
}

function mapAttachment(raw: Record<string, unknown>): ChatAttachment {
  const fileUrl =
    (typeof raw.fileUrl === "string" && raw.fileUrl) ||
    (typeof raw.url === "string" && raw.url) ||
    "";
  const fileName =
    (typeof raw.fileName === "string" && raw.fileName) ||
    (typeof raw.filename === "string" && raw.filename) ||
    (typeof raw.name === "string" && raw.name) ||
    (fileUrl ? fileUrl.split("/").pop() : "attachment");
  const mimeType =
    (typeof raw.mimeType === "string" && raw.mimeType) ||
    (typeof raw.mime === "string" && raw.mime) ||
    "application/octet-stream";
  const fileSize =
    typeof raw.fileSize === "number"
      ? raw.fileSize
      : typeof raw.sizeBytes === "number"
      ? raw.sizeBytes
      : 0;
  return {
    id: String(raw.id ?? ""),
    fileUrl,
    fileName,
    filename: fileName,
    mimeType,
    mime: mimeType,
    fileSize,
    sizeBytes: fileSize,
    signedUrl:
      typeof raw.signedUrl === "string" && raw.signedUrl
        ? raw.signedUrl
        : undefined,
    expiresIn:
      typeof raw.expiresIn === "number" ? raw.expiresIn : undefined,
  };
}

function mapAttachments(raw: unknown): ChatAttachment[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const mapped = raw
    .map((a) => mapAttachment(a as Record<string, unknown>))
    .filter((a) => a.fileUrl || a.id);
  return mapped.length > 0 ? mapped : undefined;
}

function inferMessageType(
  body: string | null,
  attachments: ChatAttachment[] | undefined
): import("@/modules/chat/types").ChatMessageType {
  const hasText = Boolean(body && body.trim().length > 0);
  const hasImage = attachments?.some((a) =>
    (a.mimeType ?? a.mime ?? "").startsWith("image/")
  );
  const hasDoc = attachments?.some((a) => {
    const mime = (a.mimeType ?? a.mime ?? "").toLowerCase();
    return mime === "application/pdf" || (!mime.startsWith("image/") && mime);
  });
  if (hasImage && hasText) return "mixed";
  if (hasImage) return "image";
  if (hasDoc) return "document";
  return "text";
}

export function mapChatMessage(
  raw: Record<string, unknown>,
  threadId: string,
  currentUserIds: string[]
): ChatMessage {
  const sender = String(raw.senderUserId ?? "");
  const fromVendor = isVendorSender(sender, currentUserIds);
  const body =
    raw.body === null || raw.body === undefined
      ? null
      : String(raw.body);
  const attachments = mapAttachments(raw.attachments);
  const messageType =
    (typeof raw.messageType === "string"
      ? raw.messageType
      : inferMessageType(body, attachments)) as import("@/modules/chat/types").ChatMessageType;

  return {
    id: String(raw.id),
    threadId,
    conversationId: threadId,
    messageType,
    authorRole: fromVendor ? "vendor" : "customer",
    senderUserId: sender,
    body,
    sentAt: String(raw.createdAt ?? new Date().toISOString()),
    attachments,
    translatedBody: typeof raw.translatedBody === "string" ? raw.translatedBody : undefined,
    originalLanguage: typeof raw.originalLanguage === "string" ? raw.originalLanguage : undefined,
    targetLanguage: typeof raw.targetLanguage === "string" ? raw.targetLanguage : undefined,
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

  // Build participant map keyed by userId (matches senderUserId in messages)
  const participantMap: Record<string, ChatParticipant> = {};
  for (const p of participants) {
    const participant = mapParticipant(p);
    if (participant) {
      participantMap[participant.id] = participant;
    }
  }

  // Identify the vendor participant by role, then extract their chat participant ID
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
      return !isVendorSender(extractParticipantId(p), vendorIds);
    }) ?? participants[0];

  const peerParticipant = mapParticipant(peer);
  const name = peerParticipant?.name || "Customer";

  // Backend may return `messages` (array, take:1) or legacy `lastMessage`
  const apiMessages = Array.isArray(raw.messages)
    ? (raw.messages as Record<string, unknown>[])
    : [];
  const last =
    apiMessages[0] ??
    (raw.lastMessage as Record<string, unknown> | undefined);
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
                attachments: last.attachments,
                messageType: last.messageType,
                translatedBody: last.translatedBody,
                originalLanguage: last.originalLanguage,
                targetLanguage: last.targetLanguage,
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
