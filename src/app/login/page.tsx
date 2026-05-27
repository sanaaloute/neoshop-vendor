import { Suspense } from "react";

import { LoadingState } from "@/components/layout/loading-state";

import { LoginForm } from "@/app/login/login-form";

export default function LoginRoutePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <LoadingState
            label="Opening sign-in…"
            rows={2}
            className="max-w-md"
          />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
