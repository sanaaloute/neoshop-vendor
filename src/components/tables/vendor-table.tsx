import type { ComponentProps } from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function VendorTable({
  className,
  ...props
}: ComponentProps<typeof Table>) {
  return (
    <Table
      className={cn(
        "[&_th]:text-muted-foreground text-[13px] leading-normal [&_td]:px-3 [&_td]:py-2.5 [&_th]:h-9 [&_th]:px-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide",
        className
      )}
      {...props}
    />
  );
}

export {
  TableBody as VendorTableBody,
  TableCaption as VendorTableCaption,
  TableCell as VendorTableCell,
  TableFooter as VendorTableFooter,
  TableHead as VendorTableHead,
  TableHeader as VendorTableHeader,
  TableRow as VendorTableRow,
};
