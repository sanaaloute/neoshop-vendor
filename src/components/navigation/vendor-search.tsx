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
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={ref}
          id="vendor-search"
          name="vendor-search"
          placeholder="Search orders, SKUs, buyers…"
          className="h-9 pr-3 pl-9 sm:pr-20"
          autoComplete="off"
          aria-label="Global search"
        />
        <kbd className="border-border/80 bg-muted/50 text-muted-foreground pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] select-none sm:inline">
          ⌘K
        </kbd>
      </div>
    );
  }
);
