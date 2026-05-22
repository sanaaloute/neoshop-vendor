"use client";

import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from "socket.io-client";

import { getSocketIoUrl } from "@/config/realtime";

const defaultOptions: Partial<ManagerOptions & SocketOptions> = {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 10_000,
  randomizationFactor: 0.5,
  timeout: 20_000,
  autoConnect: false,
};

export type VendorSocket = Socket;

export function createVendorSocket(
  accessToken: string | null
): VendorSocket | null {
  const url = getSocketIoUrl();
  if (!url) return null;

  const socket = io(url, {
    ...defaultOptions,
    auth: { token: accessToken ?? undefined },
  });

  return socket;
}
