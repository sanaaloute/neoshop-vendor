import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function VendorDisplay({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl",
        className
      )}
      {...props}
    />
  );
}

export function VendorHeading({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-foreground text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export function VendorSubheading({
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "font-heading text-foreground text-base leading-snug font-medium",
        className
      )}
      {...props}
    />
  );
}

export function VendorBody({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-foreground/90 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function VendorMuted({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

export function VendorOverline({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-xs font-medium tracking-wider uppercase",
        className
      )}
      {...props}
    />
  );
}
