"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldOff } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { VendorPermission } from "@/lib/vendor-permissions";

const LABELS: Record<VendorPermission, string> = {
  products: "Products & catalog",
  orders: "Orders",
  payouts: "Payouts",
  analytics: "Analytics",
  chat: "Messages",
};

export function AccessDeniedContent() {
  const params = useSearchParams();
  const required = params.get("required") as VendorPermission | null;
  const label = required && LABELS[required] ? LABELS[required] : "this area";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <ShieldOff className="text-muted-foreground size-7" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          You don&apos;t have access
        </h1>
        <p className="text-muted-foreground text-sm">
          Your role doesn&apos;t include permission for{" "}
          <span className="text-foreground font-medium">{label}</span>. Ask an
          owner or manager to update your access.
        </p>
      </div>
      <Link href="/dashboard" className={buttonVariants()}>
        Back to dashboard
      </Link>
    </div>
  );
}
