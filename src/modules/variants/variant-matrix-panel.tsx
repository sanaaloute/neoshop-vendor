"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/use-categories";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

import { CATEGORY_ATTRIBUTE_PRESETS } from "./category-attribute-presets";
import type { VariantAttributeKind } from "./types";
import { emptyGenerationDefaults } from "./types";

function useKindOptions(t: ReturnType<typeof useTranslations>): { value: VariantAttributeKind; label: string }[] {
  return [
    { value: "color", label: t("kindColor") },
    { value: "size", label: t("kindSize") },
    { value: "type", label: t("kindType") },
    { value: "custom", label: t("kindCustom") },
  ];
}

export function VariantMatrixPanel() {
  const t = useTranslations("variants");
  const productId = useVariantWorkbenchStore((s) => s.productId);
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

  const [defaults, setDefaults] = useState(emptyGenerationDefaults);
  const [valueDraft, setValueDraft] = useState<Record<string, string>>({});
  const [newAttrName, setNewAttrName] = useState("");

  const KIND_OPTIONS = useKindOptions(t);

  const canGenerate =
    attributes.length > 0 && attributes.every((a) => a.values.length > 0);

  const expectedCount =
    attributes.length > 0
      ? attributes.reduce((n, a) => n * Math.max(1, a.values.length), 1)
      : 0;

  // Product categories
  const products = useProductCatalogStore((s) => s.products);
  const product = products.find((p) => p.id === productId);
  const categories = useCategories();
  const productCategoryNames = useMemo(() => {
    if (!product) return [];
    return product.categoryIds
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];
  }, [product, categories]);

  // Suggested attributes based on product categories
  const suggestedAttributes = useMemo(() => {
    if (!productCategoryNames.length) return [];
    const seen = new Set(attributes.map((a) => a.name.toLowerCase()));
    const result: Array<{
      name: string;
      kind: VariantAttributeKind;
      values: string[];
    }> = [];
    for (const rawName of productCategoryNames) {
      const presets = CATEGORY_ATTRIBUTE_PRESETS[rawName.trim().toLowerCase()];
      if (!presets) continue;
      for (const preset of presets) {
        if (seen.has(preset.name.toLowerCase())) continue;
        seen.add(preset.name.toLowerCase());
        result.push(preset);
      }
    }
    return result;
  }, [productCategoryNames, attributes]);

  const handleAddSuggestedAttribute = (
    name: string,
    kind: VariantAttributeKind,
    values: string[]
  ) => {
    const id = addAttribute(name, kind);
    for (const value of values) {
      addValueToAttribute(id, value);
    }
  };

  return (
    <Card className="border-border/80 shadow-vendor-card p-4 md:p-6">
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {t("matrixGenerator")}
          </h2>
          {productCategoryNames.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs">{t("categories")}:</span>
              {productCategoryNames.map((name) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetWorkbench()}
          >
            {t("resetToDefaults")}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="border-border/80 bg-muted/20 rounded-lg border border-dashed p-3">
          <p className="text-foreground text-xs font-medium">
            {t("defaultsForGeneratedRows")}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <DefaultNum
              label={t("stock")}
              value={defaults.stock}
              onChange={(stock) => setDefaults((d) => ({ ...d, stock }))}
              min={0}
              step={1}
            />
            <DefaultNum
              label={t("price")}
              value={defaults.price}
              onChange={(price) => setDefaults((d) => ({ ...d, price }))}
              min={0.01}
              step={0.01}
            />
            <DefaultNum
              label={t("weightG")}
              value={defaults.weightGrams}
              onChange={(weightGrams) =>
                setDefaults((d) => ({ ...d, weightGrams }))
              }
              min={0}
              step={1}
            />
            <DefaultNum
              label={t("lengthCm")}
              value={defaults.lengthCm}
              onChange={(lengthCm) => setDefaults((d) => ({ ...d, lengthCm }))}
              min={0}
              step={0.1}
            />
            <DefaultNum
              label={t("widthCm")}
              value={defaults.widthCm}
              onChange={(widthCm) => setDefaults((d) => ({ ...d, widthCm }))}
              min={0}
              step={0.1}
            />
            <DefaultNum
              label={t("heightCm")}
              value={defaults.heightCm}
              onChange={(heightCm) => setDefaults((d) => ({ ...d, heightCm }))}
              min={0}
              step={0.1}
            />
            <div className="grid gap-0.5">
              <Label className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {t("barcode")}
              </Label>
              <Input
                className="h-8 w-28 text-xs"
                value={defaults.barcode}
                onChange={(e) =>
                  setDefaults((d) => ({ ...d, barcode: e.target.value }))
                }
                placeholder={t("ean13")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested attributes */}
      {suggestedAttributes.length > 0 && (
        <div className="mt-4">
          <p className="text-foreground mb-2 text-xs font-medium">
            {t("suggestedAttributes")}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedAttributes.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  handleAddSuggestedAttribute(
                    preset.name,
                    preset.kind,
                    preset.values
                  )
                }
                className="border-border bg-card hover:bg-muted/60 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors"
              >
                <Plus className="size-3.5 text-primary" />
                <span className="font-medium">{preset.name}</span>
                <span className="text-muted-foreground">
                  {t("values", { count: preset.values.length })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
                  aria-label={t("newAttributeName")}
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
                title={t("removeAttribute")}
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
                  title={t("clickToRemove")}
                >
                  {v}
                  <span className="text-muted-foreground">×</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                placeholder={t("newValue")}
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
                {t("add")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-1 flex-wrap gap-2">
          <Input
            className="h-9 max-w-xs"
            placeholder={t("newAttributeName")}
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              addAttribute(newAttrName || t("kindColor"), "color");
              setNewAttrName("");
            }}
          >
            <Plus className="size-4" aria-hidden />
            {t("addAttribute")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {canGenerate
              ? t("combinations", { count: expectedCount })
              : t("eachAttributeNeedsValue")}
          </span>
          <Button
            type="button"
            disabled={!canGenerate}
            onClick={() => generateMatrix(defaults)}
            className="gap-1.5"
          >
            <Sparkles className="size-4" aria-hidden />
            {t("generateMatrix")}
          </Button>
        </div>
      </div>

      {variants.length > 0 ? (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          {t("generateReplacesWarning", { count: variants.length })}
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
        className="h-8 w-20 text-xs tabular-nums"
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
