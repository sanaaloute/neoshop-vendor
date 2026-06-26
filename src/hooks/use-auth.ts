"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/routing";

import { VENDOR_ROLE } from "@/config/auth";
import { vendorNeedsOnboarding } from "@/lib/vendor-lifecycle";
import { useAuthStore } from "@/store/auth-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  const profile = useVendorProfileStore((s) => s.profile);
  const profileFetched = useVendorProfileStore((s) => s.fetched);

  const needsOnboarding =
    status === "authenticated" &&
    profileFetched &&
    vendorNeedsOnboarding(profile);

  return {
    accessToken,
    user,
    status,
    login,
    register,
    logout,
    bootstrap,
    isLoading: status === "loading" || status === "idle",
    isAuthenticated: status === "authenticated" && Boolean(user),
    isVendor: user?.role === VENDOR_ROLE,
    needsOnboarding,
  };
}

export function useRequireVendor() {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, isVendor, needsOnboarding } = useAuth();

  useEffect(() => {
    if (status === "loading" || status === "idle") return;
    if (!user || !isVendor) {
      router.replace("/login");
      return;
    }
    if (needsOnboarding && !pathname.startsWith("/onboarding")) {
      router.replace("/onboarding");
    }
  }, [status, user, isVendor, needsOnboarding, pathname, router]);
}
