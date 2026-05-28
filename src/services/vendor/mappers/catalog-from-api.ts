import type {
  Product,
  ProductMedia,
  ProductStatus,
} from "@/modules/products/types";

import type { ApiProductStatus } from "../types";

function money(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

const API_STATUS_TO_UI: Record<ApiProductStatus, ProductStatus> = {
  draft: "draft",
  pending_review: "pending_review",
  published: "published",
  hidden: "hidden",
  archived: "archived",
  rejected: "rejected",
};

function mapProductStatus(raw: string): ProductStatus {
  if (raw in API_STATUS_TO_UI) {
    return API_STATUS_TO_UI[raw as ApiProductStatus];
  }
  return "draft";
}

/** Map a single vendor GET /products/me row into the dashboard catalog `Product` shape. */
export function mapApiProductRowToProduct(
  row: Record<string, unknown>
): Product {
  const variants = Array.isArray(row.variants)
    ? (row.variants as Record<string, unknown>[])
    : [];
  const first = variants[0];
  const price = first ? money(first.wholesalePrice) : 0;
  const sku = first ? String(first.sku ?? "—") : "—";

  const categories = Array.isArray(row.categories) ? row.categories : [];
  const categoryIds = categories
    .map((c) => {
      const cat = c as Record<string, unknown>;
      return String(cat.categoryId ?? (cat.category as Record<string, unknown>)?.id ?? "");
    })
    .filter(Boolean);

  const mediaRows = Array.isArray(row.media) ? row.media : [];
  const media: ProductMedia[] = mediaRows
    .slice(0, 40)
    .map((m, i) => {
      const item = m as Record<string, unknown>;
      const url = typeof item.url === "string" ? item.url : "";
      return {
        id: String(item.id ?? `m_${i}`),
        fileName: String(
          item.fileName ??
            (typeof url === "string" && url.length > 0
              ? url.split("/").pop()
              : null) ??
            "media"
        ),
        sortIndex: Number(item.sortOrder ?? i),
        url: url || undefined,
      };
    });

  const status = mapProductStatus(String(row.status ?? "draft"));

  return {
    id: String(row.id),
    sku,
    name: String(row.title ?? row.name ?? "Product"),
    description: String(row.description ?? ""),
    price,
    categoryIds,
    tags: [],
    seo: {
      slug: String(row.slug ?? "product"),
      metaTitle: String(row.title ?? row.name ?? "").slice(0, 70),
      metaDescription: String(row.description ?? "").slice(0, 160),
    },
    media,
    status,
    publishAt: null,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? new Date().toISOString()),
  };
}
