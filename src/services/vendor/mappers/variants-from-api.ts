import type {
  VariantAttributeDefinition,
  VariantRow,
} from "@/modules/variants/types";

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function attrKind(label: string): VariantAttributeDefinition["kind"] {
  const s = label.toLowerCase();
  if (s.includes("color") || s.includes("colour")) return "color";
  if (s.includes("size")) return "size";
  if (s.includes("type") || s.includes("style")) return "type";
  return "custom";
}

function stableAttrId(raw: Record<string, unknown>, index: number): string {
  return str(raw.id, str(raw.attributeId, str(raw.code, `attr_${index}`)));
}

function attrFromApi(
  row: Record<string, unknown>,
  index: number
): VariantAttributeDefinition {
  const id = stableAttrId(row, index);
  const name = str(
    row.label,
    str(row.name, str(row.code, `Attribute ${index + 1}`))
  );
  const rawValues = Array.isArray(row.values) ? row.values : [];
  const valueIdMap: Record<string, string> = {};
  const values = rawValues
    .map((v) => {
      const item = v as Record<string, unknown>;
      const label = str(item.value, str(item.label, ""));
      const valueId = str(item.id, "");
      if (label && valueId) {
        valueIdMap[label] = valueId;
      }
      return label;
    })
    .filter(Boolean);
  return { id, name, kind: attrKind(name), values: [...new Set(values)], valueIdMap, code: str(row.code, str(row.id, str(row.attributeId, ""))) };
}

function readSelections(row: Record<string, unknown>) {
  const raw = Array.isArray(row.selections) ? row.selections : [];
  return raw.map((s) => s as Record<string, unknown>);
}

export function mapApiProductDetailToVariantWorkbench(
  product: Record<string, unknown>
): {
  attributes: VariantAttributeDefinition[];
  variants: VariantRow[];
  skuPrefix: string;
} {
  const rawAttrs = Array.isArray(product.attributes) ? product.attributes : [];
  const attributes = rawAttrs.map((a, i) =>
    attrFromApi(a as Record<string, unknown>, i)
  );
  const attrByRawValueId = new Map<string, string>();
  for (const attr of attributes) {
    for (const value of attr.values) {
      attrByRawValueId.set(`${attr.id}:${value}`, attr.id);
    }
  }

  // Fallback lookup for flattened selection shapes: "attributeCode:value" → valueId
  const valueIdByCode = new Map<string, string>();
  for (const attr of attributes) {
    const code = attr.code || attr.id;
    for (const [value, valueId] of Object.entries(attr.valueIdMap ?? {})) {
      valueIdByCode.set(`${code}:${value}`, valueId);
    }
  }

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  const variants = rawVariants.map((v, index) => {
    const row = v as Record<string, unknown>;
    const inventory = (row.inventory ?? {}) as Record<string, unknown>;
    const combo: Record<string, string> = {};
    const selectionIds: string[] = [];
    for (const selection of readSelections(row)) {
      const valueRow = (selection.attributeValue ??
        selection.value ??
        {}) as Record<string, unknown>;
      const attrRow = (valueRow.attribute ??
        selection.attribute ??
        {}) as Record<string, unknown>;
      const value = str(valueRow.value, str(selection.value, ""));
      const attrId =
        str(attrRow.id, "") ||
        str(valueRow.attributeId, "") ||
        attrByRawValueId.get(`${str(valueRow.attributeId, "")}:${value}`) ||
        "";
      if (attrId && value) combo[attrId] = value;

      // Primary: nested attributeValue.id
      const valueId = str(valueRow.id, "");
      if (valueId) {
        selectionIds.push(valueId);
      } else {
        // Fallback: flattened { attributeCode, value }
        const attrCode = str(selection.attributeCode, "");
        const selValue = str(selection.value, "");
        if (attrCode && selValue) {
          const fallbackId = valueIdByCode.get(`${attrCode}:${selValue}`);
          if (fallbackId) selectionIds.push(fallbackId);
        }
      }
    }

    const hasRealId = typeof row.id === "string" && row.id.trim().length > 0;

    return {
      id: hasRealId ? String(row.id) : crypto.randomUUID(),
      combo,
      selectionIds,
      isLocalOnly: !hasRealId,
      sku: str(row.sku, `SKU-${index + 1}`),
      moq: Math.max(1, Math.round(num(row.moq, num(product.moq, 1)))),
      stock: Math.max(0, Math.round(num(inventory.quantity, 0))),
      price: num(row.wholesalePrice, 0),
      weightGrams: Math.round(num(row.weightGrams, num(row.weightKg, 0) * 1000)),
      lengthCm: num(row.lengthCm, 0),
      widthCm: num(row.widthCm, 0),
      heightCm: num(row.heightCm, 0),
      barcode: str(row.barcode, ""),
      imageUrl: str(row.imageUrl, ""),
    };
  });

  const firstSku = variants[0]?.sku ?? "";
  const skuPrefix = firstSku.includes("-") ? firstSku.split("-")[0] : "";
  return { attributes, variants, skuPrefix };
}

export function mapApiVariantToVariantRow(
  row: Record<string, unknown>,
  productMoq = 1
): VariantRow {
  const inventory = (row.inventory ?? {}) as Record<string, unknown>;
  const hasRealId = typeof row.id === "string" && row.id.trim().length > 0;
  return {
    id: hasRealId ? String(row.id) : crypto.randomUUID(),
    combo: {},
    isLocalOnly: !hasRealId,
    sku: str(row.sku, "SKU"),
    moq: Math.max(1, Math.round(num(row.moq, productMoq))),
    stock: Math.max(0, Math.round(num(inventory.quantity, 0))),
    price: num(row.wholesalePrice, 0),
    weightGrams: Math.round(num(row.weightGrams, num(row.weightKg, 0) * 1000)),
    lengthCm: num(row.lengthCm, 0),
    widthCm: num(row.widthCm, 0),
    heightCm: num(row.heightCm, 0),
    barcode: str(row.barcode, ""),
    imageUrl: str(row.imageUrl, ""),
  };
}
