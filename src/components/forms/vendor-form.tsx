"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";

import { cn } from "@/lib/utils";

type VendorFormProps<TValues extends FieldValues> = {
  schema: z.ZodSchema<TValues>;
  defaultValues: DefaultValues<TValues>;
  onSubmit: SubmitHandler<TValues>;
  children: (form: UseFormReturn<TValues>) => ReactNode;
  id?: string;
  className?: string;
};

export function VendorForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  id,
  className,
}: VendorFormProps<TValues>) {
  const form = useForm<TValues>({
    // zodResolver generics lag behind Zod 4's internal types — keep the boundary narrow in call sites.
    resolver: zodResolver(schema as never) as Resolver<TValues>,
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form
        id={id}
        className={cn("flex flex-col gap-4", className)}
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {children(form)}
      </form>
    </FormProvider>
  );
}
