"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { ProductFormValues } from "./types";
import { productToFormValues } from "./types";

type ProductEditorProps = {
  catalogProductId: string | null;
};

export function ProductEditor({ catalogProductId }: ProductEditorProps) {
  const router = useRouter();
  const editorKey = catalogProductId ?? "new";

  useEffect(() => {
    if (!catalogProductId) {
      useProductEditorDraftStore.getState().clearDraft("new");
    }
  }, [catalogProductId]);

  // Try to get from local store first
  const storeValues = useMemo(() => {
    const d = useProductEditorDraftStore.getState().getDraft(editorKey);
    if (d) return d;
    if (catalogProductId) {
      const p = useProductCatalogStore.getState().getProduct(catalogProductId);
      if (p) return productToFormValues(p);
    }
    return emptyProductFormValues();
  }, [editorKey, catalogProductId]);

  // Fetch full product from API when editing (to get all images)
  const [fetchedValues, setFetchedValues] = useState<ProductFormValues | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!catalogProductId || !getApiBaseUrl()) return;
    let cancelled = false;
    setFetching(true);
    getProduct(catalogProductId)
      .then((row) => {
        if (cancelled) return;
        const p = mapApiProductRowToProduct(row as Record<string, unknown>);
        useProductCatalogStore.getState().upsertProduct(p);
        setFetchedValues(productToFormValues(p));
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

  const defaultValues = fetchedValues ?? storeValues;

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
                Products
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="size-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-semibold tracking-tight">
                    {catalogProductId ? "Edit Product" : "Create Product"}
                  </h1>
                  {savedAt ? (
                    <VendorMuted className="text-[11px] tabular-nums leading-none">
                      Last saved {savedAt}
                    </VendorMuted>
                  ) : (
                    <VendorMuted className="text-[11px] leading-none">
                      Draft
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
                Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {fetching && !fetchedValues ? (
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
            onSuccess={(createdId, configureVariants) => {
              if (createdId && configureVariants) {
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
