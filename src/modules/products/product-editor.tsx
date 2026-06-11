"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, Eye, Package } from "lucide-react";

import { VendorMuted } from "@/components/layout/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiBaseUrl } from "@/config/auth";
import { cn } from "@/lib/utils";
import { mapApiProductRowToProduct } from "@/services/vendor/mappers/catalog-from-api";
import { getProduct } from "@/services/vendor/products-api";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useProductEditorDraftStore } from "@/store/product-editor-draft-store";

import { emptyProductFormValues } from "./defaults";
import { ProductForm } from "./product-form";
import { ProductPreviewSheet } from "./product-preview-sheet";
import { ProductStatusPanel } from "./product-status-panel";
import type { ProductFormValues, ProductMedia } from "./types";
import { productToFormValues } from "./types";

type ProductEditorProps = {
  catalogProductId: string | null;
};

function mergeFetchedProduct(
  target: ProductFormValues,
  source: ProductFormValues
): ProductFormValues {
  // If local media is empty (list endpoint doesn't include media), use API media directly
  if (!target.media.length) {
    return { ...target, media: source.media };
  }

  const apiById = new Map(source.media.map((m) => [m.id, m]));
  const apiIds = new Set(source.media.map((m) => m.id));

  // Count how many local items actually match API items by ID.
  const matchedCount = target.media.filter((m) => apiIds.has(m.id)).length;

  // If fewer than half match, the local state likely has stale temporary IDs
  // (e.g. from a draft saved before upload completed). Use API as ground truth.
  if (matchedCount === 0 || matchedCount < target.media.length / 2) {
    // Preserve any local items that have a real URL (unsaved uploads that
    // somehow persisted a URL) and aren't already in the API list.
    const extras = target.media.filter(
      (m) => m.url && !apiIds.has(m.id)
    );
    return { ...target, media: [...source.media, ...extras] };
  }

  // Normal merge: backfill URLs from API into matching local items,
  // and append any local-only items (unsaved uploads).
  const merged: ProductMedia[] = [];
  for (const m of target.media) {
    const api = apiById.get(m.id);
    if (api) {
      merged.push({ ...m, url: m.url || api.url || undefined });
    } else {
      merged.push(m);
    }
  }
  // Append API items that weren't in local target (new backend images)
  for (const api of source.media) {
    if (!target.media.some((m) => m.id === api.id)) {
      merged.push(api);
    }
  }
  return { ...target, media: merged };
}

export function ProductEditor({ catalogProductId }: ProductEditorProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const editorKey = catalogProductId ?? "new";

  useEffect(() => {
    if (!catalogProductId) {
      useProductEditorDraftStore.getState().clearDraft("new");
    }
  }, [catalogProductId]);

  const storeValues = useMemo(() => {
    if (!catalogProductId) {
      useProductEditorDraftStore.getState().clearDraft("new");
      return emptyProductFormValues();
    }
    const d = useProductEditorDraftStore.getState().getDraft(editorKey);
    if (d) return d;
    const p = useProductCatalogStore.getState().getProduct(catalogProductId);
    if (p) return productToFormValues(p);
    return emptyProductFormValues();
  }, [editorKey, catalogProductId]);

  const [defaultValues, setDefaultValues] = useState<ProductFormValues>(storeValues);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setDefaultValues(storeValues);
  }, [storeValues]);

  // Fetch full product from API when editing (to get all image URLs)
  useEffect(() => {
    if (!catalogProductId || !getApiBaseUrl()) return;
    let cancelled = false;
    setFetching(true);
    getProduct(catalogProductId)
      .then((row) => {
        if (cancelled) return;
        const p = mapApiProductRowToProduct(row as Record<string, unknown>);
        useProductCatalogStore.getState().upsertProduct(p);
        const fetched = productToFormValues(p);
        // Merge fetched image URLs into current values so local edits are preserved
        setDefaultValues((prev) => mergeFetchedProduct(prev, fetched));
      })
      .catch(() => {
        // silently fail — local store is the fallback
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogProductId]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<ProductFormValues>(defaultValues);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSnapshot(defaultValues);
  }, [defaultValues]);

  const handleSnapshot = useCallback((v: ProductFormValues) => {
    setSnapshot(v);
    setSavedAt(
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-4 pb-2 md:-mx-6 md:px-6 md:pt-6 md:pb-3">
        <div className="glass-card shadow-glass rounded-xl px-4 py-3 md:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className={cn(
                  "inline-flex items-center justify-center rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted/60",
                )}
              >
                <ArrowLeft className="size-4 mr-1.5" aria-hidden />
                {t("title")}
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="size-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-semibold tracking-tight">
                    {catalogProductId ? t("editProduct") : t("createProduct")}
                  </h1>
                  {savedAt ? (
                    <VendorMuted className="text-[11px] tabular-nums leading-none">
                      {t("lastSaved", { time: savedAt })}
                    </VendorMuted>
                  ) : (
                    <VendorMuted className="text-[11px] leading-none">
                      {t("draft")}
                    </VendorMuted>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-4" aria-hidden />
                {t("preview")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {fetching && defaultValues.media.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="hidden lg:flex flex-col gap-5">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ProductForm
            key={editorKey}
            editorKey={editorKey}
            catalogProductId={catalogProductId}
            defaultValues={defaultValues}
            onSuccess={(createdId, wasSubmittedForReview) => {
              if (createdId && wasSubmittedForReview) {
                router.push(`/variants?productId=${createdId}`);
              } else {
                router.push("/products");
              }
            }}
            onValuesSnapshot={handleSnapshot}
            onSavingChange={setSaving}
          />

          {/* Right Sidebar */}
          <aside className="hidden lg:block">
            <ProductStatusPanel
              values={snapshot}
              catalogProductId={catalogProductId}
              savedAt={savedAt}
              onPreview={() => setPreviewOpen(true)}
              saving={saving}
            />
          </aside>
        </div>
      )}

      <ProductPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        values={snapshot}
      />
    </div>
  );
}
