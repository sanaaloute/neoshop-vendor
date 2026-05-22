"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { getSocketIoUrl } from "@/config/realtime";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeStore } from "@/store/realtime-store";

import { RealtimeStoreBridge } from "./bridge";
import { RealtimeContextProvider } from "./context";
import { createVendorSocket } from "./create-socket";
import type { VendorSocket } from "./create-socket";

/**
 * Socket.IO provider with reconnect (built into the client), auth token wiring,
 * and store bridges for notifications / orders / inventory.
 */
export function VendorRealtimeProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setRealtimeConnection = useRealtimeStore(
    (s) => s.setRealtimeConnection
  );

  const [socket, setSocket] = useState<VendorSocket | null>(null);

  useEffect(() => {
    const enabled = Boolean(getSocketIoUrl());
    setRealtimeConnection({
      enabled,
      phase: enabled ? "connecting" : "offline",
    });

    if (!enabled) {
      setSocket(null);
      return;
    }

    const s = createVendorSocket(accessToken);
    if (!s) {
      setRealtimeConnection({ phase: "offline" });
      return;
    }

    const onConnect = () => setRealtimeConnection({ phase: "live" });
    const onDisconnect = (reason: string) => {
      setRealtimeConnection({
        phase: reason === "io client disconnect" ? "offline" : "degraded",
      });
    };
    const onConnErr = () => setRealtimeConnection({ phase: "degraded" });
    const onReconnectAttempt = () =>
      setRealtimeConnection({ phase: "degraded" });
    const onReconnected = () => setRealtimeConnection({ phase: "live" });

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnErr);
    s.io.on("reconnect_attempt", onReconnectAttempt);
    s.io.on("reconnect", onReconnected);

    setSocket(s);
    s.connect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnErr);
      s.io.off("reconnect_attempt", onReconnectAttempt);
      s.io.off("reconnect", onReconnected);
      s.disconnect();
      setSocket(null);
      setRealtimeConnection({ phase: "offline" });
    };
  }, [accessToken, setRealtimeConnection]);

  const value = useMemo(() => ({ socket }), [socket]);

  return (
    <RealtimeContextProvider value={value}>
      <RealtimeStoreBridge />
      {children}
    </RealtimeContextProvider>
  );
}
