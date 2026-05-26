"use client";

import type { RefObject } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

import { VendorNotificationsMenu } from "@/components/navigation/vendor-notifications-menu";
import { VendorProfileMenu } from "@/components/navigation/vendor-profile-menu";
import { VendorQuickActions } from "@/components/navigation/vendor-quick-actions";
import { VendorRealtimeStatus } from "@/components/navigation/vendor-realtime-status";
import { useRealtimeVendorStatus } from "@/realtime/hooks";
import { VendorSearch } from "@/components/navigation/vendor-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VendorTopNavProps = {
  searchRef: RefObject<HTMLInputElement | null>;
  onOpenMobileSidebar: () => void;
  className?: string;
};

export function VendorTopNav({
  searchRef,
  onOpenMobileSidebar,
  className,
}: VendorTopNavProps) {
  const realtimeState = useRealtimeVendorStatus();

  return (
    <motion.header
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "border-border/30 bg-background/50 sticky top-0 z-30 flex items-center gap-4 border-b px-4 py-2.5 backdrop-blur-2xl md:px-6",
        "dark:border-white/[0.04]",
        className
      )}
    >
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground md:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <VendorSearch ref={searchRef} className="flex-1 max-w-xl" />

      <div className="flex items-center justify-end gap-1 sm:gap-2">
        <VendorRealtimeStatus
          state={realtimeState}
          className="hidden lg:inline-flex"
        />
        <VendorQuickActions className="hidden md:inline-flex" />
        <VendorNotificationsMenu />
        <VendorProfileMenu />
      </div>
    </motion.header>
  );
}
