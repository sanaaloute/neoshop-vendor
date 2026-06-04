"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onClick, ...props }, ref) => (
    <div className="relative flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        ref={ref}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border border-primary bg-transparent text-primary-foreground transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          "peer-checked:bg-primary peer-checked:text-primary-foreground",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}
      >
        <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
      </div>
    </div>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
