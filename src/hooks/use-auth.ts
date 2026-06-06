"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/routing";

import { VENDOR_ROLE } from "@/config/auth";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const bootstrap = useAuthStore((s) => s.bootstrap);

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
    needsOnboarding: Boolean(user && !user.onboardingComplete),
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
