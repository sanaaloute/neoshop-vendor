import { create } from "zustand";

import type {
  NotificationFilter,
  NotificationRecord,
} from "@/modules/notifications/types";

type NotificationsState = {
  items: NotificationRecord[];
  filter: NotificationFilter;
  unreadCount: number;
  /** IDs that have already contributed to unreadCount. Prevents double-counting
   *  when the same notification arrives through multiple channels (Socket.IO + WS). */
  countedUnreadIds: Set<string>;
  seedIfEmpty: (rows: NotificationRecord[]) => void;
  loadItems: (rows: NotificationRecord[]) => void;
  ingestPush: (row: NotificationRecord) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setFilter: (f: NotificationFilter) => void;
  setUnreadCount: (n: number) => void;
};

function dedupeMerge(items: NotificationRecord[], row: NotificationRecord) {
  const i = items.findIndex((x) => x.id === row.id);
  if (i >= 0) {
    const next = [...items];
    next[i] = row;
    return next;
  }
  return [row, ...items];
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  filter: "all",
  unreadCount: 0,
  countedUnreadIds: new Set(),

  seedIfEmpty(rows) {
    if (get().items.length > 0) return;
    set({ items: rows });
  },

  loadItems(rows) {
    set({ items: rows });
  },

  ingestPush(row) {
    set((s) => {
      const exists = s.items.find((x) => x.id === row.id);
      const wasRead = exists?.read ?? true;
      const alreadyCounted = s.countedUnreadIds.has(row.id);
      const shouldCount = wasRead && !alreadyCounted;
      const nextCounted = new Set(s.countedUnreadIds);
      if (shouldCount) nextCounted.add(row.id);
      return {
        items: dedupeMerge(s.items, { ...row, read: false }),
        unreadCount: shouldCount ? s.unreadCount + 1 : s.unreadCount,
        countedUnreadIds: nextCounted,
      };
    });
  },

  markRead(id) {
    set((s) => {
      const item = s.items.find((x) => x.id === id);
      const wasUnread = item && !item.read;
      const nextCounted = new Set(s.countedUnreadIds);
      nextCounted.delete(id);
      return {
        items: s.items.map((x) => (x.id === id ? { ...x, read: true } : x)),
        unreadCount: wasUnread
          ? Math.max(0, s.unreadCount - 1)
          : s.unreadCount,
        countedUnreadIds: nextCounted,
      };
    });
  },

  markAllRead() {
    set((s) => ({
      items: s.items.map((x) => ({ ...x, read: true })),
      unreadCount: 0,
      countedUnreadIds: new Set(),
    }));
  },

  setFilter(f) {
    set({ filter: f });
  },

  setUnreadCount(n) {
    set({ unreadCount: n });
  },
}));

export function selectUnreadCount(state: NotificationsState): number {
  return state.items.filter((x) => !x.read).length;
}
