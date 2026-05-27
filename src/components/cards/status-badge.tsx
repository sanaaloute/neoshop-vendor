import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariants = cva("", {
  variants: {
    status: {
      success:
        "border-success/40 bg-success/10 text-success shadow-[0_0_12px_rgba(34,197,94,0.15)]",
      warning:
        "border-warning/40 bg-warning/10 text-warning shadow-[0_0_12px_rgba(239,68,68,0.15)]",
      danger:
        "border-danger/40 bg-danger/10 text-danger shadow-[0_0_12px_rgba(239,68,68,0.15)]",
      info: "border-info/40 bg-info/10 text-info shadow-[0_0_12px_rgba(34,197,94,0.15)]",
      neutral:
        "border-border/60 bg-muted/40 text-muted-foreground",
      pending:
        "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_rgba(34,197,94,0.15)]",
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
        "rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
        statusVariants({ status }),
        className
      )}
      {...props}
    />
  );
}
