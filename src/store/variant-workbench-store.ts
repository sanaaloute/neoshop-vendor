"use client";

import { create } from "zustand";

import { buildVariantMatrix } from "@/modules/variants/generate-matrix";
import type {
  VariantAttributeDefinition,
  VariantAttributeKind,
  VariantGenerationDefaults,
  VariantRow,
} from "@/modules/variants/types";
import type { ProductMedia } from "@/modules/products/types";

function genAttrId() {
  return `attr_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

type VariantWorkbenchState = {
  productId: string | null;
  attributes: VariantAttributeDefinition[];
  variants: VariantRow[];
  productImages: ProductMedia[];
  replaceWorkbench: (payload: {
    productId: string;
    attributes: VariantAttributeDefinition[];
    variants: VariantRow[];
    productImages?: ProductMedia[];
  }) => void;
  upsertVariant: (variant: VariantRow) => void;
  addAttribute: (name: string, kind: VariantAttributeKind) => string;
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
  resetWorkbench: () => void;
};

export const useVariantWorkbenchStore = create<VariantWorkbenchState>()(
  (set, get) => ({
    productId: null,
    attributes: [],
    variants: [],
    productImages: [],

    replaceWorkbench: ({ productId, attributes, variants, productImages }) =>
      set({
        productId,
        attributes,
        variants,
        productImages: productImages ?? [],
      }),

    upsertVariant: (variant) =>
      set((s) => {
        const i = s.variants.findIndex((v) => v.id === variant.id);
        if (i < 0) return { variants: [...s.variants, variant] };
        const next = [...s.variants];
        next[i] = variant;
        return { variants: next };
      }),

    addAttribute: (name, kind) => {
      const id = genAttrId();
      set((s) => ({
        attributes: [
          ...s.attributes,
          {
            id,
            name: name.trim() || "Attribute",
            kind,
            values: [],
          },
        ],
      }));
      return id;
    },

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
      const { attributes } = get();
      const rows = buildVariantMatrix(attributes, defaults);
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

    resetWorkbench: () =>
      set({
        productId: null,
        attributes: [],
        variants: [],
        productImages: [],
      }),
  })
);
