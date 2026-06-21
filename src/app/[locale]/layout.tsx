import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { routing } from "@/i18n/routing";
import { AppShellProvider } from "@/components/providers/app-shell-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { HealthBeaconProvider } from "@/providers/health-beacon-provider";
import { cn } from "@/lib/utils";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("dark")}
    >
      <body
        className={cn(
          "min-h-dvh font-sans antialiased",
          "vendor-app-bg text-foreground"
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <AppShellProvider>
            <AuthProvider>
              <HealthBeaconProvider>{children}</HealthBeaconProvider>
            </AuthProvider>
          </AppShellProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
