import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariants = cva("", {
  variants: {
    status: {
      success:
        "border-success/30 bg-success/10 text-success dark:text-success/90",
      warning:
        "border-warning/30 bg-warning/10 text-warning dark:text-warning/90",
      danger:
        "border-danger/30 bg-danger/10 text-danger dark:text-danger/90",
      info: "border-info/30 bg-info/10 text-info dark:text-info/90",
      neutral:
        "border-border/80 bg-muted/60 text-muted-foreground dark:text-muted-foreground",
      pending:
        "border-primary/30 bg-primary/10 text-primary dark:text-primary-foreground/90",
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
