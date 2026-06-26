"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";
import { cn } from "@/lib/utils";

import type { VariantRow } from "./types";

type VariantImageSelectorProps = {
  row: VariantRow;
};

export function VariantImageSelector({ row }: VariantImageSelectorProps) {
  const t = useTranslations("variants");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const productImages = useVariantWorkbenchStore((s) => s.productImages);
  const updateVariant = useVariantWorkbenchStore((s) => s.updateVariant);

  const handleSelect = (url: string) => {
    updateVariant(row.id, { imageUrl: url });
    setOpen(false);
  };

  const handleClear = () => {
    updateVariant(row.id, { imageUrl: "" });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="border-border/60 bg-muted/30 hover:bg-muted/50 relative h-10 w-10 overflow-hidden rounded-md border"
        title={row.imageUrl ? t("changeImage") : t("selectImage")}
      >
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="text-muted-foreground size-4" />
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("selectVariantImage")}</DialogTitle>
            <DialogDescription>{t("chooseProductImage")}</DialogDescription>
          </DialogHeader>

          {productImages.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {t("noProductImages")}
            </div>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto p-1">
              {productImages.map((img) => {
                const selected = row.imageUrl === img.url;
                return (
                  <Button
                    key={img.id}
                    type="button"
                    variant="outline"
                    onClick={() => img.url && handleSelect(img.url)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border p-0 transition-all hover:scale-[1.02]",
                      selected
                        ? "border-primary ring-primary ring-2"
                        : "border-border hover:border-primary/60"
                    )}
                    title={img.fileName || ""}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="h-full w-full object-cover"
                    />
                    {selected && (
                      <span className="bg-primary text-primary-foreground absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium">
                        ✓
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {row.imageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <X className="mr-1 size-3.5" />
                {tc("remove")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
