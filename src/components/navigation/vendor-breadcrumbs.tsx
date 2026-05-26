"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ChevronRight, Home } from "lucide-react";

import { labelForPathSegment } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export function VendorBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-muted-foreground/70 flex flex-wrap items-center gap-1 text-xs md:text-sm",
        className
      )}
    >
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-primary flex items-center gap-1 font-medium transition-colors"
      >
        <Home className="size-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labelForPathSegment(segment);

        return (
          <Fragment key={href}>
            <ChevronRight
              className="size-3.5 shrink-0 opacity-40"
              aria-hidden
            />
            {isLast ? (
              <span className="text-foreground font-semibold">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
