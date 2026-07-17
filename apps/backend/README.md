# EmergencyAI — Backend

NestJS + Prisma + PostgreSQL + Redis. REST + WebSocket API. **Never diagnoses,
never prescribes medication** — see [`docs/SAFETY.md`](../../docs/SAFETY.md).

## Quick start

```bash
# from the repo root: start Postgres (:5440) + Redis (:56379)
docker compose up -d

cd apps/backend
cp .env.example .env
npm install
npm run prisma:deploy     # apply migrations
npm run seed              # sample hospitals + ambulances
npm run start:dev         # http://localhost:3000  ·  Swagger at /docs
```

Runs with **zero paid API keys** — every external integration (OpenAI, Google
Maps, FCM, Twilio, AWS S3) has a working local mock selected by `*_PROVIDER` env
vars. Drop real keys in `.env` and flip the vars to go live.

## Scripts

| Script | What |
|--------|------|
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled server |
| `npm test` | Unit tests (35) |
| `npm run test:e2e` | Supertest e2e (20) — needs Postgres up |
| `npm run test:cov` | Coverage |
| `npm run prisma:migrate` | Create+apply a dev migration |
| `npm run prisma:deploy` | Apply committed migrations |
| `npm run prisma:studio` | Prisma Studio DB browser |
| `npm run seed` | Seed hospitals + ambulances |

> **Migrations in a non-interactive shell**: `prisma migrate dev` prompts and
> will hang. Generate SQL with
> `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`,
> drop it in `prisma/migrations/<ts>_<name>/migration.sql`, then `prisma migrate deploy`.

## Layout

```
src/
  main.ts / app-config.ts     bootstrap + shared HTTP config (helmet/CORS/pipes)
  app.module.ts               module wiring
  common/                     crypto, guards, decorators, filters, audit interceptor, geo
  prisma/                     DB access
  auth/ users/ medical-profile/    identity & profile
  triage/                     AI triage engine (+ safety guardrails)
  emergency/                  SOS incidents + WebSocket gateway
  guidance/                   16 first-aid topics + offline bundle
  maps/ hospitals/ ambulance/      location, hospital search, dispatch
  notifications/ contacts/ prearrival/   comms, contact alerts, hospital hand-off
  timeline/ analytics/ admin/      records, stats, admin CRUD
  voice/ ai/                  STT/TTS, image analysis, translation
  storage/ documents/         S3/local storage + document upload
```

## Configuration

See [`.env.example`](.env.example) for every variable. Key ones:

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` / `REDIS_URL` | data stores |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | token signing |
| `FIELD_ENCRYPTION_KEY` | **32-byte base64** AES key for PII/PHI. Changing it makes existing encrypted fields unreadable |
| `ALLOWED_ORIGINS` | CORS allowlist (blank = reflect any origin, dev only) |
| `AI_PROVIDER` / `MAPS_PROVIDER` / `NOTIFY_PROVIDER` / `SMS_PROVIDER` / `VOICE_PROVIDER` / `STORAGE_PROVIDER` | `mock` (default) or the real provider |

## Docs
[Architecture](../../docs/ARCHITECTURE.md) · [API reference](../../docs/API.md) ·
[Data model](../../docs/DATA_MODEL.md) · [Safety](../../docs/SAFETY.md) ·
[Security](../../SECURITY.md) · [Deploy](../../infra/README.md)
