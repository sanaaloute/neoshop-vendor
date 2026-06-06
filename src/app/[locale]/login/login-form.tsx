"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { z } from "zod";
import { useTranslations } from "next-intl";

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

/** Reject absolute and protocol-relative URLs from `?next=` (open-redirect hardening). */
function safePostLoginPath(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function isEmailNotVerifiedError(e: unknown): boolean {
  return getAuthErrorMessage(e).includes("Email not verified");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const t = useTranslations("auth");
  const te = useTranslations("errors");

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

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(8, t("passwordHint"))
        .regex(/[A-Z]/, t("passwordHint"))
        .regex(/[a-z]/, t("passwordHint"))
        .regex(/[0-9]/, t("passwordHint")),
    [t]
  );

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        password: z.string().min(1, t("password")),
      }),
    [t]
  );

  const signupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t("firstName")),
          surname: z.string().min(1, t("lastName")),
          email: z.string().email(),
          phone: z.string().refine(
            (val) => val === "" || /^\+[1-9]\d{1,14}$/.test(val),
            {
              message: t("phone"),
            }
          ),
          password: passwordSchema,
          confirmPassword: z.string().min(1, t("confirmPassword")),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t("confirmPassword"),
          path: ["confirmPassword"],
        }),
    [t, passwordSchema]
  );

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

  function mapAuthError(e: unknown, mode: "login" | "signup" | "forgot"): string {
    const m = getAuthErrorMessage(e);

    if (mode === "forgot") {
      return m || te("couldNotSendReset");
    }

    switch (m) {
      case "not_vendor":
        return mode === "signup" ? te("notVendorSignup") : te("notVendorLogin");
      case "signup_confirm_email":
        return te("checkEmailConfirm");
      case "sign_in_no_session":
        return te("signInNoSession");
      case "signup_no_tokens":
        return te("signupNoTokens");
      default: {
        if (
          m.includes("Invalid login credentials") ||
          m.includes("invalid_credentials") ||
          m.includes("Invalid credentials")
        ) {
          return te("invalidEmailOrPassword");
        }
        if (m.includes("Email not verified")) {
          return te("emailNotVerified");
        }
        if (m.includes("Account is suspended")) {
          return te("accountSuspended");
        }
        if (m.includes("Account already exists")) {
          return te("accountAlreadyExists");
        }
        if (m.includes("Email address is already in use or invalid")) {
          return te("emailInUseOrInvalid");
        }
        if (
          m.includes("Session not found or revoked") ||
          m.includes("Missing session header") ||
          m.includes("Invalid or expired session")
        ) {
          return te("sessionNotFound");
        }
        if (m.includes("Too many failed attempts")) {
          return m;
        }
        if (m.includes("Too many requests")) {
          return te("tooManyRequests");
        }
        return m || (mode === "signup" ? te("unableToCreateAccount") : te("unableToSignIn"));
      }
    }
  }

  async function handleResendVerification(email: string) {
    setError(null);
    setResendSuccess(null);
    if (!resendRateLimit.tryRecord()) {
      setError(te("tooManyRequests"));
      return;
    }
    try {
      await useAuthStore.getState().resendVerification({ email });
      setResendSuccess(t("resendSuccess"));
    } catch (e) {
      setError(mapAuthError(e, "forgot"));
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mb-2 flex justify-center">
          <img
            src="/logo.png"
            alt="Barkosem Vendor Dashboard"
            className="h-12 w-auto select-none"
          />
        </div>
        <CardTitle>{isSignup ? t("createAccount") : t("signIn")}</CardTitle>
        <CardDescription>
          {isSignup ? t("registerDescription") : t("signInDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signupSuccess ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-800 dark:text-green-200">
            {signupSuccess}
          </div>
        ) : isSignup ? (
          <VendorForm<z.infer<typeof signupSchema>>
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
                setError(te("tooManyRequests"));
                return;
              }
              try {
                const res = await useAuthStore.getState().register({
                  email: values.email,
                  password: values.password,
                  name: values.name,
                  surname: values.surname,
                  phone: values.phone || undefined,
                });
                if (res.success) {
                  setSignupSuccess(
                    res.message || t("accountCreatedCheckEmail")
                  );
                } else {
                  setError(t("registrationIncomplete"));
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
                    label={t("firstName")}
                    placeholder={t("firstNamePlaceholder")}
                    autoComplete="given-name"
                  />
                  <VendorTextField
                    control={form.control}
                    name="surname"
                    label={t("lastName")}
                    placeholder={t("lastNamePlaceholder")}
                    autoComplete="family-name"
                  />
                </div>
                <VendorTextField
                  control={form.control}
                  name="email"
                  label={t("email")}
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  autoComplete="email"
                />
                <VendorTextField
                  control={form.control}
                  name="phone"
                  label={t("phone")}
                  placeholder={t("phonePlaceholder")}
                  type="tel"
                  autoComplete="tel"
                />
                <div className="space-y-1">
                  <VendorPasswordField
                    control={form.control}
                    name="password"
                    label={t("password")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <p className="text-muted-foreground text-xs">
                    {t("passwordHint")}
                  </p>
                </div>
                <VendorPasswordField
                  control={form.control}
                  name="confirmPassword"
                  label={t("confirmPassword")}
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
                    ? t("creatingAccount")
                    : !registerRateLimit.canRequest
                      ? t("retryIn", { seconds: registerRateLimit.remainingSeconds })
                      : t("createVendorAccount")}
                </Button>
              </>
            )}
          </VendorForm>
        ) : (
          <VendorForm<z.infer<typeof loginSchema>>
            key="login"
            schema={loginSchema}
            defaultValues={{ email: "", password: "" }}
            onSubmit={async (values) => {
              setError(null);
              setUnverifiedEmail(null);
              setResendSuccess(null);
              if (!loginRateLimit.tryRecord()) {
                setError(te("tooManyRequests"));
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
                  label={t("email")}
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  autoComplete="email"
                />
                <VendorPasswordField
                  control={form.control}
                  name="password"
                  label={t("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    onClick={() => router.push("/login/forgot-password")}
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
                {error ? (
                  <VendorMuted className="text-destructive">{error}</VendorMuted>
                ) : null}
                {unverifiedEmail && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <p className="text-amber-800 dark:text-amber-200">
                      {t("emailNotVerified")}
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
                          ? t("resendAvailableIn", { seconds: resendRateLimit.remainingSeconds })
                          : t("resendVerification")}
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
                    ? t("signingIn")
                    : !loginRateLimit.canRequest
                      ? t("retryIn", { seconds: loginRateLimit.remainingSeconds })
                      : t("signInLink")}
                </Button>
              </>
            )}
          </VendorForm>
        )}

        {!signupSuccess && (
          <div className="text-center text-sm">
            {isSignup ? (
              <p className="text-muted-foreground">
                {t("alreadyHaveAccount")}{" "}
                <button
                  type="button"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                  onClick={() => setMode("login")}
                >
                  {t("signInLink")}
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t("newVendor")}{" "}
                <button
                  type="button"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  {t("createAccountLink")}
                </button>
              </p>
            )}
          </div>
        )}

        <VendorMuted className="text-center text-xs">
          {t("onboardingHint")}
        </VendorMuted>
      </CardContent>
    </Card>
  );
}
