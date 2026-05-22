"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

type VendorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
};

export function VendorDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: VendorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-lg",
          contentClassName
        )}
        showCloseButton
      >
        <motion.div variants={popIn} initial={false} animate="show">
          <DialogHeader className="border-border/60 gap-1 border-b px-4 py-4">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="px-4 py-4 text-sm">{children}</div>
          {footer ? (
            <DialogFooter className="border-border/60 border-t px-4 py-3">
              {footer}
            </DialogFooter>
          ) : null}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
