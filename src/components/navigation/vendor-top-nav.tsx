"use client";

import type { RefObject } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

import { VendorBreadcrumbs } from "@/components/navigation/vendor-breadcrumbs";
import { VendorNotificationsMenu } from "@/components/navigation/vendor-notifications-menu";
import { VendorProfileMenu } from "@/components/navigation/vendor-profile-menu";
import { VendorQuickActions } from "@/components/navigation/vendor-quick-actions";
import { VendorRealtimeStatus } from "@/components/navigation/vendor-realtime-status";
import { useRealtimeVendorStatus } from "@/realtime/hooks";
import { VendorSearch } from "@/components/navigation/vendor-search";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
        "border-border/60 bg-background/75 shadow-vendor-card sticky top-0 z-30 flex flex-col gap-3 border-b px-3 py-3 backdrop-blur-xl md:px-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
        <VendorSearch ref={searchRef} className="flex-1" />
        <Separator
          orientation="vertical"
          className="hidden h-7 self-stretch lg:block"
        />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <VendorRealtimeStatus
            state={realtimeState}
            className="hidden lg:inline-flex"
          />
          <VendorQuickActions className="hidden md:inline-flex" />
          <VendorNotificationsMenu />
          <VendorProfileMenu />
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto pb-0.5 whitespace-nowrap md:whitespace-normal">
        <VendorBreadcrumbs />
      </div>
    </motion.header>
  );
}
