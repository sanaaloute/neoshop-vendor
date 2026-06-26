"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ExternalLink,
  FileIcon,
  Image as ImageIcon,
  Languages,
  MessageSquare,
  Paperclip,
  Radio,
  Send,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/feedback/loading-button";
import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { getApiBaseUrl } from "@/config/auth";
import {
  useGatewayChatBootstrap,
  useGatewayChatMessages,
} from "@/hooks/use-gateway-chat-bootstrap";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useChatMessages } from "@/hooks/use-chat-messages";
import {
  useChatTypingRealtimeEvents,
  useRealtimeVendorStatus,
} from "@/realtime/hooks";
import { useRealtimeContext } from "@/realtime/context";
import { useAuthStore } from "@/store/auth-store";
import { validateChatAttachment } from "@/lib/upload-config";
import { useVendorProfileStore } from "@/store/vendor-profile-store";
import { readStorageUrls } from "@/services/vendor/storage-api";
import { mapChatMessage } from "@/services/vendor/mappers/chat-from-api";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

import type { ChatAttachment, ChatMessage, ChatThread } from "./types";

function unreadCount(t: ChatThread): number {
  return t.messages.filter(
    (m) => m.authorRole !== "vendor" && m.sentAt > t.lastReadAt
  ).length;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleBadge(role: string, t: (key: string) => string): string | null {
  const r = role.toLowerCase();
  if (r === "admin") return t("roleAdmin");
  if (r === "super_admin") return t("roleSuperAdmin");
  return null;
}

function formatShortTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function inferMessageType(
  body: string | null,
  attachments?: ChatAttachment[]
): import("./types").ChatMessageType {
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessagingHome() {
  const t = useTranslations("chat");
  const { loading: chatSyncLoading, error: chatSyncError } =
    useGatewayChatBootstrap();
  const threads = useChatStore((s) => s.threads);
  const selectedId = useChatStore((s) => s.selectedThreadId);
  const setSelectedThreadId = useChatStore((s) => s.setSelectedThreadId);
  const appendVendorMessage = useChatStore((s) => s.appendVendorMessage);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const markThreadRead = useChatStore((s) => s.markThreadRead);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const vendorUserId = useAuthStore((s) => s.user?.id ?? null);
  const vendorProfileId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [previewSignedUrls, setPreviewSignedUrls] = useState<
    Record<string, string>
  >({});
  const desktop = useIsDesktop();
  const {
    sendMessage,
    deleteMessage: deleteChatMessage,
    uploadAttachment,
  } = useChatMessages();
  const endRef = useRef<HTMLDivElement>(null);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const peerTypingClearRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const socketIoStatus = useRealtimeVendorStatus();
  const { socket } = useRealtimeContext();

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !selectedId || !vendorUserId) return;
      socket.emit("chat:typing", {
        threadId: selectedId,
        userId: vendorUserId,
        isTyping,
      });
    },
    [socket, selectedId, vendorUserId]
  );

  useGatewayChatMessages(selectedId);

  useEffect(() => {
    if (desktop && !selectedId && threads[0]) {
      setSelectedThreadId(threads[0].id);
    }
  }, [desktop, selectedId, threads, setSelectedThreadId]);

  useEffect(() => {
    if (!selectedId) return;
    markThreadRead(selectedId);
  }, [selectedId, markThreadRead]);

  // Socket.IO typing events
  useChatTypingRealtimeEvents((payload) => {
    if (payload.userId === vendorUserId) return;
    if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
    setPeerTyping(payload.isTyping);
    if (payload.isTyping) {
      peerTypingClearRef.current = setTimeout(() => setPeerTyping(false), 4500);
    }
  });

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );

  const currentUserIds = [
    vendorUserId,
    vendorProfileId,
    selected?.vendorChatId,
  ].filter((id): id is string => Boolean(id));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length, peerTyping]);

  // Resolve signed URLs for history attachments that don't have one
  useEffect(() => {
    if (!getApiBaseUrl() || !selectedId || !selected) return;
    const attachments = selected.messages.flatMap(
      (m) =>
        m.attachments?.filter(
          (a) => a.fileUrl && !a.signedUrl && !signedUrls[a.fileUrl]
        ) ?? []
    );
    if (attachments.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await readStorageUrls(
          attachments.map((a) => ({ bucket: "chat-media", path: a.fileUrl! }))
        );
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const r of res.results) {
          if (r.path && (r.signedUrl || r.publicUrl)) {
            next[r.path] = r.signedUrl ?? r.publicUrl!;
          }
        }
        setSignedUrls((prev) => ({ ...prev, ...next }));
      } catch {
        /* ignore transient signed-url failures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, signedUrls, selected, selected?.messages.length]);

  // Resolve signed URLs for image previews in the conversation list.
  useEffect(() => {
    if (!getApiBaseUrl()) return;
    const attachments = threads.flatMap((thread) => {
      const last = thread.messages[thread.messages.length - 1];
      return (
        last?.attachments?.filter((a) => {
          const mime = (a.mimeType ?? a.mime ?? "").toLowerCase();
          return (
            mime.startsWith("image/") &&
            a.fileUrl &&
            !a.signedUrl &&
            !previewSignedUrls[a.fileUrl]
          );
        }) ?? []
      );
    });
    if (attachments.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await readStorageUrls(
          attachments.map((a) => ({ bucket: "chat-media", path: a.fileUrl! }))
        );
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const r of res.results) {
          if (r.path && (r.signedUrl || r.publicUrl)) {
            next[r.path] = r.signedUrl ?? r.publicUrl!;
          }
        }
        setPreviewSignedUrls((prev) => ({ ...prev, ...next }));
      } catch {
        /* ignore transient signed-url failures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threads, previewSignedUrls]);

  const selectThread = (id: string) => {
    setSelectedThreadId(id);
    if (!desktop) setSheetOpen(true);
  };

  useEffect(() => {
    if (desktop) setSheetOpen(false);
  }, [desktop]);

  const flushTypingIdle = useCallback(() => {
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = setTimeout(() => emitTyping(false), 1200);
  }, [emitTyping]);

  const onDraftChange = (v: string) => {
    setDraft(v);
    setSendError(null);
    if (v.trim()) {
      emitTyping(true);
      flushTypingIdle();
    } else {
      emitTyping(false);
    }
  };

  /** Check if the vendor is trying to send the first message in a customer thread.
   *  Returns true if the customer has sent at least one message. */
  const canVendorSend = (thread: ChatThread): boolean => {
    return thread.messages.some((m) => m.authorRole !== "vendor");
  };

  const sendDraft = async () => {
    if (!selectedId || !selected) return;
    const text = draft.trim() || undefined;
    if (!text && pendingFiles.length === 0) return;

    // Vendor-first-message guard
    if (!canVendorSend(selected)) {
      setSendError(t("cannotSendFirstMessage"));
      return;
    }

    setSendError(null);

    let uploaded: Awaited<ReturnType<typeof uploadAttachment>>[] | undefined;
    if (pendingFiles.length > 0) {
      try {
        uploaded = await Promise.all(
          pendingFiles.map((f) => uploadAttachment(selectedId, f))
        );
      } catch {
        setSendError(t("attachmentUploadError"));
        return;
      }
    }

    const attachments: ChatAttachment[] | undefined = uploaded?.map((a) => ({
      id: a.id,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      filename: a.fileName,
      mimeType: a.mimeType,
      mime: a.mimeType,
      fileSize: a.fileSize,
      sizeBytes: a.fileSize,
      signedUrl: a.signedUrl,
      expiresIn: a.expiresIn,
    }));

    const messageType = inferMessageType(text ?? null, attachments);

    const msg: ChatMessage = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      threadId: selectedId,
      conversationId: selectedId,
      messageType,
      authorRole: "vendor",
      senderUserId: vendorUserId ?? "unknown",
      body: text ?? null,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      attachments,
      pending: true,
    };

    appendVendorMessage(selectedId, msg);
    setDraft("");
    setPendingFiles([]);
    emitTyping(false);

    if (getApiBaseUrl()) {
      void (async () => {
        setSending(true);
        try {
          const sent = (await sendMessage(
            selectedId,
            text,
            attachments?.map((a) => ({
              fileName: a.fileName ?? a.filename ?? "attachment",
              mimeType: a.mimeType ?? a.mime ?? "application/octet-stream",
              fileSize: a.fileSize ?? a.sizeBytes ?? 0,
              fileUrl: a.fileUrl ?? "",
            }))
          )) as Record<string, unknown>;
          const real = mapChatMessage(sent, selectedId, currentUserIds);
          replaceMessage(selectedId, msg.id, real);
        } catch {
          setSendError(t("sendFailed"));
          /* message stays optimistic in thread */
        } finally {
          setSending(false);
        }
      })();
    }
  };

  const pickFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      const err = validateChatAttachment(file);
      if (err) {
        setSendError(`${file.name}: ${err}`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) setPendingFiles((p) => [...p, ...accepted]);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedId || !selected) return;
    const msg = selected.messages.find((m) => m.id === messageId);
    if (!msg) return;

    // Optimistic remove
    deleteMessage(selectedId, messageId);

    if (getApiBaseUrl()) {
      try {
        await deleteChatMessage(selectedId, messageId);
      } catch {
        // Restore message on errors
        useChatStore.getState().appendVendorMessage(selectedId, msg);
      }
    }
  };

  const liveConnected = socketIoStatus === "live";

  function previewText(m: ChatMessage | undefined): string {
    if (!m) return t("noMessagesYet");
    // Prefer senderUserId comparison over role heuristic so multi-user
    // conversations and admin participants are handled correctly.
    const isFromOther = !currentUserIds.some(
      (id) => id.length > 0 && id === m.senderUserId
    );
    if (isFromOther && m.translatedBody) {
      return m.translatedBody;
    }
    if (m.messageType === "image") return t("previewImage");
    if (m.messageType === "document") return t("previewDocument");
    if (m.messageType === "mixed") return t("previewMixed");
    return m.body ?? t("previewImage");
  }

  return (
    <div className="flex max-h-[calc(100vh-120px)] min-h-[420px] flex-col gap-4 sm:min-h-[520px] lg:max-h-[calc(100vh-160px)] lg:min-h-[calc(100vh-220px)]">
      <GatewaySyncBanner loading={chatSyncLoading} error={chatSyncError} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Badge variant="secondary" className="gap-1.5 font-normal tabular-nums">
          <Radio
            className={cn(
              "size-3.5",
              liveConnected ? "text-green-500" : "text-muted-foreground"
            )}
            aria-hidden
          />
          {liveConnected
            ? t("live")
            : socketIoStatus === "degraded"
              ? t("degraded")
              : getApiBaseUrl()
                ? t("offline")
                : t("standardMode")}
        </Badge>
      </div>

      <div className="border-border/60 bg-card/40 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border lg:flex-row">
        <aside className="border-border/60 flex max-h-[min(420px,55vh)] flex-col border-b sm:max-h-[min(520px,60vh)] lg:max-h-none lg:w-[min(100%,340px)] lg:shrink-0 lg:border-r lg:border-b-0">
          <div className="border-border/60 border-b p-2">
            <Input
              placeholder={t("searchConversations")}
              aria-label={t("searchChatsAria")}
            />
          </div>
          <ScrollArea className="flex-1">
            <ul className="divide-border/60 divide-y p-2">
              {threads.map((threadItem) => {
                const active = threadItem.id === selectedId;
                const unread = unreadCount(threadItem);
                const preview =
                  threadItem.messages[threadItem.messages.length - 1];
                const peer = Object.values(threadItem.participantMap).find(
                  (p) => p.role !== "vendor"
                );
                return (
                  <li key={threadItem.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        active ? "bg-muted/70" : "hover:bg-muted/40"
                      )}
                      onClick={() => selectThread(threadItem.id)}
                    >
                      <div className="shrink-0">
                        {peer?.avatarUrl ? (
                          <img
                            src={peer.avatarUrl}
                            alt=""
                            className="size-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                            {initials(threadItem.customerName)}
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">
                            {threadItem.customerName}
                          </span>
                          <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                            {preview ? formatShortTime(preview.sentAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 truncate text-xs">
                            {preview?.messageType === "image" &&
                              preview.attachments?.[0]?.fileUrl && (
                                <img
                                  src={
                                    previewSignedUrls[
                                      preview.attachments[0].fileUrl
                                    ] ??
                                    preview.attachments[0].signedUrl ??
                                    preview.attachments[0].fileUrl
                                  }
                                  alt=""
                                  className="size-5 shrink-0 rounded object-cover"
                                />
                              )}
                            {previewText(preview)}
                          </span>
                          {unread > 0 ? (
                            <Badge
                              variant="default"
                              className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums"
                            >
                              {unread > 99 ? "99+" : unread}
                            </Badge>
                          ) : null}
                        </div>
                        {threadItem.orderRef ? (
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {threadItem.orderRef}
                          </span>
                        ) : null}
                      </div>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </aside>

        <section className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex">
          {selected ? (
            <ConversationBody
              thread={selected}
              draft={draft}
              onDraftChange={onDraftChange}
              onSend={sendDraft}
              pendingFiles={pendingFiles}
              onPickFiles={pickFiles}
              onClearFiles={() => setPendingFiles([])}
              peerTyping={peerTyping}
              endRef={endRef}
              sendError={sendError}
              onDeleteMessage={handleDeleteMessage}
              currentUserIds={currentUserIds}
              signedUrls={signedUrls}
              sending={sending}
            />
          ) : (
            <EmptyConversation />
          )}
        </section>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedThreadId(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
          showCloseButton
        >
          {selected ? (
            <>
              <SheetHeader className="border-border/60 flex-row items-center gap-3 border-b px-4 py-3 text-left">
                {(() => {
                  const peer = Object.values(selected.participantMap).find(
                    (p) => p.role !== "vendor"
                  );
                  return peer?.avatarUrl ? (
                    <img
                      src={peer.avatarUrl}
                      alt=""
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                      {initials(selected.customerName)}
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <SheetTitle className="leading-snug">
                    {selected.customerName}
                  </SheetTitle>
                  <SheetDescription className="truncate">
                    {selected.customerEmail || selected.customerPhone || ""}
                    {selected.orderRef ? (
                      <span className="ml-2 font-mono text-xs">
                        {selected.orderRef}
                      </span>
                    ) : null}
                  </SheetDescription>
                </div>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground mb-2 w-fit gap-1 self-start px-2"
                  onClick={() => {
                    setSheetOpen(false);
                    setSelectedThreadId(null);
                  }}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Inbox
                </Button>
                <ConversationBody
                  thread={selected}
                  draft={draft}
                  onDraftChange={onDraftChange}
                  onSend={sendDraft}
                  pendingFiles={pendingFiles}
                  onPickFiles={pickFiles}
                  onClearFiles={() => setPendingFiles([])}
                  peerTyping={peerTyping}
                  endRef={endRef}
                  sendError={sendError}
                  onDeleteMessage={handleDeleteMessage}
                  currentUserIds={currentUserIds}
                  signedUrls={signedUrls}
                  sending={sending}
                />
              </div>
            </>
          ) : (
            <SheetHeader className="p-4">
              <SheetTitle>{t("messages")}</SheetTitle>
              <SheetDescription>{t("selectConversation")}</SheetDescription>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmptyConversation() {
  const t = useTranslations("chat");
  return (
    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <MessageSquare className="size-10 opacity-70" aria-hidden />
      <p className="text-foreground text-sm font-medium">
        {t("selectConversationTitle")}
      </p>
      <p className="max-w-xs text-xs">{t("selectConversationDescription")}</p>
    </div>
  );
}

function TranslationBadge({
  originalLanguage,
  targetLanguage,
}: {
  originalLanguage?: string;
  targetLanguage?: string;
}) {
  if (!originalLanguage || !targetLanguage) return null;
  return (
    <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
      <Languages className="size-2.5" aria-hidden />
      {originalLanguage.toUpperCase()} → {targetLanguage.toUpperCase()}
    </span>
  );
}

function AttachmentThumbnail({
  a,
  signedUrl,
}: {
  a: ChatAttachment;
  signedUrl?: string;
}) {
  const t = useTranslations("chat");
  const url = signedUrl ?? a.signedUrl;
  const mime = (a.mimeType ?? a.mime ?? "").toLowerCase();
  const name = a.fileName ?? a.filename ?? t("attachment");

  if (mime.startsWith("image/")) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group/image relative block overflow-hidden rounded-md border"
      >
        {url ? (
          <img
            src={url}
            alt={name}
            className="max-h-[180px] max-w-[260px] object-contain transition-opacity group-hover/image:opacity-90"
            loading="lazy"
          />
        ) : (
          <div className="bg-muted flex h-[120px] w-[160px] items-center justify-center">
            <ImageIcon className="text-muted-foreground size-8" />
          </div>
        )}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="bg-background/80 ring-border/60 hover:bg-background inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium ring-1 backdrop-blur-sm transition-colors"
    >
      {mime === "application/pdf" ? (
        <FileIcon className="size-4 text-red-500" aria-hidden />
      ) : (
        <FileIcon className="text-muted-foreground size-4" aria-hidden />
      )}
      <span className="max-w-[180px] truncate">{name}</span>
      <span className="text-muted-foreground tabular-nums">
        {formatFileSize(a.fileSize ?? a.sizeBytes)}
      </span>
      <ExternalLink className="text-muted-foreground size-3" aria-hidden />
    </a>
  );
}

function MessageBubble({
  m,
  thread,
  currentUserIds,
  hoveredMessageId,
  setHoveredMessageId,
  onDeleteMessage,
  signedUrls,
}: {
  m: ChatMessage;
  thread: ChatThread;
  currentUserIds: string[];
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  onDeleteMessage: (id: string) => void;
  signedUrls: Record<string, string>;
}) {
  const t = useTranslations("chat");
  const isVendor = m.authorRole === "vendor";
  const sender = m.senderUserId
    ? thread.participantMap[m.senderUserId]
    : undefined;
  const senderName = sender?.name || thread.customerName;
  const badge = sender ? roleBadge(sender.role, t) : null;
  const isMine =
    m.senderUserId && currentUserIds.includes(m.senderUserId) ? true : false;
  const hasTranslation = !!m.translatedBody;
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div
      className={cn("flex gap-2", isVendor ? "justify-end" : "justify-start")}
      onMouseEnter={() => setHoveredMessageId(m.id)}
      onMouseLeave={() => setHoveredMessageId(null)}
    >
      {!isVendor && sender?.avatarUrl ? (
        <img
          src={sender.avatarUrl}
          alt=""
          className="mt-1 size-7 shrink-0 rounded-full object-cover"
        />
      ) : !isVendor ? (
        <div className="bg-primary/10 text-primary mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
          {initials(senderName)}
        </div>
      ) : null}
      <div className="flex max-w-[min(100%,420px)] flex-col">
        {!isVendor && (
          <span className="text-muted-foreground mb-0.5 flex items-center gap-1.5 px-1 text-[11px]">
            <span>{senderName}</span>
            {badge ? (
              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                {badge}
              </Badge>
            ) : null}
          </span>
        )}
        <div
          className={cn(
            "group relative rounded-2xl border px-3 py-2 text-sm shadow-sm",
            isVendor
              ? "border-primary/30 bg-primary/15 text-foreground"
              : "border-border bg-muted/40"
          )}
        >
          {/* Delete button - only on current user's own messages */}
          {m.senderUserId &&
            currentUserIds.includes(m.senderUserId) &&
            hoveredMessageId === m.id && (
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                onClick={() => onDeleteMessage(m.id)}
                className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                title={t("deleteMessage")}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          {/* Message text: show translated by default for received messages when available */}
          {m.body ? (
            <p className="whitespace-pre-wrap">
              {isMine || !hasTranslation || showOriginal
                ? m.body
                : m.translatedBody}
            </p>
          ) : null}
          {/* Translation toggle (receiver only, when translation exists) */}
          {!isMine && hasTranslation && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowOriginal((v) => !v)}
                className="bg-background/80 text-muted-foreground ring-border/60 hover:text-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 backdrop-blur-sm transition-colors"
              >
                <Languages className="size-2.5" aria-hidden />
                {showOriginal ? t("showTranslation") : t("showOriginal")}
              </Button>
              <TranslationBadge
                originalLanguage={m.originalLanguage}
                targetLanguage={m.targetLanguage}
              />
            </div>
          )}
          {m.attachments?.length ? (
            <div
              className={cn("grid gap-2", m.body ? "mt-2 border-t pt-2" : "")}
            >
              {m.attachments.map((a) => (
                <AttachmentThumbnail
                  key={a.id}
                  a={a}
                  signedUrl={a.fileUrl ? signedUrls[a.fileUrl] : undefined}
                />
              ))}
            </div>
          ) : null}
          <p className="text-muted-foreground mt-1 text-[10px] tabular-nums">
            {formatShortTime(m.sentAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConversationBody({
  thread,
  draft,
  onDraftChange,
  onSend,
  pendingFiles,
  onPickFiles,
  onClearFiles,
  peerTyping,
  endRef,
  sendError,
  onDeleteMessage,
  currentUserIds,
  signedUrls,
  sending,
}: {
  thread: ChatThread;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  pendingFiles: File[];
  onPickFiles: (list: FileList | null) => void;
  onClearFiles: () => void;
  peerTyping: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
  sendError: string | null;
  onDeleteMessage: (messageId: string) => void;
  currentUserIds: string[];
  signedUrls: Record<string, string>;
  sending: boolean;
}) {
  const t = useTranslations("chat");
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  return (
    <>
      <header className="border-border/60 hidden shrink-0 items-center gap-3 border-b px-4 py-3 lg:flex">
        {(() => {
          const peer = Object.values(thread.participantMap).find(
            (p) => p.role !== "vendor"
          );
          return peer?.avatarUrl ? (
            <img
              src={peer.avatarUrl}
              alt=""
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
              {initials(thread.customerName)}
            </div>
          );
        })()}
        <div className="min-w-0">
          <h2 className="text-base leading-tight font-semibold">
            {thread.customerName}
          </h2>
          <p className="text-muted-foreground text-xs">
            {thread.customerEmail || thread.customerPhone || ""}
            {thread.orderRef ? (
              <span className="ml-2 font-mono">· {thread.orderRef}</span>
            ) : null}
          </p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <div className="space-y-3 py-3 pr-2">
          {thread.messages.map((m) => (
            <MessageBubble
              key={m.id}
              m={m}
              thread={thread}
              currentUserIds={currentUserIds}
              hoveredMessageId={hoveredMessageId}
              setHoveredMessageId={setHoveredMessageId}
              onDeleteMessage={onDeleteMessage}
              signedUrls={signedUrls}
            />
          ))}
          {peerTyping ? (
            <div className="flex justify-start">
              <div className="border-border bg-muted/30 text-muted-foreground rounded-2xl border border-dashed px-3 py-2 text-xs italic">
                {t("someoneIsTyping")}
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <footer className="border-border/60 shrink-0 border-t p-3">
        {sendError ? (
          <p className="text-destructive mb-2 text-xs">{sendError}</p>
        ) : null}
        {pendingFiles.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingFiles.map((f, i) => (
              <Badge
                key={`${f.name}-${i}`}
                variant="secondary"
                className="font-normal"
              >
                {f.name}
              </Badge>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onClearFiles}
            >
              {t("clear")}
            </Button>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            placeholder={t("writeReply")}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            className="min-h-[88px] flex-1 resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !sending) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <input
              id="chat-attach-input"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0"
              onClick={() =>
                document.getElementById("chat-attach-input")?.click()
              }
              aria-label={t("attachFiles")}
            >
              <Paperclip className="size-4" />
            </Button>
            <LoadingButton
              type="button"
              className="gap-1.5 sm:w-full"
              loading={sending}
              onClick={onSend}
            >
              <Send className="size-4" aria-hidden />
              {t("send")}
            </LoadingButton>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-[11px]">
          {t("enterSends")}
        </p>
      </footer>
    </>
  );
}
