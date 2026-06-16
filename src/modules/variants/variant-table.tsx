"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
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
import { VariantImageSelector } from "./variant-image-selector";

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
    <div className="flex flex-wrap gap-1">
      {defs.map((d) => (
        <Badge
          key={d.id}
          variant={kindVariant(d.kind)}
          className="text-[10px] font-normal whitespace-nowrap"
        >
          {d.name}: {row.combo[d.id] ?? "—"}
        </Badge>
      ))}
    </div>
  );
}

function StatusBadge({ isLocalOnly, t }: { isLocalOnly?: boolean; t: ReturnType<typeof useTranslations> }) {
  if (isLocalOnly) {
    return (
      <Badge variant="outline" className="text-[10px] font-normal text-amber-600 border-amber-200">
        {t("newStatus")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] font-normal text-emerald-600 border-emerald-200">
      {t("savedStatus")}
    </Badge>
  );
}

type VariantTableProps = {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onDelete?: (id: string) => void;
};

export function VariantTable({
  selected,
  onToggle,
  onToggleAll,
  onDelete,
}: VariantTableProps) {
  const t = useTranslations("variants");
  const variants = useVariantWorkbenchStore((s) => s.variants);
  const attributes = useVariantWorkbenchStore((s) => s.attributes);
  const updateVariant = useVariantWorkbenchStore((s) => s.updateVariant);

  const allSelected = variants.length > 0 && selected.size === variants.length;

  if (!variants.length) {
    return (
      <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-8 text-center text-sm shadow-inner">
        {t("noVariantsYet", { strong: t("generateMatrix") })}
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
                  aria-label={t("selectAll")}
                />
              </TableHead>
              <TableHead className="min-w-[200px]">{t("combination")}</TableHead>
              <TableHead className="w-14">{t("image")}</TableHead>
              <TableHead className="w-48">{t("price")}</TableHead>
              <TableHead className="w-10 text-right">{t("actions")}</TableHead>
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
                    aria-label={t("selectAll")}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ComboBadges row={row} defs={attributes} />
                    <StatusBadge isLocalOnly={row.isLocalOnly} t={t} />
                  </div>
                </TableCell>
                <TableCell>
                  <VariantImageSelector row={row} />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-48 text-xs tabular-nums font-mono"
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
                <TableCell className="text-right">
                  {onDelete ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={t("deleteVariant")}
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
        {t("rowsCount", { count: variants.length })} · {t("quickPriceCheck")}:{" "}
        {formatCurrency(
          variants.reduce((s, r) => s + r.price, 0) /
            Math.max(1, variants.length)
        )}{" "}
        {t("avgPrice")}
      </div>
    </Card>
  );
}
