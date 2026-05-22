"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { VendorMuted } from "@/components/layout/typography";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useProductEditorDraftStore } from "@/store/product-editor-draft-store";

import { emptyProductFormValues } from "./defaults";
import { ProductForm } from "./product-form";
import { ProductPreviewSheet } from "./product-preview-sheet";
import type { ProductFormValues } from "./types";
import { productToFormValues } from "./types";

type ProductEditorProps = {
  catalogProductId: string | null;
};

export function ProductEditor({ catalogProductId }: ProductEditorProps) {
  const router = useRouter();
  const editorKey = catalogProductId ?? "new";

  const defaultValues = useMemo(() => {
    const d = useProductEditorDraftStore.getState().getDraft(editorKey);
    if (d) return d;
    if (catalogProductId) {
      const p = useProductCatalogStore.getState().getProduct(catalogProductId);
      if (p) return productToFormValues(p);
    }
    return emptyProductFormValues();
  }, [editorKey, catalogProductId]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<ProductFormValues>(defaultValues);
  const [savedAt, setSavedAt] = useState<string | null>(null);

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex gap-1.5"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Products
          </Link>
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            {catalogProductId ? "Edit product" : "New product"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedAt ? (
            <VendorMuted className="text-xs tabular-nums">
              Saved {savedAt}
            </VendorMuted>
          ) : null}
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="size-4" aria-hidden />
            Preview
          </button>
        </div>
      </div>

      <ProductForm
        key={editorKey}
        editorKey={editorKey}
        catalogProductId={catalogProductId}
        defaultValues={defaultValues}
        onCatalogCreated={(id) => {
          router.replace(`/products/${id}/edit`);
        }}
        onValuesSnapshot={handleSnapshot}
      />

      <ProductPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        values={snapshot}
      />
    </div>
  );
}
