"use client";

import { create } from "zustand";

import {
  buildSku,
  buildVariantMatrix,
} from "@/modules/variants/generate-matrix";
import type {
  VariantAttributeDefinition,
  VariantAttributeKind,
  VariantGenerationDefaults,
  VariantRow,
} from "@/modules/variants/types";

function genAttrId() {
  return `attr_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

type VariantWorkbenchState = {
  productId: string | null;
  skuPrefix: string;
  attributes: VariantAttributeDefinition[];
  variants: VariantRow[];
  replaceWorkbench: (payload: {
    productId: string;
    skuPrefix?: string;
    attributes: VariantAttributeDefinition[];
    variants: VariantRow[];
  }) => void;
  upsertVariant: (variant: VariantRow) => void;
  setSkuPrefix: (v: string) => void;
  addAttribute: (name: string, kind: VariantAttributeKind) => void;
  removeAttribute: (id: string) => void;
  renameAttribute: (id: string, name: string) => void;
  setAttributeKind: (id: string, kind: VariantAttributeKind) => void;
  setAttributeValues: (id: string, values: string[]) => void;
  addValueToAttribute: (attrId: string, value: string) => void;
  removeValueFromAttribute: (attrId: string, value: string) => void;
  generateMatrix: (defaults: VariantGenerationDefaults) => void;
  setAttributeValueIdMap: (attrId: string, valueIdMap: Record<string, string>) => void;
  remapAttributeId: (oldId: string, newId: string) => void;
  updateVariant: (id: string, patch: Partial<VariantRow>) => void;
  removeVariant: (id: string) => void;
  bulkUpdateVariants: (
    ids: string[],
    patch: Partial<
      Pick<
        VariantRow,
        | "moq"
        | "stock"
        | "price"
        | "weightGrams"
        | "lengthCm"
        | "widthCm"
        | "heightCm"
        | "barcode"
      >
    >
  ) => void;
  regenerateSkus: () => void;
  resetWorkbench: () => void;
};

export const useVariantWorkbenchStore = create<VariantWorkbenchState>()(
  (set, get) => ({
    productId: null,
    skuPrefix: "",
    attributes: [],
    variants: [],

    replaceWorkbench: ({ productId, skuPrefix, attributes, variants }) =>
      set({
        productId,
        skuPrefix: skuPrefix ?? "",
        attributes,
        variants,
      }),

    upsertVariant: (variant) =>
      set((s) => {
        const i = s.variants.findIndex((v) => v.id === variant.id);
        if (i < 0) return { variants: [...s.variants, variant] };
        const next = [...s.variants];
        next[i] = variant;
        return { variants: next };
      }),

    setSkuPrefix: (v) => set({ skuPrefix: v }),

    addAttribute: (name, kind) =>
      set((s) => ({
        attributes: [
          ...s.attributes,
          {
            id: genAttrId(),
            name: name.trim() || "Attribute",
            kind,
            values: [],
          },
        ],
      })),

    removeAttribute: (id) =>
      set((s) => ({
        attributes: s.attributes.filter((a) => a.id !== id),
      })),

    renameAttribute: (id, name) =>
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === id ? { ...a, name: name.trim() } : a
        ),
      })),

    setAttributeKind: (id, kind) =>
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === id ? { ...a, kind } : a
        ),
      })),

    setAttributeValues: (id, values) =>
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === id
            ? {
                ...a,
                values: [
                  ...new Set(values.map((v) => v.trim()).filter(Boolean)),
                ],
              }
            : a
        ),
      })),

    addValueToAttribute: (attrId, value) => {
      const v = value.trim();
      if (!v) return;
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === attrId && !a.values.includes(v)
            ? { ...a, values: [...a.values, v] }
            : a
        ),
      }));
    },

    removeValueFromAttribute: (attrId, value) =>
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === attrId
            ? { ...a, values: a.values.filter((x) => x !== value) }
            : a
        ),
      })),

    generateMatrix: (defaults) => {
      const { attributes, skuPrefix } = get();
      const rows = buildVariantMatrix(attributes, skuPrefix, defaults);
      set({ variants: rows });
    },

    setAttributeValueIdMap: (attrId: string, valueIdMap: Record<string, string>) =>
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === attrId ? { ...a, valueIdMap: { ...(a.valueIdMap ?? {}), ...valueIdMap } } : a
        ),
      })),

    remapAttributeId: (oldId: string, newId: string) =>
      set((s) => ({
        attributes: s.attributes.map((a) =>
          a.id === oldId ? { ...a, id: newId } : a
        ),
        variants: s.variants.map((r) => {
          if (!(oldId in r.combo)) return r;
          const { [oldId]: value, ...restCombo } = r.combo;
          return { ...r, combo: { ...restCombo, [newId]: value } };
        }),
      })),

    updateVariant: (id, patch) =>
      set((s) => ({
        variants: s.variants.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      })),

    removeVariant: (id) =>
      set((s) => ({
        variants: s.variants.filter((r) => r.id !== id),
      })),

    bulkUpdateVariants: (ids, patch) => {
      const idSet = new Set(ids);
      set((s) => ({
        variants: s.variants.map((r) =>
          idSet.has(r.id) ? { ...r, ...patch } : r
        ),
      }));
    },

    regenerateSkus: () => {
      const { variants, skuPrefix, attributes } = get();
      const order = attributes.map((a) => a.id);
      set({
        variants: variants.map((r, idx) => {
          const tuple = order.map((id) => r.combo[id] ?? "").filter(Boolean);
          return {
            ...r,
            sku: buildSku(skuPrefix, tuple, idx),
          };
        }),
      });
    },

    resetWorkbench: () =>
      set({
        productId: null,
        skuPrefix: "",
        attributes: [],
        variants: [],
      }),
  })
);
