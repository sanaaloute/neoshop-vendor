"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ProductFormValues } from "./types";

type BulkPricingEditorProps = {
  control: Control<ProductFormValues>;
};

export function BulkPricingEditor({ control }: BulkPricingEditorProps) {
  const t = useTranslations("products");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "bulkPricing",
  });

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("bulkPricing")}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ minQuantity: 100, unitPrice: 0 })}
        >
          <Plus className="mr-1 size-3.5" />
          {t("addTier")}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          {t("noBulkPricingTiers")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2">
              <div className="grid flex-1 gap-1">
                <Label className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  {t("minQty")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="h-8 text-xs tabular-nums"
                  {...control.register(
                    `bulkPricing.${index}.minQuantity` as const,
                    { valueAsNumber: true }
                  )}
                />
              </div>
              <div className="grid flex-1 gap-1">
                <Label className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  {t("unitPrice")}
                </Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  className="h-8 text-xs tabular-nums"
                  {...control.register(
                    `bulkPricing.${index}.unitPrice` as const,
                    { valueAsNumber: true }
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive mb-0.5"
                onClick={() => remove(index)}
                title={t("removeTier")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
