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
  "relative overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-vendor-card ring-1 ring-white/5 backdrop-blur-md dark:bg-card/60 dark:ring-white/10";

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
