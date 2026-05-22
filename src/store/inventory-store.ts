"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  InventoryLine,
  StockMovement,
  StockMovementType,
  Warehouse,
} from "@/modules/inventory/types";

function nowIso() {
  return new Date().toISOString();
}

function movId() {
  return `mov_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

type InventoryState = {
  pulse: number;
  warehouses: Warehouse[];
  lines: InventoryLine[];
  movements: StockMovement[];
  replaceInventory: (payload: {
    warehouses: Warehouse[];
    lines: InventoryLine[];
    movements?: StockMovement[];
  }) => void;
  /** Legacy hook compatibility — no simulated drift. */
  tickRealtime: () => void;
  adjustStock: (
    lineId: string,
    delta: number,
    type: StockMovementType,
    note?: string
  ) => void;
  resetInventoryDemo: () => void;
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      pulse: 0,
      warehouses: [],
      lines: [],
      movements: [],

      replaceInventory: ({ warehouses, lines, movements }) =>
        set((s) => ({
          warehouses,
          lines,
          movements: movements ?? s.movements,
        })),

      tickRealtime: () => {},

      adjustStock: (lineId, delta, type, note) =>
        set((s) => {
          const lines = s.lines.map((l) => {
            if (l.id !== lineId) return l;
            const onHand = Math.max(0, l.onHand + delta);
            return { ...l, onHand };
          });
          const line = lines.find((l) => l.id === lineId);
          if (!line) return s;
          const movement: StockMovement = {
            id: movId(),
            at: nowIso(),
            type,
            sku: line.sku,
            productName: line.productName,
            warehouseId: line.warehouseId,
            delta,
            balanceAfter: line.onHand,
            note,
          };
          return {
            lines,
            movements: [movement, ...s.movements].slice(0, 300),
          };
        }),

      resetInventoryDemo: () =>
        set({
          pulse: 0,
          warehouses: [],
          lines: [],
          movements: [],
        }),
    }),
    {
      name: "neoshop-vendor-inventory",
      version: 2,
      partialize: (s) => ({
        warehouses: s.warehouses,
        lines: s.lines,
        movements: s.movements,
      }),
    }
  )
);
