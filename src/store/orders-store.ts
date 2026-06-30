"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { VendorOrder } from "@/modules/orders/types";

type OrdersState = {
  orders: VendorOrder[];
  /** Replace list after GET /orders/vendor (gateway). */
  replaceOrders: (orders: VendorOrder[]) => void;
  /** Merge one order (e.g. after GET /orders/:id or Socket.IO). */
  upsertOrder: (order: VendorOrder) => void;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],

      replaceOrders: (orders) => set({ orders }),

      upsertOrder: (order) =>
        set((s) => {
          const i = s.orders.findIndex((o) => o.id === order.id);
          if (i < 0) {
            return { orders: [order, ...s.orders] };
          }
          const next = [...s.orders];
          next[i] = order;
          return { orders: next };
        }),
    }),
    {
      name: "neoshop-vendor-orders",
      version: 3,
      migrate: (persistedState, version) => {
        if (version < 3) {
          const orders = (persistedState as OrdersState | undefined)?.orders;
          if (Array.isArray(orders)) {
            return {
              orders: orders.map((o) => ({
                ...o,
                status:
                  (o.status as string) === "pending"
                    ? "pending_payment"
                    : o.status,
              })),
            };
          }
        }
        return persistedState;
      },
      partialize: (st) => ({ orders: st.orders }),
    }
  )
);
