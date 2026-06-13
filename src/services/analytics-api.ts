import {
  getVendorAnalyticsDashboard,
  getVendorAnalyticsInventory,
  getVendorAnalyticsOrders,
  getVendorAnalyticsProducts,
} from "@/services/vendor/analytics-gateway-api";
import type {
  AnalyticsDatePreset,
  AnalyticsReport,
} from "@/modules/analytics/types";

function presetToDays(preset: AnalyticsDatePreset): number {
  switch (preset) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "12m": return 365;
  }
}

function rangeLabelFor(preset: AnalyticsDatePreset): string {
  switch (preset) {
    case "7d": return "Last 7 days";
    case "30d": return "Last 30 days";
    case "90d": return "Last 90 days";
    case "12m": return "Last 12 months";
  }
}

function safeNumber(v: string | number | undefined | null): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function fetchVendorAnalyticsReport(
  preset: AnalyticsDatePreset,
  options?: { signal?: AbortSignal }
): Promise<AnalyticsReport> {
  const days = presetToDays(preset);

  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const [dashboard, orders, products, inventory] = await Promise.all([
    getVendorAnalyticsDashboard(),
    getVendorAnalyticsOrders({ days }),
    getVendorAnalyticsProducts(),
    getVendorAnalyticsInventory({ days }),
  ]);

  const revenueTrend = orders.map((o) => ({
    label: o.date.slice(5),
    value: safeNumber(o.revenue),
  }));
  const orderVolume = orders.map((o) => ({
    label: o.date.slice(5),
    value: o.orders ?? 0,
  }));

  const topProducts = (dashboard.topProducts ?? []).map((p) => ({
    label: p.productTitle || "Unknown",
    value: safeNumber(p.revenue),
  }));

  const categoryPerformance = products.slice(0, 6).map((p) => ({
    label: p.title,
    value: p.totalSold ?? 0,
  }));

  const retentionSeries = (dashboard.retentionSeries ?? []).map((r) => ({
    label: r.label,
    value: r.rate,
  }));

  const velocitySeries = (inventory?.items ?? []).map((i) => ({
    label: i.label,
    value: i.unitsSold,
  }));

  const geographic = (dashboard.geographic ?? []).map((g) => ({
    name: g.name || g.countryCode,
    value: safeNumber(g.revenue),
  }));

  return {
    preset,
    rangeLabel: rangeLabelFor(preset),
    revenueTrend,
    topProducts,
    conversionRate: dashboard.conversionRate ?? 0,
    conversionTrend: dashboard.conversionTrend ?? [],
    categoryPerformance,
    retentionSeries,
    velocitySeries,
    orderVolume,
    geographic,
  };
}
