"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { VendorSocket } from "./create-socket";

/** Socket instance only — connection phase lives in `useRealtimeStore`. */
export type RealtimeContextValue = {
  socket: VendorSocket | null;
};

export const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
});

export function useRealtimeContext(): RealtimeContextValue {
  return useContext(RealtimeContext);
}

export function RealtimeContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: RealtimeContextValue;
}) {
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
