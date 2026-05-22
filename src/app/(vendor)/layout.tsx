import type { ReactNode } from "react";

import { VendorShell } from "@/components/layout/vendor-shell";
import { VendorRealtimeProvider } from "@/realtime/vendor-realtime-provider";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <VendorRealtimeProvider>
      <VendorShell>{children}</VendorShell>
    </VendorRealtimeProvider>
  );
}
