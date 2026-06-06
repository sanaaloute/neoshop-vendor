"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationsPanel } from "@/modules/notifications/notifications-panel";
import {
  selectUnreadCount,
  useNotificationsStore,
} from "@/store/notifications-store";
import { cn } from "@/lib/utils";

export function VendorNotificationsMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  const unread = useNotificationsStore(selectUnreadCount);

  return (
    <>
      <button
        type="button"
        className={cn(
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 relative inline-flex size-9 items-center justify-center rounded-lg border border-transparent transition-colors outline-none focus-visible:ring-[3px]",
          className
        )}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        onClick={() => setOpen(true)}
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="bg-primary text-primary-foreground ring-card absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ring-2">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <SheetHeader className="border-border/60 border-b px-4 py-3 text-left">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription className="text-xs">
              Recent alerts for your shop.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <NotificationsPanel variant="compact" className="min-h-0 flex-1" />
            <Link
              href="/notifications"
              className="text-primary hover:bg-muted/40 mt-4 block rounded-lg py-2 text-center text-sm font-medium hover:underline"
              onClick={() => setOpen(false)}
            >
              Open notification center
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
