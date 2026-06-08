"use client";

import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VendorPasswordFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export function VendorPasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  autoComplete,
  className,
  inputClassName,
  labelClassName,
}: VendorPasswordFieldProps<TFieldValues>) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("grid gap-1.5", className)}>
          <Label htmlFor={field.name} className={labelClassName}>{label}</Label>
          <div className="relative">
            <Input
              id={field.name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
              className={cn("pr-10", inputClassName)}
              {...field}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setVisible((v) => !v)}
              tabIndex={-1}
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {fieldState.error?.message ? (
            <p className="text-destructive text-xs">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
}
