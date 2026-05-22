"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProductFormValues } from "@/modules/products/types";

type EditorDraftState = {
  /** Local autosave bucket keyed by `new` or product id */
  drafts: Record<string, ProductFormValues>;
  setDraft: (key: string, values: ProductFormValues) => void;
  getDraft: (key: string) => ProductFormValues | undefined;
  clearDraft: (key: string) => void;
};

export const useProductEditorDraftStore = create<EditorDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      setDraft: (key, values) =>
        set((s) => ({
          drafts: { ...s.drafts, [key]: values },
        })),

      getDraft: (key) => get().drafts[key],

      clearDraft: (key) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[key];
          return { drafts: next };
        }),
    }),
    {
      name: "neoshop-vendor-product-editor-drafts",
      version: 1,
    }
  )
);
