import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { VendorMuted } from "@/components/layout/typography";

type SettingsFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

export function SettingsField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  fullWidth,
}: SettingsFieldProps) {
  return (
    <div
      className={cn(
        "space-y-1.5",
        fullWidth && "sm:col-span-2",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className="text-foreground/90 text-sm font-medium"
        >
          {label}
        </Label>
      </div>
      {hint ? (
        <VendorMuted className="text-xs leading-relaxed">{hint}</VendorMuted>
      ) : null}
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : null}
    </div>
  );
}
