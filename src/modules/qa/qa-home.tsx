"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  HelpCircle,
  Loader2,
  MessageCircleQuestion,
} from "lucide-react";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import { listMyProducts } from "@/services/vendor/products-api";
import {
  listProductQa,
  answerQaThread,
} from "@/services/vendor/qa-api";
import type { QaThread } from "@/services/vendor/qa-api";

type ProductOption = {
  id: string;
  name: string;
};

function answeredBadge(answered: boolean) {
  return answered ? (
    <Badge
      variant="secondary"
      className="border-green-500/40 bg-green-500/15 font-normal text-green-800 dark:text-green-200"
    >
      Answered
    </Badge>
  ) : (
    <Badge variant="outline" className="font-normal">
      Unanswered
    </Badge>
  );
}

function ThreadDetailPanel({
  thread,
  onAnswerPosted,
}: {
  thread: QaThread;
  onAnswerPosted: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await answerQaThread(thread.id, { answer: answer.trim() });
      setAnswer("");
      onAnswerPosted();
    } catch (e) {
      setSubmitError(httpErrorMessageForUser(e, "Failed to post answer."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {answeredBadge(thread.answers.length > 0)}
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(thread.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <h3 className="text-sm font-semibold">{thread.customerName}</h3>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {thread.question}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {thread.answers.length > 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              Answers
            </p>
            {thread.answers.map((a) => (
              <DashboardCard
                key={a.id}
                className="border-border/40 bg-muted/30 shadow-none ring-0"
              >
                <DashboardCardHeader className="px-3 py-2">
                  <DashboardCardTitle className="text-xs font-medium">
                    {a.answeredBy}
                  </DashboardCardTitle>
                  <DashboardCardDescription className="text-[11px]">
                    {new Date(a.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </DashboardCardDescription>
                </DashboardCardHeader>
                <DashboardCardContent className="px-3 pb-2">
                  <p className="text-sm whitespace-pre-wrap">{a.answer}</p>
                </DashboardCardContent>
              </DashboardCard>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2">
        {submitError ? (
          <p className="text-destructive text-xs">{submitError}</p>
        ) : null}
        <Textarea
          placeholder="Write your answer…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!answer.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1 size-3.5 animate-spin" />
                Posting…
              </>
            ) : (
              "Post Answer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QaHome() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [threads, setThreads] = useState<QaThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const desktop = useIsDesktop();

  // Load products
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setProductsLoading(true);
        setProductsError(null);
        const res = await listMyProducts({ take: 100 });
        if (cancelled) return;
        const items = (res.items ?? []) as Array<{ id: string; name: string }>;
        setProducts(
          items.map((p) => ({ id: p.id, name: p.name || "Untitled product" }))
        );
      } catch (e) {
        if (cancelled) return;
        setProductsError(
          httpErrorMessageForUser(e, "Could not load products.")
        );
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load QA threads when product changes
  useEffect(() => {
    if (!selectedProductId) {
      setThreads([]);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        setThreadsLoading(true);
        setThreadsError(null);
        const data = await listProductQa(selectedProductId!);
        if (cancelled) return;
        setThreads(data);
      } catch (e) {
        if (cancelled) return;
        setThreadsError(
          httpErrorMessageForUser(e, "Could not load questions.")
        );
      } finally {
        if (!cancelled) setThreadsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  // Auto-select first thread on desktop
  useEffect(() => {
    if (desktop && !selectedThreadId && threads[0]) {
      setSelectedThreadId(threads[0].id);
    }
  }, [desktop, selectedThreadId, threads]);

  useEffect(() => {
    if (desktop) setSheetOpen(false);
  }, [desktop]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  const selectThread = (id: string) => {
    setSelectedThreadId(id);
    if (!desktop) setSheetOpen(true);
  };

  const refetchThreads = useCallback(async () => {
    if (!selectedProductId) return;
    try {
      setThreadsLoading(true);
      setThreadsError(null);
      const data = await listProductQa(selectedProductId);
      setThreads(data);
    } catch (e) {
      setThreadsError(httpErrorMessageForUser(e, "Could not refresh questions."));
    } finally {
      setThreadsLoading(false);
    }
  }, [selectedProductId]);

  if (productsLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading products…</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <p className="text-destructive text-sm font-medium">
          Failed to load products
        </p>
        <p className="text-muted-foreground max-w-sm text-center text-xs">
          {productsError}
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

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      {/* Product selector */}
      <DashboardCard className="max-w-xl">
        <DashboardCardHeader>
          <DashboardCardTitle>Select a product</DashboardCardTitle>
          <DashboardCardDescription>
            Choose a product to view and answer customer questions.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent>
          <Select
            value={selectedProductId ?? ""}
            onValueChange={(value) => {
              setSelectedProductId(value || null);
              setSelectedThreadId(null);
            }}
          >
            <SelectTrigger className="w-full" aria-label="Select product">
              <SelectValue placeholder="Select a product…" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DashboardCardContent>
      </DashboardCard>

      {/* Two-column layout */}
      <div className="lg:border-border/60 lg:bg-card/40 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border">
        {/* Left: thread list */}
        <aside className="lg:border-border/60 flex flex-col lg:w-[min(100%,380px)] lg:shrink-0 lg:border-r">
          <div className="border-border/60 border-b p-3">
            <p className="text-muted-foreground text-xs font-medium">
              Questions
            </p>
          </div>
          <div className="max-h-[480px] overflow-y-auto lg:max-h-[calc(100vh-320px)]">
            {threadsLoading && threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
                <p className="text-muted-foreground text-xs">Loading…</p>
              </div>
            ) : threadsError && threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                <p className="text-destructive text-xs font-medium">
                  Failed to load questions
                </p>
                <p className="text-muted-foreground text-xs">{threadsError}</p>
              </div>
            ) : !selectedProductId ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                <MessageCircleQuestion
                  className="text-muted-foreground size-8"
                  aria-hidden
                />
                <p className="text-sm font-medium">
                  Select a product to view questions
                </p>
                <p className="text-muted-foreground max-w-xs text-xs">
                  Choose a product from the dropdown above to see customer
                  questions.
                </p>
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                <HelpCircle
                  className="text-muted-foreground size-8"
                  aria-hidden
                />
                <p className="text-sm font-medium">
                  No questions yet for this product
                </p>
                <p className="text-muted-foreground max-w-xs text-xs">
                  When customers ask questions, they will appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-3">Question</TableHead>
                    <TableHead className="pr-3 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threads.map((t) => {
                    const active = t.id === selectedThreadId;
                    const answered = t.answers.length > 0;
                    return (
                      <TableRow
                        key={t.id}
                        data-state={active ? "selected" : undefined}
                        className={cn(
                          "cursor-pointer",
                          active && "bg-muted/60"
                        )}
                        onClick={() => selectThread(t.id)}
                      >
                        <TableCell className="max-w-[240px] pl-3">
                          <p className="truncate text-sm font-medium">
                            {t.customerName}
                          </p>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {t.question}
                          </p>
                          <p className="text-muted-foreground text-[11px] tabular-nums">
                            {new Date(t.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="pr-3 text-right">
                          {answeredBadge(answered)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </aside>

        {/* Right: detail panel */}
        <section className="hidden min-h-0 min-w-0 flex-1 flex-col gap-4 p-4 lg:flex">
          {selectedThread ? (
            <>
              <div className="shrink-0 space-y-1">
                <h2 className="text-lg leading-tight font-semibold">
                  Q&A Detail
                </h2>
                <p className="text-muted-foreground text-sm">
                  Thread ID{" "}
                  <span className="font-mono text-xs">{selectedThread.id}</span>
                </p>
              </div>
              <ThreadDetailPanel
                thread={selectedThread}
                onAnswerPosted={refetchThreads}
              />
            </>
          ) : (
            <div className="border-border flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
              <MessageCircleQuestion
                className="text-muted-foreground size-10"
                aria-hidden
              />
              <p className="text-sm font-medium">
                {selectedProductId
                  ? "Select a question"
                  : "Select a product to view questions"}
              </p>
              <p className="text-muted-foreground max-w-sm text-xs">
                {selectedProductId
                  ? "Choose a row in the list to view the full question and respond."
                  : "Choose a product from the dropdown above to see customer questions."}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Mobile Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedThreadId(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg"
        >
          {selectedThread ? (
            <>
              <SheetHeader className="border-border/60 shrink-0 border-b text-left">
                <SheetTitle className="pr-8 leading-snug">
                  Q&A Detail
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">
                    {selectedThread.id}
                  </span>
                  {answeredBadge(selectedThread.answers.length > 0)}
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
                    setSelectedThreadId(null);
                  }}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back to list
                </Button>
                <ThreadDetailPanel
                  thread={selectedThread}
                  onAnswerPosted={refetchThreads}
                />
              </div>
            </>
          ) : (
            <SheetHeader>
              <SheetTitle>Q&A</SheetTitle>
              <SheetDescription>
                Select a question from the list.
              </SheetDescription>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
