"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Eye,
  Package,
  ImageIcon,
  Tag,
  FolderOpen,
  DollarSign,
  Layers,
  Search,
  ArrowUpRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { useCategoriesStore } from "@/store/categories-store";
import type { ProductFormValues } from "./types";

type CheckItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  valid: boolean;
  optional?: boolean;
};

function statusBadgeVariant(status: ProductFormValues["status"]) {
  switch (status) {
    case "published":
      return "default";
    case "pending_review":
      return "secondary";
    case "draft":
      return "outline";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: ProductFormValues["status"]) {
  switch (status) {
    case "published":
      return "Published";
    case "pending_review":
      return "Pending Review";
    case "draft":
      return "Draft";
    case "rejected":
      return "Rejected";
    case "scheduled":
      return "Scheduled";
    case "hidden":
      return "Hidden";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function useProductChecklist(values: ProductFormValues): {
  items: CheckItem[];
  completed: number;
  total: number;
  percent: number;
} {
  return useMemo(() => {
    const items: CheckItem[] = [
      {
        key: "name",
        label: "Product Name",
        icon: <Package className="size-3.5" />,
        valid: values.name.trim().length >= 2,
      },
      {
        key: "images",
        label: "Images",
        icon: <ImageIcon className="size-3.5" />,
        valid: values.media.length > 0,
      },
      {
        key: "category",
        label: "Category",
        icon: <FolderOpen className="size-3.5" />,
        valid: values.categoryIds.length > 0,
      },
      {
        key: "price",
        label: "Price",
        icon: <DollarSign className="size-3.5" />,
        valid: Number.isFinite(values.price) && values.price > 0,
      },
      {
        key: "description",
        label: "Description",
        icon: <Tag className="size-3.5" />,
        valid: values.description.trim().length >= 10,
      },
      {
        key: "variants",
        label: "Variants",
        icon: <Layers className="size-3.5" />,
        valid: true, // optional for now
        optional: true,
      },
      {
        key: "seo",
        label: "SEO Settings",
        icon: <Search className="size-3.5" />,
        valid:
          values.seo.slug.trim().length >= 2 &&
          values.seo.metaTitle.trim().length >= 4,
        optional: true,
      },
    ];
    const total = items.length;
    const completed = items.filter((i) => i.valid).length;
    const percent = Math.round((completed / total) * 100);
    return { items, completed, total, percent };
  }, [values]);
}

type ProductStatusPanelProps = {
  values: ProductFormValues;
  catalogProductId: string | null;
  savedAt: string | null;
  onPreview: () => void;
  saving: boolean;
};

export function ProductStatusPanel({
  values,
  catalogProductId,
  savedAt,
  onPreview,
  saving,
}: ProductStatusPanelProps) {
  const { items, completed, total, percent } = useProductChecklist(values);
  const categories = useCategoriesStore((s) => s.categories);

  const primaryImage = values.media[0];
  const categoryNames = values.categoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-5 lg:sticky lg:top-4">
      {/* Status Card */}
      <Card className="glass-card shadow-glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
            Product Status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Badge variant={statusBadgeVariant(values.status)} className="capitalize">
              {statusLabel(values.status)}
            </Badge>
            {saving ? (
              <span className="text-xs text-muted-foreground animate-pulse">
                Saving…
              </span>
            ) : savedAt ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                Saved {savedAt}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{percent}% Complete</span>
              <span className="text-muted-foreground text-xs">
                {completed}/{total}
              </span>
            </div>
            <Progress value={percent}>
              <ProgressTrack className="h-1.5">
                <ProgressIndicator
                  className={
                    percent === 100
                      ? "bg-emerald-500"
                      : percent >= 70
                        ? "bg-primary"
                        : "bg-amber-500"
                  }
                />
              </ProgressTrack>
            </Progress>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onPreview}
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
            {catalogProductId && (
              <Link
                href={`/variants?productId=${catalogProductId}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted/60"
              >
                <Layers className="size-3.5" />
                Variants
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card className="glass-card shadow-glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
            Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-2.5 text-sm"
              >
                {item.valid ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                ) : item.optional ? (
                  <AlertCircle className="size-4 shrink-0 text-amber-500/70" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                )}
                <span
                  className={
                    item.valid
                      ? "text-foreground/80"
                      : item.optional
                        ? "text-foreground/50"
                        : "text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
                {item.optional && !item.valid && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    Optional
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Live Preview Card */}
      <Card className="glass-card shadow-glass overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="bg-background/50 rounded-xl border border-border/50 overflow-hidden">
            <div className="aspect-[4/3] bg-muted/40 relative">
              {primaryImage?.url ? (
                <img
                  src={primaryImage.url}
                  alt={values.name || "Product"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Package className="size-10 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-3 grid gap-1">
              <p className="text-sm font-medium truncate">
                {values.name.trim() || "Untitled Product"}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {Number.isFinite(values.price)
                  ? formatCurrency(values.price)
                  : "—"}
              </p>
              {categoryNames.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {categoryNames.join(" · ")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
