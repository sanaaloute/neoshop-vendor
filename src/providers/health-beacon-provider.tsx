"use client";

import { useEffect } from "react";

import { useHealthCheck } from "@/hooks/use-health-check";
import { getOrCreateDeviceId } from "@/lib/get-device-id";
import { useAuthStore } from "@/store/auth-store";

const BEACON_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const APP_VERSION = "0.1.0";

export function HealthBeaconProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { beacon } = useHealthCheck();
  const authenticated = useAuthStore((s) => s.status === "authenticated");

  useEffect(() => {
    if (!authenticated) return;

    // The current gateway health beacon DTO only accepts "ios" / "android".
    // Skip the heartbeat on web until the backend supports a "web" platform.
    const PLATFORM = "web";
    if (PLATFORM === "web") return;

    const send = () => {
      void beacon(PLATFORM, APP_VERSION, getOrCreateDeviceId());
    };

    send();
    const id = window.setInterval(send, BEACON_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [authenticated, beacon]);

  return children;
}
