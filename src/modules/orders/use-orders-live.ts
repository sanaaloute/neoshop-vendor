"use client";

/**
 * Stable key for list re-renders. Realtime order updates use Socket.IO and
 * `GET /orders/vendor` / `GET /orders/:id` — no simulated timer.
 */
export function useOrdersLive() {
  return { liveKey: "orders" };
}
