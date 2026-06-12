"use client";

import { usePathname, Link } from "@/i18n/routing";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { labelForPathSegment } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export function VendorBreadcrumbs({ className }: { className?: string }) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={t("breadcrumb")}
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1 text-xs md:text-sm",
        className
      )}
    >
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground font-medium transition-colors"
      >
        {t("home")}
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labelForPathSegment(segment, t as (key: string) => string);

        return (
          <Fragment key={href}>
            <ChevronRight
              className="size-3.5 shrink-0 opacity-60"
              aria-hidden
            />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                href={href as string}
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
