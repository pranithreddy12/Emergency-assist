# EmergencyAI — Infrastructure

## Container images
| Image | Build |
|-------|-------|
| Backend | `docker build -t emergencyai-backend apps/backend` |
| Admin   | `docker build -f apps/admin/Dockerfile -t emergencyai-admin .` (context = repo root) |

Both use Debian-slim base images (Prisma engines need glibc + OpenSSL 3). The
backend image runs `prisma migrate deploy` then `node dist/main.js`; the admin
image serves the built SPA via nginx with SPA-fallback routing.

Run the backend image standalone against a Postgres:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://emergencyai:emergencyai@host.docker.internal:5440/emergencyai" \
  -e JWT_ACCESS_SECRET=... -e JWT_REFRESH_SECRET=... \
  -e FIELD_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  emergencyai-backend
```

## Kubernetes (`infra/k8s`)
Apply in order (filenames are numbered):
```bash
kubectl apply -f infra/k8s/
```
Includes: namespace, ConfigMap + Secret (replace the placeholder secrets!),
Postgres StatefulSet + PVC, Redis, a one-shot migration Job, the backend
Deployment (2 replicas, health probes, resource limits), the admin Deployment,
and an Ingress exposing `api.emergencyai.local` and `admin.emergencyai.local`.

> **Secrets**: `10-config.yaml` ships placeholder dev values. In real clusters
> replace with Sealed Secrets / External Secrets and a generated
> `FIELD_ENCRYPTION_KEY` (`openssl rand -base64 32`).

## CI/CD (`.github/workflows/ci.yml`)
On every push/PR:
- **backend** — spins up a Postgres service, then `prisma migrate deploy`,
  build, unit tests, and the supertest e2e suite.
- **sdk** — typecheck.
- **admin** — production build (also compiles the SDK it consumes).
- **images** — on `main`/`master`, builds both container images.
