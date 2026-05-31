import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

/** Premium shimmer skeleton with animated gradient sweep */
function Shimmer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="shimmer"
      className={cn("shimmer rounded-md", className)}
      {...props}
    />
  );
}

/** Skeleton row with multiple columns for table layouts */
function SkeletonRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 rounded",
            i === 0 ? "w-8" : i === columns - 1 ? "w-20 ml-auto" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

/** Card skeleton with shimmer effect */
function CardSkeleton({
  className,
  header = true,
  rows = 3,
}: {
  className?: string;
  header?: boolean;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/40 shadow-vendor-card dark:bg-card/30 flex flex-col gap-3 rounded-xl border p-4 ring-1 ring-white/5 backdrop-blur-sm",
        className
      )}
    >
      {header && (
        <div className="space-y-2 pb-1">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Shimmer
            key={i}
            className={cn("h-9 w-full rounded-lg", i % 2 === 1 && "w-[85%]")}
          />
        ))}
      </div>
    </div>
  );
}

/** Metric card skeleton */
function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/50 shadow-vendor-card dark:bg-card/40 relative overflow-hidden rounded-xl border p-4 ring-1 ring-white/5 backdrop-blur-sm",
        className
      )}
    >
      <div className="space-y-3">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-8 w-32" />
        <Shimmer className="h-3 w-16" />
      </div>
    </div>
  );
}

export { Skeleton, Shimmer, SkeletonRow, CardSkeleton, MetricSkeleton };
