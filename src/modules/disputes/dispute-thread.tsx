"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { LoadingButton } from "@/components/feedback/loading-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { DisputeMessage } from "./types";

function bubbleStyles(
  role: DisputeMessage["author"]["role"],
  internal: boolean
) {
  if (internal) {
    return "mr-auto max-w-[92%] border-amber-500/25 bg-amber-500/10 text-foreground dark:bg-amber-500/5";
  }
  switch (role) {
    case "vendor":
      return "ml-auto max-w-[92%] border-primary/25 bg-primary/10 text-foreground";
    case "platform":
      return "mr-auto max-w-[92%] border-border bg-muted/50 text-foreground";
    default:
      return "mr-auto max-w-[92%] border-red-500/25 bg-red-500/10 text-foreground dark:bg-red-500/5";
  }
}

type DisputeThreadProps = {
  messages: DisputeMessage[];
  onSend: (body: string) => void;
  readOnly?: boolean;
  busy?: boolean;
  className?: string;
};

export function DisputeThread({
  messages,
  onSend,
  readOnly,
  busy,
  className,
}: DisputeThreadProps) {
  const t = useTranslations("disputes.thread");
  const [draft, setDraft] = useState("");

  const flat = useMemo(
    () =>
      [...messages].sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
      ),
    [messages]
  );

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <ScrollArea className="border-border/60 bg-muted/10 max-h-[min(420px,55vh)] rounded-lg border">
        <div className="space-y-3 p-3">
          {flat.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm shadow-sm",
                  bubbleStyles(msg.author.role, msg.internal)
                )}
              >
                <div className="text-muted-foreground mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-foreground font-semibold capitalize">
                    {msg.author.name || msg.author.role}
                    {msg.internal ? (
                      <span className="ml-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        {t("internal")}
                      </span>
                    ) : null}
                  </span>
                  <time dateTime={msg.createdAt} className="tabular-nums">
                    {new Date(msg.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {!readOnly ? (
        <div className="border-border/60 bg-card/40 space-y-2 rounded-lg border p-3">
          <Textarea
            placeholder={t("placeholder")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[88px] resize-y"
            disabled={readOnly || busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground text-[11px]">
              {t("sendHint")}
            </span>
            <LoadingButton
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={submit}
              disabled={!draft.trim()}
              loading={busy}
              loadingText={t("send")}
            >
              <Send className="size-3.5" aria-hidden />
              {t("send")}
            </LoadingButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
