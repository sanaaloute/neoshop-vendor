"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { VendorForm } from "@/components/forms/vendor-form";
import { VendorTextField } from "@/components/forms/vendor-text-field";
import { VendorPasswordField } from "@/components/forms/vendor-password-field";
import { VendorMuted } from "@/components/layout/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters"),
});

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

function safePostLoginPath(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function mapAuthError(e: unknown, mode: "login" | "signup"): string {
  if (!(e instanceof Error)) return "Something went wrong.";
  switch (e.message) {
    case "not_vendor":
      return mode === "signup"
        ? "Account was created, but this portal requires an active vendor role."
        : "This portal is restricted to vendor accounts.";
    case "signup_confirm_email":
      return "Check your email to confirm your address, then sign in.";
    case "sign_in_no_session":
      return "Sign-in did not return a session. Try again.";
    case "signup_no_tokens":
      return "Sign-up succeeded but no session was returned. Check your email.";
    default: {
      const m = e.message;
      if (
        m.includes("Invalid login credentials") ||
        m.includes("invalid_credentials")
      ) {
        return "Invalid email or password.";
      }
      return (
        m || (mode === "signup" ? "Unable to create account." : "Unable to sign in.")
      );
    }
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(() =>
    searchParams.get("signup") === "1" ? "signup" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const resumeStarted = useRef(false);

  useEffect(() => {
    if (searchParams.get("resume") !== "1" || resumeStarted.current) return;
    resumeStarted.current = true;

    void refreshTokensClient().then(async (token) => {
      if (!token) return;
      await useAuthStore.getState().bootstrap();
      router.replace(safePostLoginPath(searchParams.get("next")));
    });
  }, [router, searchParams]);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const isSignup = mode === "signup";

  return (
    <Card className={cn(
      "w-full max-w-sm glass-surface relative overflow-hidden rounded-xl border border-border/40 shadow-vendor-card"
    )}>
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-radial from-primary/25 to-transparent opacity-50 blur-2xl" />

      <CardHeader className="relative text-center pb-2 pt-6">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/20 ring-1 ring-primary/20">
          <span className="text-primary text-lg font-black tracking-tight text-glow-primary">N</span>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">
          {isSignup ? "Create account" : "Sign in"}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-4 px-6 pb-6">
        {isSignup ? (
          <VendorForm<SignupValues>
            key="signup"
            schema={signupSchema}
            defaultValues={{ email: "", password: "", confirmPassword: "" }}
            onSubmit={async (values) => {
              setError(null);
              try {
                await register({
                  email: values.email,
                  password: values.password,
                });
                router.replace(safePostLoginPath(searchParams.get("next")));
              } catch (e) {
                setError(mapAuthError(e, "signup"));
              }
            }}
            className="w-full space-y-4"
          >
            {(form) => (
              <>
                <VendorTextField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="you@company.com"
                  type="email"
                  autoComplete="email"
                />
                <VendorPasswordField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <VendorPasswordField
                  control={form.control}
                  name="confirmPassword"
                  label="Confirm"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {error ? (
                  <VendorMuted className="text-destructive text-xs">{error}</VendorMuted>
                ) : null}
                <Button
                  type="submit"
                  className="w-full rounded-lg font-semibold"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Creating…"
                    : "Create account"}
                </Button>
              </>
            )}
          </VendorForm>
        ) : (
          <VendorForm<LoginValues>
            key="login"
            schema={loginSchema}
            defaultValues={{ email: "", password: "" }}
            onSubmit={async (values) => {
              setError(null);
              try {
                await login(values);
                router.replace(safePostLoginPath(searchParams.get("next")));
              } catch (e) {
                setError(mapAuthError(e, "login"));
              }
            }}
            className="w-full space-y-4"
          >
            {(form) => (
              <>
                <VendorTextField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="you@company.com"
                  type="email"
                  autoComplete="email"
                />
                <VendorPasswordField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {error ? (
                  <VendorMuted className="text-destructive text-xs">{error}</VendorMuted>
                ) : null}
                <Button
                  type="submit"
                  className="w-full rounded-lg font-semibold"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </>
            )}
          </VendorForm>
        )}

        <div className="text-center text-sm">
          {isSignup ? (
            <p className="text-muted-foreground text-xs">
              Have an account?{" "}
              <button
                type="button"
                className="text-primary font-semibold underline-offset-4 hover:underline transition-colors"
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              New?{" "}
              <button
                type="button"
                className="text-primary font-semibold underline-offset-4 hover:underline transition-colors"
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
