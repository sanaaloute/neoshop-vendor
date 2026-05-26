"use client";

import { motion } from "framer-motion";
import { PanelLeft, PanelLeftClose } from "lucide-react";

import { VendorSidebarNav } from "@/components/navigation/vendor-sidebar-nav";
import { Button } from "@/components/ui/button";
import { useUiShellStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";

export function VendorSidebarDesktop({ className }: { className?: string }) {
  const collapsed = useUiShellStore((s) => s.sidebarCollapsed);
  const toggle = useUiShellStore((s) => s.toggleSidebarCollapsed);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 268 }}
      transition={{ type: "spring", stiffness: 420, damping: 38 }}
      className={cn(
        "border-border/40 bg-card/40 relative z-20 hidden shrink-0 flex-col border-r backdrop-blur-2xl md:flex",
        "dark:border-white/[0.06] dark:bg-[hsl(255_30%_8%/0.5)]",
        className
      )}
    >
      <div className="pointer-events-none absolute top-0 left-0 h-20 w-full bg-gradient-to-b from-primary/[0.04] to-transparent" />

      <div className="border-border/40 relative flex h-14 shrink-0 items-center border-b px-3 dark:border-white/[0.05]">
        {collapsed ? (
          <span className="text-primary mx-auto text-xs font-extrabold tracking-tight select-none">
            NS
          </span>
        ) : (
          <span className="text-sm font-semibold tracking-tight select-none">
            <span className="bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              NeoShop
            </span>{" "}
            <span className="text-muted-foreground font-medium">Vendor</span>
          </span>
        )}
      </div>
      <VendorSidebarNav collapsed={collapsed} />
      <div className="border-border/40 relative mt-auto shrink-0 border-t p-2 dark:border-white/[0.05]">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground transition-colors",
            collapsed && "mx-auto"
          )}
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={
            collapsed
              ? "Expand sidebar (⌘B / Ctrl+B)"
              : "Collapse sidebar (⌘B / Ctrl+B)"
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
