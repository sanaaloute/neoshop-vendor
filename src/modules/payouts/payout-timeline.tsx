"use client";

import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { cn } from "@/lib/utils";

type PayoutTimelineEvent = {
  id: string;
  title: string;
  detail: string;
  at: string;
  status: "complete" | "current" | "upcoming";
};

type PayoutTimelineProps = {
  events: PayoutTimelineEvent[];
  className?: string;
};

export function PayoutTimeline({ events, className }: PayoutTimelineProps) {
  const t = useTranslations("payouts.timeline");
  return (
    <DashboardCard className={cn("gap-0 py-0", className)}>
      <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
        <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          {t("pipeline")}
        </DashboardCardDescription>
        <DashboardCardTitle className="text-base">
          {t("title")}
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="px-4 py-4">
        <ol className="relative space-y-0">
          {events.map((e, i) => {
            const isLast = i === events.length - 1;
            const done = e.status === "complete";
            const current = e.status === "current";
            return (
              <li key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      done &&
                        "border-green-500/50 bg-green-500/15 text-green-600 dark:text-green-400",
                      current &&
                        "border-primary/60 bg-primary/15 text-primary ring-primary/25 ring-2",
                      !done &&
                        !current &&
                        "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Circle
                        className="size-3 fill-current opacity-80"
                        aria-hidden
                      />
                    )}
                  </span>
                  {!isLast ? (
                    <span
                      className="bg-border my-1 min-h-[28px] w-px flex-1"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className={cn("pb-6", isLast && "pb-0")}>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {e.detail}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">
                    {new Date(e.at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </DashboardCardContent>
    </DashboardCard>
  );
}
