"use client";

import { create } from "zustand";

import type { ChatMessage, ChatThread } from "@/modules/chat/types";

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
  mergeThreadMessages: (threadId: string, messages: ChatMessage[]) => void;
  mergeIncomingMessage: (message: ChatMessage) => void;
  appendVendorMessage: (threadId: string, msg: ChatMessage) => void;
  markThreadRead: (threadId: string) => void;
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  threads: [],
  selectedThreadId: null,
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),
  replaceThreads: (threads) => set({ threads }),
  mergeThreadMessages: (threadId, messages) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, messages } : t
      ),
    })),
  mergeIncomingMessage: (message) => {
    const selectedId = get().selectedThreadId;
    const open =
      selectedId === message.threadId && message.authorRole === "customer";
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
  markThreadRead: (threadId) => {
    const now = new Date().toISOString();
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, lastReadAt: now } : t
      ),
    }));
  },
}));
