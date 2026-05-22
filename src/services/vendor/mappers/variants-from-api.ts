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
  const values = rawValues
    .map((v) => {
      const item = v as Record<string, unknown>;
      return str(item.value, str(item.label, ""));
    })
    .filter(Boolean);
  return { id, name, kind: attrKind(name), values: [...new Set(values)] };
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

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  const variants = rawVariants.map((v, index) => {
    const row = v as Record<string, unknown>;
    const inventory = (row.inventory ?? {}) as Record<string, unknown>;
    const combo: Record<string, string> = {};
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
    }

    return {
      id: str(row.id, `var_${index}`),
      combo,
      sku: str(row.sku, `SKU-${index + 1}`),
      moq: Math.max(1, Math.round(num(row.moq, num(product.moq, 1)))),
      stock: Math.max(0, Math.round(num(inventory.quantity, 0))),
      price: num(row.wholesalePrice, 0),
      weightGrams: Math.round(num(row.weightGrams, 0)),
      lengthCm: num(row.lengthCm, 0),
      widthCm: num(row.widthCm, 0),
      heightCm: num(row.heightCm, 0),
      barcode: str(row.barcode, ""),
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
  return {
    id: str(row.id, crypto.randomUUID()),
    combo: {},
    sku: str(row.sku, "SKU"),
    moq: Math.max(1, Math.round(num(row.moq, productMoq))),
    stock: Math.max(0, Math.round(num(inventory.quantity, 0))),
    price: num(row.wholesalePrice, 0),
    weightGrams: Math.round(num(row.weightGrams, 0)),
    lengthCm: num(row.lengthCm, 0),
    widthCm: num(row.widthCm, 0),
    heightCm: num(row.heightCm, 0),
    barcode: str(row.barcode, ""),
  };
}
