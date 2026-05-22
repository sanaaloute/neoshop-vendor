"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

type BrandingDropProps = {
  label: string;
  hint?: string;
  preview: string | null;
  fileName: string | null;
  accept: string;
  onPick: (file: File) => void | Promise<void>;
  onClear: () => void;
  tall?: boolean;
};

export function BrandingDrop({
  label,
  hint,
  preview,
  fileName,
  accept,
  onPick,
  onClear,
  tall,
}: BrandingDropProps) {
  const inputId = `shop-brand-${label.replace(/\s/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <VendorMuted className="text-xs">{hint}</VendorMuted> : null}
      <div
        className={cn(
          "border-border/80 bg-muted/15 flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center",
          tall && "sm:items-start"
        )}
      >
        <div
          className={cn(
            "border-border/60 bg-background flex shrink-0 items-center justify-center overflow-hidden rounded-lg border",
            tall ? "h-28 w-full sm:h-36 sm:w-56" : "size-24"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={`${label} preview`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImageIcon
              className="text-muted-foreground/60 size-10"
              aria-hidden
            />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {fileName ? (
            <p className="text-muted-foreground truncate text-xs">{fileName}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <input
              id={inputId}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) await onPick(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              Upload
            </Button>
            {preview ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
