"use client";

import { useEffect } from "react";

import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/services/vendor/notifications-api";
import { useNotificationsStore } from "@/store/notifications-store";

import type { NotificationRecord } from "./types";
import { NotificationsPanel } from "./notifications-panel";

export function NotificationsHome() {
  const loadItems = useNotificationsStore((s) => s.loadItems);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  useEffect(() => {
    listNotifications({ take: 50 })
      .then((res) => {
        const rows: NotificationRecord[] = res.items.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          category: r.category as NotificationRecord["category"],
          read: r.read,
          createdAt: r.createdAt,
          href: r.href ?? undefined,
        }));
        loadItems(rows);
      })
      .catch(() => {
        // silently fail; store remains empty
      });

    getUnreadNotificationCount()
      .then((res) => {
        setUnreadCount(res.count);
      })
      .catch(() => {
        // silently fail
      });
  }, [loadItems, setUnreadCount]);

  return (
    <div className="space-y-6">
      <NotificationsPanel
        variant="full"
        className="border-border/60 bg-card/40 shadow-vendor-card rounded-xl border p-4"
      />
    </div>
  );
}
