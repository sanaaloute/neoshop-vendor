import type { ReactNode } from "react";

import { VendorDisplay } from "@/components/layout/typography";
import { cn } from "@/lib/utils";

type FeaturePageShellProps = {
  title: string;
  children?: ReactNode;
  className?: string;
};

export function FeaturePageShell({
  title,
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
      <header>
        <VendorDisplay className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          {title}
        </VendorDisplay>
      </header>
      {children}
    </main>
  );
}
