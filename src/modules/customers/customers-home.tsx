"use client";

import { useEffect, useMemo, useState } from "react";

import { MetricCard } from "@/components/cards/metric-card";
import { formatCompact } from "@/lib/format";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getApiBaseUrl } from "@/config/auth";

import { CustomerProfileDrawer } from "./customer-profile-drawer";
import { CustomersList } from "./customers-list";
import { fetchVendorCustomers } from "./customers-api";
import type { VendorCustomer } from "./types";

function isRepeatBuyer(tags: string[]) {
  return tags.some((t) => t.toLowerCase().includes("repeat"));
}

export function CustomersHome() {
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVendorCustomers();
        if (!cancelled) setCustomers(data);
      } catch (e) {
        if (!cancelled) {
          setError(httpErrorMessageForUser(e, "Could not load customers."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const repeat = customers.filter((c) => isRepeatBuyer(c.tags)).length;
    const spend = customers.reduce((s, c) => s + c.totalSpend, 0);
    return { repeat, spend, count: customers.length };
  }, [customers]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Customers"
          value={stats.count}
          index={0}
        />
        <MetricCard
          label="Repeat buyers"
          value={stats.repeat}
          index={1}
        />
        <MetricCard
          label="Recorded LTV"
          value={formatCompact(stats.spend)}
          index={2}
        />
      </div>

      <CustomersList
        customers={customers}
        search={search}
        onSearchChange={setSearch}
        repeatOnly={repeatOnly}
        onRepeatOnlyChange={setRepeatOnly}
        onOpenProfile={(id) => {
          setActiveId(id);
          setDrawerOpen(true);
        }}
        syncLoading={loading}
        syncError={error}
      />

      <CustomerProfileDrawer
        customers={customers}
        customerId={activeId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setActiveId(null);
        }}
      />
    </div>
  );
}
