# Contributing to EmergencyAI

Thanks for helping. This is emergency-adjacent health software — correctness and
safety come before speed.

## Ground rules

1. **Never diagnose, never prescribe.** Any change touching triage/guidance/AI
   must preserve the guardrails and their tests. See [`docs/SAFETY.md`](docs/SAFETY.md).
2. **No placeholder logic.** Everything committed must compile and run. If a
   feature needs a credential you don't have, put it behind an adapter with a
   working mock (the established pattern) — don't stub it.
3. **Build dependencies before dependents.**

## Repo layout

| Path | Stack |
|------|-------|
| `apps/backend` | NestJS + Prisma (the API) |
| `apps/admin` | React + Vite (admin portal) |
| `apps/mobile` | Flutter (client) |
| `packages/sdk` | Typed TS API client |
| `infra` | Docker, K8s, CI |
| `docs` | Architecture, API, data model, safety |

## Local setup

```bash
docker compose up -d                 # Postgres + Redis
cd apps/backend && cp .env.example .env && npm install
npm run prisma:deploy && npm run seed && npm run start:dev
```

## Before you open a PR

Run the same checks CI runs:

```bash
# backend
cd apps/backend && npm run build && npm test && npm run test:e2e
# sdk
cd packages/sdk && npm run typecheck
# admin
cd apps/admin && npm run build
```

CI (`.github/workflows/ci.yml`) runs all of these on a fresh Postgres, plus
container image builds. PRs must be green.

## Conventions

- **TypeScript**: match the surrounding style; DTOs use `class-validator`;
  external services go behind an interface + mock (`*_PROVIDER` env switch).
- **Database**: change `schema.prisma`, then generate a migration. In this
  repo's non-interactive environment, use `prisma migrate diff … --script` →
  write the migration file → `prisma migrate deploy` (see backend README).
- **Tests**: add unit tests for logic and an e2e test for new endpoints. Safety-
  critical paths (triage, auth) need explicit tests.
- **Commits**: imperative subject; explain *why* in the body for non-trivial
  changes.

## Security

Report vulnerabilities privately — see [`SECURITY.md`](SECURITY.md). Don't open
public issues for security problems.
