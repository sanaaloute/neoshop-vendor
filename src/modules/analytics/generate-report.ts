import type { AnalyticsDatePreset, AnalyticsReport } from "./types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Neutral charts when analytics gateway is unavailable. */
export function emptyAnalyticsReport(
  preset: AnalyticsDatePreset
): AnalyticsReport {
  const daily = DAYS.map((label) => ({ label, value: 0 }));
  const monthly = MONTHS.slice(0, 12).map((label) => ({ label, value: 0 }));
  const isMonthly = preset === "12m";
  const z = isMonthly ? monthly : daily;
  return {
    preset,
    rangeLabel: "Report unavailable",
    revenueTrend: z,
    topProducts: [],
    conversionRate: 0,
    conversionTrend: z,
    categoryPerformance: [],
    retentionSeries: monthly,
    velocitySeries: z,
    orderVolume: z,
    geographic: [],
  };
}
