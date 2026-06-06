import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function getEnvOrigin(key: string): string | null {
  try {
    const url = process.env[key];
    if (!url) return null;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const apiOrigin = getEnvOrigin("NEXT_PUBLIC_API_BASE_URL");
const supabaseOrigin = getEnvOrigin("NEXT_PUBLIC_SUPABASE_URL");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Required for the production Docker image (multi-stage `standalone` output). */
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  experimental: {
    /** Tree-shake large icon / chart / animation entry points. */
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@base-ui/react",
    ],
    /** Client router cache (App Router) — reduce refetch churn on navigations. */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async rewrites() {
    return [
      {
        source: '/_health',
        destination: '/health',
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline for styled-jsx
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' blob: data:${apiOrigin ? ` ${apiOrigin}` : ""}${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
              "font-src 'self'",
              `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""} ws: wss:`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
