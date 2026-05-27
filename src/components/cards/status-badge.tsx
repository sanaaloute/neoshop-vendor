import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariants = cva("", {
  variants: {
    status: {
      success:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 dark:text-emerald-200",
      warning:
        "border-amber-500/25 bg-amber-500/10 text-amber-200 dark:text-amber-100",
      danger:
        "border-destructive/30 bg-destructive/15 text-destructive dark:text-red-200",
      info: "border-sky-500/25 bg-sky-500/10 text-sky-200 dark:text-sky-100",
      neutral:
        "border-border/80 bg-muted/60 text-muted-foreground dark:text-muted-foreground",
      pending:
        "border-primary/25 bg-primary/10 text-primary dark:text-primary-foreground/90",
    },
  },
  defaultVariants: {
    status: "neutral",
  },
});

export type VendorStatus = NonNullable<
  VariantProps<typeof statusVariants>["status"]
>;

export function StatusBadge({
  className,
  status = "neutral",
  ...props
}: ComponentProps<typeof Badge> &
  VariantProps<typeof statusVariants> & { status?: VendorStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        statusVariants({ status }),
        className
      )}
      {...props}
    />
  );
}
