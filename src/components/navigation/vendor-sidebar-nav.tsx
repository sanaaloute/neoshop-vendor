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
    <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
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
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {active && (
              <span className="absolute top-1/2 left-0 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
            )}

            <Icon
              className={cn(
                "size-5 shrink-0 transition-all",
                active
                  ? "text-primary"
                  : "text-muted-foreground/50 group-hover:text-foreground/70"
              )}
            />
            {!collapsed ? (
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold tracking-wide">{item.label}</span>
                {item.href === "/notifications" && notifUnread > 0 ? (
                  <Badge
                    variant="secondary"
                    className="h-4 shrink-0 justify-center px-1 text-[9px] tabular-nums bg-primary/20 text-primary border-primary/30"
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
            <TooltipTrigger className="flex w-full justify-center rounded-lg">
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
