"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
} from "lucide-react";

import { MetricCard } from "@/components/cards/metric-card";
import { formatCurrency, formatCompact } from "@/lib/format";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getApiBaseUrl } from "@/config/auth";
import { fadeUp, staggerContainer } from "@/lib/motion";

import { CustomerProfileDrawer } from "./customer-profile-drawer";
import { CustomerCardGrid } from "./customer-card-grid";
import { fetchVendorCustomers } from "./customers-api";
import type { VendorCustomer } from "./types";

function isRepeatBuyer(tags: string[]) {
  return tags.some((t) => t.toLowerCase().includes("repeat"));
}

/** Animated counter for stats */
function AnimatedValue({
  value,
  formatter,
}: {
  value: number;
  formatter?: (v: number) => string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (value - from) * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  const formatted = formatter
    ? formatter(display)
    : Math.round(display).toLocaleString();

  return <span>{formatted}</span>;
}

export function CustomersHome() {
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVendorCustomers();
        if (!cancelled) setCustomers(data);
      } catch (e) {
        if (!cancelled) {
          setError(httpErrorMessageForUser(e, "Could not load customers."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const count = customers.length;
    const repeatCount = customers.filter((c) => isRepeatBuyer(c.tags)).length;
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
    const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const repeatRate = count > 0 ? (repeatCount / count) * 100 : 0;

    return {
      count,
      repeatCount,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      repeatRate,
    };
  }, [customers]);

  const activeCustomer = useMemo(
    () => customers.find((c) => c.id === activeId) ?? null,
    [customers, activeId]
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Stats Row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <MetricCard
            label="Total Customers"
            value={
              <AnimatedValue
                value={stats.count}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            }
            index={0}
            hint={`${stats.repeatCount} repeat buyers`}
            delta={
              stats.repeatRate > 0
                ? {
                    label: `${stats.repeatRate.toFixed(1)}% repeat rate`,
                    positive: stats.repeatRate >= 30,
                  }
                : undefined
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            label="Total Revenue"
            value={
              <AnimatedValue
                value={stats.totalRevenue}
                formatter={(v) => formatCurrency(v, "CNY", 2)}
              />
            }
            index={1}
            hint={`${stats.totalOrders} total orders`}
            delta={
              stats.totalRevenue > 0
                ? {
                    label: "From all customers",
                    positive: true,
                  }
                : undefined
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            label="Repeat Buyers"
            value={
              <AnimatedValue
                value={stats.repeatCount}
                formatter={(v) => Math.round(v).toLocaleString()}
              />
            }
            index={2}
            hint="Customers with 2+ orders"
            delta={
              stats.repeatCount > 0
                ? {
                    label: `${formatCompact(stats.totalRevenue / Math.max(1, stats.repeatCount))} avg LTV`,
                    positive: true,
                  }
                : undefined
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            label="Avg Order Value"
            value={
              <AnimatedValue
                value={stats.avgOrderValue}
                formatter={(v) => formatCurrency(v, "CNY", 2)}
              />
            }
            index={3}
            hint="Per order average"
          />
        </motion.div>
      </motion.div>

      {/* Customer Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <CustomerCardGrid
          customers={customers}
          syncLoading={loading}
          syncError={error}
          onOpenProfile={(id) => {
            setActiveId(id);
            setDrawerOpen(true);
          }}
        />
      </motion.div>

      {/* Profile Drawer */}
      <CustomerProfileDrawer
        customer={activeCustomer}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setActiveId(null);
        }}
      />
    </div>
  );
}
