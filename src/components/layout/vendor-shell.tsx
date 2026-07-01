"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";

import { LoadingState } from "@/components/layout/loading-state";
import { VendorSidebarDesktop } from "@/components/navigation/vendor-sidebar";
import { VendorSidebarNav } from "@/components/navigation/vendor-sidebar-nav";
import { VendorTopNav } from "@/components/navigation/vendor-top-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useVendorKeyboardShortcuts } from "@/hooks/use-vendor-keyboard";
import { vendorNeedsOnboarding } from "@/lib/vendor-lifecycle";
import { useUiShellStore } from "@/store/sidebar-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

export function VendorShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("metadata");
  const loadVendorProfile = useVendorProfileStore((s) => s.load);
  const profile = useVendorProfileStore((s) => s.profile);
  const profileFetched = useVendorProfileStore((s) => s.fetched);
  const { status, user, isVendor, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" || pathname.startsWith("/login/");

  // Load the vendor profile only once we know the user is authenticated.
  useEffect(() => {
    if (isAuthenticated) {
      void loadVendorProfile();
    }
  }, [isAuthenticated, loadVendorProfile]);

  // Redirect to login when unauthenticated instead of showing an overlay card.
  useEffect(() => {
    if (isLoading) return;
    if ((!isAuthenticated || !isVendor) && !isAuthPage) {
      // eslint-disable-next-line no-console
      console.log(
        "[VendorShell] redirecting to login, status:",
        status,
        "user:",
        !!user,
        "isVendor:",
        isVendor,
        "pathname:",
        pathname
      );
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isVendor, isAuthPage, status, user, pathname, router]);

  // Redirect authenticated vendors to onboarding when they do not have a
  // completed profile. Onboarding is mandatory before accessing the dashboard.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !isVendor) return;
    if (!profileFetched) return;

    const isOnboardingPage =
      pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    if (isOnboardingPage) return;

    if (vendorNeedsOnboarding(profile)) {
      // eslint-disable-next-line no-console
      console.log(
        "[VendorShell] redirecting to onboarding, profile status:",
        profile?.status ?? "no_profile"
      );
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, isVendor, profile, profileFetched, pathname, router]);

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

  // Do not render the protected shell until authentication is confirmed.
  // This prevents unauthenticated users from seeing any dashboard content
  // while the client-side token bundle is being bootstrapped.
  if (isLoading) {
    return <LoadingState variant="fullscreen" />;
  }

  if ((!isAuthenticated || !isVendor) && !isAuthPage) {
    // Redirect is in progress; keep the screen blanked out so there is no
    // flash of protected UI before the router navigates to /login.
    return <LoadingState variant="fullscreen" />;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <VendorSidebarDesktop />
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(20rem,100vw)] p-0"
          showCloseButton
        >
          <div className="border-border/60 flex h-14 items-center border-b px-4">
            <img
              src="/logo-small.png"
              alt={t("title")}
              className="h-6 w-auto select-none"
            />
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
          <div className="flex flex-1 flex-col">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
