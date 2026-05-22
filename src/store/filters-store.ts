"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Feature areas that can own persisted filter chips / query params */
export type FilterScope =
  | "orders"
  | "inventory"
  | "products"
  | "customers"
  | "analytics"
  | "notifications";

type FiltersState = {
  /** Simple string map per scope (query keys → value) */
  byScope: Record<FilterScope, Record<string, string>>;
  setFilter: (scope: FilterScope, key: string, value: string) => void;
  clearScope: (scope: FilterScope) => void;
  clearKey: (scope: FilterScope, key: string) => void;
};

const emptyScopes = (): Record<FilterScope, Record<string, string>> => ({
  orders: {},
  inventory: {},
  products: {},
  customers: {},
  analytics: {},
  notifications: {},
});

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      byScope: emptyScopes(),
      setFilter: (scope, key, value) =>
        set((s) => ({
          byScope: {
            ...s.byScope,
            [scope]: { ...s.byScope[scope], [key]: value },
          },
        })),
      clearScope: (scope) =>
        set((s) => ({
          byScope: { ...s.byScope, [scope]: {} },
        })),
      clearKey: (scope, key) =>
        set((s) => {
          const next = { ...s.byScope[scope] };
          delete next[key];
          return { byScope: { ...s.byScope, [scope]: next } };
        }),
    }),
    {
      name: "neoshop-vendor-filters",
      partialize: (s) => ({ byScope: s.byScope }),
    }
  )
);
