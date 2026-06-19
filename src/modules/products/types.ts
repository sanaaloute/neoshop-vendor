/** UI/catalog statuses; gateway uses additional ProductStatus values mapped in `catalog-from-api`. */
export type ProductStatus =
  | "draft"
  | "published"
  | "archived"
  | "pending_review"
  | "hidden"
  | "rejected";

/** Persisted media row (no blob URLs — previews are session-only in the editor). */
export type ProductMedia = {
  id: string;
  fileName: string;
  sortIndex: number;
  /** HTTPS URL from gateway media attachment or storage upload. */
  url?: string;
};

export type ProductSeo = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
};

export type BulkPricingTier = {
  minQuantity: number;
  unitPrice: number;
};

export type Product = {
  id: string;
  /** Backend-generated SKU; the frontend never creates or edits it. */
  sku?: string | null;
  name: string;
  description: string;
  price: number;
  currency: "CNY" | "XOF";
  moq?: number;
  bulkPricing?: BulkPricingTier[];
  categoryIds: string[];
  tags: string[];
  seo: ProductSeo;
  media: ProductMedia[];
  status: ProductStatus;
  publishAt: string | null;
  averageRating?: string | null;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  moq: number;
  currency: "CNY" | "XOF";
  bulkPricing: BulkPricingTier[];
  categoryIds: string[];
  seo: { slug: string };
  media: ProductMedia[];
  status: ProductStatus;
  publishAt: string | null;
  averageRating?: string | null;
  reviewsCount?: number;
};

export function productToFormValues(p: Product): ProductFormValues {
  return {
    name: p.name,
    description: p.description,
    moq: p.moq ?? 1,
    currency: p.currency ?? "CNY",
    bulkPricing: p.bulkPricing ? [...p.bulkPricing] : [],
    categoryIds: [...p.categoryIds],
    seo: { slug: p.seo.slug },
    media: p.media.map((m) => ({ ...m })),
    status: p.status,
    publishAt: p.publishAt,
    averageRating: p.averageRating,
    reviewsCount: p.reviewsCount,
  };
}

export function formValuesToProductPatch(
  v: ProductFormValues
): Omit<Product, "id" | "createdAt" | "updatedAt" | "sku" | "price" | "tags"> {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    moq: v.moq,
    currency: v.currency,
    bulkPricing: v.bulkPricing.length > 0 ? [...v.bulkPricing] : undefined,
    categoryIds: v.categoryIds,
    seo: {
      slug: v.seo.slug.trim().toLowerCase(),
      metaTitle: "",
      metaDescription: "",
    },
    media: v.media
      .slice()
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((m, i) => ({ ...m, sortIndex: i })),
    status: v.status,
    publishAt: v.publishAt?.trim() ? v.publishAt : null,
  };
}
