"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { AnalyticsDatePreset } from "./types";

const PRESETS: { id: AnalyticsDatePreset; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "12m", label: "12 months" },
];

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
  return (
    <Card className="border-border/80 shadow-vendor-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Date range
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{rangeLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-muted/50 flex flex-wrap gap-1.5 rounded-lg p-1">
          {PRESETS.map((p) => (
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
          Export CSV
        </Button>
      </div>
    </Card>
  );
}
