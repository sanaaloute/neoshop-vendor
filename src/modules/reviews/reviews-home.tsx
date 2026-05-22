"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { listVendorReviews, respondToReview } from "@/services/vendor/reviews-api";
import type { ReviewResponse, ReviewStatus } from "@/services/vendor/types";

function statusBadge(status: ReviewStatus) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="secondary" className="font-normal">
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="font-normal">
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="font-normal">
          Rejected
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
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </span>
  );
}

export function ReviewsHome() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [respondSheetOpen, setRespondSheetOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewResponse | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listVendorReviews();
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setReviews(items as ReviewResponse[]);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load reviews."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

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
      await respondToReview(activeReview.id, { response: responseText.trim() });
      setRespondSheetOpen(false);
      setActiveReview(null);
      setResponseText("");
      await loadReviews();
    } catch (e) {
      setSubmitError(httpErrorMessageForUser(e, "Could not submit response."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardCard className="gap-0 py-0">
        <DashboardCardHeader className="border-border/50 flex flex-row items-center justify-between border-b px-4 py-3">
          <DashboardCardTitle className="text-base">All reviews</DashboardCardTitle>
          {loading && reviews.length === 0 ? (
            <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Loading…
            </span>
          ) : null}
        </DashboardCardHeader>
        <DashboardCardContent className="px-0 py-0">
          {error && reviews.length === 0 ? (
            <div className="text-destructive p-6 text-center text-sm">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="hidden md:table-cell">Review</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
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
                        {r.body}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
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
                            Respond
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Responded
                          </span>
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
                        No reviews yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DashboardCardContent>
      </DashboardCard>

      <Sheet open={respondSheetOpen} onOpenChange={setRespondSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg" showCloseButton>
          <SheetHeader>
            <SheetTitle>Respond to review</SheetTitle>
            <SheetDescription>
              {activeReview ? (
                <>
                  Replying to <strong>{activeReview.customerName}</strong> for{" "}
                  <em>{activeReview.productTitle}</em>
                </>
              ) : null}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="response-text">
                Your response
              </label>
              <Textarea
                id="response-text"
                className="min-h-[140px]"
                placeholder="Write a helpful response…"
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
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!responseText.trim() || submitting}
              onClick={handleSubmitResponse}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Submit response"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
