import type { ReactNode } from "react";

import { VendorDisplay, VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";

type FeaturePageShellProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  animate?: boolean;
  headerActions?: ReactNode;
};

export function FeaturePageShell({
  title,
  description,
  children,
  className,
  animate = true,
  headerActions,
}: FeaturePageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6",
        animate && "animate-page-enter",
        className
      )}
    >
      {title ? (
        <header
          className={cn(
            "flex flex-col gap-2",
            headerActions && "sm:flex-row sm:items-start sm:justify-between",
            animate && "animate-header-enter"
          )}
        >
          <div className="space-y-2">
            <VendorDisplay>{title}</VendorDisplay>
            {description ? (
              <VendorMuted className="max-w-2xl text-base">
                {description}
              </VendorMuted>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex items-center gap-2">{headerActions}</div>
          ) : null}
        </header>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-6",
          animate && "animate-children-stagger"
        )}
      >
        {children}
      </div>
    </main>
  );
}
