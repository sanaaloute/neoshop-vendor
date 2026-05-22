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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";

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

/** Reject absolute and protocol-relative URLs from `?next=` (open-redirect hardening). */
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
        ? "Account was created, but this portal requires an active vendor role. Contact marketplace support if you believe this is a mistake."
        : "This portal is restricted to vendor accounts.";
    case "signup_confirm_email":
      return "Check your email to confirm your address, then sign in.";
    case "sign_in_no_session":
      return "Sign-in did not return a session. Try again or confirm your email.";
    case "signup_no_tokens":
      return "Sign-up succeeded but no session was returned. Check your email to verify your account, then sign in.";
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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{isSignup ? "Create vendor account" : "Vendor sign in"}</CardTitle>
        <CardDescription>
          {isSignup
            ? "Register to access the vendor dashboard."
            : "Sign in with your vendor account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  label="Work email"
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
                  label="Confirm password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {error ? (
                  <VendorMuted className="text-destructive">{error}</VendorMuted>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Creating account…"
                    : "Create vendor account"}
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
                  label="Work email"
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
                  <VendorMuted className="text-destructive">{error}</VendorMuted>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
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
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary font-medium underline-offset-4 hover:underline"
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              New vendor?{" "}
              <button
                type="button"
                className="text-primary font-medium underline-offset-4 hover:underline"
                onClick={() => setMode("signup")}
              >
                Create an account
              </button>
            </p>
          )}
        </div>

        <VendorMuted className="text-center text-xs">
          After sign-up, complete vendor onboarding (business details and verification) from your dashboard when prompted.
        </VendorMuted>
      </CardContent>
    </Card>
  );
}
