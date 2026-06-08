"use client";

import type { ComponentProps } from "react";
import { useRef } from "react";

import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageIcon, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

import type { VariantAttributeDefinition, VariantRow } from "./types";

function kindVariant(
  k: VariantAttributeDefinition["kind"]
): ComponentProps<typeof Badge>["variant"] {
  if (k === "color") return "default";
  if (k === "size") return "secondary";
  if (k === "type") return "outline";
  return "ghost";
}

function ComboBadges({
  row,
  defs,
}: {
  row: VariantRow;
  defs: VariantAttributeDefinition[];
}) {
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {defs.map((d) => (
        <Badge
          key={d.id}
          variant={kindVariant(d.kind)}
          className="text-[10px] font-normal"
        >
          {d.name}: {row.combo[d.id] ?? "—"}
        </Badge>
      ))}
    </div>
  );
}

function StatusBadge({ isLocalOnly }: { isLocalOnly?: boolean }) {
  if (isLocalOnly) {
    return (
      <Badge variant="outline" className="text-[10px] font-normal text-amber-600 border-amber-200">
        New
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] font-normal text-emerald-600 border-emerald-200">
      Saved
    </Badge>
  );
}

function VariantImageCell({
  row,
  onChange,
}: {
  row: VariantRow;
  onChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50"
        title={row.imageUrl ? "Change image" : "Add image"}
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

type VariantTableProps = {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onDelete?: (id: string) => void;
  onImageChange?: (id: string, file: File) => void;
};

export function VariantTable({
  selected,
  onToggle,
  onToggleAll,
  onDelete,
  onImageChange,
}: VariantTableProps) {
  const variants = useVariantWorkbenchStore((s) => s.variants);
  const attributes = useVariantWorkbenchStore((s) => s.attributes);
  const updateVariant = useVariantWorkbenchStore((s) => s.updateVariant);

  const allSelected = variants.length > 0 && selected.size === variants.length;

  if (!variants.length) {
    return (
      <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-8 text-center text-sm shadow-inner">
        No variants yet. Add attributes above, then click{" "}
        <strong>Generate matrix</strong>.
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-vendor-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pr-0">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all variants"
                />
              </TableHead>
              <TableHead className="min-w-[200px]">Combination</TableHead>
              <TableHead className="w-14">Image</TableHead>
              <TableHead className="min-w-[140px]">SKU</TableHead>
              <TableHead className="w-16">MOQ</TableHead>
              <TableHead className="w-20">Stock</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-20">Weight g (optional)</TableHead>
              <TableHead className="min-w-[120px]">L×W×H cm (optional)</TableHead>
              <TableHead className="min-w-[120px]">Barcode (optional)</TableHead>
              <TableHead className="w-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((row) => (
              <TableRow
                key={row.id}
                data-state={selected.has(row.id) ? "selected" : undefined}
              >
                <TableCell className="pr-0">
                  <input
                    type="checkbox"
                    className="accent-primary size-4"
                    checked={selected.has(row.id)}
                    onChange={() => onToggle(row.id)}
                    aria-label={`Select ${row.sku}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <ComboBadges row={row} defs={attributes} />
                    <StatusBadge isLocalOnly={row.isLocalOnly} />
                  </div>
                </TableCell>
                <TableCell>
                  {onImageChange ? (
                    <VariantImageCell
                      row={row}
                      onChange={(file) => onImageChange(row.id, file)}
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="bg-muted/50 block min-w-[120px] rounded-md px-2 py-1 font-mono text-xs tabular-nums">
                    {row.sku}
                  </span>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-14 text-xs tabular-nums"
                    min={1}
                    value={row.moq}
                    onChange={(e) =>
                      updateVariant(row.id, {
                        moq: Math.max(
                          1,
                          Number.parseInt(e.target.value, 10) || 1
                        ),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-16 text-xs tabular-nums"
                    min={0}
                    value={row.stock}
                    onChange={(e) =>
                      updateVariant(row.id, {
                        stock: Math.max(
                          0,
                          Number.parseInt(e.target.value, 10) || 0
                        ),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-20 text-xs tabular-nums"
                    min={0}
                    step={0.01}
                    value={row.price}
                    onChange={(e) =>
                      updateVariant(row.id, {
                        price: Math.max(
                          0,
                          Number.parseFloat(e.target.value) || 0
                        ),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-16 text-xs tabular-nums"
                    min={0}
                    value={row.weightGrams}
                    onChange={(e) =>
                      updateVariant(row.id, {
                        weightGrams: Math.max(
                          0,
                          Number.parseInt(e.target.value, 10) || 0
                        ),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      className="h-8 w-12 px-1 text-[10px] tabular-nums"
                      title="Length cm"
                      value={row.lengthCm}
                      onChange={(e) =>
                        updateVariant(row.id, {
                          lengthCm: Math.max(
                            0,
                            Number.parseFloat(e.target.value) || 0
                          ),
                        })
                      }
                    />
                    <Input
                      type="number"
                      className="h-8 w-12 px-1 text-[10px] tabular-nums"
                      title="Width cm"
                      value={row.widthCm}
                      onChange={(e) =>
                        updateVariant(row.id, {
                          widthCm: Math.max(
                            0,
                            Number.parseFloat(e.target.value) || 0
                          ),
                        })
                      }
                    />
                    <Input
                      type="number"
                      className="h-8 w-12 px-1 text-[10px] tabular-nums"
                      title="Height cm"
                      value={row.heightCm}
                      onChange={(e) =>
                        updateVariant(row.id, {
                          heightCm: Math.max(
                            0,
                            Number.parseFloat(e.target.value) || 0
                          ),
                        })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 min-w-[100px] font-mono text-xs"
                    value={row.barcode}
                    onChange={(e) =>
                      updateVariant(row.id, { barcode: e.target.value })
                    }
                    placeholder="—"
                  />
                </TableCell>
                <TableCell className="text-right">
                  {onDelete ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete variant"
                      onClick={() => onDelete(row.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="border-border bg-muted/20 text-muted-foreground border-t px-3 py-2 text-xs">
        {variants.length} row{variants.length === 1 ? "" : "s"} · quick price
        check:{" "}
        {formatCurrency(
          variants.reduce((s, r) => s + r.price, 0) /
            Math.max(1, variants.length)
        )}{" "}
        avg price
      </div>
    </Card>
  );
}
