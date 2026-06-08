"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type VendorTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export function VendorTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  type = "text",
  autoComplete,
  className,
  inputClassName,
  labelClassName,
}: VendorTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("grid gap-1.5", className)}>
          <Label htmlFor={field.name} className={labelClassName}>{label}</Label>
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
          <Input
            id={field.name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            className={inputClassName}
            {...field}
          />
          {fieldState.error?.message ? (
            <p className="text-destructive text-xs">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}
