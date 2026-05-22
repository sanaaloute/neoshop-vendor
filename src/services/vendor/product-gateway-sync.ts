import type { Product, ProductFormValues, ProductStatus } from "@/modules/products/types";

import { mapApiProductRowToProduct } from "./mappers/catalog-from-api";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listMyProducts,
  setProductCategories,
  updateProduct,
} from "./products-api";
import type { ApiProductStatus } from "./types";
import { createVariant, listVariants, updateVariant } from "./variants-api";

function uiStatusToApi(
  status: ProductFormValues["status"]
): ApiProductStatus {
  switch (status) {
    case "published":
      return "published";
    case "archived":
      return "archived";
    case "hidden":
      return "hidden";
    case "pending_review":
      return "pending_review";
    case "draft":
    default:
      return "draft";
  }
}

async function ensurePrimaryVariant(
  productId: string,
  values: ProductFormValues
) {
  const raw = await listVariants(productId);
  const variants = Array.isArray(raw) ? raw : [];
  const first = variants[0] as Record<string, unknown> | undefined;
  const body = {
    wholesalePrice: values.price,
    moq: 1,
    isActive: true,
  };
  if (first?.id) {
    await updateVariant(productId, String(first.id), body);
  } else {
    await createVariant(productId, {
      selectionIds: [],
      wholesalePrice: values.price,
      moq: 1,
      isActive: true,
    });
  }
}

export async function createProductFromForm(
  values: ProductFormValues
): Promise<Product> {
  const row = await createProduct({
    title: values.name.trim(),
    slug: values.seo.slug.trim().toLowerCase(),
    description: values.description.trim() || undefined,
    moq: 1,
    categoryIds:
      values.categoryIds.length > 0 ? values.categoryIds : undefined,
  });
  const pid = String((row as Record<string, unknown>).id);
  await setProductCategories(pid, { categoryIds: values.categoryIds });
  await ensurePrimaryVariant(pid, values);
  const refreshed = await getProduct(pid);
  return mapApiProductRowToProduct(refreshed as Record<string, unknown>);
}

export async function updateProductFromForm(
  productId: string,
  values: ProductFormValues
): Promise<Product> {
  await updateProduct(productId, {
    title: values.name.trim(),
    slug: values.seo.slug.trim().toLowerCase(),
    description: values.description.trim() || undefined,
    status: uiStatusToApi(values.status),
    moq: 1,
  });
  await setProductCategories(productId, { categoryIds: values.categoryIds });
  await ensurePrimaryVariant(productId, values);
  const refreshed = await getProduct(productId);
  return mapApiProductRowToProduct(refreshed as Record<string, unknown>);
}

export async function archiveProductOnGateway(productId: string) {
  await deleteProduct(productId);
}

export async function duplicateProductOnGateway(
  sourceProductId: string
): Promise<Product | null> {
  const src = await getProduct(sourceProductId);
  const r = src as Record<string, unknown>;
  const title = String(r.title ?? "Product");
  const slugBase = String(r.slug ?? "product");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const row = await createProduct({
    title: `${title} (copy)`,
    slug: `${slugBase}-copy-${suffix}`.slice(0, 120),
    description:
      typeof r.description === "string" ? r.description : undefined,
    moq: typeof r.moq === "number" ? r.moq : 1,
    categoryIds: Array.isArray(r.categories)
      ? (r.categories as { categoryId?: string }[])
          .map((c) => c.categoryId)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      : undefined,
  });
  const pid = String((row as Record<string, unknown>).id);
  const srcVariants = Array.isArray(r.variants) ? r.variants : [];
  const v0 = srcVariants[0] as Record<string, unknown> | undefined;
  const wholesale =
    typeof v0?.wholesalePrice === "number"
      ? v0.wholesalePrice
      : typeof v0?.wholesalePrice === "string"
        ? parseFloat(v0.wholesalePrice)
        : 0;
  const variantBody = {
    wholesalePrice: Number.isFinite(wholesale) ? wholesale : 0,
    moq: typeof v0?.moq === "number" ? v0.moq : 1,
    isActive: v0?.isActive !== false,
  };
  const existing = await listVariants(pid);
  const ev = Array.isArray(existing) ? existing : [];
  const firstNew = ev[0] as Record<string, unknown> | undefined;
  if (firstNew?.id) {
    await updateVariant(pid, String(firstNew.id), variantBody);
  } else {
    await createVariant(pid, {
      selectionIds: [],
      ...variantBody,
    });
  }
  const refreshed = await getProduct(pid);
  return mapApiProductRowToProduct(refreshed as Record<string, unknown>);
}

function uiProductStatusToApi(s: ProductStatus): ApiProductStatus {
  switch (s) {
    case "published":
      return "published";
    case "archived":
      return "archived";
    case "hidden":
      return "hidden";
    case "pending_review":
      return "pending_review";
    case "rejected":
      return "rejected";
    case "draft":
    case "scheduled":
    default:
      return "draft";
  }
}

export async function bulkPatchProductsOnGateway(
  productIds: string[],
  patch: { status?: ProductStatus; categoryIds?: string[] }
) {
  for (const id of productIds) {
    const body: Record<string, unknown> = {};
    if (patch.status !== undefined) {
      body.status = uiProductStatusToApi(patch.status);
    }
    if (Object.keys(body).length) {
      await updateProduct(id, body);
    }
    if (patch.categoryIds !== undefined) {
      await setProductCategories(id, { categoryIds: patch.categoryIds });
    }
  }
  const res = await listMyProducts({ take: 100 });
  const rows = Array.isArray(res?.items) ? res.items : [];
  return rows.map((row) =>
    mapApiProductRowToProduct(row as Record<string, unknown>)
  );
}
