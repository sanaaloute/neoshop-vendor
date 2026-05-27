import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function VendorDisplay({
  className,
  ...props
}: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "font-heading text-2xl font-bold tracking-tight md:text-3xl",
        className
      )}
      {...props}
    />
  );
}

export function VendorHeading({
  className,
  ...props
}: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-xl font-semibold tracking-tight",
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
        "font-heading text-base font-medium leading-snug tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export function VendorBody({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-black", className)}
      {...props}
    />
  );
}

export function VendorMuted({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-black", className)}
      {...props}
    />
  );
}

export function VendorOverline({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500",
        className
      )}
      {...props}
    />
  );
}

export function VendorMono({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-mono text-sm tabular-nums tracking-tighter",
        className
      )}
      {...props}
    />
  );
}
