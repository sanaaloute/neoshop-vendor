export type AnalyticsDatePreset = "7d" | "30d" | "90d" | "12m";

export const ANALYTICS_DATE_PRESETS: AnalyticsDatePreset[] = [
  "7d",
  "30d",
  "90d",
  "12m",
];

export function parseAnalyticsPreset(
  value: string | null | undefined
): AnalyticsDatePreset {
  if (value && ANALYTICS_DATE_PRESETS.includes(value as AnalyticsDatePreset)) {
    return value as AnalyticsDatePreset;
  }
  return "30d";
}

export type AnalyticsAreaPoint = { label: string; value: number };

export type AnalyticsBarRow = { label: string; value: number };

export type AnalyticsGeoSlice = { name: string; value: number };

/** Analytics report built from gateway dashboard + orders + products endpoints. */
export type AnalyticsReport = {
  preset: AnalyticsDatePreset;
  rangeLabel: string;
  revenueTrend: AnalyticsAreaPoint[];
  topProducts: AnalyticsBarRow[];
  conversionRate: number;
  conversionTrend: AnalyticsAreaPoint[];
  categoryPerformance: AnalyticsBarRow[];
  retentionSeries: AnalyticsAreaPoint[];
  velocitySeries: AnalyticsAreaPoint[];
  orderVolume: AnalyticsAreaPoint[];
  geographic: AnalyticsGeoSlice[];
};
