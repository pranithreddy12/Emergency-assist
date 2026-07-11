# EmergencyAI — Architecture

> AI-powered emergency **assistant**. It never diagnoses and never prescribes
> medication — only evidence-based first-aid guidance (AHA / Red Cross / WHO).

## System overview

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Flutter app   │     │  Admin portal  │     │  Public QR /   │
│ (Material 3)   │     │ (React + Vite) │     │  tracking link │
└───────┬────────┘     └───────┬────────┘     └───────┬────────┘
        │  REST + WebSocket     │  via @emergencyai/sdk │
        └───────────────┬───────┴───────────────────────┘
                        ▼
             ┌──────────────────────┐
             │   NestJS backend     │  JWT auth · RBAC · rate-limit · audit
             │  (REST + Socket.IO)  │
             └─────┬──────────┬─────┘
                   │          │
         ┌─────────▼──┐   ┌───▼─────────┐   Adapters (mock ⇄ real):
         │ PostgreSQL │   │    Redis    │   OpenAI · Google Maps · FCM ·
         │  (Prisma)  │   │             │   Twilio · AWS S3 · Whisper/TTS
         └────────────┘   └─────────────┘
```

## Backend modules (`apps/backend/src`)

| Module | Responsibility |
|--------|----------------|
| `auth` | Email/guest auth, rotating JWT access+refresh, global JWT guard |
| `users` | Authenticated user profile (`/users/me`) |
| `medical-profile` | Clinical profile, encrypted insurance, emergency contacts, public QR card |
| `triage` | AI triage engine — severity + confidence + first-aid steps; safety guardrails |
| `emergency` | SOS incidents, state machine, WebSocket gateway for live updates |
| `guidance` | 16 evidence-based first-aid topics + offline bundle |
| `maps` | Distance/ETA + geocoding adapter (mock / Google) |
| `hospitals` | Nearby search with filters, travel time, sorting |
| `ambulance` | One-tap nearest-unit booking, live tracking, cancel |
| `notifications` | Push/SMS/WhatsApp/email/call adapters + fallback + audit |
| `contacts` | Alert emergency contacts, public live-tracking link |
| `prearrival` | Hospital clinical hand-off snapshot + acknowledgement (RBAC) |
| `timeline` | Unified medical timeline (incidents, ambulances, documents) |
| `analytics` | System stats, response times, heatmap, trends (ADMIN) |
| `admin` | CRUD for hospitals/ambulances/users/incidents + audit viewer (ADMIN) |
| `voice` | STT/TTS adapters + hands-free voice→triage→speech `assist` |
| `common` | Crypto, guards, decorators, filters, **audit interceptor**, geo utils |
| `prisma` | Database access layer |

## Key design principles

- **Adapter pattern for every external service.** Each integration sits behind
  an interface with a working local **mock**, selected by an env var
  (`AI_PROVIDER`, `MAPS_PROVIDER`, `NOTIFY_PROVIDER`, `SMS_PROVIDER`,
  `VOICE_PROVIDER`, `STORAGE_PROVIDER`). Real providers fall back to the mock on
  missing keys or failure, so the platform runs fully with **zero paid keys**.
- **Safety first.** The triage engine combines physiologic red-flags
  (airway/breathing/consciousness/bleeding) with keyword rules and free-text
  phrase detection, taking the max severity. Guardrails scrub any
  prescription/diagnosis language from generated guidance; content is unit-tested
  to contain none.
- **Clean architecture on the client.** The Flutter app is feature-first
  (`data` · `domain` · `application` · `presentation`) with Riverpod + GoRouter.

## Triage flow

```
input (text or voice) ─▶ STT (voice) ─▶ TriageService
                                           │
             physiologic red-flags ────────┤
             keyword + phrase rules ───────┤  max-severity + confidence
                                           ▼
           structured report (severity, confidence, first-aid steps,
           facility routing, disclaimer)  ──▶ persisted on Incident (immutable)
                                           ──▶ TTS spoken summary (voice)
```

## Security

- **AES-256-GCM** field encryption for PII/PHI (insurance).
- **JWT** access (15 min) + rotating refresh (14 d), refresh-token hashes stored.
- **RBAC** — `USER` / `RESPONDER` / `HOSPITAL_STAFF` / `ADMIN` via `RolesGuard`.
- **Audit trail** — a global interceptor records every state-changing request
  (who/action/resource/ip) and **never persists request bodies** (no credentials
  or PHI leak).
- **Rate limiting** via `@nestjs/throttler`.
- TLS, secrets management, and GDPR/HIPAA-inspired controls are deployment
  concerns documented in `infra/`.

## Testing

- **Unit** — 24 tests (triage rules, guardrails, geo/maps, notifications
  fallback, voice, guidance safety).
- **E2E** — 13 supertest tests booting the real app against Postgres (auth,
  RBAC, profile/QR, triage, SOS + state machine, guidance, hospitals).
- **Runtime** — the admin portal and backend container are verified live in a
  browser / container.

See [ROADMAP.md](../ROADMAP.md) for status and [API.md](API.md) for endpoints.
