"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Copy, Eye, Layers, Pencil, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/cards/empty-state";
import { StatusBadge } from "@/components/cards/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LoadingButton } from "@/components/feedback/loading-button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiBaseUrl } from "@/config/auth";

import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/routing";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";
import { useCategoriesStore } from "@/store/categories-store";
import {
  bulkPatchProductsOnGateway,
  deleteProductOnGateway,
  duplicateProductOnGateway,
} from "@/services/vendor/product-gateway-sync";

import { ProductPreviewSheet } from "./product-preview-sheet";
import type { Product, ProductFormValues, ProductStatus } from "./types";
import { productToFormValues } from "./types";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

function statusToBadge(
  s: ProductStatus
): Parameters<typeof StatusBadge>[0]["status"] {
  if (s === "published") return "success";
  if (s === "draft") return "neutral";
  if (s === "pending_review") return "pending";
  if (s === "hidden") return "warning";
  if (s === "rejected") return "danger";
  return "neutral";
}

function categorySummary(
  ids: string[],
  categories: { id: string; name: string }[]
) {
  if (!ids.length) return "—";
  return ids
    .map((id) => categories.find((c) => c.id === id)?.name ?? id)
    .join(", ");
}

type ProductsTableProps = {
  filterStatus: ProductStatus | "";
  filterCategory: string;
  filterSearch: string;
  canWriteCatalog: boolean;
  syncLoading?: boolean;
};

export function ProductsTable({
  filterStatus,
  filterCategory,
  filterSearch,
  canWriteCatalog,
  syncLoading = false,
}: ProductsTableProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const products = useProductCatalogStore((s) => s.products);
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
          (p.sku?.toLowerCase() ?? "").includes(q)
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
          httpErrorMessageForUser(e, t("list.couldNotUpdateProducts"))
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
    if (syncLoading) {
      return (
        <Card className="border-border/80 text-muted-foreground border-dashed p-12 text-center text-sm">
          <Spinner size="lg" variant="primary" className="mx-auto" />
          <p className="mt-3">{t("list.loading")}</p>
        </Card>
      );
    }
    return (
      <EmptyState
        title={t("list.noProductsYet")}
        primaryAction={
          canWriteCatalog
            ? {
                label: t("list.createProduct"),
                onClick: () => router.push("/products/new"),
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {listError ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-destructive text-sm"
        >
          {listError}
        </motion.p>
      ) : null}

      {/* ── Bulk Edit Panel ── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
          >
            <Card className="border-primary/30 from-primary/5 shadow-vendor-card overflow-hidden bg-gradient-to-r to-transparent">
              <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/15 flex size-8 items-center justify-center rounded-lg">
                    <span className="text-primary text-xs font-bold">
                      {selected.size}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {t("list.bulkEdit", { count: selected.size })}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-muted-foreground text-xs">
                      {t("list.setStatus")}
                    </Label>
                    <Select
                      value={bulkStatus}
                      onValueChange={(v) =>
                        setBulkStatus((v || "") as ProductStatus | "")
                      }
                    >
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        <SelectItem value="draft">
                          {t("status.draft")}
                        </SelectItem>
                        <SelectItem value="pending_review">
                          {t("status.pending_review")}
                        </SelectItem>
                        <SelectItem value="hidden">
                          {t("status.hidden")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-muted-foreground text-xs">
                      {t("list.setPrimaryCategory")}
                    </Label>
                    <Select
                      value={bulkCategory}
                      onValueChange={(v) => setBulkCategory(v ?? "")}
                    >
                      <SelectTrigger className="h-9 w-44">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <LoadingButton
                    type="button"
                    size="sm"
                    loading={listBusy}
                    disabled={!canWriteCatalog}
                    onClick={() => void applyBulk()}
                  >
                    {t("list.apply")}
                  </LoadingButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(new Set())}
                  >
                    {t("list.clear")}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <Card className="border-border/80 shadow-vendor-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-10">
                  <Checkbox
                    disabled={!canWriteCatalog}
                    checked={
                      filtered.length > 0 && selected.size === filtered.length
                    }
                    onCheckedChange={toggleAll}
                    aria-label={t("list.selectAll")}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium tracking-wider uppercase">
                  {t("list.name")}
                </TableHead>
                <TableHead className="text-xs font-medium tracking-wider uppercase">
                  {t("list.sku")}
                </TableHead>
                <TableHead className="hidden text-xs font-medium tracking-wider uppercase md:table-cell">
                  {t("list.categories")}
                </TableHead>
                <TableHead className="text-xs font-medium tracking-wider uppercase">
                  {t("list.moq")}
                </TableHead>
                <TableHead className="text-xs font-medium tracking-wider uppercase">
                  {t("list.status")}
                </TableHead>
                <TableHead className="text-right text-xs font-medium tracking-wider uppercase">
                  {t("list.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground text-center text-sm"
                    >
                      {t("list.noMatches")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <motion.tr
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.25,
                        ease: easeOutExpo,
                      }}
                      data-state={selected.has(p.id) ? "selected" : undefined}
                      className={cn(
                        "hover:bg-muted/40 group cursor-pointer border-b transition-colors",
                        p.status === "archived" && "opacity-60",
                        selected.has(p.id) && "bg-primary/5"
                      )}
                      onClick={() => router.push(`/products/${p.id}/edit`)}
                    >
                      <td
                        className="p-2 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          disabled={!canWriteCatalog}
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggle(p.id)}
                          aria-label={t("list.selectAll")}
                        />
                      </td>
                      <td className="max-w-[200px] truncate p-2 px-4 font-medium">
                        <span className="text-foreground underline-offset-4 group-hover:underline">
                          {p.name}
                        </span>
                      </td>
                      <td className="text-muted-foreground p-2 px-4 tabular-nums">
                        {p.sku || "—"}
                      </td>
                      <td className="text-muted-foreground hidden max-w-[180px] truncate p-2 px-4 md:table-cell">
                        {categorySummary(p.categoryIds, categories)}
                      </td>
                      <td className="p-2 px-4 tabular-nums">
                        {p.moq ?? 1}
                      </td>
                      <td className="p-2 px-4">
                        <StatusBadge status={statusToBadge(p.status)}>
                          {t(`status.${p.status}`)}
                        </StatusBadge>
                      </td>
                      <td
                        className="p-2 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-wrap justify-end gap-1">
                          <Link
                            href={`/products/${p.id}/edit`}
                            title={t("list.edit")}
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
                            title={t("preview")}
                            onClick={() => openPreview(p)}
                          >
                            <Eye className="size-4" aria-hidden />
                          </Button>
                          <Link
                            href={`/variants?productId=${p.id}`}
                            title={t("list.editVariants")}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                            })}
                          >
                            <Layers className="size-4" aria-hidden />
                          </Link>
                          <LoadingButton
                            variant="ghost"
                            size="icon-sm"
                            title={t("list.duplicate")}
                            loading={listBusy}
                            disabled={!canWriteCatalog}
                            onClick={() => {
                              void (async () => {
                                setListError(null);
                                if (getApiBaseUrl()) {
                                  setListBusy(true);
                                  try {
                                    const copy =
                                      await duplicateProductOnGateway(p.id);
                                    if (!copy) return;
                                    replaceCatalog([
                                      copy,
                                      ...products.filter(
                                        (x) => x.id !== copy.id
                                      ),
                                    ]);
                                    router.push(`/products/${copy.id}/edit`);
                                  } catch (e) {
                                    setListError(
                                      httpErrorMessageForUser(
                                        e,
                                        t("list.couldNotDuplicate")
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
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon-sm"
                            title={t("list.delete")}
                            loading={listBusy}
                            disabled={!canWriteCatalog}
                            onClick={() => {
                              void (async () => {
                                setListError(null);
                                if (getApiBaseUrl()) {
                                  setListBusy(true);
                                  try {
                                    await deleteProductOnGateway(p.id);
                                    replaceCatalog(
                                      products.filter((x) => x.id !== p.id)
                                    );
                                  } catch (e) {
                                    setListError(
                                      httpErrorMessageForUser(
                                        e,
                                        t("list.couldNotDelete")
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
                                  useVariantWorkbenchStore
                                    .getState()
                                    .resetWorkbench();
                                }
                              })();
                            }}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </LoadingButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
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
