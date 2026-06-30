"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/cards/status-badge";
import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProductStats } from "@/hooks/use-product-stats";
import { useGatewayCatalogBootstrap } from "@/hooks/use-gateway-catalog-bootstrap";
import { useCategoriesStore } from "@/store/categories-store";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import Link from "next/link";

import { ProductsTable } from "./products-table";
import type { ProductStatus } from "./types";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

const PRODUCT_STATUSES: {
  key: Exclude<ProductStatus, "rejected">;
  labelKey: string;
  status: Parameters<typeof StatusBadge>[0]["status"];
}[] = [
  { key: "draft", labelKey: "stats.draft", status: "neutral" },
  { key: "pending_review", labelKey: "stats.pending", status: "pending" },
  { key: "published", labelKey: "stats.published", status: "success" },
  { key: "hidden", labelKey: "stats.hidden", status: "warning" },
  { key: "archived", labelKey: "stats.archived", status: "neutral" },
];

export function ProductsHome() {
  const t = useTranslations("products");
  const { stats, loading: statsLoading } = useProductStats();
  const { loading: gatewayLoading, error: gatewayError } =
    useGatewayCatalogBootstrap();
  const { canWriteCatalog } = useVendorWritesAllowed();
  const categories = useCategoriesStore((s) => s.categories);

  const [filterStatus, setFilterStatus] = useState<ProductStatus | "">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const activeFiltersCount =
    (filterStatus ? 1 : 0) + (filterCategory ? 1 : 0) + (filterSearch ? 1 : 0);

  const clearFilters = useCallback(() => {
    setFilterStatus("");
    setFilterCategory("");
    setFilterSearch("");
  }, []);

  const handleStatClick = useCallback((status: ProductStatus) => {
    setFilterStatus((prev) => (prev === status ? "" : status));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <GatewaySyncBanner loading={gatewayLoading} error={gatewayError} />

      {/* ── Stat Metric Cards ── */}
      {stats && !statsLoading ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {PRODUCT_STATUSES.map(({ key, labelKey, status }) => {
            const byStatus = stats.byStatus;
            const count =
              key === "draft"
                ? byStatus.draft
                : key === "pending_review"
                  ? byStatus.pending_review
                  : key === "published"
                    ? byStatus.published
                    : key === "hidden"
                      ? byStatus.hidden
                      : byStatus.archived;
            const active = filterStatus === key;
            return (
              <motion.button
                key={key}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: easeOutExpo },
                  },
                }}
                whileHover={{ y: -3, transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStatClick(key)}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300",
                  "bg-card/80 shadow-vendor-card ring-1 ring-white/5 backdrop-blur-md",
                  "dark:bg-card/60 dark:ring-white/10",
                  active
                    ? "border-primary/50 bg-primary/5 shadow-primary/10 ring-primary/20 shadow-lg"
                    : "border-border/60 hover:border-primary/30 hover:shadow-lg"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={status} className="text-[10px]">
                    {t(labelKey)}
                  </StatusBadge>
                  {active && (
                    <motion.div
                      layoutId="product-stat-active"
                      className="bg-primary size-2 rounded-full"
                      transition={{ duration: 0.25, ease: easeOutExpo }}
                    />
                  )}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                  {count}
                </div>
                <div
                  className={cn(
                    "mt-1 h-0.5 w-full rounded-full transition-colors duration-300",
                    active ? "bg-primary/40" : "bg-border/40"
                  )}
                />
              </motion.button>
            );
          })}
        </motion.div>
      ) : null}

      {/* ── Toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: easeOutExpo }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 flex size-9 items-center justify-center rounded-xl">
            <Package className="text-primary size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-muted-foreground text-xs">
              {t("list.productCatalog")}
            </p>
          </div>
        </div>
        <Link
          href="/products/new"
          aria-disabled={!canWriteCatalog}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "hover:shadow-primary/25 gap-1.5 rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg",
            !canWriteCatalog && "pointer-events-none opacity-50"
          )}
          onClick={(e) => {
            if (!canWriteCatalog) e.preventDefault();
          }}
        >
          <Plus className="size-4" aria-hidden />
          {t("list.newProduct")}
        </Link>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: easeOutExpo }}
      >
        <Card className="border-border/60 shadow-vendor-card overflow-hidden">
          <div className="from-primary/5 to-chart-2/5 border-border/50 border-b bg-gradient-to-r via-transparent px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-medium">
              <SlidersHorizontal className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground tracking-wider uppercase">
                {t("list.filters")}
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary/15 text-primary flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Label htmlFor="product-search" className="sr-only">
                {t("list.search")}
              </Label>
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="product-search"
                className="h-10 pl-10"
                placeholder={t("list.searchPlaceholder")}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:w-44">
              <Label className="text-muted-foreground text-xs">
                {t("list.status")}
              </Label>
              <Select
                value={filterStatus}
                onValueChange={(v) =>
                  setFilterStatus((v || "") as ProductStatus | "")
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("list.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("list.allStatuses")}</SelectItem>
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="pending_review">
                    {t("status.pending_review")}
                  </SelectItem>
                  <SelectItem value="published">
                    {t("status.published")}
                  </SelectItem>
                  <SelectItem value="hidden">{t("status.hidden")}</SelectItem>
                  <SelectItem value="archived">
                    {t("status.archived")}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {t("status.rejected")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:w-48">
              <Label className="text-muted-foreground text-xs">
                {t("list.category")}
              </Label>
              <Select
                value={filterCategory}
                onValueChange={(v) => setFilterCategory(v ?? "")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("list.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("list.allCategories")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-10 gap-1.5",
                activeFiltersCount === 0 && "opacity-50"
              )}
              disabled={activeFiltersCount === 0}
              onClick={clearFilters}
            >
              <RotateCcw className="size-3.5" />
              {t("list.reset")}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Product Table ── */}
      <ProductsTable
        filterStatus={filterStatus}
        filterCategory={filterCategory}
        filterSearch={filterSearch}
        canWriteCatalog={canWriteCatalog}
        syncLoading={gatewayLoading}
      />
    </div>
  );
}
