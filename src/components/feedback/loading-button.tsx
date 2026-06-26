"use client";

import type { ComponentProps } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  successText?: string;
  spinnerSize?: ComponentProps<typeof Spinner>["size"];
  spinnerPosition?: "left" | "overlay";
};

export function LoadingButton({
  children,
  loading = false,
  success = false,
  loadingText,
  successText,
  spinnerSize = "sm",
  spinnerPosition = "left",
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const isBusy = loading || success;

  return (
    <Button
      disabled={disabled || isBusy}
      className={cn(
        "relative overflow-hidden",
        spinnerPosition === "overlay" && "relative",
        className
      )}
      aria-busy={isBusy}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {spinnerPosition === "overlay" && loading ? (
          <motion.span
            key="overlay"
            className="absolute inset-0 inline-flex items-center justify-center bg-inherit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Spinner size={spinnerSize} />
          </motion.span>
        ) : loading ? (
          <motion.span
            key="loading"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Spinner size={spinnerSize} />
            {loadingText ?? children}
          </motion.span>
        ) : success ? (
          <motion.span
            key="success"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Check className="size-4" />
            </motion.span>
            {successText ?? children}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
