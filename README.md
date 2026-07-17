# EmergencyAI

An AI-powered emergency **assistant** — not a diagnostic tool and not a replacement for emergency services.

EmergencyAI helps people during medical emergencies by collecting structured information, guiding
bystanders with medically accepted first-aid instructions, sharing emergency information with
responders, locating appropriate facilities, notifying hospitals before arrival, and coordinating
response.

> ⚠️ **Safety:** This software never diagnoses conditions and never prescribes medication. It surfaces
> only evidence-based first-aid guidance from recognized organizations (AHA, Red Cross, WHO). In a
> real emergency, always call your local emergency number.

## Monorepo layout

| Path            | What                                                             |
|-----------------|-----------------------------------------------------------------|
| `apps/backend`  | NestJS + Prisma + PostgreSQL + Redis REST/WebSocket API         |
| `apps/mobile`   | Flutter (Material 3, Riverpod, GoRouter) client                 |
| `apps/admin`    | Admin portal                                                    |
| `packages/sdk`  | Shared, typed API client SDK                                    |
| `infra`         | Docker, Kubernetes manifests, CI/CD                            |
| `docs`          | Architecture & module documentation                            |

**Docs:** [docs index](docs/README.md) · [Architecture](docs/ARCHITECTURE.md) · [API](docs/API.md) · [Data model](docs/DATA_MODEL.md) · [Safety](docs/SAFETY.md) · [Security](SECURITY.md) · [Infra/Deploy](infra/README.md) · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md)

**Components:** [backend](apps/backend/README.md) · [admin portal](apps/admin/README.md) · [mobile](apps/mobile/README.md) ([bring-up](apps/mobile/BRINGUP.md)) · [SDK](packages/sdk/README.md)

## Quick start (backend)

```bash
docker compose up -d           # Postgres (:5440) + Redis (:56379)
cd apps/backend
cp .env.example .env
npm install
npm run prisma:deploy          # apply migrations
npm run seed                   # sample hospitals + ambulances
npm run start:dev              # http://localhost:3000, Swagger at /docs
```

The app runs with **zero paid API keys** — OpenAI, Maps, Firebase, S3, SMS and voice all fall back to
working local mock adapters. Drop real credentials into `.env` and flip the `*_PROVIDER` vars to switch
to live providers.

## Admin portal

```bash
cd apps/admin
npm install
npm run dev                    # http://localhost:5173  (needs the backend running)
```
Sign in with an `ADMIN` user. Consumes the shared `@emergencyai/sdk`.

## Tests

```bash
cd apps/backend
npm test            # 24 unit tests
npm run test:e2e    # 13 supertest e2e tests (needs Postgres up)
```

## Containers & Kubernetes

See [infra/README.md](infra/README.md). Backend and admin ship as Docker images; `infra/k8s/` has a full
manifest set (Postgres, Redis, backend + migration Job, admin, ingress). CI is in `.github/workflows/ci.yml`.

## Status

Backend is feature-complete across Phases 0–5 (16 modules, all verified end-to-end; 37 tests green). The
Flutter app and shared SDK are built; the admin portal is verified live in a browser. See the roadmap for
remaining items (Flutter live-GPS Location module, on-device Flutter compilation).
