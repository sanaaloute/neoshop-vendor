import { Suspense } from "react";

import { AccessDeniedContent } from "./access-denied-content";

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground px-4 py-16 text-center text-sm">
          Loading…
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
