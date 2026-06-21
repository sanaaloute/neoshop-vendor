"use client";

import { create } from "zustand";

import type { ChatMessage, ChatParticipant, ChatThread } from "@/modules/chat/types";

function upsertMessage(
  messages: ChatMessage[],
  next: ChatMessage
): ChatMessage[] {
  if (messages.some((m) => m.id === next.id)) return messages;
  return [...messages, next].sort(
    (a, b) => +new Date(a.sentAt) - +new Date(b.sentAt)
  );
}

type ChatStoreState = {
  threads: ChatThread[];
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
  replaceThreads: (threads: ChatThread[]) => void;
  /** Merge incoming threads from background polling — preserves local messages + read state */
  mergeThreads: (threads: ChatThread[]) => void;
  mergeThreadMessages: (threadId: string, messages: ChatMessage[]) => void;
  mergeThreadParticipantMap: (
    threadId: string,
    map: Record<string, ChatParticipant>
  ) => void;
  mergeIncomingMessage: (message: ChatMessage) => void;
  appendVendorMessage: (threadId: string, msg: ChatMessage) => void;
  replaceMessage: (
    threadId: string,
    oldMessageId: string,
    msg: ChatMessage
  ) => void;
  markThreadRead: (threadId: string) => void;
  deleteMessage: (threadId: string, messageId: string) => void;
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  threads: [],
  selectedThreadId: null,
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),
  replaceThreads: (threads) => set({ threads }),
  mergeThreads: (incoming) =>
    set((s) => {
      const existingById = new Map(s.threads.map((t) => [t.id, t]));
      const merged = incoming.map((incomingThread) => {
        const existing = existingById.get(incomingThread.id);
        if (!existing) return incomingThread;
        // Preserve local state: lastReadAt and locally-known participants.
        // Merge the server's latest preview message into the local message list
        // so the thread preview stays fresh without overwriting full history.
        const latestIncoming = incomingThread.messages[incomingThread.messages.length - 1];
        const nextMessages = latestIncoming
          ? upsertMessage(existing.messages, latestIncoming)
          : existing.messages;
        return {
          ...incomingThread,
          messages: nextMessages,
          lastReadAt: existing.lastReadAt,
          participantMap: {
            ...incomingThread.participantMap,
            ...existing.participantMap,
          },
        };
      });
      // Append any threads that only exist locally (shouldn't happen, but be safe)
      const incomingIds = new Set(incoming.map((t) => t.id));
      const localOnly = s.threads.filter((t) => !incomingIds.has(t.id));
      return { threads: [...merged, ...localOnly] };
    }),
  mergeThreadMessages: (threadId, messages) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, messages } : t
      ),
    })),
  mergeThreadParticipantMap: (threadId, map) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId
          ? { ...t, participantMap: { ...t.participantMap, ...map } }
          : t
      ),
    })),
  mergeIncomingMessage: (message) => {
    const selectedId = get().selectedThreadId;
    const isPeer = message.authorRole !== "vendor";
    const open = selectedId === message.threadId && isPeer;
    const now = new Date().toISOString();
    set((s) => ({
      threads: s.threads.map((t) => {
        if (t.id !== message.threadId) return t;
        const nextMsgs = upsertMessage(t.messages, message);
        return {
          ...t,
          messages: nextMsgs,
          lastReadAt: open ? now : t.lastReadAt,
        };
      }),
    }));
  },
  appendVendorMessage: (threadId, msg) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id !== threadId
          ? t
          : { ...t, messages: upsertMessage(t.messages, msg) }
      ),
    })),
  replaceMessage: (threadId, oldMessageId, msg) =>
    set((s) => ({
      threads: s.threads.map((t) => {
        if (t.id !== threadId) return t;
        const messages = t.messages.filter((m) => m.id !== oldMessageId);
        return { ...t, messages: upsertMessage(messages, msg) };
      }),
    })),
  markThreadRead: (threadId) => {
    const now = new Date().toISOString();
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, lastReadAt: now } : t
      ),
    }));
  },
  deleteMessage: (threadId, messageId) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId
          ? { ...t, messages: t.messages.filter((m) => m.id !== messageId) }
          : t
      ),
    })),
}));
