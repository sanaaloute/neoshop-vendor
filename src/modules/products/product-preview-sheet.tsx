"use client";

import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useCategoriesStore } from "@/store/categories-store";
import type { ProductFormValues } from "./types";

type ProductPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: ProductFormValues;
};

function categoryLabels(ids: string[], categories: { id: string; name: string }[]) {
  return ids
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(" · ");
}

export function ProductPreviewSheet({
  open,
  onOpenChange,
  values,
}: ProductPreviewSheetProps) {
  const categories = useCategoriesStore((s) => s.categories);
  const cats = categoryLabels(values.categoryIds, categories);
  const url = values.seo.slug
    ? `/catalog/p/${values.seo.slug}`
    : "/catalog/p/…";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-border border-b text-left">
          <SheetTitle>Product preview</SheetTitle>
          <SheetDescription>
            Buyer-facing summary — compare with published catalog when previewing.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="border-border bg-card shadow-vendor-card rounded-xl border p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {values.status}
              </Badge>
              {values.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline" className="capitalize">
                  {t}
                </Badge>
              ))}
            </div>
            <h3 className="text-lg leading-tight font-semibold">
              {values.name.trim() || "Untitled product"}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              SKU {values.sku || "—"}
            </p>
            <p className="mt-3 text-xl font-semibold tabular-nums">
              {Number.isFinite(values.price)
                ? formatCurrency(values.price)
                : "—"}
            </p>
            <p className="text-muted-foreground mt-3 line-clamp-4 text-sm">
              {values.description.trim() || "No description yet."}
            </p>
            {cats ? (
              <p className="text-muted-foreground mt-3 text-xs">
                <span className="text-foreground font-medium">
                  Categories:{" "}
                </span>
                {cats}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-2 text-xs">
              {values.media.length} media file
              {values.media.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="border-border/80 bg-muted/30 rounded-lg border border-dashed p-3 text-xs">
            <p className="text-foreground font-medium">Search preview</p>
            <p className="text-primary mt-2 truncate">{url}</p>
            <p className="text-foreground mt-1 font-medium">
              {values.seo.metaTitle.trim() || values.name || "Meta title"}
            </p>
            <p className="text-muted-foreground mt-1 line-clamp-3">
              {values.seo.metaDescription.trim() ||
                "Meta description will appear here."}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
