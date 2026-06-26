"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  TrendingUp,
  User,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/feedback/loading-button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/config/auth";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { DashboardCard } from "@/components/cards/dashboard-card";
import { useTranslations } from "next-intl";

import type { VendorCustomer, CustomerProduct } from "./types";

type SortKey = "spend" | "orders" | "name";

function isRepeatBuyer(tags: string[]) {
  return tags.some((t) => t.toLowerCase().includes("repeat"));
}

/** Deterministic gradient from name string */
function nameGradient(name: string): string {
  const hash = name.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  const gradients = [
    "from-amber-500/20 to-orange-600/20 border-amber-500/30",
    "from-emerald-500/20 to-teal-600/20 border-emerald-500/30",
    "from-sky-500/20 to-blue-600/20 border-sky-500/30",
    "from-violet-500/20 to-purple-600/20 border-violet-500/30",
    "from-rose-500/20 to-pink-600/20 border-rose-500/30",
    "from-cyan-500/20 to-indigo-600/20 border-cyan-500/30",
  ];
  return gradients[hash % gradients.length];
}

function nameTextColor(name: string): string {
  const hash = name.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  const colors = [
    "text-amber-600",
    "text-emerald-600",
    "text-sky-600",
    "text-violet-600",
    "text-rose-600",
    "text-cyan-600",
  ];
  return colors[hash % colors.length];
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

/** Mini product bars for card preview */
function ProductMiniBars({ products }: { products: CustomerProduct[] }) {
  const t = useTranslations("customers");
  const top = useMemo(
    () =>
      [...products]
        .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
        .slice(0, 3),
    [products]
  );
  const maxQty = Math.max(...top.map((p) => p.totalQuantity), 1);

  if (top.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {t("topProducts")}
      </p>
      {top.map((p) => (
        <div key={p.productId} className="group/bar">
          <div className="flex items-center justify-between gap-2">
            <span className="max-w-[70%] truncate text-xs font-medium">
              {p.title}
            </span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {p.totalQuantity} qty
            </span>
          </div>
          <div className="bg-muted/60 mt-1 h-1.5 w-full overflow-hidden rounded-full">
            <motion.div
              className="from-primary/70 to-primary h-full rounded-full bg-gradient-to-r"
              initial={{ width: 0 }}
              animate={{ width: `${(p.totalQuantity / maxQty) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Individual customer card */
function CustomerCard({
  customer,
  index,
  onOpenProfile,
  onStartConversation,
  startingConversation,
}: {
  customer: VendorCustomer;
  index: number;
  onOpenProfile: (id: string) => void;
  onStartConversation?: (customer: VendorCustomer) => void;
  startingConversation?: boolean;
}) {
  const t = useTranslations("customers");
  const repeat = isRepeatBuyer(customer.tags);
  const gradient = nameGradient(customer.name);
  const textColor = nameTextColor(customer.name);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.05 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      className="group"
    >
      <DashboardCard
        className={cn(
          "relative overflow-hidden p-0 transition-all duration-300",
          "hover:shadow-glass hover:border-primary/20"
        )}
      >
        {/* Subtle gradient overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            gradient
          )}
        />

        <div className="relative flex flex-col p-5">
          {/* Header: Avatar + Name */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold",
                gradient,
                textColor
              )}
            >
              {initials(customer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                {customer.name}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {customer.email && (
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                    <Mail className="size-3" />
                    <span className="truncate">{customer.email}</span>
                  </span>
                )}
              </div>
              {customer.phone && (
                <span className="text-muted-foreground mt-0.5 inline-flex items-center gap-1 text-[11px]">
                  <Phone className="size-3" />
                  {customer.phone}
                </span>
              )}
            </div>
            {onStartConversation && (
              <LoadingButton
                type="button"
                variant="ghost"
                size="icon-sm"
                loading={startingConversation}
                spinnerPosition="overlay"
                className="text-muted-foreground hover:text-primary shrink-0"
                aria-label={t("startConversation")}
                title={t("startConversation")}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartConversation(customer);
                }}
              >
                <MessageCircle className="size-4" />
              </LoadingButton>
            )}
          </div>

          {/* Stats Row */}
          <div className="mt-4 flex items-center gap-3">
            <Badge
              variant={repeat ? "default" : "secondary"}
              className={cn(
                "h-5 text-[10px] font-medium",
                repeat &&
                  "border-amber-500/30 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20"
              )}
            >
              <ShoppingBag className="mr-1 size-3" />
              {customer.orderCount} {t("order", { count: customer.orderCount })}
            </Badge>
            {repeat && (
              <Badge
                variant="outline"
                className="h-5 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700"
              >
                <TrendingUp className="mr-1 size-3" />
                {t("repeat")}
              </Badge>
            )}
          </div>

          {/* Total Spent */}
          <div className="mt-3">
            <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              {t("totalSpent")}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(customer.totalSpent, "CNY", 2)}
            </p>
          </div>

          {/* Product Mini Bars */}
          {customer.products.length > 0 && (
            <ProductMiniBars products={customer.products} />
          )}

          {/* Footer Action */}
          <div className="border-border/40 mt-4 border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/5 h-8 w-full justify-between text-xs font-medium"
              onClick={() => onOpenProfile(customer.id)}
            >
              <span>{t("viewProfile")}</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </DashboardCard>
    </motion.div>
  );
}

/** Shimmer skeleton card */
function SkeletonCard() {
  return (
    <DashboardCard className="overflow-hidden p-5">
      <div className="flex items-start gap-3">
        <div className="bg-muted h-12 w-12 shrink-0 animate-pulse rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="bg-muted h-5 w-20 animate-pulse rounded-full" />
      </div>
      <div className="mt-3 space-y-1">
        <div className="bg-muted h-3 w-16 animate-pulse rounded" />
        <div className="bg-muted h-8 w-full animate-pulse rounded" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="bg-muted h-3 w-full animate-pulse rounded" />
        <div className="bg-muted h-1.5 w-full animate-pulse rounded-full" />
        <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-1.5 w-3/4 animate-pulse rounded-full" />
      </div>
    </DashboardCard>
  );
}

type CustomerCardGridProps = {
  customers: VendorCustomer[];
  syncLoading?: boolean;
  syncError?: string | null;
  onOpenProfile: (id: string) => void;
  onStartConversation?: (customer: VendorCustomer) => void;
  startingConversationId?: string | null;
};

export function CustomerCardGrid({
  customers,
  syncLoading = false,
  syncError = null,
  onOpenProfile,
  onStartConversation,
  startingConversationId = null,
}: CustomerCardGridProps) {
  const t = useTranslations("customers");
  const api = getApiBaseUrl();
  const [search, setSearch] = useState("");
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("spend");

  const filtered = useMemo(() => {
    let result = [...customers];

    if (repeatOnly) {
      result = result.filter((c) => isRepeatBuyer(c.tags));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const blob = [c.name, c.email, c.phone ?? "", ...c.tags]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case "spend":
          return b.totalSpent - a.totalSpent;
        case "orders":
          return b.orderCount - a.orderCount;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [customers, search, repeatOnly, sortKey]);

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Bar */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="h-10 pl-10 text-sm"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRepeatOnly((v) => !v)}
            aria-pressed={repeatOnly}
            className={cn(
              "h-9 gap-1.5 px-3 text-xs font-medium transition-all",
              repeatOnly
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15"
                : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50"
            )}
          >
            <TrendingUp className="size-3.5" />
            {t("repeatBuyers")}
          </Button>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="border-input bg-background h-9 rounded-lg border px-3 text-xs"
          >
            <option value="spend">{t("sortBySpend")}</option>
            <option value="orders">{t("sortByOrders")}</option>
            <option value="name">{t("sortByName")}</option>
          </select>
        </div>
      </motion.div>

      {/* Results count */}
      {customers.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {t("showingOf", {
            filtered: filtered.length,
            total: customers.length,
          })}
        </p>
      )}

      {/* Grid */}
      {!filtered.length ? (
        <div className="border-border/80 bg-muted/15 text-muted-foreground rounded-xl border border-dashed p-12 text-center">
          {syncLoading && customers.length === 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : syncError ? (
            <div className="flex flex-col items-center gap-3">
              <User className="text-destructive size-10" />
              <p className="text-destructive text-sm font-medium">
                {t("couldNotLoadCustomers")}
              </p>
              <p className="text-xs">{syncError}</p>
            </div>
          ) : !syncLoading && customers.length === 0 && api ? (
            <div className="flex flex-col items-center gap-3">
              <div className="from-primary/10 to-primary/5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
                <ShoppingBag className="text-primary/60 size-8" />
              </div>
              <p className="text-sm font-medium">{t("noCustomersYet")}</p>
              <p className="max-w-xs text-xs">{t("noCustomersDescription")}</p>
            </div>
          ) : !syncLoading && customers.length === 0 && !api ? (
            <div className="flex flex-col items-center gap-3">
              <User className="text-muted-foreground size-10" />
              <p className="text-sm font-medium">{t("connectMarketplace")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Search className="text-muted-foreground size-10" />
              <p className="text-sm font-medium">{t("noMatches")}</p>
              <p className="text-xs">{t("tryAdjustingFilters")}</p>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((customer, i) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              index={i}
              onOpenProfile={onOpenProfile}
              onStartConversation={onStartConversation}
              startingConversation={startingConversationId === customer.id}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
