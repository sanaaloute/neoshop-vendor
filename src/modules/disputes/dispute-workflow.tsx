"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  DISPUTE_WORKFLOW_STEPS,
  type DisputeStatus,
  disputeWorkflowStepIndex,
} from "./types";

type DisputeWorkflowProps = {
  status: DisputeStatus;
  className?: string;
};

export function DisputeWorkflow({ status, className }: DisputeWorkflowProps) {
  const activeIndex = disputeWorkflowStepIndex(status);
  const terminal = status === "resolved";

  return (
    <div className={cn("w-full", className)}>
      <ol className="flex flex-wrap gap-2">
        {DISPUTE_WORKFLOW_STEPS.map((step, i) => {
          const complete = i < activeIndex || (terminal && i <= activeIndex);
          const current = i === activeIndex && !terminal;
          return (
            <li
              key={step.key}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm",
                complete &&
                  "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
                current &&
                  "border-primary/50 bg-primary/10 text-primary ring-primary/20 ring-1",
                !complete &&
                  !current &&
                  "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  complete && "border-emerald-500/60 bg-emerald-500/20",
                  current && "border-primary bg-primary/20",
                  !complete && !current && "border-border"
                )}
              >
                {complete ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className="truncate font-medium">{step.label}</span>
            </li>
          );
        })}
      </ol>
      {terminal ? (
        <p className="text-muted-foreground mt-2 text-xs">
          This dispute has been resolved — messaging is read-only.
        </p>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">
          Respond within deadlines to avoid automatic decisions.
        </p>
      )}
    </div>
  );
}
