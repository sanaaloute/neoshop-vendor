"use client";

import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

import type { VariantAttributeKind } from "./types";
import { emptyGenerationDefaults } from "./types";

const KIND_OPTIONS: { value: VariantAttributeKind; label: string }[] = [
  { value: "color", label: "Color" },
  { value: "size", label: "Size" },
  { value: "type", label: "Type" },
  { value: "custom", label: "Custom" },
];

export function VariantMatrixPanel() {
  const skuPrefix = useVariantWorkbenchStore((s) => s.skuPrefix);
  const setSkuPrefix = useVariantWorkbenchStore((s) => s.setSkuPrefix);
  const attributes = useVariantWorkbenchStore((s) => s.attributes);
  const addAttribute = useVariantWorkbenchStore((s) => s.addAttribute);
  const removeAttribute = useVariantWorkbenchStore((s) => s.removeAttribute);
  const renameAttribute = useVariantWorkbenchStore((s) => s.renameAttribute);
  const setAttributeKind = useVariantWorkbenchStore((s) => s.setAttributeKind);
  const addValueToAttribute = useVariantWorkbenchStore(
    (s) => s.addValueToAttribute
  );
  const removeValueFromAttribute = useVariantWorkbenchStore(
    (s) => s.removeValueFromAttribute
  );
  const generateMatrix = useVariantWorkbenchStore((s) => s.generateMatrix);
  const variants = useVariantWorkbenchStore((s) => s.variants);
  const resetWorkbench = useVariantWorkbenchStore((s) => s.resetWorkbench);
  const regenerateSkus = useVariantWorkbenchStore((s) => s.regenerateSkus);

  const [defaults, setDefaults] = useState(emptyGenerationDefaults);
  const [valueDraft, setValueDraft] = useState<Record<string, string>>({});
  const [newAttrName, setNewAttrName] = useState("Color");

  const canGenerate =
    attributes.length > 0 && attributes.every((a) => a.values.length > 0);

  const expectedCount =
    attributes.length > 0
      ? attributes.reduce((n, a) => n * Math.max(1, a.values.length), 1)
      : 0;

  return (
    <Card className="border-border/80 shadow-vendor-card p-4 md:p-6">
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Matrix generator
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => regenerateSkus()}
          >
            Regenerate SKUs
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetWorkbench()}
          >
            Reset to defaults
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="sku-prefix">SKU prefix</Label>
          <Input
            id="sku-prefix"
            value={skuPrefix}
            onChange={(e) => setSkuPrefix(e.target.value)}
            placeholder="PROD-001"
          />
        </div>

        <div className="border-border/80 bg-muted/20 rounded-lg border border-dashed p-3">
          <p className="text-foreground text-xs font-medium">
            Defaults for generated rows
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DefaultNum
              label="MOQ"
              value={defaults.moq}
              onChange={(moq) => setDefaults((d) => ({ ...d, moq }))}
              min={1}
              step={1}
            />
            <DefaultNum
              label="Stock"
              value={defaults.stock}
              onChange={(stock) => setDefaults((d) => ({ ...d, stock }))}
              min={0}
              step={1}
            />
            <DefaultNum
              label="Price"
              value={defaults.price}
              onChange={(price) => setDefaults((d) => ({ ...d, price }))}
              min={0.01}
              step={0.01}
            />
            <DefaultNum
              label="Weight (g) (optional)"
              value={defaults.weightGrams}
              onChange={(weightGrams) =>
                setDefaults((d) => ({ ...d, weightGrams }))
              }
              min={0}
              step={1}
            />
            <DefaultNum
              label="L (cm) (optional)"
              value={defaults.lengthCm}
              onChange={(lengthCm) => setDefaults((d) => ({ ...d, lengthCm }))}
              min={0}
              step={0.1}
            />
            <DefaultNum
              label="W (cm) (optional)"
              value={defaults.widthCm}
              onChange={(widthCm) => setDefaults((d) => ({ ...d, widthCm }))}
              min={0}
              step={0.1}
            />
            <DefaultNum
              label="H (cm) (optional)"
              value={defaults.heightCm}
              onChange={(heightCm) => setDefaults((d) => ({ ...d, heightCm }))}
              min={0}
              step={0.1}
            />
          </div>
          <div className="mt-2 grid gap-1">
            <Label className="text-xs">
              Barcode (optional, same for all new rows)
            </Label>
            <Input
              className="h-8 text-xs"
              value={defaults.barcode}
              onChange={(e) =>
                setDefaults((d) => ({ ...d, barcode: e.target.value }))
              }
              placeholder="EAN-13 or internal"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className="border-border bg-card/50 rounded-lg border p-3 shadow-inner"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <Input
                  className="h-8 max-w-[140px] text-sm font-medium"
                  value={attr.name}
                  onChange={(e) => renameAttribute(attr.id, e.target.value)}
                  aria-label="Attribute name"
                />
                <select
                  className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                  value={attr.kind}
                  onChange={(e) =>
                    setAttributeKind(
                      attr.id,
                      e.target.value as VariantAttributeKind
                    )
                  }
                >
                  {KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => removeAttribute(attr.id)}
                title="Remove attribute"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {attr.values.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="border-border bg-muted/60 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                  onClick={() => removeValueFromAttribute(attr.id, v)}
                  title="Click to remove"
                >
                  {v}
                  <span className="text-muted-foreground">×</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                placeholder="New value"
                value={valueDraft[attr.id] ?? ""}
                onChange={(e) =>
                  setValueDraft((d) => ({ ...d, [attr.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addValueToAttribute(attr.id, valueDraft[attr.id] ?? "");
                    setValueDraft((d) => ({ ...d, [attr.id]: "" }));
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 shrink-0"
                onClick={() => {
                  addValueToAttribute(attr.id, valueDraft[attr.id] ?? "");
                  setValueDraft((d) => ({ ...d, [attr.id]: "" }));
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-1 flex-wrap gap-2">
          <Input
            className="h-9 max-w-xs"
            placeholder="New attribute name"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              addAttribute(newAttrName || "Color", "color");
              setNewAttrName("Color");
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add attribute
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {canGenerate
              ? `${expectedCount} combination${expectedCount === 1 ? "" : "s"}`
              : "Each attribute needs at least one value."}
          </span>
          <Button
            type="button"
            disabled={!canGenerate}
            onClick={() => generateMatrix(defaults)}
            className="gap-1.5"
          >
            <Sparkles className="size-4" aria-hidden />
            Generate matrix
          </Button>
        </div>
      </div>

      {variants.length > 0 ? (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Generating replaces all {variants.length} existing variant rows with a
          fresh matrix from the current axes.
        </p>
      ) : null}
    </Card>
  );
}

function DefaultNum({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  step: number;
}) {
  return (
    <div className="grid gap-0.5">
      <Label className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </Label>
      <Input
        type="number"
        className="h-8 text-xs tabular-nums"
        min={min}
        step={step}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? min : Number.parseFloat(raw));
        }}
      />
    </div>
  );
}
