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
import { getAuthErrorMessage } from "@/lib/get-auth-error-message";
import { useRateLimit } from "@/lib/rate-limit";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one digit");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Enter your password"),
});

const signupSchema = z
  .object({
    name: z.string().min(1, "Enter your first name"),
    surname: z.string().min(1, "Enter your last name"),
    email: z.string().email(),
    phone: z.string().min(1, "Enter your phone number"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
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

function mapAuthError(e: unknown, mode: "login" | "signup" | "forgot"): string {
  const m = getAuthErrorMessage(e);

  if (mode === "forgot") {
    return m || "Could not send reset email. Try again.";
  }

  switch (m) {
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
      if (
        m.includes("Invalid login credentials") ||
        m.includes("invalid_credentials") ||
        m.includes("Invalid credentials")
      ) {
        return "Invalid email or password.";
      }
      if (m.includes("Email not verified")) {
        return "Email not verified. Please check your inbox and confirm your email before logging in.";
      }
      if (m.includes("Account is suspended")) {
        return "Your account has been suspended. Contact marketplace support for assistance.";
      }
      if (m.includes("Account already exists")) {
        return "An account with this email already exists. Try signing in instead.";
      }
      if (m.includes("Email address is already in use or invalid")) {
        return "That email address is already in use or invalid.";
      }
      if (
        m.includes("Session not found or revoked") ||
        m.includes("Missing session header") ||
        m.includes("Invalid or expired session")
      ) {
        return "Your session has expired. Please sign in again.";
      }
      if (m.includes("Too many failed attempts")) {
        return m;
      }
      if (m.includes("Too many requests")) {
        return "Too many requests — slow down and retry.";
      }
      return (
        m || (mode === "signup" ? "Unable to create account." : "Unable to sign in.")
      );
    }
  }
}

function isEmailNotVerifiedError(e: unknown): boolean {
  return getAuthErrorMessage(e).includes("Email not verified");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(() =>
    searchParams.get("signup") === "1" ? "signup" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const resumeStarted = useRef(false);

  const loginRateLimit = useRateLimit("auth:login", 10, 60_000);
  const registerRateLimit = useRateLimit("auth:register", 5, 60_000);
  const resendRateLimit = useRateLimit("auth:resend-verification", 3, 60_000);

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
    setSignupSuccess(null);
    setUnverifiedEmail(null);
    setResendSuccess(null);
  }, [mode]);

  const isSignup = mode === "signup";

  async function handleResendVerification(email: string) {
    setError(null);
    setResendSuccess(null);
    if (!resendRateLimit.tryRecord()) {
      setError("Too many requests — slow down and retry.");
      return;
    }
    try {
      await useAuthStore.getState().resendVerification({ email });
      setResendSuccess("If an account exists, a verification email has been sent.");
    } catch (e) {
      setError(mapAuthError(e, "forgot"));
    }
  }

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
        {signupSuccess ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-800 dark:text-green-200">
            {signupSuccess}
          </div>
        ) : isSignup ? (
          <VendorForm<SignupValues>
            key="signup"
            schema={signupSchema}
            defaultValues={{
              name: "",
              surname: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
            }}
            onSubmit={async (values) => {
              setError(null);
              setSignupSuccess(null);
              if (!registerRateLimit.tryRecord()) {
                setError("Too many requests — slow down and retry.");
                return;
              }
              try {
                const res = await useAuthStore.getState().register({
                  email: values.email,
                  password: values.password,
                  name: values.name,
                  surname: values.surname,
                  phone: values.phone,
                });
                if (res.success) {
                  setSignupSuccess(
                    res.message ||
                      "Account created. Please check your email to verify your account before logging in."
                  );
                } else {
                  setError("Registration did not complete. Try again.");
                }
              } catch (e) {
                setError(mapAuthError(e, "signup"));
              }
            }}
            className="w-full space-y-4"
          >
            {(form) => (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <VendorTextField
                    control={form.control}
                    name="name"
                    label="First name"
                    placeholder="John"
                    autoComplete="given-name"
                  />
                  <VendorTextField
                    control={form.control}
                    name="surname"
                    label="Last name"
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
                <VendorTextField
                  control={form.control}
                  name="email"
                  label="Work email"
                  placeholder="you@company.com"
                  type="email"
                  autoComplete="email"
                />
                <VendorTextField
                  control={form.control}
                  name="phone"
                  label="Phone number"
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  autoComplete="tel"
                />
                <div className="space-y-1">
                  <VendorPasswordField
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <p className="text-muted-foreground text-xs">
                    Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one digit.
                  </p>
                </div>
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
                  disabled={form.formState.isSubmitting || !registerRateLimit.canRequest}
                >
                  {form.formState.isSubmitting
                    ? "Creating account…"
                    : !registerRateLimit.canRequest
                      ? `Retry in ${registerRateLimit.remainingSeconds}s`
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
              setUnverifiedEmail(null);
              setResendSuccess(null);
              if (!loginRateLimit.tryRecord()) {
                setError("Too many requests — slow down and retry.");
                return;
              }
              try {
                await login(values);
                router.replace(safePostLoginPath(searchParams.get("next")));
              } catch (e) {
                if (isEmailNotVerifiedError(e)) {
                  setUnverifiedEmail(values.email);
                }
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    onClick={() => router.push("/login/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                {error ? (
                  <VendorMuted className="text-destructive">{error}</VendorMuted>
                ) : null}
                {unverifiedEmail && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <p className="text-amber-800 dark:text-amber-200">
                      Your email is not verified.
                    </p>
                    {resendSuccess ? (
                      <p className="mt-1 text-green-700 dark:text-green-300">{resendSuccess}</p>
                    ) : (
                      <button
                        type="button"
                        className="mt-1 text-xs font-medium underline-offset-4 hover:underline disabled:opacity-50"
                        disabled={!resendRateLimit.canRequest}
                        onClick={() => handleResendVerification(unverifiedEmail)}
                      >
                        {!resendRateLimit.canRequest
                          ? `Resend available in ${resendRateLimit.remainingSeconds}s`
                          : "Resend verification email"}
                      </button>
                    )}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting || !loginRateLimit.canRequest}
                >
                  {form.formState.isSubmitting
                    ? "Signing in…"
                    : !loginRateLimit.canRequest
                      ? `Retry in ${loginRateLimit.remainingSeconds}s`
                      : "Sign in"}
                </Button>
              </>
            )}
          </VendorForm>
        )}

        {!signupSuccess && (
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
        )}

        <VendorMuted className="text-center text-xs">
          After sign-up, complete vendor onboarding (business details and verification) from your dashboard when prompted.
        </VendorMuted>
      </CardContent>
    </Card>
  );
}
