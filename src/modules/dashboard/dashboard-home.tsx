"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Radio, Wallet } from "lucide-react";

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
  return (
    <span className="border-border/50 bg-card/50 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm">
      <span className="relative flex size-2">
        <motion.span
          className="absolute inline-flex size-full rounded-full bg-success/90"
          animate={{ scale: [1, 1.5, 1], opacity: [0.9, 0.3, 0.9] }}
          transition={{
            duration: 2.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <span className="relative inline-flex size-2 rounded-full bg-success/70" />
      </span>
      <Radio className="size-3.5 opacity-70" aria-hidden />
      Live metrics
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
      className="space-y-5 md:space-y-6"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <GatewaySyncBanner loading={syncLoading} error={syncError} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <VendorSubheading className="text-lg font-bold">Overview</VendorSubheading>
        <LivePulse />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label="Total revenue"
          value={formatCurrency(metrics.revenueTotal)}
          accent="success"
        />
        <MetricCard
          index={1}
          label="Monthly sales"
          value={formatCurrency(metrics.monthlySales)}
          accent="primary"
        />
        <MetricCard
          index={2}
          label="Pending orders"
          value={metrics.pendingOrders}
          accent="warning"
        />
        <MetricCard
          index={3}
          label="Conversion rate"
          value={formatPercent(metrics.conversionRate, 2)}
          accent="info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCard className="h-full gap-0 py-0">
            <DashboardCardHeader className="border-border/40 border-b px-4 py-3.5">
              <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                Performance
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base font-semibold">
                Revenue trend
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
                    className="bg-muted/30 h-[260px] w-full animate-pulse rounded-xl"
                    aria-hidden
                  />
                )}
              </div>
            </DashboardCardContent>
          </DashboardCard>
        </div>

        <div className="flex flex-col gap-4">
          <DashboardCard className="gap-0 py-0">
            <DashboardCardHeader className="border-border/40 border-b px-4 py-3.5">
              <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                Sales rhythm
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base font-semibold">
                This week
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
                    className="bg-muted/30 h-[180px] w-full animate-pulse rounded-xl"
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

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/40 flex flex-row items-center justify-between border-b px-4 py-3.5">
            <div>
              <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                Catalog
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base font-semibold">
                Best products
              </DashboardCardTitle>
            </div>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 rounded-lg text-muted-foreground hover:text-foreground"
              )}
            >
              View
              <ArrowRight className="size-4" />
            </Link>
          </DashboardCardHeader>
          <DashboardCardContent className="px-4 py-4">
            <DashboardMiniBars data={bestBarData} valuePrefix="$" />
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/40 flex flex-row items-center justify-between border-b px-4 py-3.5">
            <div>
              <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                Variants
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base font-semibold">
                Top movers
              </DashboardCardTitle>
            </div>
            <Link
              href="/variants"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 rounded-lg text-muted-foreground hover:text-foreground"
              )}
            >
              View
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
          <DashboardCardHeader className="border-border/40 border-b px-4 py-3.5">
            <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
              Stock
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base font-semibold">
              Inventory alerts
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-3 px-4 py-4">
            {metrics.inventoryAlerts.map((row) => (
              <div
                key={row.sku}
                className="border-border/40 bg-muted/15 hover:bg-muted/25 flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-semibold">
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
                  <span className="text-muted-foreground text-xs tabular-nums font-medium">
                    {row.qty} left
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/inventory"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              Open inventory
            </Link>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="h-full gap-0 py-0">
          <DashboardCardHeader className="border-border/40 flex flex-row items-center justify-between border-b px-4 py-3.5">
            <div>
              <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                Inbox
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base font-semibold">
                Customer messages
              </DashboardCardTitle>
            </div>
            <Link
              href="/chat"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 rounded-lg text-muted-foreground hover:text-foreground"
              )}
            >
              Open
              <MessageSquare className="size-4" />
            </Link>
          </DashboardCardHeader>
          <DashboardCardContent className="divide-border/40 divide-y px-0 py-0">
            {metrics.messages.map((m) => (
              <Link
                key={m.id}
                href="/chat"
                className={cn(
                  "hover:bg-muted/30 block px-4 py-3 transition-colors",
                  m.unread && "bg-primary/[0.04]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{m.from}</span>
                  {m.unread ? (
                    <span className="bg-primary size-2 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
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
          <DashboardCardHeader className="border-border/40 flex flex-row items-center justify-between border-b px-4 py-3.5">
            <div>
              <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                Risk
              </DashboardCardDescription>
              <DashboardCardTitle className="text-base font-semibold">
                Dispute alerts
              </DashboardCardTitle>
            </div>
            <StatusBadge status="warning">
              {metrics.disputesOpen} open
            </StatusBadge>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-3 px-4 py-4">
            {metrics.disputeAlerts.map((d) => (
              <div
                key={d.id}
                className="border-border/40 hover:bg-muted/20 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.title}</p>
                  <VendorMuted className="text-xs">
                    {d.amount} exposure
                  </VendorMuted>
                </div>
                <Link
                  href="/disputes"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "xs" }),
                    "rounded-lg border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  Review
                </Link>
              </div>
            ))}
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <DashboardCard className="gap-0 py-0 lg:col-span-4">
          <DashboardCardHeader className="border-border/40 border-b px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                <Wallet className="text-primary size-4" />
              </div>
              <div>
                <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
                  Treasury
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base font-semibold">
                  Payout summary
                </DashboardCardTitle>
              </div>
            </div>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-3 px-4 py-4">
            <div>
              <VendorMuted className="text-xs font-medium">Available now</VendorMuted>
              <p className="text-[26px] font-bold tabular-nums tracking-tight mt-1">
                {formatCurrency(metrics.payoutReady)}
              </p>
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between text-sm">
              <VendorMuted className="font-medium">Next transfer</VendorMuted>
              <span className="font-semibold">{metrics.payoutNextDate}</span>
            </div>
            <Link
              href="/payouts"
              className={cn(
                buttonVariants({ size: "sm" }),
                "w-full rounded-xl font-semibold"
              )}
            >
              Payouts
            </Link>
          </DashboardCardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 py-0 lg:col-span-8">
          <DashboardCardHeader className="border-border/40 border-b px-4 py-3.5">
            <DashboardCardDescription className="text-muted-foreground/80 text-[11px] font-semibold tracking-widest uppercase">
              Activity
            </DashboardCardDescription>
            <DashboardCardTitle className="text-base font-semibold">
              Recent activity
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="max-h-[min(420px,55vh)] space-y-0 overflow-y-auto px-0 py-0">
            <ul className="divide-border/40 divide-y">
              {metrics.activity.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/20",
                    a.tone === "warn" && "border-l-[3px] border-l-warning/80",
                    a.tone === "ok" && "border-l-[3px] border-l-success/70",
                    a.tone === "info" && "border-l-[3px] border-l-info/70"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-semibold">
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
