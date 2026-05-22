"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  listVendorDisputes,
  getVendorDispute,
  postDisputeMessage,
} from "@/services/vendor/disputes-api";

import { DisputeThread } from "./dispute-thread";
import { DisputeWorkflow } from "./dispute-workflow";
import type { DisputeCase, DisputeStatus } from "./types";
import { toDisputeCase } from "./types";

import { useIsDesktop } from "@/hooks/use-is-desktop";

function statusBadge(status: DisputeStatus) {
  switch (status) {
    case "open":
      return (
        <Badge variant="outline" className="font-normal">
          Open
        </Badge>
      );
    case "investigating":
      return (
        <Badge variant="secondary" className="font-normal">
          Investigating
        </Badge>
      );
    case "awaiting_customer":
      return (
        <Badge variant="secondary" className="font-normal">
          Awaiting customer
        </Badge>
      );
    case "awaiting_vendor":
      return (
        <Badge variant="secondary" className="font-normal">
          Awaiting vendor
        </Badge>
      );
    case "mediation":
      return (
        <Badge variant="secondary" className="font-normal">
          Mediation
        </Badge>
      );
    case "escalated":
      return (
        <Badge variant="destructive" className="font-normal">
          Escalated
        </Badge>
      );
    case "resolved":
      return (
        <Badge
          variant="secondary"
          className="border-emerald-500/40 bg-emerald-500/15 font-normal text-emerald-800 dark:text-emerald-200"
        >
          Resolved
        </Badge>
      );
    default:
      return null;
  }
}

function isTerminal(status: DisputeStatus) {
  return status === "resolved";
}

function DisputeCasePanel({
  dispute,
  onSendMessage,
  sending,
  sendError,
}: {
  dispute: DisputeCase;
  onSendMessage: (body: string) => void;
  sending?: boolean;
  sendError?: string | null;
}) {
  const locked = isTerminal(dispute.status);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(dispute.status)}
          <span className="text-muted-foreground text-xs tabular-nums">
            Due {new Date(dispute.dueAt).toLocaleDateString()}
          </span>
        </div>
        <DisputeWorkflow status={dispute.status} />
        {sendError ? (
          <p className="text-destructive text-xs">{sendError}</p>
        ) : null}
      </div>

      <DashboardCard className="flex min-h-0 flex-1 flex-col gap-0 py-0">
        <DashboardCardHeader className="border-border/50 shrink-0 border-b px-4 py-3">
          <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Communication
          </DashboardCardDescription>
          <DashboardCardTitle className="text-base">Conversation</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardContent className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <DisputeThread
            messages={dispute.messages}
            onSend={onSendMessage}
            readOnly={locked}
            busy={sending}
          />
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}

export function DisputesHome() {
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const desktop = useIsDesktop();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setListLoading(true);
        setListError(null);
        const paginated = await listVendorDisputes();
        if (cancelled) return;
        const mapped = paginated.items.map((s) => toDisputeCase(s));
        setCases(mapped);
      } catch (err) {
        if (cancelled) return;
        setListError(
          err instanceof Error ? err.message : "Failed to load disputes"
        );
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetailError(null);
      return;
    }
    const id = selectedId;
    let cancelled = false;
    async function load() {
      try {
        setDetailLoading(true);
        setDetailError(null);
        const detail = await getVendorDispute(id);
        if (cancelled) return;
        setCases((prev) =>
          prev.map((c) =>
            c.id === selectedId ? toDisputeCase(detail, detail) : c
          )
        );
      } catch (err) {
        if (cancelled) return;
        setDetailError(
          err instanceof Error ? err.message : "Failed to load dispute"
        );
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (desktop && !selectedId && cases[0]) {
      setSelectedId(cases[0].id);
    }
  }, [desktop, selectedId, cases]);

  useEffect(() => {
    if (desktop) setSheetOpen(false);
  }, [desktop]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.orderId.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [cases, query]);

  const selected = useMemo(
    () => cases.find((c) => c.id === selectedId) ?? null,
    [cases, selectedId]
  );

  const selectCase = (id: string) => {
    setSelectedId(id);
    if (!desktop) setSheetOpen(true);
  };

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!selectedId) return;
      try {
        setSendLoading(true);
        setSendError(null);
        await postDisputeMessage(selectedId, { body });
        const detail = await getVendorDispute(selectedId);
        setCases((prev) =>
          prev.map((c) =>
            c.id === selectedId ? toDisputeCase(detail, detail) : c
          )
        );
      } catch (err) {
        setSendError(
          err instanceof Error ? err.message : "Failed to send message"
        );
      } finally {
        setSendLoading(false);
      }
    },
    [selectedId]
  );

  const panelProps = selected
    ? {
        dispute: selected,
        onSendMessage: handleSendMessage,
        sending: sendLoading,
        sendError,
      }
    : null;

  if (listLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading disputes…</p>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <p className="text-destructive text-sm font-medium">
          Failed to load disputes
        </p>
        <p className="text-muted-foreground max-w-sm text-center text-xs">
          {listError}
        </p>
        <Button
          onClick={() => window.location.reload()}
          size="sm"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col gap-5">
        <DashboardCard className="max-w-xl">
          <DashboardCardHeader>
            <DashboardCardTitle>No dispute cases</DashboardCardTitle>
            <DashboardCardDescription>
              Nothing open right now. Case details will appear here when
              available.
            </DashboardCardDescription>
          </DashboardCardHeader>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="lg:border-border/60 lg:bg-card/40 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border">
        <aside className="lg:border-border/60 flex flex-col lg:w-[min(100%,380px)] lg:shrink-0 lg:border-r">
          <div className="border-border/60 border-b p-3">
            <Input
              placeholder="Search case, order…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search disputes"
            />
          </div>
          <div className="max-h-[480px] overflow-y-auto lg:max-h-[calc(100vh-220px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3">Case</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pr-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <TableRow
                      key={c.id}
                      data-state={active ? "selected" : undefined}
                      className={cn("cursor-pointer", active && "bg-muted/60")}
                      onClick={() => selectCase(c.id)}
                    >
                      <TableCell className="max-w-[200px] pl-3">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="text-muted-foreground text-[11px] tabular-nums">
                          {c.orderId} · {c.id}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(c.amount, c.currency)}
                      </TableCell>
                      <TableCell className="pr-3">
                        {statusBadge(c.status)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </aside>

        <section className="hidden min-h-0 min-w-0 flex-1 flex-col gap-4 p-4 lg:flex">
          {selected ? (
            <>
              <div className="shrink-0 space-y-1">
                <h2 className="text-lg leading-tight font-semibold">
                  {selected.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Order <span className="font-mono">{selected.orderId}</span>{" "}
                  · Reason{" "}
                  <Badge
                    variant="outline"
                    className="align-middle font-mono text-xs"
                  >
                    {selected.reasonCode}
                  </Badge>
                </p>
              </div>
              {detailLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <Loader2 className="text-muted-foreground size-8 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Loading case details…
                  </p>
                </div>
              ) : detailError ? (
                <div className="border-border flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
                  <p className="text-destructive text-sm font-medium">
                    Failed to load details
                  </p>
                  <p className="text-muted-foreground max-w-sm text-xs">
                    {detailError}
                  </p>
                </div>
              ) : panelProps ? (
                <DisputeCasePanel {...panelProps} />
              ) : null}
            </>
          ) : (
            <div className="border-border flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
              <MessageSquare
                className="text-muted-foreground size-10"
                aria-hidden
              />
              <p className="text-sm font-medium">Select a dispute</p>
              <p className="text-muted-foreground max-w-sm text-xs">
                Choose a row in the list to open case detail, workflow, and
                messages.
              </p>
            </div>
          )}
        </section>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg"
        >
          {selected ? (
            <>
              <SheetHeader className="border-border/60 shrink-0 border-b text-left">
                <SheetTitle className="pr-8 leading-snug">
                  {selected.title}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{selected.orderId}</span>
                  {statusBadge(selected.status)}
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground w-fit gap-1 self-start px-0"
                  onClick={() => {
                    setSheetOpen(false);
                    setSelectedId(null);
                  }}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back to list
                </Button>
                {detailLoading ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2">
                    <Loader2 className="text-muted-foreground size-8 animate-spin" />
                    <p className="text-muted-foreground text-sm">
                      Loading case details…
                    </p>
                  </div>
                ) : detailError ? (
                  <div className="border-border flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
                    <p className="text-destructive text-sm font-medium">
                      Failed to load details
                    </p>
                    <p className="text-muted-foreground max-w-sm text-xs">
                      {detailError}
                    </p>
                  </div>
                ) : panelProps ? (
                  <DisputeCasePanel {...panelProps} />
                ) : null}
              </div>
            </>
          ) : (
            <SheetHeader>
              <SheetTitle>Dispute</SheetTitle>
              <SheetDescription>Select a case from the list.</SheetDescription>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
