"use client";

import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
  "2xl": "size-10",
};

const strokeMap = {
  xs: 2,
  sm: 2,
  md: 2,
  lg: 2.5,
  xl: 3,
  "2xl": 3,
};

type SpinnerProps = {
  size?: keyof typeof sizeMap;
  className?: string;
  variant?: "default" | "primary" | "secondary" | "white";
  label?: string;
};

export function Spinner({
  size = "md",
  className,
  variant = "default",
  label,
}: SpinnerProps) {
  const colorClass =
    variant === "primary"
      ? "text-primary"
      : variant === "secondary"
        ? "text-muted-foreground"
        : variant === "white"
          ? "text-white"
          : "text-current";

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <svg
        className={cn("animate-spin-slow", sizeMap[size], colorClass)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={strokeMap[size]}
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2Z"
        />
      </svg>
      {label ? (
        <span className="text-muted-foreground text-sm">{label}</span>
      ) : null}
    </span>
  );
}

/** Dots bouncing loader for inline/text contexts */
export function LoadingDots({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "primary" | "muted";
}) {
  const colorClass =
    variant === "primary"
      ? "bg-primary"
      : variant === "muted"
        ? "bg-muted-foreground"
        : "bg-current";

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            colorClass,
            "animate-bounce-subtle"
          )}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

/** Circular progress indicator with percentage */
export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 3,
  className,
  showPercentage = false,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary transition-all duration-500 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showPercentage ? (
        <span className="absolute text-[10px] font-semibold tabular-nums">
          {Math.round(value)}%
        </span>
      ) : null}
    </div>
  );
}
