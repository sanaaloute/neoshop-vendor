"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShellProvider({ children }: { children: ReactNode }) {
  return <TooltipProvider delay={200}>{children}</TooltipProvider>;
}
