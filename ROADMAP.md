# EmergencyAI — Project Roadmap

> Living document. Updated every session. `[x]` done & verified · `[~]` in progress · `[ ]` pending.
> **Strategy:** Vertical slice first — prove the full stack end-to-end, then expand module by module.
> **Integrations:** Adapter pattern — real code behind interfaces, working local mocks so the app runs with zero paid keys.

## Guiding constraints (non-negotiable)
- **Never diagnose. Never prescribe medication.** Only evidence-based first-aid guidance from recognized bodies (AHA, Red Cross, WHO).
- No placeholder/stub business logic. Everything committed must compile and run.
- Build dependencies before dependents.

---

## Phase 0 — Foundation  `[x]`
- [x] Monorepo structure (`apps/backend`, `apps/mobile`, `apps/admin`, `packages/sdk`, `docs`, `infra`)
- [x] Root README, ROADMAP, .gitignore
- [x] `docker-compose.yml` — Postgres + Redis for local dev (ports 5440 / 56379; host had conflicts)
- [x] Backend NestJS bootstrap (config, Prisma, health, Swagger, global JWT guard, throttler, error filter)
- [x] Shared API SDK (`packages/sdk`) — typed, dependency-free TS client; typecheck green

## Phase 1 — Vertical Slice (CURRENT FOCUS)  `[~]`
Goal: a bystander can authenticate (or guest), a medical profile exists, the AI triage engine classifies an emergency with a confidence score and structured report, and an SOS incident is created — all wired to one real Flutter flow.

- [x] **Auth** — email register/login, JWT access+refresh (rotating), guest mode, logout/session revoke — *verified end-to-end*
- [x] **Medical Profile** — full schema, CRUD, encrypted insurance field, emergency contacts, public QR card — *verified*
- [x] **Triage Engine** — AI adapter (OpenAI + deterministic rule-based mock), severity + confidence + structured report, safety guardrails (no diagnosis/prescription), 7 unit tests green — *verified*
- [x] **Emergency/SOS** — incident create (runs triage + persists immutable report), state machine w/ guarded transitions, WebSocket gateway — *verified end-to-end*
- [x] **Flutter** — code-complete: login/guest → SOS dashboard (pulsing button) → guided AI triage → structured report, + medical profile with QR card. Clean feature-first architecture (Riverpod, GoRouter, Dio w/ auto token-refresh). *Not compiled here (no Flutter SDK on host) — needs `flutter analyze`/`run` on a Flutter machine.*
- [ ] E2E test (supertest) of the backend slice

## Phase 2 — Emergency Content & Location
- [x] First-aid guidance module — 16 evidence-based topics (AHA/Red Cross/WHO), offline bundle w/ checksum, content safety-tested. Flutter list+detail screens. *Backend verified end-to-end.*
- [x] Hospital search — Maps adapter (mock + Google w/ fallback), haversine distance, capability/openNow filters, distance/rating/travel-time sort, seed dataset. Flutter search screen. *Backend verified end-to-end.*
- [x] Ambulance module — one-tap nearest-unit booking (concurrency-guarded), live ETA tracking, driver details, cancel (frees unit). Flutter book/track screen. *Backend verified end-to-end.*
- [ ] Location module (GPS, sharing, offline cache) — Flutter screens currently use a demo location; needs geolocator + live GPS.

## Phase 3 — Coordination & Comms  `[x]`
- [x] Notifications backbone — push/SMS/WhatsApp/email/call adapters (mock + FCM/Twilio w/ fallback), push→SMS→email fallback, NotificationLog audit. *Verified end-to-end + unit-tested.*
- [x] Emergency contacts alerting — SMS+WhatsApp+priority-1 call, public live-tracking link (token-resolved, no auth). Flutter "Alert my contacts" action on report. *Verified end-to-end.*
- [x] Hospital pre-arrival — immutable clinical hand-off snapshot (severity, vitals, allergies, meds, blood group, ETA), hospital inbox + acknowledge/decline with RBAC (HOSPITAL_STAFF/ADMIN). *Verified end-to-end incl. 403 on USER.*
- [x] Voice assistant — STT/TTS adapters (mock + OpenAI Whisper/TTS w/ fallback), hands-free `assist` flow (voice→triage→spoken guidance). *Verified end-to-end + 3 unit tests.* Also hardened the triage engine to escalate life-threatening free-text phrases ("not breathing", "unconscious") to CRITICAL — caught via the voice test.

## Phase 4 — Records, Analytics, Admin  `[x]`
- [x] Medical timeline — unified reverse-chronological record (incidents, ambulances, documents) + summary counts. *Verified end-to-end.*
- [x] Analytics dashboard — overview (by severity/status), response-times (dispatch latency + ETA mean/median), location heatmap (1km buckets), daily trends. ADMIN-only RBAC. *Verified end-to-end incl. 403 on USER.*
- [x] Admin portal (hospitals, ambulances, users, incidents) — first real consumer of the shared SDK
  - [x] Backend admin CRUD (hospitals, ambulances, users+roles, incidents), ADMIN RBAC. *Verified end-to-end incl. 403.*
  - [x] `apps/admin` React/Vite frontend consuming the SDK — login (admin gate), analytics dashboard, hospital/ambulance/user/incident tables. **Verified in a real browser** (built with `vite build`, logged in, live data rendered). Caught+fixed a real SDK `fetch` binding bug via runtime testing.

## Phase 5 — Hardening & Delivery  `[x]`
- [x] Audit logs — global interceptor records every state-changing request (who/action/resource/ip), **never persists request bodies** (no credentials/PHI). Admin `/admin/audit-logs` viewer. *Verified end-to-end.* (AES field encryption ✓ Phase 1; RBAC ✓ Phases 3–4)
- [x] Security hardening pass — **Helmet** headers (HSTS, nosniff, frame/DNS), **CORS allowlist** (no wildcard-with-credentials; env `ALLOWED_ORIGINS`), **refresh-token reuse detection** (replayed/stolen token → revoke all user sessions), **stricter auth rate-limits** (register 5/min, login 10/min), **password policy** (letter+number, ≥8). *4/5 verified live + reuse-detection unit-tested (28 unit tests green).*
- [x] Full test suites — 24 unit + **13 supertest e2e** (full HTTP stack: auth, RBAC 401/403, profile/QR, triage, SOS+state machine, guidance, hospitals). *All green.*
- [x] Docker images, K8s manifests, CI/CD — backend Dockerfile (Debian-slim, multi-stage, **built AND ran in a container: migrate + health ok**), admin Dockerfile (vite→nginx, **built**), 7 K8s manifests (namespace/config/postgres/redis/backend+migration-Job/admin/ingress, all YAML-valid), GitHub Actions CI (postgres service → build/test/e2e + SDK typecheck + admin build + image builds). `infra/README.md`. *Verified.*
- [x] Complete docs — `docs/ARCHITECTURE.md` (system diagram, module map, triage flow, security), `docs/API.md` (full endpoint reference w/ roles), refreshed root README + `infra/README.md`. Swagger live at `/docs`.

---

## Changelog
- **2026-07-11** — Repo initialized. Phase 0 scaffolding started. Chose vertical-slice strategy + adapter/mock integrations.
- **2026-07-11** — Phase 0 complete. Backend vertical slice (auth, medical profile, triage engine, SOS/incidents + WebSocket) built and **verified end-to-end** against Postgres: guest→profile→QR card→triage(CRITICAL/CARDIAC)→SOS incident→state machine. 7 triage/guardrail unit tests green. `nest build` clean.
- **2026-07-11** — Shared TS SDK (`packages/sdk`) built, typecheck green. Flutter app code-complete for the full slice (auth→dashboard→triage→report + profile/QR). Flutter not installed on host, so mobile is authored but not compiled here — needs verification on a Flutter machine.
- **2026-07-11** — Phase 2 (mostly) complete. Guidance, hospital-search (+Maps adapter), and ambulance modules built and **verified end-to-end** against Postgres (16 guidance topics, filtered/sorted hospital search, book→track→cancel). 17 backend unit tests green, `nest build` clean. Flutter screens for all three added + dashboard/router wiring (authored, not compiled). Location module (live GPS) still pending — Flutter uses a demo location for now.
- **2026-07-11** — Phase 3 (mostly) complete. Notifications backbone (5 channels + fallback + audit log), emergency-contacts alerting with public tracking link, hospital pre-arrival with RBAC acknowledge — all **verified end-to-end** against Postgres (contacts alerted via SMS/WhatsApp/call; tracking link resolved; pre-arrival snapshot sent, USER→403, staff→acknowledged). 20 backend unit tests green. Flutter: report-screen "Alert my contacts" action + prearrival repo methods (authored). Voice assistant still pending. Note: Docker Desktop engine crashed mid-session and was restarted; migrations now created via `migrate diff` + `migrate deploy` because the harness is non-interactive.
- **2026-07-11** — Phase 5 COMPLETE (self-paced /loop). Audit-log interceptor (bodies never stored), 13 supertest e2e tests, backend+admin Docker images (backend container run-verified), 7 K8s manifests, GitHub Actions CI, and full docs (ARCHITECTURE + API + infra README). Backend now 16 modules; 37 tests green (24 unit + 13 e2e). **Phases 0–5 done.** Remaining: Flutter Location module (live GPS) + on-device Flutter compilation (no Flutter SDK on this host).
- **2026-07-11** — Phase 4 COMPLETE (self-paced /loop, 4 iterations). Medical timeline, analytics dashboard (overview/response-times/heatmap/trends, ADMIN RBAC), admin backend CRUD, and the **`apps/admin` React/Vite portal** — all verified end-to-end. The admin portal was verified in a **real browser** (vite build + live login + live data render), which caught and fixed a genuine SDK bug (`globalThis.fetch` needs `.bind(globalThis)` — "Illegal invocation"). SDK extended with admin+analytics methods, typecheck green. Backend is now 12 modules, all runnable-and-verified. Remaining: voice assistant, Location module, Phase 5 (hardening/tests/deploy).
