"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FileIcon,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Radio,
  Send,
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
import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { getApiBaseUrl } from "@/config/auth";
import { getVendorChatWsUrl } from "@/config/messaging";
import {
  useGatewayChatBootstrap,
  useGatewayChatMessages,
} from "@/hooks/use-gateway-chat-bootstrap";
import { postConversationMessage } from "@/services/vendor/chat-api";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

import type { ChatAttachment, ChatMessage, ChatThread } from "./types";
import {
  useVendorChatRealtime,
  type ChatRealtimeEvent,
} from "./use-vendor-chat-realtime";

import { useIsDesktop } from "@/hooks/use-is-desktop";

function unreadCount(t: ChatThread): number {
  return t.messages.filter(
    (m) => m.authorRole === "customer" && m.sentAt > t.lastReadAt
  ).length;
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

export function MessagingHome() {
  const {
    loading: chatSyncLoading,
    error: chatSyncError,
  } = useGatewayChatBootstrap();
  const threads = useChatStore((s) => s.threads);
  const selectedId = useChatStore((s) => s.selectedThreadId);
  const setSelectedThreadId = useChatStore((s) => s.setSelectedThreadId);
  const mergeIncomingMessage = useChatStore((s) => s.mergeIncomingMessage);
  const appendVendorMessage = useChatStore((s) => s.appendVendorMessage);
  const markThreadRead = useChatStore((s) => s.markThreadRead);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const desktop = useIsDesktop();
  const endRef = useRef<HTMLDivElement>(null);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const peerTypingClearRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const wsConfigured = Boolean(getVendorChatWsUrl());

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

  const onRealtimeEvent = useCallback(
    (e: ChatRealtimeEvent) => {
      if (e.kind === "incoming_message") {
        mergeIncomingMessage(e.message);
      }
      if (e.kind === "peer_typing") {
        if (peerTypingClearRef.current)
          clearTimeout(peerTypingClearRef.current);
        setPeerTyping(e.isTyping);
        if (e.isTyping) {
          peerTypingClearRef.current = setTimeout(
            () => setPeerTyping(false),
            4500
          );
        }
      }
      if (e.kind === "transport") {
        setLiveConnected(e.connected);
      }
    },
    [mergeIncomingMessage]
  );

  const { mode, sendTyping, sendChatOverWs } =
    useVendorChatRealtime({
      threadId: selectedId,
      enabled: Boolean(selectedId),
      onEvent: onRealtimeEvent,
    });

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length, peerTyping]);

  const selectThread = (id: string) => {
    setSelectedThreadId(id);
    if (!desktop) setSheetOpen(true);
  };

  useEffect(() => {
    if (desktop) setSheetOpen(false);
  }, [desktop]);

  const flushTypingIdle = useCallback(() => {
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = setTimeout(() => sendTyping(false), 1200);
  }, [sendTyping]);

  const onDraftChange = (v: string) => {
    setDraft(v);
    if (v.trim()) {
      sendTyping(true);
      flushTypingIdle();
    } else {
      sendTyping(false);
    }
  };

  const buildAttachmentsFromFiles = async (
    files: File[]
  ): Promise<ChatAttachment[]> => {
    return files.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      filename: f.name,
      mime: f.type || "application/octet-stream",
      sizeBytes: f.size,
    }));
  };

  const sendDraft = async () => {
    if (!selectedId || !selected) return;
    const text = draft.trim();
    if (!text && pendingFiles.length === 0) return;

    const attachments =
      pendingFiles.length > 0
        ? await buildAttachmentsFromFiles(pendingFiles)
        : undefined;

    const msg: ChatMessage = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      threadId: selectedId,
      authorRole: "vendor",
      body: text || (attachments?.length ? "Sent attachment(s)." : ""),
      sentAt: new Date().toISOString(),
      attachments,
    };

    appendVendorMessage(selectedId, msg);
    setDraft("");
    setPendingFiles([]);
    sendTyping(false);

    if (getApiBaseUrl()) {
      void (async () => {
        try {
          await postConversationMessage(selectedId, { body: msg.body });
        } catch {
          /* message stays optimistic in thread */
        }
      })();
    }

    if (mode === "websocket") {
      sendChatOverWs(msg);
    }
  };

  const pickFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setPendingFiles((p) => [...p, ...Array.from(list)]);
  };

  return (
    <div className="flex min-h-[560px] flex-col gap-4">
      <GatewaySyncBanner loading={chatSyncLoading} error={chatSyncError} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Badge
          variant="secondary"
          className="gap-1.5 font-normal tabular-nums"
        >
          <Radio
            className={cn(
              "size-3.5",
              liveConnected ? "text-green-500" : "text-muted-foreground"
            )}
            aria-hidden
          />
          {mode === "websocket"
            ? wsConfigured
              ? liveConnected
                ? "Live"
                : "Connecting…"
              : "Standard mode"
            : getApiBaseUrl()
              ? "Connected"
              : "Offline"}
        </Badge>
      </div>

      <div className="border-border/60 bg-card/40 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border lg:flex-row">
        <aside className="border-border/60 flex max-h-[min(520px,55vh)] flex-col border-b lg:max-h-none lg:w-[min(100%,340px)] lg:shrink-0 lg:border-r lg:border-b-0">
          <div className="border-border/60 border-b p-2">
            <Input
              placeholder="Search conversations…"
              aria-label="Search chats"
            />
          </div>
          <ScrollArea className="flex-1">
            <ul className="divide-border/60 divide-y p-2">
              {threads.map((t) => {
                const active = t.id === selectedId;
                const unread = unreadCount(t);
                const preview = t.messages[t.messages.length - 1];
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectThread(t.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        active ? "bg-muted/70" : "hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {t.customerName}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                          {preview ? formatShortTime(preview.sentAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground truncate text-xs">
                          {preview?.body ?? "No messages yet"}
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
                      {t.orderRef ? (
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {t.orderRef}
                        </span>
                      ) : null}
                    </button>
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
              <SheetHeader className="border-border/60 border-b px-4 py-3 text-left">
                <SheetTitle className="leading-snug">
                  {selected.customerName}
                </SheetTitle>
                <SheetDescription className="truncate">
                  {selected.customerEmail}
                  {selected.orderRef ? (
                    <span className="ml-2 font-mono text-xs">
                      {selected.orderRef}
                    </span>
                  ) : null}
                </SheetDescription>
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
                />
              </div>
            </>
          ) : (
            <SheetHeader className="p-4">
              <SheetTitle>Messages</SheetTitle>
              <SheetDescription>Select a conversation.</SheetDescription>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <MessageSquare className="size-10 opacity-70" aria-hidden />
      <p className="text-foreground text-sm font-medium">
        Select a conversation
      </p>
      <p className="max-w-xs text-xs">
        Customer threads appear in the list; unread counts update until you open
        a chat.
      </p>
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
}) {
  return (
    <>
      <header className="border-border/60 hidden shrink-0 border-b px-4 py-3 lg:block">
        <h2 className="text-base leading-tight font-semibold">
          {thread.customerName}
        </h2>
        <p className="text-muted-foreground text-xs">
          {thread.customerEmail}
          {thread.orderRef ? (
            <span className="ml-2 font-mono">· {thread.orderRef}</span>
          ) : null}
        </p>
      </header>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <div className="space-y-3 py-3 pr-2">
          {thread.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.authorRole === "vendor" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[min(100%,420px)] rounded-2xl border px-3 py-2 text-sm shadow-sm",
                  m.authorRole === "vendor"
                    ? "border-primary/30 bg-primary/15 text-foreground"
                    : "border-border bg-muted/40"
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.attachments?.length ? (
                  <ul className="border-border/50 mt-2 space-y-1 border-t pt-2">
                    {m.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="text-muted-foreground flex items-center gap-2 text-xs"
                      >
                        {a.mime.startsWith("image/") ? (
                          <ImageIcon
                            className="size-3.5 shrink-0"
                            aria-hidden
                          />
                        ) : (
                          <FileIcon className="size-3.5 shrink-0" aria-hidden />
                        )}
                        <span className="truncate">{a.filename}</span>
                        <span className="tabular-nums">
                          {(a.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-muted-foreground mt-1 text-[10px] tabular-nums">
                  {formatShortTime(m.sentAt)}
                </p>
              </div>
            </div>
          ))}
          {peerTyping ? (
            <div className="flex justify-start">
              <div className="border-border bg-muted/30 text-muted-foreground rounded-2xl border border-dashed px-3 py-2 text-xs italic">
                Customer is typing…
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <footer className="border-border/60 shrink-0 border-t p-3">
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
              Clear
            </Button>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            placeholder="Write a reply…"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            className="min-h-[88px] flex-1 resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
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
              aria-label="Attach files"
            >
              <Paperclip className="size-4" />
            </Button>
            <Button
              type="button"
              className="gap-1.5 sm:w-full"
              onClick={onSend}
            >
              <Send className="size-4" aria-hidden />
              Send
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-[11px]">
          Enter sends · Shift+Enter for a new line · Attachments send with your
          message (large files may take a moment).
        </p>
      </footer>
    </>
  );
}
