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
  const price = money(
    row.price ?? row.wholesalePrice ?? (first ? first.wholesalePrice : undefined)
  );
  const skuRaw = row.sku ?? (first ? first.sku : undefined);
  const sku = typeof skuRaw === "string" && skuRaw.trim() ? skuRaw : undefined;

  const categories = Array.isArray(row.categories) ? row.categories : [];
  const categoryIds = categories
    .map((c) => {
      const cat = c as Record<string, unknown>;
      return String(cat.categoryId ?? (cat.category as Record<string, unknown>)?.id ?? "");
    })
    .filter(Boolean);

  // API may return media under "media" or "images"
  const rawMedia = Array.isArray(row.media)
    ? row.media
    : Array.isArray(row.images)
      ? row.images
      : [];
  const media: ProductMedia[] = rawMedia
    .slice(0, 40)
    .map((m, i) => {
      const item = m as Record<string, unknown>;
      // Try common URL field names
      const url =
        (typeof item.url === "string" && item.url) ||
        (typeof item.imageUrl === "string" && item.imageUrl) ||
        (typeof item.publicUrl === "string" && item.publicUrl) ||
        (typeof item.fileUrl === "string" && item.fileUrl) ||
        (typeof item.src === "string" && item.src) ||
        (typeof item.path === "string" && item.path) ||
        "";
      return {
        id: String(item.id ?? `m_${i}`),
        fileName: String(
          item.fileName ??
            item.name ??
            item.alt ??
            (url.length > 0 ? url.split("/").pop() : null) ??
            "media"
        ),
        sortIndex: Number(item.sortOrder ?? item.sortIndex ?? i),
        url: url || undefined,
      };
    });

  const status = mapProductStatus(String(row.status ?? "draft"));
  const moq = typeof row.moq === "number" && Number.isFinite(row.moq) ? row.moq : undefined;
  const rawBulk = Array.isArray(row.bulkPricing) ? row.bulkPricing : [];
  const bulkPricing = rawBulk
    .map((b) => {
      const item = b as Record<string, unknown>;
      const minQ = typeof item.minQuantity === "number" ? item.minQuantity : Number(item.minQuantity);
      const uPrice = typeof item.unitPrice === "number" ? item.unitPrice : Number(item.unitPrice);
      if (Number.isFinite(minQ) && Number.isFinite(uPrice) && minQ >= 1 && uPrice > 0) {
        return { minQuantity: minQ, unitPrice: uPrice };
      }
      return null;
    })
    .filter(Boolean) as { minQuantity: number; unitPrice: number }[];

  return {
    id: String(row.id),
    ...(sku !== undefined ? { sku } : {}),
    name: String(row.title ?? row.name ?? "Product"),
    description: String(row.description ?? ""),
    price,
    ...(moq !== undefined ? { moq } : {}),
    ...(bulkPricing.length > 0 ? { bulkPricing } : {}),
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
