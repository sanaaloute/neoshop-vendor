"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="size-4 text-emerald-400" />,
  error: <XCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-amber-400" />,
  info: <Info className="size-4 text-primary" />,
};

const borderMap: Record<ToastType, string> = {
  success: "border-emerald-500/30",
  error: "border-destructive/30",
  warning: "border-amber-500/30",
  info: "border-primary/30",
};

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "bg-card/95 shadow-vendor-card border-border/60 flex items-start gap-3 rounded-xl border p-3 ring-1 ring-white/5 backdrop-blur-xl",
              borderMap[toast.type]
            )}
          >
            <div className="mt-0.5 shrink-0">{iconMap[toast.type]}</div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.message ? (
                <p className="text-muted-foreground text-xs">{toast.message}</p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => onDismiss(toast.id)}
            >
              <X className="size-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
