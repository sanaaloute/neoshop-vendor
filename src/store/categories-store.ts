"use client";

import { create } from "zustand";

import type { Category } from "@/services/vendor/categories-api";

type CategoriesState = {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  getCategoryLabel: (id: string) => string;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  getCategoryLabel: (id) =>
    get().categories.find((c) => c.id === id)?.name ?? id,
}));
