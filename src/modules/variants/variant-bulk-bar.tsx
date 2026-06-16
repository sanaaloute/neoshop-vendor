"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

type VariantBulkBarProps = {
  selected: Set<string>;
  onClearSelection: () => void;
};

export function VariantBulkBar({
  selected,
  onClearSelection,
}: VariantBulkBarProps) {
  const t = useTranslations("variants");
  const bulkUpdateVariants = useVariantWorkbenchStore(
    (s) => s.bulkUpdateVariants
  );

  const [price, setPrice] = useState("");

  if (selected.size === 0) return null;

  const apply = () => {
    const ids = [...selected];
    const patch: Parameters<typeof bulkUpdateVariants>[1] = {};
    if (price.trim()) patch.price = Math.max(0, Number.parseFloat(price) || 0);
    if (Object.keys(patch).length) {
      bulkUpdateVariants(ids, patch);
    }
    setPrice("");
    onClearSelection();
  };

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-vendor-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-sm font-medium">
          {t("bulkUpdate", { count: selected.size })}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("price")} value={price} onChange={setPrice} className="w-60" />
          <Button type="button" size="sm" onClick={() => apply()}>
            {t("apply")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            {t("clear")}
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
  placeholder = "—",
  className = "w-20",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1", className)}>
      <Label className="text-xs">{label}</Label>
      <Input
        className="h-9 text-xs tabular-nums font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
