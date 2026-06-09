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

import type { VariantAttributeDefinition, VariantRow } from "./types";

type VariantPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  attributes: VariantAttributeDefinition[];
  rows: VariantRow[];
};

export function VariantPreviewSheet({
  open,
  onOpenChange,
  title,
  attributes,
  rows,
}: VariantPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="border-border border-b text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Preview how variants and options look on packing and fulfillment
            views.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing to preview.</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="border-border bg-card shadow-vendor-card rounded-xl border p-3 text-sm"
              >
                <div className="flex flex-wrap gap-1">
                  {attributes.map((a) => (
                    <Badge
                      key={a.id}
                      variant="outline"
                      className="text-[10px] capitalize"
                    >
                      {a.name}: {row.combo[a.id] ?? "—"}
                    </Badge>
                  ))}
                </div>
                {row.imageUrl ? (
                  <img
                    src={row.imageUrl}
                    alt=""
                    className="mt-2 h-24 w-24 rounded-lg object-cover"
                  />
                ) : null}
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div>
                    <dt className="text-muted-foreground">MOQ</dt>
                    <dd className="font-medium tabular-nums">{row.moq}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Stock</dt>
                    <dd className="font-medium tabular-nums">{row.stock}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="font-medium tabular-nums">
                      {formatCurrency(row.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Weight</dt>
                    <dd className="font-medium tabular-nums">
                      {row.weightGrams} g
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">
                      Dimensions (L×W×H)
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {row.lengthCm} × {row.widthCm} × {row.heightCm} cm
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Barcode</dt>
                    <dd className="font-mono text-xs">
                      {row.barcode.trim() || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
