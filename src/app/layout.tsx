import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Barkosem Vendor Dashboard",
  description: "B2B marketplace vendor console",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a14" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
