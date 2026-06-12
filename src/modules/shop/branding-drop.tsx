"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

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
  const t = useTranslations("shop.brandingDrop");
  const inputId = `shop-brand-${label.replace(/\s/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-2">
      <Label className="text-foreground/90 text-sm font-medium">{label}</Label>
      {hint ? <VendorMuted className="text-xs">{hint}</VendorMuted> : null}
      <div
        className={cn(
          "group relative flex flex-col gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-muted/20 sm:flex-row sm:items-center",
          tall && "sm:items-start"
        )}
      >
        {/* Preview thumbnail */}
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background shadow-sm",
            tall ? "h-32 w-full sm:h-40 sm:w-64" : "size-28"
          )}
        >
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease: easeOutExpo }}
                className="relative flex h-full w-full items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`${label} preview`}
                  className="max-h-full max-w-full object-contain"
                />
                {/* Remove overlay button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity duration-200 group-hover:bg-black/20 group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    className="size-8 rounded-full shadow-lg"
                    onClick={onClear}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60"
              >
                <ImageIcon className="size-10" aria-hidden />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {t("noImage")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="min-w-0 flex-1 space-y-3">
          {fileName ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground truncate text-xs font-medium"
            >
              {fileName}
            </motion.p>
          ) : (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t("hint", { formats: accept.includes("svg") ? "PNG, JPG, SVG" : "PNG, JPG" })}
            </p>
          )}
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
              className="gap-1.5 rounded-lg"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <Upload className="size-3.5" />
              {t("upload")}
            </Button>
            {preview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={onClear}
              >
                <X className="size-3.5" />
                {t("remove")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
