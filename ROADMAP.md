# EmergencyAI — Project Plan & Roadmap

> **Living document.** Updated every working session.
> Status keys: `[x]` done & verified · `[~]` in progress · `[ ]` planned · `[?]` idea / needs validation.
> Last substantive rewrite: **2026-11-06**.

---

## 1. The motive — why this exists

**Most people die in an emergency not because help is unavailable, but because of the gap between the moment something goes wrong and the moment a trained responder arrives.**

In that gap stands an ordinary person — a bystander, a family member, a coworker — who usually knows what *happened* but not what to *do*. Cardiac arrest survival drops ~10% for every minute without CPR or defibrillation. Choking, severe bleeding, anaphylaxis, stroke, and overdose are all won or lost in the first few minutes, by whoever is standing there.

EmergencyAI exists to **turn that frightened bystander into a competent first responder for the few minutes that matter**, and to **compress the chain of survival** — recognize → call → act → hand off — into one guided flow on a phone that already fits in their pocket.

It is **not** a doctor, a diagnosis engine, or a replacement for emergency services. It is a **calm, knowledgeable voice over your shoulder** that:

1. Helps you *recognize* how serious a situation is (triage, not diagnosis).
2. Tells you the *right emergency number* for exactly where you are, and gets you dialing.
3. *Coaches you step-by-step* through evidence-based first aid — CPR, choking, bleeding, AED use — in plain language, hands-free, even with no signal.
4. *Finds* the nearest AED, hospital, or pharmacy using live local data.
5. *Alerts* the patient's circle and *pre-briefs* the receiving hospital so no time is lost on arrival.

### The three audiences
- **The bystander / Good Samaritan** — the primary user. Scared, untrained, needs confidence and clear next actions. (Mobile: the "rescue coach" flow.)
- **The patient** — carries a medical profile / ID that speaks for them when they can't.
- **Responders & hospitals** — receive structured, trustworthy hand-off data before the patient arrives. (Admin portal + pre-arrival inbox.)

---

## 2. Non-negotiable principles

These override every feature decision. If a feature can't honor these, it doesn't ship.

| # | Principle | Why |
|---|-----------|-----|
| 1 | **Never diagnose. Never prescribe medication.** Only evidence-based first-aid guidance from recognized bodies (AHA, Red Cross, WHO, ERC). | Legal, ethical, and safety floor. Guardrails are code-enforced and unit-tested. |
| 2 | **Works when everything else fails.** Core life-saving guidance must run **offline, low-battery, and on a locked phone.** | Emergencies happen in basements, rural roads, and dead-zones. |
| 3 | **Seconds, not screens.** The critical path (SOS → call → coach) is reachable in ≤2 taps. No onboarding walls in front of a dying person. | Every tap is a lost compression. |
| 4 | **Right info for *this* place.** Emergency number, nearby facilities, and protocols are location- and locale-aware, never hardcoded to one country. | 112 ≠ 911 ≠ 108. A US-only app kills people elsewhere. |
| 5 | **Earn trust with provenance.** Every instruction cites its source organization. No made-up medicine. | Trust is the product. |
| 6 | **Privacy is a safety feature.** PHI is encrypted; request bodies are never logged; data minimization everywhere. | Health data leaks are their own emergency. |
| 7 | **No placeholder logic.** Everything committed compiles, runs, and is verified. Paid integrations sit behind adapters with working local mocks. | The app must never be a demo that lies. |

---

## 3. Architecture at a glance

| Path | What | State |
|------|------|-------|
| `apps/backend` | NestJS + Prisma + PostgreSQL + Redis — REST/WebSocket API, **25 modules** | Feature-complete, verified end-to-end |
| `apps/mobile` | Flutter (Material 3, Riverpod, GoRouter) — bystander rescue coach | Authored; needs on-device bring-up |
| `apps/admin` | React/Vite admin + hospital portal | Verified live in browser |
| `packages/sdk` | Shared, typed, dependency-free TS API client | Typecheck green |
| `infra` | Docker images, 7 K8s manifests, GitHub Actions CI → GHCR + gated deploy | Verified |
| `docs` | Architecture, API, Data model, Safety, Setup | Complete |

**Integration strategy:** adapter pattern. Real providers (OpenAI, Google Maps/Places, OSM, Firebase, AWS S3, Twilio) sit behind interfaces; working mocks are selected via `*_PROVIDER=mock` so the whole platform runs with **zero paid keys**. Providers fall back to mock on any error.

---

## 4. What's built today (foundation — Phases 0–6)

Consolidated; all items verified unless noted. Full per-phase history is in the Changelog.

### Core platform
- [x] Monorepo, Docker Compose (Postgres `:5440`, Redis `:56379`), NestJS bootstrap, shared SDK.
- [x] **Auth** — email register/login, rotating JWT access+refresh, **refresh-reuse detection**, guest mode.
- [x] **Medical Profile** — encrypted fields, emergency contacts, public QR card / medical ID.
- [x] **Triage Engine** — AI adapter (OpenAI + deterministic rule-based mock), severity + confidence + structured report, **safety guardrails that scrub diagnosis/prescription language**, escalation of life-threatening free-text ("not breathing", "unconscious") to CRITICAL.
- [x] **Emergency / SOS** — incident creation (runs triage, persists immutable report), guarded state machine, WebSocket live updates.

### Bystander response (the heart of the product)
- [x] **First-aid guidance** — evidence-based topics (AHA/Red Cross/WHO), **fully offline bundle** w/ checksum, safety-tested.
- [x] **Infant protocols** — infant CPR + choking variants (no abdominal thrusts), routing + safety tests.
- [x] **AED** — nearest-AED locator + step-by-step AED-use coaching (closes the OHCA defibrillation loop).
- [x] **Country-aware emergency number** — dials the correct local number for the user's location.
- [x] **Voice assistant** — hands-free voice → triage → spoken guidance (STT/TTS adapters).

### Location & facilities
- [x] **Live nearby hospitals / pharmacies** — Google Places primary, **OpenStreetMap fallback**, location-specific (no hardcoded lists), haversine distance + filters/sort.
- [x] **Ambulance** — one-tap nearest-unit booking (concurrency-guarded), live ETA, cancel.
- [x] **Flutter Location module** — `geolocator` live GPS wired into hospitals, ambulance, SOS.

### Coordination
- [x] **Notifications backbone** — push/SMS/WhatsApp/email/call adapters with push→SMS→email fallback + audit log.
- [x] **Contact alerting** — alert the circle + public, token-resolved live-tracking link (no auth).
- [x] **Hospital pre-arrival** — immutable clinical hand-off snapshot + hospital inbox w/ RBAC acknowledge/decline.

### Records, admin, delivery
- [x] **Medical timeline**, **analytics dashboard** (severity/status, response times, heatmap, trends — ADMIN RBAC).
- [x] **Admin + hospital portal** (React/Vite, consumes SDK) — verified live.
- [x] **Medical documents** upload/download (local + S3), **AI image analysis** (non-diagnostic observations → triage), **translation**.
- [x] **Hardening** — Helmet, CORS allowlist, rate limits, password policy, **global audit interceptor (never stores request bodies)**, AES field encryption, RBAC.
- [x] **Delivery** — Docker images (backend run-verified), 7 K8s manifests, CI → GHCR + gated K8s deploy.
- [x] **Docs** — Architecture, API, Data model, Safety, Setup & Run; Swagger at `/docs`; Windows `start.bat`.

### Known gaps carried forward
- [ ] On-device Flutter compile (`flutter analyze && flutter test`) — no Flutter SDK on host.
- [ ] Flutter shake/gesture SOS, social (Google/Apple) + biometric login — need native Firebase/platform config.
- [ ] Documents DB e2e — deferred to CI.

---

## 5. Redefined roadmap — where we go next

The foundation proves the *platform*. The next phases deepen the **motive**: save more lives, in more places, for more kinds of emergency, more reliably.

### Phase 7 — Bystander confidence & reliability  `[~]`
*Make the critical path unbreakable and the coaching impossible to get wrong.*
- [ ] **One-tap lock-screen / widget SOS** — launch the rescue coach + auto-dial without unlocking.
- [ ] **Metronome + haptic CPR pacing** — audible/vibrating 100–120 bpm beat during compressions; works offline, screen-off.
- [ ] **Shake / power-button / voice "Hey, emergency" trigger** — hands may be busy or bloody.
- [ ] **Low-battery survival mode** — strips to text + metronome + emergency number when battery < 15%.
- [ ] **Offline-first everything audit** — guarantee recognize→call→coach runs with airplane mode on. Automated test that fails if any critical screen needs the network.
- [ ] **"What's happening?" decision tree** — fast branching recognizer (not breathing / choking / bleeding / seizure / allergic / overdose / stroke-FAST / burn / drowning) that routes straight to the right protocol.

### Phase 8 — Community responder network  `[?]`
*The nearest help is almost never the ambulance — it's a trained person 200m away.*
- [ ] **Good Samaritan dispatch** — opt-in CPR-trained volunteers get alerted to a nearby cardiac arrest (PulsePoint-style), with the AED location en route.
- [ ] **Crowdsourced AED registry** — users add/verify AED locations with photos; moderation + staleness decay.
- [ ] **Responder reputation + Good Samaritan legal info** — surface local Good Samaritan protections to reduce hesitation.
- [ ] **"I'm on my way" coordination** — de-conflict multiple responders to one incident.

### Phase 9 — Beyond first aid: the whole chain  `[ ]`
- [ ] **Live video / audio bridge to a dispatcher or responder** — show, don't type, in a crisis.
- [ ] **Text-to-emergency-services** — accessibility for deaf/HoH users and silent-danger situations (domestic violence, intruder).
- [ ] **Post-incident follow-up** — "how did it go?", care-continuity summary, encourage CPR retraining, debrief for bystander stress.
- [ ] **Telemedicine warm handoff** — for non-critical triage results, connect to on-call clinician instead of the ER.

### Phase 10 — Specialized emergency modes  `[ ]`
- [ ] **Mental-health / crisis mode** — suicide-prevention & crisis-line routing (988/local), de-escalation guidance, *strict* non-clinical guardrails.
- [ ] **Mass-casualty / disaster mode** — triage *tagging* (START/JumpSTART), offline map, works when towers are down (mesh/SMS fallback).
- [ ] **Chronic-condition & allergy awareness** — proactive, profile-driven prompts (epi-pen location, insulin, blood thinners) surfaced to the bystander.
- [ ] **Pediatric & elderly dedicated flows** — age-aware protocol selection beyond infant CPR.
- [ ] **Overdose / naloxone coaching** — recognition + administration coaching where legal.

### Phase 11 — Intelligence & personalization  `[ ]`
- [ ] **On-device triage model** — small local model so recognition works offline and privately, cloud only to enrich.
- [ ] **Wearable integration** — ingest fall detection, heart-rate anomalies, SpO₂ from smartwatches to auto-raise an incident.
- [ ] **Multilingual coaching** — real-time translation of spoken coaching for the responder *and* the patient.
- [ ] **Context-aware prompts** — time of day, location type (pool, road, kitchen), weather → tailored risk prompts.

### Phase 12 — Public health & scale  `[ ]`
- [ ] **Anonymized incident analytics** for public-health partners (where/when emergencies cluster, response-time gaps).
- [ ] **Hospital EHR / dispatch integration** — push pre-arrival data into real hospital systems (FHIR) and PSAP/112 dispatch where APIs exist.
- [ ] **First-aid training & drills** — gamified, spaced-repetition CPR/choking practice so skills are warm *before* the emergency.
- [ ] **Institutional deployments** — schools, gyms, workplaces, events (fixed-AED maps, staff responder rosters).

### Phase 13 — Mobile hardening & launch  `[ ]`
- [ ] On-device Flutter bring-up: `flutter analyze && flutter test`, real-device QA on the critical path.
- [ ] Native config: Firebase, social + biometric login, background location, push.
- [ ] Accessibility pass (screen reader, large text, high contrast, color-blind-safe severity cues).
- [ ] App Store / Play compliance (medical-app policies, Good Samaritan disclaimers).
- [ ] Load/latency SLOs for the SOS path; chaos test the provider fallbacks.

---

## 6. How we decide what's next

1. **Does it shorten the chain of survival?** (recognize → call → act → hand off) — if not, it waits.
2. **Does it work offline / low-signal?** If a feature only helps online, it's a bonus, never the core.
3. **Can we honor the safety principles?** No diagnosis, no prescription, provenance on every instruction.
4. **Is there a working mock so it ships keyless?** Adapters first, keys optional.
5. **One runnable check per non-trivial path.** Protocol routing and safety guardrails always get a test.

---

## Changelog
- **2026-11-06** — **Project plan rewritten and redefined.** Re-anchored the whole roadmap on the motive (close the bystander gap / chain of survival), restated the non-negotiable principles, consolidated the built foundation (now **25 backend modules**), and defined forward Phases 7–13 with new features: lock-screen SOS + CPR metronome, offline-first audit, community Good Samaritan dispatch, crowdsourced AED registry, live video-to-dispatcher, text-to-911 accessibility, crisis/disaster/overdose modes, on-device triage, wearable ingestion, EHR/dispatch (FHIR) integration, and gamified training.
- **2026-08+** — Repositioned mobile app as a **bystander-first responder coach**. Added AED locator + AED-use coaching (OHCA), country-aware emergency number, live nearby hospitals/pharmacies (Google Places primary → OSM fallback, location-specific), infant CPR/choking variants, and fully-offline first aid.
- **2026-07-17** — CI pushes images to GHCR + gated Kubernetes deploy; full documentation set; Windows launcher scripts + setup guide.
- **2026-07-15** — Security hardening (helmet, CORS allowlist, refresh-reuse detection, rate-limits, password policy). Phase 6: storage (local/S3) + documents + AI image analysis + translation. Flutter live-GPS Location module. E2e caught & fixed a refresh-token uniqueness bug (`jti`); shared `configureApp()` with e2e. 35 unit + 17 e2e green.
- **2026-07-11** — Phases 0–5 built and verified end-to-end: platform (auth, profile, triage, SOS+WebSocket), content & location (guidance, hospital search, ambulance), coordination (notifications, contact alerting, pre-arrival, voice), records/analytics/admin portal (verified in a real browser — caught a real SDK `fetch` binding bug), and hardening/delivery (audit interceptor, 13 e2e, Docker/K8s/CI, docs).
