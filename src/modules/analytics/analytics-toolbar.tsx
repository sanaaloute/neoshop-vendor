"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { AnalyticsDatePreset } from "./types";

function usePresetLabels() {
  const t = useTranslations("analytics");
  return [
    { id: "7d" as const, label: t("preset7d") },
    { id: "30d" as const, label: t("preset30d") },
    { id: "90d" as const, label: t("preset90d") },
    { id: "12m" as const, label: t("preset12m") },
  ];
}

type AnalyticsToolbarProps = {
  preset: AnalyticsDatePreset;
  onPresetChange: (p: AnalyticsDatePreset) => void;
  onExportCsv: () => void;
  rangeLabel: string;
};

export function AnalyticsToolbar({
  preset,
  onPresetChange,
  onExportCsv,
  rangeLabel,
}: AnalyticsToolbarProps) {
  const t = useTranslations("analytics");
  const presets = usePresetLabels();
  return (
    <Card className="border-border/80 shadow-vendor-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t("dateRange")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{rangeLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-muted/50 flex flex-wrap gap-1.5 rounded-lg p-1">
          {presets.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={preset === p.id ? "default" : "ghost"}
              className="h-8 rounded-md px-3"
              onClick={() => onPresetChange(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={onExportCsv}
        >
          <Download className="size-4" aria-hidden />
          {t("exportCsv")}
        </Button>
      </div>
    </Card>
  );
}
