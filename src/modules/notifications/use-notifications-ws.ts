"use client";

import { useEffect } from "react";

import { getNotificationsWsUrl } from "@/config/notifications";
import { useNotificationsStore } from "@/store/notifications-store";

import type { NotificationRecord } from "./types";

/**
 * Connects to {@link NEXT_PUBLIC_NOTIFICATIONS_WS_URL} when set.
 * No REST inbox exists yet — without WS the inbox stays empty.
 */
export function useNotificationsRealtime() {
  const ingestPush = useNotificationsStore((s) => s.ingestPush);

  const url = getNotificationsWsUrl();

  useEffect(() => {
    if (!url) return;

    let ws: WebSocket | null = null;
    let attempts = 0;
    let reconnectTimer: number | undefined;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as Record<string, unknown>;
          if (data.type === "notification" && data.payload) {
            ingestPush(data.payload as NotificationRecord);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (attempts < 10) {
          const delay = Math.min(30_000, 700 * 2 ** attempts);
          attempts += 1;
          reconnectTimer = window.setTimeout(connect, delay) as number;
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onopen = () => {
        attempts = 0;
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [url, ingestPush]);
}
