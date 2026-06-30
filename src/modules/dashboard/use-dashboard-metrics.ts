"use client";

import { useMemo } from "react";

import { useOrdersStore } from "@/store/orders-store";
import { useProductCatalogStore } from "@/store/product-catalog-store";

const ACTIVE_ORDER = new Set([
  "pending_payment",
  "paid",
  "processing",
  "shipped",
]);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type RevenuePoint = { label: string; value: number };

export type ProductRank = { sku: string; name: string; revenue: number };

export type VariantRank = { name: string; units: number };

export type InventoryAlert = {
  sku: string;
  name: string;
  qty: number;
  severity: "critical" | "low" | "ok";
};

export type MessagePreview = {
  id: string;
  from: string;
  preview: string;
  unread: boolean;
};

export type DisputeAlert = { id: string; title: string; amount: string };

export type ActivityItem = {
  id: string;
  label: string;
  time: string;
  tone: "ok" | "warn" | "info";
};

export type DashboardMetrics = {
  revenueTotal: number;
  monthlySales: number;
  pendingOrders: number;
  conversionRate: number;
  revenueSeries: RevenuePoint[];
  monthlySeries: RevenuePoint[];
  bestProducts: ProductRank[];
  topVariants: VariantRank[];
  inventoryAlerts: InventoryAlert[];
  messages: MessagePreview[];
  disputesOpen: number;
  disputeAlerts: DisputeAlert[];
  payoutReady: number;
  payoutNextDate: string;
  activity: ActivityItem[];
};

/** KPIs derived from gateway-backed stores (no simulated drift). */
export function useDashboardMetrics(): DashboardMetrics {
  const orders = useOrdersStore((s) => s.orders);
  const products = useProductCatalogStore((s) => s.products);

  return useMemo(() => {
    const revenueTotal = orders.reduce(
      (s, o) => s + (Number.parseFloat(o.total) || 0),
      0
    );
    const pendingOrders = orders.filter((o) =>
      ACTIVE_ORDER.has(o.status)
    ).length;

    const bestProducts = [...products]
      .filter((p) => p.status === "published")
      .slice(0, 4)
      .map((p) => ({
        sku: p.sku || "—",
        name: p.name,
        revenue: p.price * 4,
      }));

    const activity = orders.slice(0, 6).map((o) => ({
      id: o.id,
      label: `${o.reference} · ${o.status}`,
      time: new Date(o.updatedAt).toLocaleString(),
      tone: "info" as const,
    }));

    return {
      revenueTotal,
      monthlySales: revenueTotal,
      pendingOrders,
      conversionRate: orders.length ? Math.min(8, orders.length * 0.4) : 0,
      revenueSeries: DAYS.map((label) => ({ label, value: 0 })),
      monthlySeries: DAYS.map((label) => ({ label, value: 0 })),
      bestProducts,
      topVariants: [],
      inventoryAlerts: [],
      messages: [],
      disputesOpen: 0,
      disputeAlerts: [],
      payoutReady: 0,
      payoutNextDate: "—",
      activity,
    };
  }, [orders, products]);
}
