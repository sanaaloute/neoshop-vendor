import type {
  DisputeSummary,
  DisputeDetail,
  DisputeMessage,
  PostDisputeMessageDto,
} from "@/services/vendor/types";

export type {
  DisputeSummary,
  DisputeDetail,
  DisputeMessage,
  PostDisputeMessageDto,
};

export type DisputeStatus =
  | "open"
  | "evidence_requested"
  | "under_review"
  | "investigating"
  | "awaiting_customer"
  | "awaiting_vendor"
  | "mediation"
  | "escalated"
  | "resolved"
  | "resolved_won"
  | "resolved_lost";

export type DisputeEvidence = {
  id: string;
  caseId: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number;
};

export type DisputeCase = {
  id: string;
  orderId: string;
  title: string;
  amount: number;
  currency: string;
  status: DisputeStatus;
  openedAt: string;
  dueAt: string;
  reasonCode: string;
  messages: DisputeMessage[];
  evidence: DisputeEvidence[];
};

export function computeDueDate(openedAt: string): string {
  const date = new Date(openedAt);
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

export function toDisputeCase(
  summary: DisputeSummary,
  detail?: DisputeDetail
): DisputeCase {
  return {
    id: summary.id,
    orderId: summary.orderId,
    title: summary.reasonCategory,
    amount: summary.amountClaimed,
    currency: summary.currency,
    status: summary.status,
    openedAt: summary.openedAt,
    dueAt: computeDueDate(summary.openedAt),
    reasonCode: summary.reasonCategory,
    messages: detail?.messages ?? [],
    evidence: [],
  };
}

export const DISPUTE_WORKFLOW_STEPS = [
  { key: "opened", label: "Opened" },
  { key: "investigation", label: "Investigation" },
  { key: "mediation", label: "Mediation" },
  { key: "escalated", label: "Escalated" },
  { key: "resolved", label: "Resolved" },
] as const;

export function disputeWorkflowStepIndex(status: DisputeStatus): number {
  switch (status) {
    case "open":
    case "evidence_requested":
      return 0;
    case "investigating":
    case "awaiting_customer":
    case "awaiting_vendor":
    case "under_review":
      return 1;
    case "mediation":
      return 2;
    case "escalated":
      return 3;
    case "resolved":
    case "resolved_won":
    case "resolved_lost":
      return 4;
    default:
      return 0;
  }
}
