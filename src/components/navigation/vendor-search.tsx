"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VendorSearchProps = {
  className?: string;
};

export const VendorSearch = forwardRef<HTMLInputElement, VendorSearchProps>(
  function VendorSearch({ className }, ref) {
    return (
      <div className={cn("relative w-full max-w-md min-w-[140px]", className)}>
        <Search
          className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={ref}
          id="vendor-search"
          name="vendor-search"
          placeholder="Search orders, SKUs, buyers…"
          className="h-9 rounded-xl border-border/50 bg-muted/30 pr-20 pl-10 text-sm backdrop-blur-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-muted/50 focus:ring-2 focus:ring-primary/10"
          autoComplete="off"
          aria-label="Global search"
        />
        <kbd className="border-border/60 bg-muted/40 text-muted-foreground/70 pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border px-1.5 py-0.5 font-mono text-[10px] select-none sm:inline">
          ⌘K
        </kbd>
      </div>
    );
  }
);
