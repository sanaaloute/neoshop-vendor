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

function uiBulkPricingToApi(
  tiers: { minQuantity: number; unitPrice: number }[]
): { minQuantity: number; unitPrice: number }[] {
  return tiers.map((t) => ({
    minQuantity: t.minQuantity,
    unitPrice: t.unitPrice,
  }));
}

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

export async function createProductFromForm(
  values: ProductFormValues
): Promise<Product> {
  const row = await createProduct({
    title: values.name.trim(),
    slug: values.seo.slug.trim().toLowerCase(),
    description: values.description.trim() || undefined,
    moq: values.moq,
    currency: values.currency,
    bulkPricing: values.bulkPricing.length > 0 ? uiBulkPricingToApi(values.bulkPricing) : undefined,
    categoryIds:
      values.categoryIds.length > 0 ? values.categoryIds : undefined,
  });
  const pid = String((row as Record<string, unknown>).id);

  const apiStatus = uiStatusToApi(values.status);
  // Vendors may set draft, pending_review, hidden, or published directly.
  // archived and rejected are admin-only.
  if (
    apiStatus === "draft" ||
    apiStatus === "pending_review" ||
    apiStatus === "hidden" ||
    apiStatus === "published"
  ) {
    await updateProduct(pid, { status: apiStatus });
  }

  await setProductCategories(pid, { categoryIds: values.categoryIds });
  const refreshed = await getProduct(pid);
  return mapApiProductRowToProduct(refreshed as Record<string, unknown>);
}

export async function updateProductFromForm(
  productId: string,
  values: ProductFormValues
): Promise<Product> {
  const apiStatus = uiStatusToApi(values.status);
  const body: Record<string, unknown> = {
    title: values.name.trim(),
    slug: values.seo.slug.trim().toLowerCase(),
    description: values.description.trim() || undefined,
    moq: values.moq,
    currency: values.currency,
    bulkPricing: values.bulkPricing.length > 0 ? uiBulkPricingToApi(values.bulkPricing) : undefined,
  };
  // Vendors may set draft, pending_review, hidden, or published via PATCH.
  // archived and rejected are admin-only.
  if (
    apiStatus === "draft" ||
    apiStatus === "pending_review" ||
    apiStatus === "hidden" ||
    apiStatus === "published"
  ) {
    body.status = apiStatus;
  }
  await updateProduct(productId, body);
  await setProductCategories(productId, { categoryIds: values.categoryIds });
  const refreshed = await getProduct(productId);
  return mapApiProductRowToProduct(refreshed as Record<string, unknown>);
}

export async function deleteProductOnGateway(productId: string) {
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
    default:
      return "draft";
  }
}

export async function bulkPatchProductsOnGateway(
  productIds: string[],
  patch: { status?: ProductStatus; categoryIds?: string[] }
) {
  // Vendors may set draft, pending_review, hidden, or published directly.
  // archived and rejected are admin-only.
  const vendorControlledStatuses: ApiProductStatus[] = [
    "draft",
    "pending_review",
    "hidden",
    "published",
  ];
  for (const id of productIds) {
    const body: Record<string, unknown> = {};
    if (patch.status !== undefined) {
      const apiStatus = uiProductStatusToApi(patch.status);
      if (vendorControlledStatuses.includes(apiStatus)) {
        body.status = apiStatus;
      }
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
