/** How we label an axis in the matrix (color / size / product type / custom). */
export type VariantAttributeKind = "color" | "size" | "type" | "custom";

export type VariantAttributeDefinition = {
  id: string;
  name: string;
  kind: VariantAttributeKind;
  /** Distinct option values for this axis (e.g. Red, Blue or S, M, L). */
  values: string[];
};

export type VariantRow = {
  id: string;
  /** Maps attribute id → chosen value for this row. */
  combo: Record<string, string>;
  sku: string;
  moq: number;
  stock: number;
  price: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  barcode: string;
};

export type VariantGenerationDefaults = {
  moq: number;
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
    moq: 1,
    stock: 0,
    price: 9.99,
    weightGrams: 250,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 5,
    barcode: "",
  };
}
