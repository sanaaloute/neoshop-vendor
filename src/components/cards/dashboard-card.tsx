"use client";

import type { ComponentProps } from "react";
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const shell =
  "relative overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-vendor-card ring-1 ring-white/5 backdrop-blur-md dark:bg-card/60 dark:ring-white/10 transition-premium hover-lift";

export function DashboardCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return <Card className={cn(shell, className)} {...props} />;
}

export function DashboardCardHeader({
  className,
  ...props
}: ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("gap-1", className)} {...props} />;
}

export function DashboardCardTitle({
  className,
  ...props
}: ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn("text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function DashboardCardDescription({
  className,
  ...props
}: ComponentProps<typeof CardDescription>) {
  return <CardDescription className={cn("text-xs", className)} {...props} />;
}

export function DashboardCardContent({
  className,
  ...props
}: ComponentProps<typeof CardContent>) {
  return <CardContent className={cn("pt-0", className)} {...props} />;
}

export function DashboardCardFooter({
  className,
  ...props
}: ComponentProps<typeof CardFooter>) {
  return (
    <CardFooter
      className={cn("border-border/60 bg-muted/30", className)}
      {...props}
    />
  );
}

/** Animated dashboard card with entrance animation */
export function AnimatedDashboardCard({
  className,
  index = 0,
  ...props
}: ComponentProps<typeof DashboardCard> & { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <DashboardCard className={className} {...props} />
    </motion.div>
  );
}
