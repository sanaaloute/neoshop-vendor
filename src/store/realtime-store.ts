"use client";

import { create } from "zustand";

export type RealtimeUiPhase = "offline" | "connecting" | "live" | "degraded";

type RealtimeStoreState = {
  phase: RealtimeUiPhase;
  /** `NEXT_PUBLIC_SOCKET_IO_URL` is set */
  enabled: boolean;
  setRealtimeConnection: (
    partial: Partial<Pick<RealtimeStoreState, "phase" | "enabled">>
  ) => void;
};

export const useRealtimeStore = create<RealtimeStoreState>((set) => ({
  phase: "offline",
  enabled: false,
  setRealtimeConnection: (partial) => set(partial),
}));
