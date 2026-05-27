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
      <div className={cn("relative w-full min-w-[140px]", className)}>
        <Search
          className="text-primary/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={ref}
          id="vendor-search"
          name="vendor-search"
          placeholder="Search…"
          className="h-9 rounded-lg border-border/40 bg-muted/20 pr-4 pl-10 text-sm backdrop-blur-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-muted/30 focus:shadow-[0_0_20px_rgba(34,197,94,0.15)] focus:ring-0"
          autoComplete="off"
          aria-label="Global search"
        />
      </div>
    );
  }
);
