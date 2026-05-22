FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./

# Use npm install (not ci) so platform-specific optional deps (e.g. lightningcss, @next/swc)
# are resolved correctly when the lockfile was generated on a different OS.
# --no-audit keeps it fast.
RUN npm install --fetch-timeout=120000 --fetch-retries=5 --no-audit

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# -------------------------------
# Production image
# -------------------------------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3003
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
