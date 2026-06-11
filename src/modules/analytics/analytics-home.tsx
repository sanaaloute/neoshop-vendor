"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { DashboardAreaChart } from "@/components/charts/dashboard-area-chart";
import { DashboardMiniBars } from "@/components/charts/dashboard-mini-bars";
import { AnalyticsWidget } from "@/components/charts/analytics-widget";
import { MetricCard } from "@/components/cards/metric-card";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { fetchVendorAnalyticsReport } from "@/services/analytics-api";

import { AnalyticsToolbar } from "./analytics-toolbar";
import { CategoryBarChart } from "./category-bar-chart";
import { downloadAnalyticsCsv } from "./export-csv";
import { emptyAnalyticsReport } from "./generate-report";
import { GeoPieChart } from "./geo-pie-chart";
import type { AnalyticsDatePreset, AnalyticsReport } from "./types";

export function AnalyticsHome() {
  const t = useTranslations("analytics");
  const [preset, setPreset] = useState<AnalyticsDatePreset>("30d");
  const [chartsReady, setChartsReady] = useState(false);
  const [report, setReport] = useState<AnalyticsReport>(() =>
    emptyAnalyticsReport("30d")
  );
  const [fetchState, setFetchState] = useState<"pending" | "live" | "fallback">(
    "pending"
  );

  useEffect(() => {
    setChartsReady(true);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    setFetchState("pending");
    fetchVendorAnalyticsReport(preset, { signal: ac.signal })
      .then((r) => {
        setReport(r);
        setFetchState("live");
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setReport(emptyAnalyticsReport(preset));
        setFetchState("fallback");
      });
    return () => ac.abort();
  }, [preset]);

  const conversionGoal = 5;
  const conversionProgress = Math.min(
    100,
    (report.conversionRate / conversionGoal) * 100
  );

  const revenueTotal = useMemo(
    () => report.revenueTrend.reduce((s, p) => s + p.value, 0),
    [report.revenueTrend]
  );

  const ordersTotal = useMemo(
    () => report.orderVolume.reduce((s, p) => s + p.value, 0),
    [report.orderVolume]
  );

  const avgRetention = useMemo(() => {
    const n = report.retentionSeries.length;
    if (!n) return 0;
    return report.retentionSeries.reduce((s, p) => s + p.value, 0) / n;
  }, [report.retentionSeries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {fetchState === "pending" && (
          <Badge variant="secondary" className="font-normal tabular-nums">
            {t("syncing")}
          </Badge>
        )}
        {fetchState === "live" && (
          <Badge variant="secondary" className="font-normal tabular-nums">
            {t("liveData")}
          </Badge>
        )}
        {fetchState === "fallback" && (
          <Badge variant="outline" className="font-normal">
            {t("dataUnavailable")}
          </Badge>
        )}
      </div>

      <AnalyticsToolbar
        preset={preset}
        onPresetChange={setPreset}
        rangeLabel={
          report.rangeLabel === "Report unavailable"
            ? t("reportUnavailable")
            : report.rangeLabel
        }
        onExportCsv={() => downloadAnalyticsCsv(report)}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label={t("revenueRange")}
          value={formatCurrency(revenueTotal)}
        />
        <MetricCard
          index={1}
          label={t("conversionRate")}
          value={formatPercent(report.conversionRate, 2)}
        />
        <MetricCard
          index={2}
          label={t("orderVolume")}
          value={ordersTotal.toLocaleString()}
        />
        <MetricCard
          index={3}
          label={t("avgRetentionScore")}
          value={formatPercent(avgRetention, 1)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("revenue")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("revenueTrend")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-2 pt-4 pb-2 sm:px-4">
            <div className="min-h-[240px] w-full min-w-0">
              {chartsReady ? (
                <DashboardAreaChart
                  data={report.revenueTrend}
                  gradientId={`rev-${preset}`}
                  height={260}
                />
              ) : (
                <div
                  className="shimmer h-[260px] rounded-lg"
                  aria-hidden
                />
              )}
            </div>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("orders")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("orderVolume")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-2 pt-4 pb-2 sm:px-4">
            <div className="min-h-[240px] w-full min-w-0">
              {chartsReady ? (
                <DashboardAreaChart
                  data={report.orderVolume}
                  gradientId={`vol-${preset}`}
                  accentColor="var(--color-chart-3)"
                  height={260}
                />
              ) : (
                <div
                  className="shimmer h-[260px] rounded-lg"
                  aria-hidden
                />
              )}
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardCard className="gap-0 py-0 lg:col-span-2">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("catalog")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("topPerformingProducts")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-2 pt-4 pb-4 sm:px-4">
            {chartsReady ? (
              <CategoryBarChart
                data={report.categoryPerformance}
                height={300}
                valueFormatter={(n) => formatCurrency(n)}
              />
            ) : (
              <div
                className="shimmer h-[300px] rounded-lg"
                aria-hidden
              />
            )}
          </DashboardCardContent>
        </DashboardCard>

        <AnalyticsWidget
          index={0}
          subtitle={t("funnel")}
          title={t("conversion")}
          primaryProgress={conversionProgress}
          series={report.conversionTrend.slice(0, 6).map((p) => ({
            label: p.label,
            value: p.value,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("products")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("topSellingProducts")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-4 py-4">
            <DashboardMiniBars
              data={report.topProducts.map((p) => ({
                label: p.label,
                value: p.value,
              }))}
              valuePrefix="¥"
            />
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("geography")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("geographicSales")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-2 pt-4 pb-4 sm:px-4">
            {chartsReady ? (
              <GeoPieChart data={report.geographic} height={280} />
            ) : (
              <div
                className="shimmer h-[280px] rounded-lg"
                aria-hidden
              />
            )}
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("retention")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("customerRetentionIndex")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-2 pt-4 pb-2 sm:px-4">
            <div className="min-h-[220px] w-full min-w-0">
              {chartsReady ? (
                <DashboardAreaChart
                  data={report.retentionSeries}
                  gradientId={`ret-${preset}`}
                  accentColor="var(--color-chart-4)"
                  height={240}
                />
              ) : (
                <div
                  className="shimmer h-[240px] rounded-lg"
                  aria-hidden
                />
              )}
            </div>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("inventory")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("inventoryVelocity")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="px-2 pt-4 pb-2 sm:px-4">
            <div className="min-h-[220px] w-full min-w-0">
              {chartsReady ? (
                <DashboardAreaChart
                  data={report.velocitySeries}
                  gradientId={`vel-${preset}`}
                  accentColor="var(--color-chart-5)"
                  height={240}
                />
              ) : (
                <div
                  className="shimmer h-[240px] rounded-lg"
                  aria-hidden
                />
              )}
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </div>
    </div>
  );
}
