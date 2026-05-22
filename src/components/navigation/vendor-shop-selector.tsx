"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SHOPS = [
  { id: "main", label: "Main storefront" },
  { id: "eu-b2b", label: "EU · B2B wholesale" },
] as const;

export function VendorShopSelector({ className }: { className?: string }) {
  const [active, setActive] = useState<string>(SHOPS[0].id);
  const current = SHOPS.find((s) => s.id === active) ?? SHOPS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "border-border bg-background hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 min-w-[10rem] items-center justify-between gap-2 rounded-lg border px-2.5 text-sm font-normal shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
          className
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Store className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate text-left">{current.label}</span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs">Active shop</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SHOPS.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            className="gap-2"
            onClick={() => setActive(shop.id)}
          >
            <span className="flex-1 truncate">{shop.label}</span>
            {shop.id === active ? (
              <Check className="text-primary size-4 shrink-0" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
