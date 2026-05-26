"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { VENDOR_MAIN_NAV } from "@/constants/navigation";
import {
  selectUnreadCount,
  useNotificationsStore,
} from "@/store/notifications-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVendorPermissions } from "@/hooks/use-vendor-permissions";

type VendorSidebarNavProps = {
  collapsed: boolean;
  onNavigate?: () => void;
};

export function VendorSidebarNav({
  collapsed,
  onNavigate,
}: VendorSidebarNavProps) {
  const pathname = usePathname();
  const notifUnread = useNotificationsStore(selectUnreadCount);
  const { can } = useVendorPermissions();

  const navItems = VENDOR_MAIN_NAV.filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <nav className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      <div className="pointer-events-none absolute top-4 bottom-4 left-0 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent" />

      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        const link = (
          <Link
            href={item.href}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/[0.12] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {active && (
              <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            )}

            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground/70 group-hover:text-foreground/80"
              )}
            />
            {!collapsed ? (
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{item.label}</span>
                {item.href === "/notifications" && notifUnread > 0 ? (
                  <Badge
                    variant="secondary"
                    className="h-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums bg-primary/15 text-primary border-primary/20"
                  >
                    {notifUnread > 99 ? "99+" : notifUnread}
                  </Badge>
                ) : null}
              </span>
            ) : null}
          </Link>
        );

        if (!collapsed) {
          return (
            <div key={item.href} className="w-full">
              {link}
            </div>
          );
        }

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger className="flex w-full justify-center rounded-xl">
              {link}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
