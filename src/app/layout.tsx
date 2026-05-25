import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";

import "@/app/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppShellProvider } from "@/components/providers/app-shell-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NeoShop Vendor",
  description: "B2B marketplace vendor console",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark", fontSans.variable)}
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
        <Analytics />
      </body>
    </html>
  );
}
