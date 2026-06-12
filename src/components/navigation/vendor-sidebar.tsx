"use client";

import { motion } from "framer-motion";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useTranslations } from "next-intl";

import { VendorSidebarNav } from "@/components/navigation/vendor-sidebar-nav";
import { Button } from "@/components/ui/button";
import { useUiShellStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";

export function VendorSidebarDesktop({ className }: { className?: string }) {
  const collapsed = useUiShellStore((s) => s.sidebarCollapsed);
  const toggle = useUiShellStore((s) => s.toggleSidebarCollapsed);
  const t = useTranslations("navigation");

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 268 }}
      transition={{ type: "spring", stiffness: 420, damping: 38 }}
      className={cn(
        "border-border/70 bg-card/45 shadow-vendor-card relative z-20 hidden shrink-0 flex-col border-r backdrop-blur-xl md:flex",
        className
      )}
    >
      <div className="border-border/50 flex h-14 shrink-0 items-center border-b px-3">
        {collapsed ? (
          <img
            src="/logo.png"
            alt={t("brandName")}
            className="mx-auto h-8 w-8 select-none"
          />
        ) : (
          <img
            src="/logo-small.png"
            alt={t("brandNameFull")}
            className="h-6 w-auto select-none"
          />
        )}
      </div>
      <VendorSidebarNav collapsed={collapsed} />
      <div className="border-border/50 mt-auto shrink-0 border-t p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn("w-full", collapsed && "mx-auto")}
          onClick={toggle}
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          title={
            collapsed
              ? t("expandSidebarShortcut")
              : t("collapseSidebarShortcut")
          }
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
