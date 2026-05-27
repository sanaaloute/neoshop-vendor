"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { formValuesToProductPatch } from "@/modules/products/types";
import type {
  Product,
  ProductFormValues,
  ProductStatus,
} from "@/modules/products/types";

type CatalogState = {
  products: Product[];
  /** Replace catalog after GET /products/me (gateway). */
  replaceCatalog: (products: Product[]) => void;
  upsertProduct: (product: Product) => void;
  getProduct: (id: string) => Product | undefined;
  addProduct: (values: ProductFormValues) => string;
  updateProduct: (id: string, values: ProductFormValues) => void;
  archiveProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => string | null;
  bulkPatch: (
    ids: string[],
    patch: Partial<{
      status: ProductStatus;
      categoryIds: string[];
    }>
  ) => void;
  resetCatalog: () => void;
};

export const useProductCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: [],

      replaceCatalog: (products) => set({ products }),

      upsertProduct: (product) =>
        set((s) => {
          const i = s.products.findIndex((p) => p.id === product.id);
          if (i < 0) return { products: [product, ...s.products] };
          const next = [...s.products];
          next[i] = product;
          return { products: next };
        }),

      getProduct: (id) => get().products.find((p) => p.id === id),

      addProduct: (values) => {
        const id = `prd_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        const ts = new Date().toISOString();
        const body = formValuesToProductPatch(values);
        set((s) => ({
          products: [
            { id, ...body, createdAt: ts, updatedAt: ts },
            ...s.products,
          ],
        }));
        return id;
      },

      updateProduct: (id, values) => {
        const body = formValuesToProductPatch(values);
        const ts = new Date().toISOString();
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...body, updatedAt: ts } : p
          ),
        }));
      },

      archiveProduct: (id) => {
        const ts = new Date().toISOString();
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? { ...p, status: "archived" as const, updatedAt: ts }
              : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
        }));
      },

      duplicateProduct: (id) => {
        const src = get().products.find((p) => p.id === id);
        if (!src) return null;
        const nid = `prd_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        const ts = new Date().toISOString();
        const copy: Product = {
          ...src,
          id: nid,
          sku: `${src.sku}-COPY`,
          name: `${src.name} (copy)`,
          status: "draft",
          publishAt: null,
          seo: {
            ...src.seo,
            slug: `${src.seo.slug}-copy-${nid.slice(-4)}`,
            metaTitle: `${src.seo.metaTitle} (copy)`,
          },
          media: src.media.map((m, i) => ({
            id: `${m.id}_${nid.slice(-4)}`,
            fileName: m.fileName,
            sortIndex: i,
            url: m.url,
          })),
          createdAt: ts,
          updatedAt: ts,
        };
        set((s) => ({ products: [copy, ...s.products] }));
        return nid;
      },

      bulkPatch: (ids, patch) => {
        const ts = new Date().toISOString();
        const idSet = new Set(ids);
        set((s) => ({
          products: s.products.map((p) => {
            if (!idSet.has(p.id)) return p;
            return {
              ...p,
              ...(patch.status !== undefined ? { status: patch.status } : {}),
              ...(patch.categoryIds !== undefined
                ? { categoryIds: patch.categoryIds }
                : {}),
              updatedAt: ts,
            };
          }),
        }));
      },

      resetCatalog: () => set({ products: [] }),
    }),
    {
      name: "neoshop-vendor-product-catalog",
      version: 2,
    }
  )
);
