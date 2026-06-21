import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
          // Content-Security-Policy is generated per-request in middleware with a
          // cryptographic nonce so we can avoid 'unsafe-inline'/'unsafe-eval' for
          // scripts while keeping connect-src restricted to known origins.
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
