"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/modules/onboarding/countries";
import { cn } from "@/lib/utils";

type VendorCountrySelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  className?: string;
};

export function VendorCountrySelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Select a country",
  className,
}: VendorCountrySelectProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("grid gap-1.5", className)}>
          <Label htmlFor={field.name}>{label}</Label>
          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              id={field.name}
              className="w-full"
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
