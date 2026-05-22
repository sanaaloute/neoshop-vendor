/**
 * Variant matrix — dynamic attributes, SKUs, inventory fields.
 * @module modules/variants
 */

export { VariantsHome } from "./variants-home";
export { VariantMatrixPanel } from "./variant-matrix-panel";
export { VariantTable } from "./variant-table";
export { VariantBulkBar } from "./variant-bulk-bar";
export { VariantPreviewSheet } from "./variant-preview-sheet";
export * from "./types";
export {
  cartesianValues,
  buildVariantMatrix,
  buildSku,
} from "./generate-matrix";
