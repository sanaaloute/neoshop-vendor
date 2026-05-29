/** UI/catalog statuses; gateway uses additional ProductStatus values mapped in `catalog-from-api`. */
export type ProductStatus =
  | "draft"
  | "published"
  | "scheduled"
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

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  categoryIds: string[];
  tags: string[];
  seo: ProductSeo;
  media: ProductMedia[];
  status: ProductStatus;
  /** ISO datetime when `status === "scheduled"` */
  publishAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  sku: string;
  name: string;
  description: string;
  price: number;
  categoryIds: string[];
  tags: string[];
  seo: ProductSeo;
  media: ProductMedia[];
  status: ProductStatus;
  publishAt: string | null;
  configureVariants: boolean;
};

export function productToFormValues(p: Product): ProductFormValues {
  return {
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price,
    categoryIds: [...p.categoryIds],
    tags: [...p.tags],
    seo: { ...p.seo },
    media: p.media.map((m) => ({ ...m })),
    status: p.status,
    publishAt: p.publishAt,
    configureVariants: false,
  };
}

export function formValuesToProductPatch(
  v: ProductFormValues
): Omit<Product, "id" | "createdAt" | "updatedAt"> {
  return {
    sku: v.sku.trim(),
    name: v.name.trim(),
    description: v.description.trim(),
    price: v.price,
    categoryIds: v.categoryIds,
    tags: v.tags.map((t) => t.trim()).filter(Boolean),
    seo: {
      slug: v.seo.slug.trim().toLowerCase(),
      metaTitle: v.seo.metaTitle.trim(),
      metaDescription: v.seo.metaDescription.trim(),
    },
    media: v.media
      .slice()
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((m, i) => ({ ...m, sortIndex: i })),
    status: v.status,
    publishAt: v.publishAt?.trim() ? v.publishAt : null,
  };
}
