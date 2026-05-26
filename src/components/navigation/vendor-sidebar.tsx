"use client";

import { motion } from "framer-motion";

import { VendorSidebarNav } from "@/components/navigation/vendor-sidebar-nav";
import { useUiShellStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";

export function VendorSidebarDesktop({ className }: { className?: string }) {
  const collapsed = useUiShellStore((s) => s.sidebarCollapsed);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ type: "spring", stiffness: 480, damping: 38 }}
      className={cn(
        "border-border/30 bg-sidebar/80 relative z-20 hidden shrink-0 flex-col border-r backdrop-blur-2xl md:flex",
        "dark:border-white/[0.04]",
        className
      )}
    >
      <div className="pointer-events-none absolute top-0 left-0 h-24 w-full bg-gradient-to-b from-primary/[0.06] to-transparent" />

      <div className="border-border/30 relative flex h-14 shrink-0 items-center border-b px-3 dark:border-white/[0.04]">
        {collapsed ? (
          <span className="text-primary mx-auto text-sm font-black tracking-tight select-none text-glow-primary">
            N
          </span>
        ) : (
          <span className="px-2 text-sm font-bold tracking-tight select-none">
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              NeoShop
            </span>
          </span>
        )}
      </div>
      <VendorSidebarNav collapsed={collapsed} />
    </motion.aside>
  );
}
