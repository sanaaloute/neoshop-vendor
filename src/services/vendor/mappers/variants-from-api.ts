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

function idStr(v: unknown, fallback = ""): string {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function attrKind(label: string): VariantAttributeDefinition["kind"] {
  const s = label.toLowerCase();
  if (s.includes("color") || s.includes("colour")) return "color";
  if (s.includes("size")) return "size";
  if (s.includes("type") || s.includes("style")) return "type";
  return "custom";
}

function stableAttrId(raw: Record<string, unknown>, index: number): string {
  return idStr(raw.id, idStr(raw.attributeId, `attr_${index}`));
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
      const valueId = idStr(item.id, "");
      if (label && valueId) {
        valueIdMap[label] = valueId;
      }
      return label;
    })
    .filter(Boolean);
  return { id, name, kind: attrKind(name), values: [...new Set(values)], valueIdMap, code: idStr(row.code, idStr(row.id, idStr(row.attributeId, ""))) };
}

function readSelections(row: Record<string, unknown>) {
  const raw = Array.isArray(row.selections) ? row.selections : [];
  return raw.map((s) => s as Record<string, unknown>);
}

function reconstructAttributesFromVariants(
  rawVariants: unknown[]
): VariantAttributeDefinition[] {
  const attrMap = new Map<
    string,
    {
      id: string;
      code: string;
      label: string;
      values: Map<string, string>;
    }
  >();

  for (const v of rawVariants) {
    const row = v as Record<string, unknown>;
    for (const selection of readSelections(row)) {
      const valueRow = (selection.attributeValue ??
        selection.value ??
        {}) as Record<string, unknown>;
      const attrRow = (valueRow.attribute ??
        selection.attribute ??
        {}) as Record<string, unknown>;

      const attrId =
        idStr(attrRow.id, "") ||
        idStr(valueRow.attributeId, "") ||
        idStr(selection.attributeCode, "") ||
        "";
      if (!attrId) continue;

      const attrCode =
        str(attrRow.code, "") ||
        str(selection.attributeCode, "") ||
        attrId;
      const attrLabel = str(attrRow.label, str(attrRow.name, attrCode));
      const valueId = idStr(valueRow.id, "");
      const valueLabel = str(valueRow.value, str(selection.value, ""));
      if (!valueLabel) continue;

      let entry = attrMap.get(attrId);
      if (!entry) {
        entry = { id: attrId, code: attrCode, label: attrLabel, values: new Map() };
        attrMap.set(attrId, entry);
      }
      if (valueId) {
        entry.values.set(valueLabel, valueId);
      } else if (!entry.values.has(valueLabel)) {
        entry.values.set(valueLabel, "");
      }
    }
  }

  return Array.from(attrMap.values()).map((entry) => {
    const valueIdMap: Record<string, string> = {};
    const values: string[] = [];
    for (const [label, id] of entry.values) {
      values.push(label);
      if (id) valueIdMap[label] = id;
    }
    return {
      id: entry.id,
      name: entry.label,
      kind: attrKind(entry.label),
      values: [...new Set(values)],
      valueIdMap,
      code: entry.code,
    };
  });
}

export function mapApiProductDetailToVariantWorkbench(
  product: Record<string, unknown>
): {
  attributes: VariantAttributeDefinition[];
  variants: VariantRow[];
  skuPrefix: string;
} {
  const rawAttrs = Array.isArray(product.attributes) ? product.attributes : [];
  let attributes = rawAttrs.map((a, i) =>
    attrFromApi(a as Record<string, unknown>, i)
  );

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];

  // If the top-level attributes array is empty or missing, reconstruct
  // attribute definitions by scanning every variant selection.
  if (attributes.length === 0 && rawVariants.length > 0) {
    attributes = reconstructAttributesFromVariants(rawVariants);
  }

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

  // Reverse lookup: backend value UUID → { attrId, displayValue }
  const valueIdToAttrValue = new Map<string, { attrId: string; value: string }>();
  for (const attr of attributes) {
    for (const [value, valueId] of Object.entries(attr.valueIdMap ?? {})) {
      valueIdToAttrValue.set(valueId, { attrId: attr.id, value });
    }
  }

  const variants = rawVariants.map((v, index) => {
    const row = v as Record<string, unknown>;
    const inventory = (row.inventory ?? {}) as Record<string, unknown>;
    const combo: Record<string, string> = {};
    const selectionIds: string[] = [];

    // 1. Nested / flattened selections (full object shape)
    for (const selection of readSelections(row)) {
      const valueRow = (selection.attributeValue ??
        selection.value ??
        {}) as Record<string, unknown>;
      const attrRow = (valueRow.attribute ??
        selection.attribute ??
        {}) as Record<string, unknown>;
      const value = str(valueRow.value, str(selection.value, ""));
      const attrId =
        idStr(attrRow.id, "") ||
        idStr(valueRow.attributeId, "") ||
        attrByRawValueId.get(`${idStr(valueRow.attributeId, "")}:${value}`) ||
        "";
      if (attrId && value) combo[attrId] = value;

      // Primary: nested attributeValue.id
      const valueId = idStr(valueRow.id, "");
      if (valueId) {
        selectionIds.push(valueId);
      } else {
        // Fallback: flattened { attributeCode, value }
        const attrCode = str(selection.attributeCode, "");
        const selValue = str(selection.value, "");
        if (attrCode && selValue) {
          // Also populate combo when we only have a flat code+value
          const attr = attributes.find(
            (a) => a.code === attrCode || a.name.toLowerCase() === attrCode.toLowerCase()
          );
          if (attr) combo[attr.id] = selValue;

          const fallbackId = valueIdByCode.get(`${attrCode}:${selValue}`);
          if (fallbackId) selectionIds.push(fallbackId);
        }
      }
    }

    // 2. Some backends return only attributeValueIds (UUID array) without
    //    full selection objects.  Use the reverse lookup to rebuild combo.
    const rawAttrValueIds = Array.isArray(row.attributeValueIds)
      ? row.attributeValueIds
      : [];
    for (const valId of rawAttrValueIds) {
      const mapped = valueIdToAttrValue.get(String(valId));
      if (mapped) {
        combo[mapped.attrId] = mapped.value;
        if (!selectionIds.includes(String(valId))) {
          selectionIds.push(String(valId));
        }
      }
    }

    const hasRealId = (typeof row.id === "string" && row.id.trim().length > 0) || (typeof row.id === "number" && Number.isFinite(row.id));

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
  const hasRealId = (typeof row.id === "string" && row.id.trim().length > 0) || (typeof row.id === "number" && Number.isFinite(row.id));
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
