"use client";

import { useMemo, useState } from "react";

import { useGatewayCatalogBootstrap } from "@/hooks/use-gateway-catalog-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Copy, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/cards/empty-state";
import { VendorWriteGuardBanner } from "@/components/vendor/vendor-write-guard-banner";
import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiBaseUrl } from "@/config/auth";
import { formatCurrency } from "@/lib/format";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import {
  archiveProductOnGateway,
  bulkPatchProductsOnGateway,
  deleteProductOnGateway,
  duplicateProductOnGateway,
} from "@/services/vendor/product-gateway-sync";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

import { useCategoriesStore } from "@/store/categories-store";
import { ProductPreviewSheet } from "./product-preview-sheet";
import type { Product, ProductFormValues, ProductStatus } from "./types";
import { productToFormValues } from "./types";

function statusVariant(
  s: ProductStatus
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "published") return "default";
  if (s === "draft" || s === "pending_review") return "secondary";
  if (s === "scheduled") return "outline";
  if (s === "hidden") return "outline";
  if (s === "rejected") return "destructive";
  return "destructive";
}

function categorySummary(ids: string[], categories: { id: string; name: string }[]) {
  if (!ids.length) return "—";
  return ids
    .map((id) => categories.find((c) => c.id === id)?.name ?? id)
    .join(", ");
}

export function ProductsList() {
  const router = useRouter();
  const { canWriteCatalog, status: vendorStatus } = useVendorWritesAllowed();
  const { loading: gatewayLoading, error: gatewayError } =
    useGatewayCatalogBootstrap();
  const products = useProductCatalogStore((s) => s.products);
  const archiveProduct = useProductCatalogStore((s) => s.archiveProduct);
  const deleteProduct = useProductCatalogStore((s) => s.deleteProduct);
  const duplicateProduct = useProductCatalogStore((s) => s.duplicateProduct);
  const bulkPatch = useProductCatalogStore((s) => s.bulkPatch);
  const replaceCatalog = useProductCatalogStore((s) => s.replaceCatalog);
  const categories = useCategoriesStore((s) => s.categories);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus | "">("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [preview, setPreview] = useState<ProductFormValues | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...products].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    if (filterStatus) {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (filterCategory) {
      result = result.filter((p) => p.categoryIds.includes(filterCategory));
    }
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, filterStatus, filterCategory, filterSearch]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const applyBulk = async () => {
    if (!canWriteCatalog) return;
    const ids = [...selected];
    if (!ids.length) return;
    const patch: { status?: ProductStatus; categoryIds?: string[] } = {};
    if (bulkStatus) patch.status = bulkStatus;
    if (bulkCategory) patch.categoryIds = [bulkCategory];
    if (!patch.status && !patch.categoryIds) return;

    setListError(null);
    if (getApiBaseUrl()) {
      setListBusy(true);
      try {
        const updated = await bulkPatchProductsOnGateway(ids, patch);
        replaceCatalog(updated);
      } catch (e) {
        setListError(
          httpErrorMessageForUser(e, "Could not update products. Try again.")
        );
      } finally {
        setListBusy(false);
      }
    } else {
      bulkPatch(ids, patch);
    }
    setSelected(new Set());
    setBulkStatus("");
    setBulkCategory("");
  };

  const openPreview = (p: Product) => {
    setPreview(productToFormValues(p));
    setPreviewOpen(true);
  };

  if (!products.length) {
    return (
      <div className="flex flex-col gap-4">
        <VendorWriteGuardBanner area="catalog" status={vendorStatus} />
        <GatewaySyncBanner loading={gatewayLoading} error={gatewayError} />
        {gatewayLoading ? (
          <Card className="border-border/80 text-muted-foreground border-dashed p-12 text-center text-sm">
            <Loader2
              className="text-primary mx-auto size-8 animate-spin"
              aria-hidden
            />
            <p className="mt-3">Loading…</p>
          </Card>
        ) : (
          <EmptyState
            title="No products yet"
            primaryAction={
              canWriteCatalog
                ? {
                    label: "Create product",
                    onClick: () => router.push("/products/new"),
                  }
                : undefined
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <VendorWriteGuardBanner area="catalog" status={vendorStatus} />
      <GatewaySyncBanner loading={gatewayLoading} error={gatewayError} />
      {listError ? (
        <p className="text-destructive text-sm">{listError}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/products/new"
          aria-disabled={!canWriteCatalog}
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "gap-1.5",
            !canWriteCatalog && "pointer-events-none opacity-50"
          )}
          onClick={(e) => {
            if (!canWriteCatalog) e.preventDefault();
          }}
        >
          <Plus className="size-4" aria-hidden />
          New product
        </Link>
      </div>

      <Card className="border-border/80 shadow-vendor-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-1 flex-1">
            <Label className="text-xs">Search</Label>
            <input
              type="text"
              placeholder="Product name or SKU…"
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Status</Label>
            <select
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus((e.target.value || "") as ProductStatus | "")
              }
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Category</Label>
            <select
              className="border-input bg-background h-9 min-w-[10rem] rounded-md border px-2 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterStatus("");
              setFilterCategory("");
              setFilterSearch("");
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {selected.size > 0 ? (
        <Card className="border-primary/30 bg-primary/5 shadow-vendor-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <p className="text-sm font-medium">
              Bulk edit ({selected.size} selected)
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <Label className="text-xs">Set status</Label>
                <select
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                  value={bulkStatus}
                  onChange={(e) =>
                    setBulkStatus((e.target.value || "") as ProductStatus | "")
                  }
                >
                  <option value="">—</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Set primary category</Label>
                <select
                  className="border-input bg-background h-9 min-w-[10rem] rounded-md border px-2 text-sm"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={listBusy || !canWriteCatalog}
                onClick={() => void applyBulk()}
              >
                Apply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-vendor-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  disabled={!canWriteCatalog}
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="hidden md:table-cell">Categories</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center text-sm"
                >
                  No products match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
              <TableRow
                key={p.id}
                data-state={selected.has(p.id) ? "selected" : undefined}
                className={cn(p.status === "archived" && "opacity-60")}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    className="accent-primary size-4"
                    disabled={!canWriteCatalog}
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium">
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {p.sku}
                </TableCell>
                <TableCell className="text-muted-foreground hidden max-w-[180px] truncate md:table-cell">
                  {categorySummary(p.categoryIds, categories)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCurrency(p.price)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant(p.status)}
                    className="capitalize"
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link
                      href={`/products/${p.id}/edit`}
                      title="Edit"
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon-sm",
                      })}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Preview"
                      onClick={() => openPreview(p)}
                    >
                      <Eye className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Duplicate"
                      disabled={listBusy || !canWriteCatalog}
                      onClick={() => {
                        void (async () => {
                          setListError(null);
                          if (getApiBaseUrl()) {
                            setListBusy(true);
                            try {
                              const copy = await duplicateProductOnGateway(p.id);
                              if (!copy) return;
                              replaceCatalog(
                                [copy, ...products.filter((x) => x.id !== copy.id)]
                              );
                              router.push(`/products/${copy.id}/edit`);
                            } catch (e) {
                              setListError(
                                httpErrorMessageForUser(
                                  e,
                                  "Could not duplicate this product."
                                )
                              );
                            } finally {
                              setListBusy(false);
                            }
                            return;
                          }
                          const nid = duplicateProduct(p.id);
                          if (nid) router.push(`/products/${nid}/edit`);
                        })();
                      }}
                    >
                      <Copy className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Archive"
                      disabled={listBusy || !canWriteCatalog}
                      onClick={() => {
                        void (async () => {
                          setListError(null);
                          if (getApiBaseUrl()) {
                            setListBusy(true);
                            try {
                              await archiveProductOnGateway(p.id);
                              replaceCatalog(products.filter((x) => x.id !== p.id));
                            } catch (e) {
                              setListError(
                                httpErrorMessageForUser(
                                  e,
                                  "Could not archive this product."
                                )
                              );
                            } finally {
                              setListBusy(false);
                            }
                            return;
                          }
                          archiveProduct(p.id);
                        })();
                      }}
                    >
                      <Archive className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete"
                      disabled={listBusy || !canWriteCatalog}
                      onClick={() => {
                        void (async () => {
                          setListError(null);
                          if (getApiBaseUrl()) {
                            setListBusy(true);
                            try {
                              await deleteProductOnGateway(p.id);
                              replaceCatalog(products.filter((x) => x.id !== p.id));
                            } catch (e) {
                              setListError(
                                httpErrorMessageForUser(
                                  e,
                                  "Could not delete this product."
                                )
                              );
                            } finally {
                              setListBusy(false);
                            }
                          } else {
                            deleteProduct(p.id);
                          }
                          const workbenchProductId =
                            useVariantWorkbenchStore.getState().productId;
                          if (workbenchProductId === p.id) {
                            useVariantWorkbenchStore.getState().resetWorkbench();
                          }
                        })();
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </Card>

      {preview ? (
        <ProductPreviewSheet
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          values={preview}
        />
      ) : null}
    </div>
  );
}
