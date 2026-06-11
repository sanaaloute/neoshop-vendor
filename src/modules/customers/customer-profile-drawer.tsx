"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  ShoppingBag,
  TrendingUp,
  Package,
  ArrowUpDown,
  X,
  User,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { useTranslations } from "next-intl";

import type { VendorCustomer, CustomerProduct } from "./types";

type ProductSort = "spend" | "quantity" | "title";

function isRepeatBuyer(tags: string[]) {
  return tags.some((t) => t.toLowerCase().includes("repeat"));
}

/** Deterministic gradient from name string */
function nameGradient(name: string): string {
  const hash = name.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  const gradients = [
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-sky-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-indigo-600",
  ];
  return gradients[hash % gradients.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Mini KPI pill */
function KpiPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="text-primary size-4" />
      </div>
      <div>
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/** Product breakdown table row with visual bar */
function ProductRow({
  product,
  maxSpend,
  index,
}: {
  product: CustomerProduct;
  maxSpend: number;
  index: number;
}) {
  const t = useTranslations("customers");
  const pct = maxSpend > 0 ? (Number(product.totalSpent) / maxSpend) * 100 : 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.04 }}
      className="group/row flex flex-col gap-2 rounded-xl border border-border/40 bg-card/50 p-4 transition-all hover:border-primary/20 hover:bg-card/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {product.totalQuantity} {t("unitsSold")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatCurrency(Number(product.totalSpent), "CNY", 2)}
          </p>
          <p className="text-muted-foreground text-[10px]">
            {pct.toFixed(0)}{t("percentOfSpend")}
          </p>
        </div>
      </div>
      {/* Visual spend bar */}
      <div className="bg-muted/60 h-1.5 w-full overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

type CustomerProfileDrawerProps = {
  customer: VendorCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomerProfileDrawer({
  customer,
  open,
  onOpenChange,
}: CustomerProfileDrawerProps) {
  const t = useTranslations("customers");
  const [productSort, setProductSort] = useState<ProductSort>("spend");

  const sortedProducts = useMemo(() => {
    if (!customer) return [];
    const products = [...customer.products];
    switch (productSort) {
      case "spend":
        return products.sort(
          (a, b) => Number(b.totalSpent) - Number(a.totalSpent)
        );
      case "quantity":
        return products.sort((a, b) => b.totalQuantity - a.totalQuantity);
      case "title":
        return products.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return products;
    }
  }, [customer, productSort]);

  const maxSpend = useMemo(() => {
    if (!customer?.products.length) return 0;
    return Math.max(...customer.products.map((p) => Number(p.totalSpent)));
  }, [customer]);

  const totalQuantity = useMemo(() => {
    return customer?.products.reduce((s, p) => s + p.totalQuantity, 0) ?? 0;
  }, [customer]);

  const avgOrderValue = useMemo(() => {
    if (!customer || customer.orderCount === 0) return 0;
    return customer.totalSpent / customer.orderCount;
  }, [customer]);

  if (!open) return null;

  if (!customer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg"
          showCloseButton
        >
          <SheetHeader>
            <SheetTitle>{t("customerProfile")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <User className="text-muted-foreground size-12" />
            <p className="text-muted-foreground text-sm">
              {t("selectCustomerToView")}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const repeat = isRepeatBuyer(customer.tags);
  const gradient = nameGradient(customer.name);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        showCloseButton
      >
        {/* Header with avatar */}
        <SheetHeader className="relative border-b border-border/50 px-6 py-6 text-left">
          {/* Background gradient */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-5",
              gradient
            )}
          />

          <div className="relative flex items-start gap-4">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg",
                gradient
              )}
            >
              {initials(customer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl font-semibold tracking-tight">
                {customer.name}
              </SheetTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {customer.email && (
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Mail className="size-3.5" />
                    <span className="truncate">{customer.email}</span>
                  </span>
                )}
              </div>
              {customer.phone && (
                <span className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </span>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge
                  variant={repeat ? "default" : "secondary"}
                  className={cn(
                    "h-5 text-[10px] font-medium",
                    repeat &&
                      "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30"
                  )}
                >
                  <ShoppingBag className="mr-1 size-3" />
                  {customer.orderCount} {t("order", { count: customer.orderCount })}
                </Badge>
                {repeat && (
                  <Badge
                    variant="outline"
                    className="h-5 text-[10px] border-emerald-500/30 text-emerald-700 bg-emerald-500/10"
                  >
                    <TrendingUp className="mr-1 size-3" />
                    {t("repeatBuyer")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 gap-2 px-6 py-4">
          <KpiPill
            icon={ShoppingBag}
            label={t("totalOrdersKpi")}
            value={String(customer.orderCount)}
          />
          <KpiPill
            icon={Wallet}
            label={t("totalSpent")}
            value={formatCurrency(customer.totalSpent, "CNY", 2)}
          />
          <KpiPill
            icon={TrendingUp}
            label={t("avgOrderValue")}
            value={formatCurrency(avgOrderValue, "CNY", 2)}
          />
          <KpiPill
            icon={Package}
            label={t("productsBought")}
            value={String(totalQuantity)}
          />
        </div>

        <Separator className="mx-6 w-auto" />

        {/* Products Breakdown */}
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Package className="text-muted-foreground size-4" />
              {t("productBreakdown")}
            </h3>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-[10px]">{t("sort")}</span>
              <select
                value={productSort}
                onChange={(e) => setProductSort(e.target.value as ProductSort)}
                className="border-input bg-background h-7 rounded-md border px-2 text-[11px]"
              >
                <option value="spend">{t("spend")}</option>
                <option value="quantity">{t("quantity")}</option>
                <option value="title">{t("name")}</option>
              </select>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="text-muted-foreground rounded-xl border border-dashed border-border/50 py-8 text-center text-sm">
              {t("noProductData")}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedProducts.map((product, i) => (
                <ProductRow
                  key={product.productId}
                  product={product}
                  maxSpend={maxSpend}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
