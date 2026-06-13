import type { Currency } from "@/services/vendor/types";

/** How we label an axis in the matrix (color / size / product type / custom). */
export type VariantAttributeKind = "color" | "size" | "type" | "custom";

export type VariantAttributeDefinition = {
  id: string;
  name: string;
  kind: VariantAttributeKind;
  /** Distinct option values for this axis (e.g. Red, Blue or S, M, L). */
  values: string[];
  /** Maps display value → backend attribute-value id (selection id). */
  valueIdMap?: Record<string, string>;
  /** Original attribute code from the API (used to resolve selections). */
  code?: string;
};

/** UI editor row. Numeric values are converted to strings when calling the API. */
export type VariantRow = {
  id: string;
  /** Maps attribute id → chosen value for this row. */
  combo: Record<string, string>;
  /** Backend-generated SKU; the frontend never creates or edits it. */
  sku?: string | null;
  stock: number;
  price: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  barcode: string;
  /** Variant-specific image URL (from storage or a local blob preview). */
  imageUrl?: string;
  /** Backend selection ids required when creating this variant on the server. */
  selectionIds?: string[];
  /** True when this row was created locally and does not yet exist on the backend. */
  isLocalOnly?: boolean;
};

export type VariantGenerationDefaults = {
  stock: number;
  price: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  barcode: string;
};

export function emptyGenerationDefaults(): VariantGenerationDefaults {
  return {
    stock: 1000000,
    price: 9.99,
    weightGrams: 250,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 5,
    barcode: "",
  };
}

// --- API response shapes (guide-aligned) ---

export type VariantSelectionApiResponse = {
  attributeValueId?: string;
  attributeValue?: {
    value?: string;
    attribute?: {
      id?: string;
      code?: string;
      label?: string;
    };
  };
};

export type VariantInventoryApiResponse = {
  quantity?: number;
  reservedQuantity?: number;
};

/**
 * Raw ProductVariant returned by the gateway.
 * Decimal fields are strings to preserve precision; the UI mapper converts them
 * to numbers for the editor (`VariantRow`).
 */
export type VariantApiResponse = {
  id: string;
  productId?: string;
  sku?: string | null;
  wholesalePrice: string;
  currency: Currency;
  isActive: boolean;
  imageUrl?: string | null;
  weightKg?: string;
  volumeCbm?: string;
  selections?: VariantSelectionApiResponse[];
  inventory?: VariantInventoryApiResponse;
  createdAt?: string;
  updatedAt?: string;
};
