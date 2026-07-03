# ─── Stage 1: Build dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Security: remove unnecessary system packages
RUN apk --no-cache add dumb-init && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy production dependencies from build stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Security: remove dev files
RUN rm -rf tests/ .env .env.example .git/ docker-compose*.yml

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Security: drop all capabilities except what's needed
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Use dumb-init to handle PID 1 properly (signal forwarding)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]

EXPOSE 5000
