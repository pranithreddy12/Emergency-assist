# ─── Builder ────────────────────────────────────────────────────────────
# Debian-slim (not alpine): Prisma engines need glibc + OpenSSL 3.
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install all deps (incl. dev) for the build.
COPY package*.json ./
RUN npm ci

# Generate the Prisma client and compile TypeScript.
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ─── Runner ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Only production deps (prisma CLI + @prisma/client are prod deps).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma schema + generated client + compiled app.
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

# Own the app dir so the non-root user can run the migration engine at start.
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Apply migrations, then start. (In k8s prefer a migration Job/initContainer.)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
