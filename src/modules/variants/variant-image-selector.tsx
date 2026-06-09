"use client";

import { useState } from "react";
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

import type { VariantRow } from "./types";

type VariantImageSelectorProps = {
  row: VariantRow;
};

export function VariantImageSelector({ row }: VariantImageSelectorProps) {
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50"
        title={row.imageUrl ? "Change image" : "Select image"}
      >
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="size-4 text-muted-foreground" />
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select variant image</DialogTitle>
            <DialogDescription>
              Choose one of the product images to associate with this variant.
            </DialogDescription>
          </DialogHeader>

          {productImages.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              No product images available. Upload images on the product detail
              page first.
            </div>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto p-1">
              {productImages.map((img) => {
                const selected = row.imageUrl === img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => img.url && handleSelect(img.url)}
                    className={`group relative aspect-square overflow-hidden rounded-lg border transition-all ${
                      selected
                        ? "border-primary ring-2 ring-primary"
                        : "border-border hover:border-primary/60"
                    }`}
                    title={img.fileName || ""}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="h-full w-full object-cover"
                    />
                    {selected && (
                      <span className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                        ✓
                      </span>
                    )}
                  </button>
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
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
