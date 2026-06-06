"use client";

import { usePathname, Link } from "@/i18n/routing";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { useVendorMainNav } from "@/constants/navigation";
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
  const navItems = useVendorMainNav();
  const notifUnread = useNotificationsStore(selectUnreadCount);
  const { can } = useVendorPermissions();

  const visibleItems = navItems.filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      {visibleItems.map((item, index) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        const link = (
          <Link
            href={item.href as string}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {active && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="bg-primary absolute inset-y-1 left-0 w-0.5 rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
              )}
            />
            {!collapsed ? (
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{item.label}</span>
                {item.href === "/notifications" && notifUnread > 0 ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Badge
                      variant="secondary"
                      className="h-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums"
                    >
                      {notifUnread > 99 ? "99+" : notifUnread}
                    </Badge>
                  </motion.div>
                ) : null}
              </span>
            ) : null}
          </Link>
        );

        if (!collapsed) {
          return (
            <motion.div
              key={item.href}
              className="w-full"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.03,
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {link}
            </motion.div>
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
