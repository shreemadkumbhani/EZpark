# syntax=docker/dockerfile:1.7

# ---- Base deps stage ----
FROM node:22-alpine AS deps
WORKDIR /app
# Install OS deps for node-gyp if needed and curl for HEALTHCHECK in runtime
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --include=dev

# ---- Production build stage ----
FROM node:22-alpine AS proddeps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Helpful for healthcheck
RUN apk add --no-cache curl

# Copy production node_modules from proddeps
COPY --from=proddeps /app/node_modules ./node_modules
# Copy application source
COPY . .

# Respect PORT provided by platform (Render sets this)
ENV PORT=8080
EXPOSE 8080

# Healthcheck hits the express /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/health || exit 1

CMD ["node", "server.js"]
