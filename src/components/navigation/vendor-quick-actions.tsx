"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useVendorPermissions } from "@/hooks/use-vendor-permissions";

export function VendorQuickActions({ className }: { className?: string }) {
  const router = useRouter();
  const { can } = useVendorPermissions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" className={cn("gap-1.5", className)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Quick actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">
          Create & import
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {can("products") ? (
          <>
            <DropdownMenuItem onClick={() => router.push("/products")}>
              <Plus className="size-4" />
              New product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/products")}>
              <Upload className="size-4" />
              Bulk import
            </DropdownMenuItem>
          </>
        ) : null}
        {can("orders") ? (
          <DropdownMenuItem onClick={() => router.push("/orders")}>
            <ClipboardList className="size-4" />
            Review orders
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
