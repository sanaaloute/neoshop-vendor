import type { ReactNode } from "react";

import { VendorDisplay, VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";

type FeaturePageShellProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function FeaturePageShell({
  title,
  description,
  children,
  className,
}: FeaturePageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6",
        className
      )}
    >
      <header className="space-y-2">
        <VendorDisplay>{title}</VendorDisplay>
        {description ? (
          <VendorMuted className="max-w-2xl text-base">
            {description}
          </VendorMuted>
        ) : null}
      </header>
      {children}
    </main>
  );
}
