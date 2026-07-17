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

## Container registry
On every push to `main`, CI builds and pushes both images to **GitHub Container
Registry** using the built-in `GITHUB_TOKEN` (no external registry account
required):

- `ghcr.io/<owner>/emergencyai-backend:<sha>` and `:latest`
- `ghcr.io/<owner>/emergencyai-admin:<sha>` and `:latest`

Packages are private by default — make them public, or add an
`imagePullSecret` to the namespace, for the cluster to pull them.

## Kubernetes (`infra/k8s`)

### 1. Secrets first (once, by hand)
`infra/k8s/` intentionally contains **no Secret object**, so automated
`kubectl apply` can never overwrite real credentials. Apply secrets separately:

```bash
kubectl apply -f infra/k8s/00-namespace.yaml
cp infra/k8s-secrets.example.yaml /tmp/secrets.yaml   # edit with real values
kubectl apply -f /tmp/secrets.yaml && rm /tmp/secrets.yaml
```
Generate keys with `openssl rand -base64 32` (FIELD_ENCRYPTION_KEY **must** be
32 bytes; changing it makes existing encrypted fields unreadable).
Prefer Sealed Secrets / External Secrets in real clusters.

### 2. Workloads
```bash
kubectl apply -f infra/k8s/
```
Includes: namespace, ConfigMap (non-sensitive only), Postgres StatefulSet + PVC,
Redis, a one-shot migration Job, the backend Deployment (2 replicas, health
probes, resource limits), the admin Deployment, and an Ingress exposing
`api.emergencyai.local` / `admin.emergencyai.local`.

## CI/CD (`.github/workflows/ci.yml`)
On every push/PR:
- **backend** — spins up a Postgres service, then `prisma migrate deploy`,
  build, unit tests, and the supertest e2e suite.
- **sdk** — typecheck.
- **admin** — production build (also compiles the SDK it consumes).
- **images-pr** — on PRs, builds both images (no push).
- **images** — on `main`, builds **and pushes** both images to ghcr.io,
  tagged with the commit SHA and `latest` (with layer caching).
- **deploy** — on `main`, applies `infra/k8s/` and rolls the Deployments to the
  new SHA, then waits on `rollout status` and **auto-rolls-back on failure**.

### Enabling deploys
The deploy job is **gated on a `KUBE_CONFIG` secret**. Without it the job logs a
notice and skips — CI stays green for anyone without a cluster. To enable:

```bash
base64 -w0 ~/.kube/config    # macOS: base64 -i ~/.kube/config
```
Add the output as repo **Settings → Secrets and variables → Actions →
`KUBE_CONFIG`**. Deploys target the `production` environment, so you can also
add required reviewers there for a manual approval gate.
