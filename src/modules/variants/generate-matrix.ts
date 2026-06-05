import { slugify } from "@/lib/slugify";

import type {
  VariantAttributeDefinition,
  VariantGenerationDefaults,
  VariantRow,
} from "./types";

/** Cartesian product of value lists (each inner array is one axis). */
export function cartesianValues<T>(axes: T[][]): T[][] {
  if (!axes.length) return [];
  return axes.reduce<T[][]>(
    (acc, axis) => acc.flatMap((prefix) => axis.map((v) => [...prefix, v])),
    [[]]
  );
}

function genVariantId() {
  return crypto.randomUUID();
}

export function buildSku(
  skuPrefix: string,
  valueTuple: string[],
  index: number
): string {
  const base = slugify(skuPrefix.trim()) || "sku";
  const part = slugify(valueTuple.join(" ")) || "variant";
  const n = String(index + 1).padStart(3, "0");
  const raw = `${base}-${part}-${n}`;
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw;
}

/**
 * Builds one row per combination of attribute values (full matrix).
 * Skips when any attribute has zero values.
 */
export function buildVariantMatrix(
  definitions: VariantAttributeDefinition[],
  skuPrefix: string,
  defaults: VariantGenerationDefaults
): VariantRow[] {
  if (!definitions.length) return [];
  if (definitions.some((d) => !d.values.length)) return [];

  const tuples = cartesianValues(definitions.map((d) => d.values));

  return tuples.map((vals, idx) => {
    const combo: Record<string, string> = {};
    const selectionIds: string[] = [];
    definitions.forEach((d, i) => {
      const val = vals[i] ?? "";
      combo[d.id] = val;
      const valueId = d.valueIdMap?.[val];
      if (valueId) selectionIds.push(valueId);
    });
    return {
      id: genVariantId(),
      combo,
      selectionIds,
      isLocalOnly: true,
      sku: buildSku(skuPrefix, vals as string[], idx),
      moq: defaults.moq,
      stock: defaults.stock,
      price: defaults.price,
      weightGrams: defaults.weightGrams,
      lengthCm: defaults.lengthCm,
      widthCm: defaults.widthCm,
      heightCm: defaults.heightCm,
      barcode: defaults.barcode.trim(),
    };
  });
}
