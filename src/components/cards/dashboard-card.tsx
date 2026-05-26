import type { ComponentProps } from "react";

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
  "relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 shadow-vendor-card ring-1 ring-white/[0.07] backdrop-blur-xl transition-all duration-300 hover:border-primary/20 dark:bg-card/50 dark:ring-white/[0.08]";

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
  return <CardHeader className={cn("gap-1.5", className)} {...props} />;
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
      className={cn(
        "border-border/50 bg-muted/20 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
