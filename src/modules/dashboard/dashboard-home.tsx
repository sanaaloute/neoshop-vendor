"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Radio, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { AnalyticsWidget } from "@/components/charts/analytics-widget";
import { DashboardAreaChart } from "@/components/charts/dashboard-area-chart";
import { DashboardMiniBars } from "@/components/charts/dashboard-mini-bars";
import { useGatewayCatalogBootstrap } from "@/hooks/use-gateway-catalog-bootstrap";
import { useGatewayOrdersBootstrap } from "@/hooks/use-gateway-orders-bootstrap";
import { MetricCard } from "@/components/cards/metric-card";
import { StatusBadge } from "@/components/cards/status-badge";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { VendorMuted, VendorSubheading } from "@/components/layout/typography";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardMetrics } from "@/modules/dashboard/use-dashboard-metrics";

function LivePulse() {
  const t = useTranslations("dashboard");
  return (
    <span className="border-border/60 bg-card/50 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium">
      <span className="relative flex size-2">
        <motion.span
          className="absolute inline-flex size-full rounded-full bg-emerald-400/90"
          animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.45, 0.9] }}
          transition={{
            duration: 2.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </span>
      <Radio className="size-3.5 opacity-70" aria-hidden />
      {t("liveMetrics")}
    </span>
  );
}

export function DashboardHome() {
  const t = useTranslations("dashboard");
  const { loading: ordersLoading, error: ordersError } =
    useGatewayOrdersBootstrap();
  const { loading: catalogLoading, error: catalogError } =
    useGatewayCatalogBootstrap();
  const syncLoading = ordersLoading || catalogLoading;
  const syncError =
    [ordersError, catalogError].filter(Boolean).join(" · ") || null;
  const metrics = useDashboardMetrics();
  const chartKey = "dashboard";
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  const conversionGoal = 5;
  const conversionProgress = Math.min(
    100,
    (metrics.conversionRate / conversionGoal) * 100
  );

  const bestBarData = metrics.bestProducts.map((p) => ({
    label: p.name,
    value: Math.round(p.revenue),
  }));

  const variantBarData = metrics.topVariants.map((v) => ({
    label: v.name,
    value: v.units,
  }));

  return (
    <motion.div
      className="space-y-5 md:space-y-6"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <GatewaySyncBanner loading={syncLoading} error={syncError} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <VendorSubheading className="text-lg">{t("overview")}</VendorSubheading>
        <LivePulse />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label={t("totalRevenue")}
          value={formatCurrency(metrics.revenueTotal)}
        />
        <MetricCard
          index={1}
          label={t("monthlySales")}
          value={formatCurrency(metrics.monthlySales)}
        />
        <MetricCard
          index={2}
          label={t("pendingOrders")}
          value={metrics.pendingOrders}
        />
        <MetricCard
          index={3}
          label={t("conversionRate")}
          value={formatPercent(metrics.conversionRate, 2)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCard className="h-full gap-0 py-0">
            <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
              <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t("performance")}
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base">
                {t("revenueTrend")}
              </DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardContent className="px-2 pt-4 pb-2 sm:px-4">
              <div
                key={chartKey}
                className="min-h-[220px] w-full min-w-0 sm:min-h-[260px]"
              >
                {chartsReady ? (
                  <DashboardAreaChart
                    data={metrics.revenueSeries}
                    gradientId="rev-grad"
                    height={260}
                  />
                ) : (
                  <div
                    className="shimmer h-[260px] w-full rounded-lg"
                    aria-hidden
                  />
                )}
              </div>
            </DashboardCardContent>
          </DashboardCard>
        </div>

        <div className="flex flex-col gap-4">
          <DashboardCard className="gap-0 py-0">
            <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
              <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t("salesRhythm")}
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base">
                {t("thisWeek")}
              </DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardContent className="px-2 pt-4 pb-2 sm:px-4">
              <div
                key={`${chartKey}-wk`}
                className="min-h-[160px] w-full min-w-0"
              >
                {chartsReady ? (
                  <DashboardAreaChart
                    data={metrics.monthlySeries}
                    gradientId="wk-grad"
                    accentColor="var(--color-chart-2)"
                    height={180}
                  />
                ) : (
                  <div
                    className="shimmer h-[180px] w-full rounded-lg"
                    aria-hidden
                  />
                )}
              </div>
            </DashboardCardContent>
          </DashboardCard>
          <AnalyticsWidget
            index={0}
            title={t("sessionToPurchase")}
            subtitle={t("conversion")}
            primaryProgress={conversionProgress}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/50 flex flex-row items-center justify-between border-b px-4 py-3">
            <div>
              <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t("catalog")}
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base">
                {t("bestProducts")}
              </DashboardCardTitle>
            </div>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1"
              )}
            >
              {t("view")}
              <ArrowRight className="size-4" />
            </Link>
          </DashboardCardHeader>
          <DashboardCardContent className="px-4 py-4">
            <DashboardMiniBars data={bestBarData} valuePrefix="¥" />
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/50 flex flex-row items-center justify-between border-b px-4 py-3">
            <div>
              <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t("variants")}
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base">
                {t("topMovers")}
              </DashboardCardTitle>
            </div>
            <Link
              href="/variants"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1"
              )}
            >
              {t("view")}
              <ArrowRight className="size-4" />
            </Link>
          </DashboardCardHeader>
          <DashboardCardContent className="px-4 py-4">
            <DashboardMiniBars data={variantBarData} />
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("stock")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("inventoryAlerts")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-3 px-4 py-4">
            {metrics.inventoryAlerts.map((row) => (
              <div
                key={row.sku}
                className="border-border/50 bg-muted/20 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-medium">
                    {row.name}
                  </p>
                  <VendorMuted className="text-xs">{row.sku}</VendorMuted>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge
                    status={
                      row.severity === "critical"
                        ? "danger"
                        : row.severity === "low"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {row.severity}
                  </StatusBadge>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {row.qty} {t("left")}
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/inventory"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full"
              )}
            >
              {t("openInventory")}
            </Link>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/50 flex flex-row items-center justify-between border-b px-4 py-3">
            <div>
              <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t("inbox")}
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base">
                {t("customerMessages")}
              </DashboardCardTitle>
            </div>
            <Link
              href="/chat"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1"
              )}
            >
              {t("open")}
              <MessageSquare className="size-4" />
            </Link>
          </DashboardCardHeader>
          <DashboardCardContent className="divide-border/50 divide-y px-0 py-0">
            {metrics.messages.map((m) => (
              <Link
                key={m.id}
                href="/chat"
                className={cn(
                  "hover:bg-muted/40 block px-4 py-3 transition-colors",
                  m.unread && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{m.from}</span>
                  {m.unread ? (
                    <span className="bg-primary size-2 rounded-full" />
                  ) : null}
                </div>
                <VendorMuted className="mt-0.5 line-clamp-2 text-xs">
                  {m.preview}
                </VendorMuted>
              </Link>
            ))}
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0 md:col-span-2 xl:col-span-1">
          <DashboardCardHeader className="border-border/50 flex flex-row items-center justify-between border-b px-4 py-3">
            <div>
              <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {t("risk")}
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base">
                {t("disputeAlerts")}
              </DashboardCardTitle>
            </div>
            <StatusBadge status="warning">
              {t("openDisputes", { count: metrics.disputesOpen })}
            </StatusBadge>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-3 px-4 py-4">
            {metrics.disputeAlerts.map((d) => (
              <div
                key={d.id}
                className="border-border/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <VendorMuted className="text-xs">
                    {d.amount} exposure
                  </VendorMuted>
                </div>
                <Link
                  href="/disputes"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "xs" })
                  )}
                >
                  {t("review")}
                </Link>
              </div>
            ))}
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <DashboardCard className="gap-0 py-0 lg:col-span-4">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Wallet className="text-muted-foreground size-4" />
              <div>
                <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {t("treasury")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("payoutSummary")}
                </DashboardCardTitle>
              </div>
            </div>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-3 px-4 py-4">
            <div>
              <VendorMuted className="text-xs">{t("availableNow")}</VendorMuted>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrency(metrics.payoutReady)}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <VendorMuted>{t("nextTransfer")}</VendorMuted>
              <span className="font-medium">{metrics.payoutNextDate}</span>
            </div>
            <Link
              href="/payouts"
              className={cn(buttonVariants({ size: "sm" }), "w-full")}
            >
              {t("payouts")}
            </Link>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 py-0 lg:col-span-8">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("activity")}
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base">
              {t("recentActivity")}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="max-h-[min(420px,55vh)] space-y-0 overflow-y-auto px-0 py-0">
            <ul className="divide-border/50 divide-y">
              {metrics.activity.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex gap-3 px-4 py-3",
                    a.tone === "warn" && "border-l-2 border-l-amber-500/80",
                    a.tone === "ok" && "border-l-2 border-l-emerald-500/70",
                    a.tone === "info" && "border-l-2 border-l-sky-500/70"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-medium">
                      {a.label}
                    </p>
                    <VendorMuted className="text-xs">{a.time}</VendorMuted>
                  </div>
                </li>
              ))}
            </ul>
          </DashboardCardContent>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
