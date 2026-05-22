"use client";

import { useEffect, useMemo, useRef } from "react";

import { getVendorChatWsUrl } from "@/config/messaging";

import type { ChatMessage } from "./types";

export type ChatRealtimeEvent =
  | { kind: "transport"; mode: "websocket"; connected: boolean }
  | { kind: "incoming_message"; message: ChatMessage }
  | { kind: "peer_typing"; threadId: string; isTyping: boolean };

type UseVendorChatRealtimeOptions = {
  threadId: string | null;
  enabled?: boolean;
  onEvent: (event: ChatRealtimeEvent) => void;
};

type WsPayload =
  | { type: "join"; threadId: string }
  | {
      type: "typing";
      threadId: string;
      role: "vendor";
      isTyping: boolean;
    }
  | {
      type: "chat";
      threadId: string;
      message: ChatMessage;
    };

function createWsTransport(
  url: string,
  threadId: string,
  onEvent: (event: ChatRealtimeEvent) => void
) {
  let ws: WebSocket | null = null;
  let disposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;

  const connect = () => {
    if (disposed) return;
    ws = new WebSocket(url);

    ws.onopen = () => {
      attempts = 0;
      const join: WsPayload = { type: "join", threadId };
      ws?.send(JSON.stringify(join));
      onEvent({ kind: "transport", mode: "websocket", connected: true });
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as Record<string, unknown>;
        if (data.type === "message" && data.message) {
          onEvent({
            kind: "incoming_message",
            message: data.message as ChatMessage,
          });
        }
        if (data.type === "typing" && data.from === "customer") {
          onEvent({
            kind: "peer_typing",
            threadId: String(data.threadId ?? threadId),
            isTyping: Boolean(data.isTyping),
          });
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      onEvent({ kind: "transport", mode: "websocket", connected: false });
      if (!disposed && attempts < 8) {
        const delay = Math.min(30_000, 800 * 2 ** attempts);
        attempts += 1;
        reconnectTimer = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  };

  connect();

  return {
    sendTyping(isTyping: boolean) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const payload: WsPayload = {
        type: "typing",
        threadId,
        role: "vendor",
        isTyping,
      };
      ws.send(JSON.stringify(payload));
    },
    sendChat(message: ChatMessage) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const payload: WsPayload = {
        type: "chat",
        threadId,
        message,
      };
      ws.send(JSON.stringify(payload));
    },
    dispose() {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      onEvent({ kind: "transport", mode: "websocket", connected: false });
    },
  };
}

export function useVendorChatRealtime({
  threadId,
  enabled = true,
  onEvent,
}: UseVendorChatRealtimeOptions) {
  const wsUrl = useMemo(() => getVendorChatWsUrl(), []);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const transportRef = useRef<
    ReturnType<typeof createWsTransport>
    | null
  >(null);

  useEffect(() => {
    if (!enabled || !threadId || !wsUrl) return;

    const emit = (e: ChatRealtimeEvent) => onEventRef.current(e);
    const t = createWsTransport(wsUrl, threadId, emit);
    transportRef.current = t;

    return () => {
      t.dispose();
      transportRef.current = null;
    };
  }, [enabled, threadId, wsUrl]);

  const api = useMemo(
    () => ({
      sendTyping(isTyping: boolean) {
        transportRef.current?.sendTyping(isTyping);
      },
      sendChatOverWs(message: ChatMessage) {
        transportRef.current?.sendChat(message);
      },
    }),
    []
  );

  return {
    mode: wsUrl ? ("websocket" as const) : ("offline" as const),
    ...api,
  };
}
