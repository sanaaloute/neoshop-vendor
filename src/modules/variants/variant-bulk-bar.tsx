"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

type VariantBulkBarProps = {
  selected: Set<string>;
  onClearSelection: () => void;
};

export function VariantBulkBar({
  selected,
  onClearSelection,
}: VariantBulkBarProps) {
  const bulkUpdateVariants = useVariantWorkbenchStore(
    (s) => s.bulkUpdateVariants
  );

  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [barcode, setBarcode] = useState("");

  if (selected.size === 0) return null;

  const apply = () => {
    const ids = [...selected];
    const patch: Parameters<typeof bulkUpdateVariants>[1] = {};
    if (stock.trim())
      patch.stock = Math.max(0, Number.parseInt(stock, 10) || 0);
    if (price.trim()) patch.price = Math.max(0, Number.parseFloat(price) || 0);
    if (weight.trim()) {
      patch.weightGrams = Math.max(0, Number.parseInt(weight, 10) || 0);
    }
    if (barcode.trim()) patch.barcode = barcode.trim();
    if (Object.keys(patch).length) {
      bulkUpdateVariants(ids, patch);
    }
    setStock("");
    setPrice("");
    setWeight("");
    setBarcode("");
    onClearSelection();
  };

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-vendor-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-sm font-medium">
          Bulk update ({selected.size} selected)
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Stock" value={stock} onChange={setStock} />
          <Field label="Price" value={price} onChange={setPrice} />
          <Field label="Weight g (optional)" value={weight} onChange={setWeight} />
          <div className="grid min-w-[8rem] gap-1">
            <Label className="text-xs">Barcode (optional)</Label>
            <Input
              className="h-9 text-xs"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="optional"
            />
          </div>
          <Button type="button" size="sm" onClick={() => apply()}>
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid w-20 gap-1">
      <Label className="text-xs">{label}</Label>
      <Input
        className="h-9 text-xs tabular-nums"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
      />
    </div>
  );
}
