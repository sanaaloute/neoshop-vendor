import type { AnalyticsReport } from "./types";

function row(section: string, label: string, value: string | number) {
  const esc = (s: string) => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return `${esc(section)},${esc(label)},${value}`;
}

/** Builds a flat CSV for spreadsheets (Excel, Sheets). */
export function analyticsReportToCsv(report: AnalyticsReport): string {
  const lines: string[] = ["section,label,value"];

  lines.push(row("meta", "range", report.rangeLabel));
  lines.push(row("meta", "preset", report.preset));

  report.revenueTrend.forEach((p) =>
    lines.push(row("revenue_trend", p.label, p.value))
  );
  report.topProducts.forEach((p) =>
    lines.push(row("top_products", p.label, p.value))
  );
  lines.push(row("conversion", "rate_pct", report.conversionRate));
  report.conversionTrend.forEach((p) =>
    lines.push(row("conversion_trend", p.label, p.value))
  );
  report.categoryPerformance.forEach((p) =>
    lines.push(row("category_performance", p.label, p.value))
  );
  report.retentionSeries.forEach((p) =>
    lines.push(row("customer_retention_pct", p.label, p.value))
  );
  report.velocitySeries.forEach((p) =>
    lines.push(row("inventory_velocity_units", p.label, p.value))
  );
  report.orderVolume.forEach((p) =>
    lines.push(row("order_volume", p.label, p.value))
  );
  report.geographic.forEach((p) =>
    lines.push(row("geographic_sales", p.name, p.value))
  );

  return lines.join("\n");
}

export function downloadAnalyticsCsv(report: AnalyticsReport) {
  const csv = analyticsReportToCsv(report);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neoshop-analytics-${report.preset}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
