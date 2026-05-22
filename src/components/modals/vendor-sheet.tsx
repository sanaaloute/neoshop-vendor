"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

type VendorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  contentClassName?: string;
};

export function VendorSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  contentClassName,
}: VendorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "gap-0 overflow-y-auto p-0 sm:max-w-md",
          contentClassName
        )}
        showCloseButton
      >
        <motion.div
          variants={popIn}
          initial={false}
          animate="show"
          className="flex h-full flex-col"
        >
          <SheetHeader className="border-border/60 gap-1 border-b px-4 py-4 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          <div className="flex-1 px-4 py-4 text-sm">{children}</div>
          {footer ? (
            <SheetFooter className="border-border/60 mt-auto border-t px-4 py-3">
              {footer}
            </SheetFooter>
          ) : null}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
