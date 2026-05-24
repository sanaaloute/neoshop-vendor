"use client";

import { useEffect } from "react";

import { getCategoryTree } from "@/services/vendor/categories-api";
import { useCategoriesStore } from "@/store/categories-store";

/** Loads category tree once into global store; returns cached categories on subsequent calls. */
export function useCategories() {
  const categories = useCategoriesStore((s) => s.categories);
  const setCategories = useCategoriesStore((s) => s.setCategories);

  useEffect(() => {
    if (categories.length > 0) return;
    let cancelled = false;
    getCategoryTree()
      .then((rows) => {
        if (!cancelled) setCategories(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load categories:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [categories.length, setCategories]);

  return categories;
}
