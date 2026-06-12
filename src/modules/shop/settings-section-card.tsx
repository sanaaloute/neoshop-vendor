"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

type SettingsSectionCardProps = {
  id?: string;
  icon?: ReactNode;
  overline?: string;
  title: string;
  description?: string;
  children: ReactNode;
  index?: number;
  className?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
};

export function SettingsSectionCard({
  id,
  icon,
  overline,
  title,
  description,
  children,
  index = 0,
  className,
  headerAction,
  footer,
}: SettingsSectionCardProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: easeOutExpo,
      }}
    >
      <DashboardCard
        className={cn(
          "gap-0 overflow-hidden py-0 transition-premium hover-lift",
          className
        )}
      >
        <DashboardCardHeader className="border-border/50 bg-gradient-to-r from-transparent via-muted/30 to-transparent border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {icon ? (
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  {icon}
                </div>
              ) : null}
              <div className="space-y-1">
                {overline ? (
                  <DashboardCardDescription className="text-primary/80 text-[11px] font-semibold tracking-wider uppercase">
                    {overline}
                  </DashboardCardDescription>
                ) : null}
                <DashboardCardTitle className="text-base font-semibold tracking-tight">
                  {title}
                </DashboardCardTitle>
                {description ? (
                  <DashboardCardDescription className="text-muted-foreground max-w-md text-xs leading-relaxed">
                    {description}
                  </DashboardCardDescription>
                ) : null}
              </div>
            </div>
            {headerAction ? (
              <div className="shrink-0 pt-0.5">{headerAction}</div>
            ) : null}
          </div>
        </DashboardCardHeader>
        <DashboardCardContent className="px-5 py-5">
          {children}
        </DashboardCardContent>
        {footer ? (
          <div className="border-border/50 bg-muted/20 border-t px-5 py-3">
            {footer}
          </div>
        ) : null}
      </DashboardCard>
    </motion.section>
  );
}
