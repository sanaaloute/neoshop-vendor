"use client";

import { useMemo } from "react";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiBaseUrl } from "@/config/auth";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { VendorCustomer } from "./types";

type CustomersListProps = {
  customers: VendorCustomer[];
  search: string;
  onSearchChange: (v: string) => void;
  repeatOnly: boolean;
  onRepeatOnlyChange: (v: boolean) => void;
  onOpenProfile: (id: string) => void;
  /** While customers are loading */
  syncLoading?: boolean;
  syncError?: string | null;
};

function isRepeatBuyer(tags: string[]) {
  return tags.some((t) => t.toLowerCase().includes("repeat"));
}

export function CustomersList({
  customers,
  search,
  onSearchChange,
  repeatOnly,
  onRepeatOnlyChange,
  onOpenProfile,
  syncLoading = false,
  syncError = null,
}: CustomersListProps) {
  const api = getApiBaseUrl();

  const filtered = useMemo(() => {
    return customers
      .filter((c) => {
        if (repeatOnly && !isRepeatBuyer(c.tags)) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const blob = [c.name, c.email, c.company ?? "", ...c.tags]
            .join(" ")
            .toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  }, [customers, search, repeatOnly]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/80 shadow-vendor-card p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Label htmlFor="cust-search" className="sr-only">
              Search customers
            </Label>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              id="cust-search"
              className="h-9 pl-9"
              placeholder="Search name, email, company, tags…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary size-4"
              checked={repeatOnly}
              onChange={(e) => onRepeatOnlyChange(e.target.checked)}
            />
            Repeat buyers only
          </label>
        </div>
      </Card>

      {!filtered.length ? (
        <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-10 text-center text-sm">
          {syncLoading && customers.length === 0 ? (
            <span className="inline-flex flex-col items-center gap-3">
              <Loader2
                className="text-primary size-8 animate-spin"
                aria-hidden
              />
              <span>Loading…</span>
            </span>
          ) : syncError ? (
            <span className="text-destructive">Could not load data. {syncError}</span>
          ) : !syncLoading && customers.length === 0 && api ? (
            <span>No customers yet.</span>
          ) : !syncLoading && customers.length === 0 && !api ? (
            <span>Connect to your marketplace.</span>
          ) : (
            <span>No matches.</span>
          )}
        </Card>
      ) : (
        <Card className="border-border/80 shadow-vendor-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Last seen
                </TableHead>
                <TableHead className="text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => onOpenProfile(c.id)}
                >
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {c.email}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isRepeatBuyer(c.tags) ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Repeat
                        </Badge>
                      ) : null}
                      {c.tags
                        .filter((t) => !t.toLowerCase().includes("repeat"))
                        .map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="text-[10px] capitalize"
                          >
                            {t}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {c.company ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.orderCount}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(c.totalSpend)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                    {new Date(c.lastSeen).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "h-8"
                      )}
                      onClick={() => onOpenProfile(c.id)}
                    >
                      Profile
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
