"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Radio, Wallet, AlertTriangle, Package, TrendingUp } from "lucide-react";

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
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { VendorMuted, VendorOverline } from "@/components/layout/typography";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardMetrics } from "@/modules/dashboard/use-dashboard-metrics";

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-success backdrop-blur-sm">
      <span className="relative flex size-2">
        <motion.span
          className="absolute inline-flex size-full rounded-full bg-success/80"
          animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Live
    </span>
  );
}

export function DashboardHome() {
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
      className="space-y-6 md:space-y-8"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GatewaySyncBanner loading={syncLoading} error={syncError} />

      <div className="flex items-center justify-between">
        <VendorOverline>Command Center</VendorOverline>
        <LivePulse />
      </div>

      {/* Hero Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label="Revenue"
          value={formatCurrency(metrics.revenueTotal)}
          accent="primary"
        />
        <MetricCard
          index={1}
          label="Monthly"
          value={formatCurrency(metrics.monthlySales)}
          accent="success"
        />
        <MetricCard
          index={2}
          label="Pending"
          value={metrics.pendingOrders}
          accent="warning"
        />
        <MetricCard
          index={3}
          label="Conversion"
          value={formatPercent(metrics.conversionRate, 2)}
          accent="info"
        />
      </div>

      {/* Main Chart + Side */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCard className="h-full gap-0 py-0">
            <DashboardCardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-primary size-4" />
                <DashboardCardTitle className="text-sm font-semibold">Revenue</DashboardCardTitle>
              </div>
              <VendorOverline>30 days</VendorOverline>
            </DashboardCardHeader>
            <DashboardCardContent className="px-3 pt-5 pb-3 sm:px-5">
              <div
                key={chartKey}
                className="min-h-[220px] w-full min-w-0 sm:min-h-[280px]"
              >
                {chartsReady ? (
                  <DashboardAreaChart
                    data={metrics.revenueSeries}
                    gradientId="rev-grad"
                    height={280}
                  />
                ) : (
                  <div
                    className="bg-muted/20 h-[280px] w-full animate-pulse rounded-lg"
                    aria-hidden
                  />
                )}
              </div>
            </DashboardCardContent>
          </DashboardCard>
        </div>

        <div className="flex flex-col gap-4">
          <DashboardCard className="gap-0 py-0">
            <DashboardCardHeader className="border-b border-border/40 px-5 py-4">
              <VendorOverline>Weekly</VendorOverline>
            </DashboardCardHeader>
            <DashboardCardContent className="px-3 pt-5 pb-3 sm:px-5">
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
                    className="bg-muted/20 h-[180px] w-full animate-pulse rounded-lg"
                    aria-hidden
                  />
                )}
              </div>
            </DashboardCardContent>
          </DashboardCard>
          <AnalyticsWidget
            index={0}
            title="Session → purchase"
            subtitle="Conversion"
            primaryProgress={conversionProgress}
          />
        </div>
      </div>

      {/* Products + Variants */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <Package className="text-chart-3 size-4" />
              <DashboardCardTitle className="text-sm font-semibold">Top Products</DashboardCardTitle>
            </div>
          </DashboardCardHeader>
          <DashboardCardContent className="px-5 py-5">
            <DashboardMiniBars data={bestBarData} valuePrefix="$" />
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-chart-4 size-4" />
              <DashboardCardTitle className="text-sm font-semibold">Top Variants</DashboardCardTitle>
            </div>
          </DashboardCardHeader>
          <DashboardCardContent className="px-5 py-5">
            <DashboardMiniBars data={variantBarData} />
          </DashboardCardContent>
        </DashboardCard>
      </div>

      {/* Alerts + Messages + Disputes */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="flex items-center gap-2 border-b border-border/40 px-5 py-4">
            <AlertTriangle className="text-danger size-4" />
            <DashboardCardTitle className="text-sm font-semibold">Alerts</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-2 px-5 py-4">
            {metrics.inventoryAlerts.map((row) => (
              <div
                key={row.sku}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <VendorMuted className="text-[11px]">{row.sku}</VendorMuted>
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
                  <span className="text-muted-foreground text-[11px] tabular-nums font-medium">
                    {row.qty}
                  </span>
                </div>
              </div>
            ))}
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="flex items-center gap-2 border-b border-border/40 px-5 py-4">
            <MessageSquare className="text-chart-2 size-4" />
            <DashboardCardTitle className="text-sm font-semibold">Inbox</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="divide-y divide-border/30 px-0 py-0">
            {metrics.messages.map((m) => (
              <Link
                key={m.id}
                href="/chat"
                className={cn(
                  "block px-5 py-3 transition-colors hover:bg-muted/20",
                  m.unread && "bg-primary/[0.03]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{m.from}</span>
                  {m.unread ? (
                    <span className="bg-primary size-2 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  ) : null}
                </div>
                <VendorMuted className="mt-0.5 line-clamp-2 text-[11px]">
                  {m.preview}
                </VendorMuted>
              </Link>
            ))}
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0 md:col-span-2 xl:col-span-1">
          <DashboardCardHeader className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-warning size-4" />
              <DashboardCardTitle className="text-sm font-semibold">Risk</DashboardCardTitle>
            </div>
            <StatusBadge status="warning">{metrics.disputesOpen} open</StatusBadge>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-2 px-5 py-4">
            {metrics.disputeAlerts.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/30 px-3 py-2.5 transition-colors hover:bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.title}</p>
                  <VendorMuted className="text-[11px]">{d.amount}</VendorMuted>
                </div>
                <Link
                  href="/disputes"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "xs" }),
                    "rounded-md border-border/40 text-[11px]"
                  )}
                >
                  Review
                </Link>
              </div>
            ))}
          </DashboardCardContent>
        </DashboardCard>
      </div>

      {/* Treasury + Activity */}
      <div className="grid gap-4 lg:grid-cols-12">
        <DashboardCard className="gap-0 py-0 lg:col-span-4">
          <DashboardCardHeader className="flex items-center gap-2.5 border-b border-border/40 px-5 py-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="text-primary size-4" />
            </div>
            <DashboardCardTitle className="text-sm font-semibold">Treasury</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-4 px-5 py-5">
            <div>
              <VendorMuted className="text-[11px] font-medium uppercase tracking-wider">Available</VendorMuted>
              <p className="mt-1 text-[28px] font-bold tabular-nums tracking-tighter">
                {formatCurrency(metrics.payoutReady)}
              </p>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex items-center justify-between text-sm">
              <VendorMuted className="text-[11px]">Next</VendorMuted>
              <span className="font-semibold">{metrics.payoutNextDate}</span>
            </div>
            <Link
              href="/payouts"
              className={cn(buttonVariants({ size: "sm" }), "w-full rounded-lg font-semibold")}
            >
              Payouts
            </Link>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 py-0 lg:col-span-8">
          <DashboardCardHeader className="border-b border-border/40 px-5 py-4">
            <DashboardCardTitle className="text-sm font-semibold">Activity</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="max-h-[min(420px,55vh)] space-y-0 overflow-y-auto px-0 py-0">
            <ul className="divide-y divide-border/30">
              {metrics.activity.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex gap-3 px-5 py-3 transition-colors hover:bg-muted/20",
                    a.tone === "warn" && "border-l-[3px] border-l-warning/70",
                    a.tone === "ok" && "border-l-[3px] border-l-success/60",
                    a.tone === "info" && "border-l-[3px] border-l-info/60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{a.label}</p>
                    <VendorMuted className="text-[11px]">{a.time}</VendorMuted>
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
