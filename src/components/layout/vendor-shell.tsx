"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { VendorSidebarDesktop } from "@/components/navigation/vendor-sidebar";
import { VendorSidebarNav } from "@/components/navigation/vendor-sidebar-nav";
import { VendorTopNav } from "@/components/navigation/vendor-top-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useVendorKeyboardShortcuts } from "@/hooks/use-vendor-keyboard";
import { useUiShellStore } from "@/store/sidebar-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

export function VendorShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const loadVendorProfile = useVendorProfileStore((s) => s.load);

  useEffect(() => {
    void loadVendorProfile();
  }, [loadVendorProfile]);

  const onToggleSidebar = useCallback(() => {
    useUiShellStore.getState().toggleSidebarCollapsed();
  }, []);

  const onFocusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  useVendorKeyboardShortcuts({
    onToggleSidebar: onToggleSidebar,
    onFocusSearch: onFocusSearch,
  });

  return (
    <div className="flex min-h-dvh w-full">
      <VendorSidebarDesktop />
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(20rem,100vw)] p-0"
          showCloseButton
        >
          <div className="border-border/60 flex h-14 items-center border-b px-4 text-sm font-semibold tracking-tight">
            NeoShop Vendor
          </div>
          <VendorSidebarNav
            collapsed={false}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <VendorTopNav
          searchRef={searchRef}
          onOpenMobileSidebar={() => setMobileNavOpen(true)}
        />
        <motion.div
          className="flex flex-1 flex-col overflow-auto"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-1 flex-col">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
