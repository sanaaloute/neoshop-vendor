"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DashboardCard,
  DashboardCardContent,
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
  SheetFooter,
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
import { useReviews } from "@/hooks/use-reviews";
import type { ReviewResponse, ReviewStatus } from "@/services/vendor/types";

function StatusBadge({ status }: { status: ReviewStatus }) {
  const t = useTranslations("reviews");
  switch (status) {
    case "approved":
      return (
        <Badge variant="secondary" className="font-normal">
          {t("approved")}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="font-normal">
          {t("pending")}
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="font-normal">
          {t("rejected")}
        </Badge>
      );
    default:
      return null;
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating
              ? "fill-red-400 text-red-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </span>
  );
}

export function ReviewsHome() {
  const t = useTranslations("reviews");
  const {
    reviews,
    total,
    params,
    loading,
    error,
    refetch,
    respond,
    setPage,
    setStatus,
  } = useReviews();

  const [respondSheetOpen, setRespondSheetOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewResponse | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const take = params.take ?? 20;
  const currentPage = Math.floor((params.skip ?? 0) / take);
  const pageCount = Math.max(1, Math.ceil(total / take));

  const openRespond = (review: ReviewResponse) => {
    setActiveReview(review);
    setResponseText(review.vendorResponse ?? "");
    setSubmitError(null);
    setRespondSheetOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!activeReview || !responseText.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await respond(activeReview.id, responseText.trim());
      setRespondSheetOpen(false);
      setActiveReview(null);
      setResponseText("");
    } catch {
      setSubmitError(t("couldNotSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (value: string | null) => {
    setStatus(value && value !== "all" ? (value as ReviewStatus) : undefined);
  };

  return (
    <div className="space-y-6">
      <DashboardCard className="gap-0 py-0">
        <DashboardCardHeader className="border-border/50 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <DashboardCardTitle className="text-base">{t("allReviews")}</DashboardCardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={params.status ?? "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[140px]" aria-label={t("filterByStatus")}>
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="approved">{t("approved")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
            {loading && reviews.length === 0 ? (
              <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                {t("loading")}
              </span>
            ) : null}
          </div>
        </DashboardCardHeader>
        <DashboardCardContent className="px-0 py-0">
          {error && reviews.length === 0 ? (
            <div className="text-destructive flex flex-col items-center gap-2 p-6 text-center text-sm">
              <p>{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                {t("retry")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("product")}</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("rating")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("review")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("date")}</TableHead>
                    <TableHead className="text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm font-medium">
                          {r.productTitle}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.customerName}</TableCell>
                      <TableCell>
                        <RatingStars rating={r.rating} />
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-xs truncate text-sm md:table-cell">
                        {r.vendorResponse ? (
                          <span className="text-foreground block truncate">
                            <span className="text-muted-foreground mr-1">{t("youReplied")}:</span>
                            {r.vendorResponse}
                          </span>
                        ) : (
                          r.body
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!r.vendorResponse ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openRespond(r)}
                          >
                            {t("respond")}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openRespond(r)}
                          >
                            {t("editResponse")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviews.length === 0 && !loading && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-muted-foreground text-center"
                      >
                        {t("noReviewsYet")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {total > take && !error ? (
            <div className="border-border/50 flex items-center justify-between border-t px-4 py-3">
              <span className="text-muted-foreground text-xs">
                {t("showingResults", {
                  from: (params.skip ?? 0) + 1,
                  to: Math.min((params.skip ?? 0) + take, total),
                  total,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  {t("previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          ) : null}
        </DashboardCardContent>
      </DashboardCard>

      <Sheet open={respondSheetOpen} onOpenChange={setRespondSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg" showCloseButton>
          <SheetHeader>
            <SheetTitle>{t("respondToReview")}</SheetTitle>
            <SheetDescription>
              {activeReview ? (
                <>
                  {t("replyingTo", { customer: activeReview.customerName, product: activeReview.productTitle })}
                </>
              ) : null}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4 py-4">
            {activeReview ? (
              <div className="bg-muted/40 rounded-lg border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <RatingStars rating={activeReview.rating} />
                  <span className="text-muted-foreground text-xs">
                    {activeReview.customerName}
                  </span>
                </div>
                <p className="text-foreground">{activeReview.body}</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="response-text">
                {t("yourResponse")}
              </label>
              <Textarea
                id="response-text"
                className="min-h-[140px]"
                placeholder={t("placeholderResponse")}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>
            {submitError ? (
              <p className="text-destructive text-sm">{submitError}</p>
            ) : null}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRespondSheetOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={!responseText.trim() || submitting}
              onClick={handleSubmitResponse}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("submitResponse")
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
