"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn } from "lucide-react";

import { VendorSidebarDesktop } from "@/components/navigation/vendor-sidebar";
import { VendorSidebarNav } from "@/components/navigation/vendor-sidebar-nav";
import { VendorTopNav } from "@/components/navigation/vendor-top-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useVendorKeyboardShortcuts } from "@/hooks/use-vendor-keyboard";
import { useUiShellStore } from "@/store/sidebar-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

function VendorAuthOverlay({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div
      className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="bg-card/90 shadow-vendor-card border-border/60 flex flex-col items-center gap-4 rounded-2xl border p-8 ring-1 ring-white/5 backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-muted/50 flex size-12 items-center justify-center rounded-full">
          <LogIn className="text-muted-foreground size-5" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold">Your session has expired</p>
          <p className="text-muted-foreground text-xs">
            Please sign in again to continue
          </p>
        </div>
        <Button onClick={onLogin} className="mt-1">
          <LogIn className="size-4" />
          Log in again
        </Button>
      </motion.div>
    </motion.div>
  );
}

export function VendorShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const loadVendorProfile = useVendorProfileStore((s) => s.load);
  const { status, user, isVendor, logout } = useAuth();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    void loadVendorProfile();
  }, [loadVendorProfile]);

  // Delay showing the overlay slightly so transient loading states don't flash.
  useEffect(() => {
    if (status === "unauthenticated" || !user || !isVendor) {
      const id = window.setTimeout(() => setShowOverlay(true), 800);
      return () => window.clearTimeout(id);
    }
    setShowOverlay(false);
  }, [status, user, isVendor]);

  const handleLogin = useCallback(() => {
    void logout().then(() => {
      window.location.href = "/login";
    });
  }, [logout]);

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
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-1 flex-col">
            {children}
            <AnimatePresence>
              {showOverlay && status !== "loading" && status !== "idle" && (
                <VendorAuthOverlay onLogin={handleLogin} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
