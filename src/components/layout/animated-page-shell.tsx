"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { pageTransition, staggerContainer, fadeUp } from "@/lib/motion";
import { VendorDisplay, VendorMuted } from "@/components/layout/typography";
import { cn } from "@/lib/utils";

type AnimatedPageShellProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  animate?: boolean;
};

export function AnimatedPageShell({
  title,
  description,
  children,
  className,
  headerActions,
  animate = true,
}: AnimatedPageShellProps) {
  const Wrapper = animate ? motion.main : "main";
  const wrapperProps = animate
    ? {
        variants: pageTransition,
        initial: "hidden",
        animate: "show",
      }
    : {};

  return (
    <Wrapper
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6",
        className
      )}
      {...wrapperProps}
    >
      {title ? (
        <motion.header
          className={cn(
            "flex flex-col gap-2",
            headerActions && "sm:flex-row sm:items-start sm:justify-between"
          )}
          variants={fadeUp}
          initial={animate ? "hidden" : false}
          animate="show"
        >
          <div className="space-y-2">
            <VendorDisplay>{title}</VendorDisplay>
            {description ? (
              <VendorMuted className="max-w-2xl text-base">
                {description}
              </VendorMuted>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex items-center gap-2">{headerActions}</div>
          ) : null}
        </motion.header>
      ) : null}
      {animate ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </Wrapper>
  );
}

/** Animated section wrapper for staggered children */
export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
