import type { ReactNode } from "react";

import { VendorShell } from "@/components/layout/vendor-shell";
import { PermissionRouteGate } from "@/components/permissions/permission-route-gate";
import { VendorRealtimeProvider } from "@/realtime/vendor-realtime-provider";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <VendorRealtimeProvider>
      <VendorShell>
        <PermissionRouteGate>{children}</PermissionRouteGate>
      </VendorShell>
    </VendorRealtimeProvider>
  );
}
