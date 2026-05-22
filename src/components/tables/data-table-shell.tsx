import type { ComponentProps, ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";

type DataTableShellProps = {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
} & Pick<ComponentProps<"div">, "className">;

export function DataTableShell({
  title,
  description,
  toolbar,
  footer,
  children,
  className,
}: DataTableShellProps) {
  return (
    <section
      className={cn(
        "border-border/60 bg-card/50 shadow-vendor-card dark:bg-card/40 flex flex-col gap-3 rounded-xl border p-3 ring-1 ring-white/5 backdrop-blur-sm dark:ring-white/10",
        className
      )}
    >
      {(title || description || toolbar) && (
        <header className="flex flex-col gap-3 px-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="font-heading text-sm font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <VendorMuted className="text-xs">{description}</VendorMuted>
            ) : null}
          </div>
          {toolbar ? (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </header>
      )}
      <ScrollArea className="border-border/50 max-h-[min(70vh,720px)] rounded-lg border">
        <div className="min-w-0 overflow-x-auto">{children}</div>
      </ScrollArea>
      {footer ? (
        <footer className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
