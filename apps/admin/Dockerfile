# Build context must be the REPO ROOT (the admin app consumes packages/sdk):
#   docker build -f apps/admin/Dockerfile -t emergencyai-admin .

# ─── Build ──────────────────────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /app
# SDK source (aliased by vite.config) + the admin app.
COPY packages/sdk ./packages/sdk
COPY apps/admin ./apps/admin
WORKDIR /app/apps/admin
RUN npm ci && npm run build

# ─── Serve ──────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
