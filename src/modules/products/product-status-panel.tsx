"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
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
  Layers,
  Search,
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

function statusLabel(status: ProductFormValues["status"], t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "published":
      return t("status.published");
    case "pending_review":
      return t("status.pending_review");
    case "draft":
      return t("status.draft");
    case "rejected":
      return t("status.rejected");
    case "scheduled":
      return t("status.scheduled");
    case "hidden":
      return t("status.hidden");
    case "archived":
      return t("status.archived");
    default:
      return status;
  }
}

export function useProductChecklist(values: ProductFormValues, t: ReturnType<typeof useTranslations>): {
  items: CheckItem[];
  completed: number;
  total: number;
  percent: number;
} {
  return useMemo(() => {
    const items: CheckItem[] = [
      {
        key: "name",
        label: t("productNameCheck"),
        icon: <Package className="size-3.5" />,
        valid: values.name.trim().length >= 2,
      },
      {
        key: "images",
        label: t("images"),
        icon: <ImageIcon className="size-3.5" />,
        valid: values.media.length > 0,
      },
      {
        key: "category",
        label: t("category"),
        icon: <FolderOpen className="size-3.5" />,
        valid: values.categoryIds.length > 0,
      },
      {
        key: "description",
        label: t("description"),
        icon: <Tag className="size-3.5" />,
        valid: values.description.trim().length >= 10,
      },
      {
        key: "variants",
        label: t("variants"),
        icon: <Layers className="size-3.5" />,
        valid: true, // optional for now
        optional: true,
      },
      {
        key: "seo",
        label: t("seo"),
        icon: <Search className="size-3.5" />,
        valid: values.seo.slug.trim().length >= 2,
        optional: true,
      },
    ];
    const total = items.length;
    const completed = items.filter((i) => i.valid).length;
    const percent = Math.round((completed / total) * 100);
    return { items, completed, total, percent };
  }, [values, t]);
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
  const t = useTranslations("products");
  const { items, completed, total, percent } = useProductChecklist(values, t);
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
            {t("productStatus")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Badge variant={statusBadgeVariant(values.status)} className="capitalize">
              {statusLabel(values.status, t)}
            </Badge>
            {saving ? (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <span className="bg-muted-foreground/60 size-1.5 rounded-full animate-bounce-subtle" style={{ animationDelay: "0ms" }} />
                <span className="bg-muted-foreground/60 size-1.5 rounded-full animate-bounce-subtle" style={{ animationDelay: "120ms" }} />
                <span className="bg-muted-foreground/60 size-1.5 rounded-full animate-bounce-subtle" style={{ animationDelay: "240ms" }} />
                {t("saving")}
              </span>
            ) : savedAt ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("lastSaved", { time: savedAt })}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t("percentComplete", { percent })}</span>
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
              {t("preview")}
            </Button>
            {catalogProductId && (
              <Link
                href={`/variants?productId=${catalogProductId}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted/60"
              >
                <Layers className="size-3.5" />
                {t("variants")}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card className="glass-card shadow-glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
            {t("checklist")}
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
                    {t("optional")}
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
            {t("livePreview")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="bg-background/50 rounded-xl border border-border/50 overflow-hidden">
            <div className="aspect-[4/3] bg-muted/40 relative">
              {primaryImage?.url ? (
                <img
                  src={primaryImage.url}
                  alt={values.name || t("untitledProduct")}
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
                {values.name.trim() || t("untitledProduct")}
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
