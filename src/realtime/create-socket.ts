"use client";

import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from "socket.io-client";

import { getSocketIoUrl, getSocketIoPath } from "@/config/realtime";

const defaultOptions: Partial<ManagerOptions & SocketOptions> = {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 10_000,
  randomizationFactor: 0.5,
  timeout: 20_000,
  autoConnect: false,
  withCredentials: true, // required because CORS credentials=true
};

export type VendorSocket = Socket;

export function createVendorSocket(
  accessToken: string | null
): VendorSocket | null {
  const url = getSocketIoUrl();
  if (!url) return null;

  const token = accessToken
    ? accessToken.startsWith("Bearer ")
      ? accessToken
      : `Bearer ${accessToken}`
    : undefined;

  const socket = io(url, {
    ...defaultOptions,
    path: getSocketIoPath(),
    auth: { token },
  });

  return socket;
}
