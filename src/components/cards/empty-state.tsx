"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { fadeUp, scaleIn } from "@/lib/motion";
import { VendorHeading, VendorMuted } from "@/components/layout/typography";
import { Button } from "@/components/ui/button";

type ButtonAction = { label: string } & Omit<
  ComponentProps<typeof Button>,
  "children"
>;

function splitAction(props: ButtonAction) {
  const { label, ...buttonProps } = props;
  void label;
  return buttonProps;
}

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: ButtonAction;
  secondaryAction?: ButtonAction;
  className?: string;
  animate?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  animate = true,
}: EmptyStateProps) {
  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? {
        variants: fadeUp,
        initial: "hidden",
        animate: "show",
      }
    : {};

  return (
    <Wrapper
      className={cn(
        "border-border/70 bg-muted/20 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center shadow-inner",
        className
      )}
      {...wrapperProps}
    >
      {icon ? (
        <motion.div
          className="border-border/60 bg-card/60 text-muted-foreground shadow-vendor-card flex size-12 items-center justify-center rounded-2xl border"
          variants={scaleIn}
          initial={animate ? "hidden" : false}
          animate="show"
          transition={{ delay: 0.1 }}
        >
          {icon}
        </motion.div>
      ) : null}
      <div className="max-w-md space-y-2">
        <VendorHeading className="text-lg">{title}</VendorHeading>
        {description ? <VendorMuted>{description}</VendorMuted> : null}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {primaryAction ? (
            <Button {...splitAction(primaryAction)}>
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="outline" {...splitAction(secondaryAction)}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </Wrapper>
  );
}
