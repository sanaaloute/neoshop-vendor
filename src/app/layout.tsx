import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { GeistSans } from "geist/font/sans";

import { AppShellProvider } from "@/components/providers/app-shell-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NeoShop Vendor",
  description: "B2B marketplace vendor console",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark", GeistSans.variable)}
    >
      <body
        className={cn(
          "min-h-dvh font-sans antialiased",
          "vendor-app-bg text-foreground"
        )}
      >
        <AppShellProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppShellProvider>
      </body>
    </html>
  );
}
