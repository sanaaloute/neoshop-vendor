import {
  getVendorAnalyticsDashboard,
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

export async function fetchVendorAnalyticsReport(
  preset: AnalyticsDatePreset,
  options?: { signal?: AbortSignal }
): Promise<AnalyticsReport> {
  const days = presetToDays(preset);

  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const [dashboard, orders, products] = await Promise.all([
    getVendorAnalyticsDashboard(),
    getVendorAnalyticsOrders({ days }),
    getVendorAnalyticsProducts(),
  ]);

  const revenueTrend = orders.map((o) => ({ label: o.date.slice(5), value: o.revenue }));
  const orderVolume = orders.map((o) => ({ label: o.date.slice(5), value: o.orderCount }));

  return {
    preset,
    rangeLabel: rangeLabelFor(preset),
    revenueTrend,
    topProducts: dashboard.topProducts.map((p) => ({
      label: p.title,
      value: p.soldCount,
    })),
    conversionRate: dashboard.averageOrderValue > 0
      ? Math.min(8, dashboard.totalOrders * 0.4)
      : 0,
    conversionTrend: revenueTrend.slice(0, 6),
    categoryPerformance: products.slice(0, 6).map((p) => ({
      label: p.title,
      value: p.orders,
    })),
    retentionSeries: [],
    velocitySeries: [],
    orderVolume,
    geographic: [],
  };
}
