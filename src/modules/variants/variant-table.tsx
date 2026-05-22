"use client";

import type { ComponentProps } from "react";

import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type VariantTableProps = {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
};

export function VariantTable({
  selected,
  onToggle,
  onToggleAll,
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
              <TableHead className="min-w-[140px]">SKU</TableHead>
              <TableHead className="w-16">MOQ</TableHead>
              <TableHead className="w-20">Stock</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-20">Weight g</TableHead>
              <TableHead className="min-w-[120px]">L×W×H cm</TableHead>
              <TableHead className="min-w-[120px]">Barcode</TableHead>
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
                  <ComboBadges row={row} defs={attributes} />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 min-w-[120px] font-mono text-xs"
                    value={row.sku}
                    onChange={(e) =>
                      updateVariant(row.id, { sku: e.target.value })
                    }
                  />
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
