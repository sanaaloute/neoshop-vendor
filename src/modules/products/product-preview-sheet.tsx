"use client";

import { useTranslations } from "next-intl";
// NOTE: Price is managed at the variant level; preview no longer shows product-level price.
import { Star } from "lucide-react";

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
  const t = useTranslations("products");
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
          <SheetTitle>{t("productPreview")}</SheetTitle>
          <SheetDescription>
            {t("buyerFacingSummary")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="border-border bg-card shadow-vendor-card rounded-xl border p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {values.status}
              </Badge>
            </div>
            <h3 className="text-lg leading-tight font-semibold">
              {values.name.trim() || t("untitledProduct")}
            </h3>

            <p className="text-muted-foreground mt-3 line-clamp-4 text-sm">
              {values.description.trim() || t("noDescriptionYet")}
            </p>
            {cats ? (
              <p className="text-muted-foreground mt-3 text-xs">
                <span className="text-foreground font-medium">
                  {t("categories")}:{" "}
                </span>
                {cats}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-2 text-xs">
              {t("mediaFiles", { count: values.media.length })}
            </p>
            {values.reviewsCount != null && values.reviewsCount > 0 ? (
              <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i < Math.round(parseFloat(values.averageRating ?? "0") || 0)
                          ? "fill-red-400 text-red-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </span>
                <span>
                  {values.averageRating ?? "0"} · {t("reviewsCount", { count: values.reviewsCount })}
                </span>
              </div>
            ) : null}
          </div>

          <div className="border-border/80 bg-muted/30 rounded-lg border border-dashed p-3 text-xs">
            <p className="text-foreground font-medium">{t("searchPreview")}</p>
            <p className="text-primary mt-2 truncate">{url}</p>
            <p className="text-foreground mt-1 font-medium">
              {values.name || t("metaTitle")}
            </p>
            <p className="text-muted-foreground mt-1 line-clamp-3">
              {t("metaDescription")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
