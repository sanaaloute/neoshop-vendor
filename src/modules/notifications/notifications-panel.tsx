"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  CreditCard,
  MessageSquare,
  Package,
  Settings2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsRead,
  patchNotification,
} from "@/services/vendor/notifications-api";
import { useNotificationsStore } from "@/store/notifications-store";

import type { NotificationFilter, NotificationRecord } from "./types";

function categoryIcon(cat: NotificationRecord["category"]) {
  switch (cat) {
    case "order":
      return Package;
    case "payout":
      return CreditCard;
    case "dispute":
      return AlertTriangle;
    case "message":
      return MessageSquare;
    default:
      return Settings2;
  }
}

function passesFilter(
  row: NotificationRecord,
  filter: NotificationFilter
): boolean {
  if (filter === "unread") return !row.read;
  if (filter === "orders") return row.category === "order";
  if (filter === "system") return row.category === "system";
  if (filter === "finance")
    return row.category === "payout" || row.category === "dispute";
  return true;
}

const FILTER_TABS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "finance", label: "Finance" },
  { id: "system", label: "System" },
];

type NotificationsPanelProps = {
  variant?: "compact" | "full";
  className?: string;
};

export function NotificationsPanel({
  variant = "compact",
  className,
}: NotificationsPanelProps) {
  const items = useNotificationsStore((s) => s.items);
  const filter = useNotificationsStore((s) => s.filter);
  const setFilter = useNotificationsStore((s) => s.setFilter);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const filtered = useMemo(
    () =>
      [...items]
        .filter((r) => passesFilter(r, filter))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [items, filter]
  );

  const dense = variant === "compact";

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore API errors; still update local state
    }
    markAllRead();
  };

  const handleItemClick = async (id: string) => {
    const row = items.find((x) => x.id === id);
    if (row && !row.read) {
      try {
        await patchNotification(id, { read: true });
      } catch {
        // ignore API errors; still update local state
      }
    }
    markRead(id);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="text-muted-foreground size-4" aria-hidden />
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount} new
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Caught up</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={unreadCount === 0}
          onClick={handleMarkAllRead}
        >
          Mark all read
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-1"
        role="tablist"
        aria-label="Notification filters"
      >
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            size="xs"
            variant={filter === tab.id ? "secondary" : "ghost"}
            className="rounded-full"
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <ScrollArea
        className={cn(
          dense ? "max-h-[min(380px,50vh)]" : "max-h-[min(640px,65vh)]"
        )}
      >
        <ul className={cn("space-y-1 pr-3", dense ? "pb-1" : "pb-2")}>
          {filtered.length === 0 ? (
            <li className="border-border/70 text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
              No notifications for this filter.
            </li>
          ) : (
            filtered.map((row) => {
              const Icon = categoryIcon(row.category);
              const rowClass = cn(
                "flex w-full gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                !row.read && "border-primary/15 bg-primary/5"
              );
              const body = (
                <>
                  <span className="bg-muted/80 flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon
                      className="text-muted-foreground size-4"
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm leading-snug font-medium">
                        {row.title}
                      </span>
                      {!row.read ? (
                        <span className="bg-primary mt-0.5 size-2 shrink-0 rounded-full" />
                      ) : null}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">
                      {row.body}
                    </span>
                    <span className="text-muted-foreground text-[11px] tabular-nums">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={row.id}>
                  {row.href ? (
                    <Link
                      href={row.href}
                      className={rowClass}
                      onClick={() => handleItemClick(row.id)}
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={rowClass}
                      onClick={() => handleItemClick(row.id)}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
