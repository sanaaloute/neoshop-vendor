"use client";

import { motion } from "framer-motion";

import { Shimmer, MetricSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainerFast } from "@/lib/motion";

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 p-6",
        className
      )}
      variants={staggerContainerFast}
      initial="hidden"
      animate="show"
    >
      <motion.div className="space-y-3" variants={fadeUp}>
        <Shimmer className="h-8 w-56 rounded-lg" />
        <Shimmer className="h-4 w-96 max-w-full rounded-lg" />
      </motion.div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>
      <motion.div variants={fadeUp}>
        <Shimmer className="h-72 w-full rounded-xl" />
      </motion.div>
    </motion.div>
  );
}
