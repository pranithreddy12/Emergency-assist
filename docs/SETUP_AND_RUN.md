# Setup & Run — EmergencyAI

How to get the system running locally and test every major flow.
**No paid API keys are needed** — all external services fall back to working mocks.

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js 20+** | `node -v` — [nodejs.org](https://nodejs.org) |
| **Docker Desktop** | For PostgreSQL + Redis |
| **Flutter** *(optional)* | Only for the mobile app — see [BRINGUP.md](../apps/mobile/BRINGUP.md) |

---

## 2. Quick start (Windows)

From the repo root, double-click or run:

```bat
start.bat
```

It does everything: starts Docker (launching Docker Desktop if needed), brings up
PostgreSQL + Redis, creates `.env`, installs dependencies, applies migrations,
seeds sample hospitals/ambulances, then opens the API and admin portal in their
own windows.

| Script | Purpose |
|--------|---------|
| `start.bat` | Start the whole system |
| `create-admin.bat` | Create an ADMIN login for the portal |
| `stop.bat` | Stop servers + containers |

### macOS / Linux
```bash
docker compose up -d
cd apps/backend && cp .env.example .env && npm install
npx prisma generate && npx prisma migrate deploy && npm run seed
npm run start:dev            # terminal 1
cd ../admin && npm install && npm run dev   # terminal 2
```

---

## 3. What's running

| Service | URL |
|---------|-----|
| **API** | http://localhost:3000/api/v1 |
| **Swagger (interactive API docs)** | http://localhost:3000/docs |
| **Admin portal** | http://localhost:5173 |
| **Health check** | http://localhost:3000/api/v1/health |
| PostgreSQL | `localhost:5440` (user/pass/db: `emergencyai`) |
| Redis | `localhost:56379` |

Verify it's alive:
```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok","db":"up","time":"..."}
```

---

## 4. Test drive — the emergency flow

Easiest path: open **http://localhost:3000/docs** (Swagger) and click *Try it out*.
Or paste these into a terminal.

### 4.1 Sign in (Emergency Guest Mode — no credentials)
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/guest
```
Copy the `accessToken`, then:
```bash
TOKEN=paste_access_token_here          # Windows CMD: set TOKEN=...
```

### 4.2 Fill in a medical profile
```bash
curl -s -X PUT http://localhost:3000/api/v1/medical-profile \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"bloodGroup":"O_NEG","allergies":["Penicillin"],"medications":["Aspirin"],"isOrganDonor":true}'
```
The response includes a **`qrToken`** — the public emergency card:
```bash
curl -s http://localhost:3000/api/v1/medical-card/PASTE_QR_TOKEN
```
(No auth required — that's the point: a responder can scan it.)

### 4.3 AI triage (never diagnoses)
```bash
curl -s -X POST http://localhost:3000/api/v1/triage/assess \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"chiefComplaint":"severe chest pain radiating to left arm","patientAge":58,"isConscious":true,"isBreathing":true}'
```
Expect `severity: CRITICAL`, a confidence score, `suggestedFacility: CARDIAC`,
first-aid steps, and a disclaimer.

Try a life-threatening phrase — it escalates:
```bash
curl -s -X POST http://localhost:3000/api/v1/triage/assess \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"chiefComplaint":"he collapsed and is not breathing"}'
```

### 4.4 Raise an SOS incident
```bash
curl -s -X POST http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"latitude":37.7749,"longitude":-122.4194,"address":"Union Square",
       "triage":{"chiefComplaint":"unconscious, not breathing","isConscious":false,"isBreathing":false}}'
```
Save the returned incident `id`. Advance its state machine:
```bash
curl -s -X PATCH http://localhost:3000/api/v1/incidents/INCIDENT_ID/status \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"DISPATCHED"}'
```
An illegal jump (e.g. straight to `RESOLVED`) is rejected with `400` — by design.

### 4.5 Find hospitals & book an ambulance
```bash
# nearest hospitals with travel time
curl -s "http://localhost:3000/api/v1/hospitals/search?latitude=37.7749&longitude=-122.4194&limit=3" \
  -H "Authorization: Bearer $TOKEN"

# filter by capability
curl -s "http://localhost:3000/api/v1/hospitals/search?latitude=37.7749&longitude=-122.4194&capability=CARDIAC" \
  -H "Authorization: Bearer $TOKEN"

# one-tap ambulance (assigns the nearest available unit)
curl -s -X POST http://localhost:3000/api/v1/ambulance/book \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pickupLat":37.7749,"pickupLng":-122.4194}'

# track it (live ETA + driver)
curl -s http://localhost:3000/api/v1/ambulance/requests/REQUEST_ID/track \
  -H "Authorization: Bearer $TOKEN"
```

### 4.6 First-aid guidance (public — works without login)
```bash
curl -s http://localhost:3000/api/v1/guidance          # 16 topics
curl -s http://localhost:3000/api/v1/guidance/cpr      # full steps
curl -s http://localhost:3000/api/v1/guidance/bundle   # offline bundle + checksum
```

### 4.7 Alert emergency contacts + live tracking link
```bash
# add contacts first
curl -s -X PUT http://localhost:3000/api/v1/medical-profile/contacts \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contacts":[{"name":"Sam","phone":"+14155551234","priority":1}]}'

# alert them about the incident
curl -s -X POST http://localhost:3000/api/v1/incidents/INCIDENT_ID/alert-contacts \
  -H "Authorization: Bearer $TOKEN"
```
Returns a **public tracking link**. Open it — no auth needed:
`http://localhost:3000/api/v1/track/TOKEN`

> SMS/WhatsApp/calls are *mocked*: watch the **API window** — each send is logged
> like `[SMS -> +14155551234] EmergencyAI alert: ...`.

### 4.8 Voice + image AI
```bash
# the mock STT reads base64-encoded text as the "recording"
curl -s -X POST http://localhost:3000/api/v1/voice/assist \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"audioBase64\":\"$(printf 'he is not breathing' | base64)\"}"

# translation
curl -s -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"Apply firm pressure to the wound.","targetLanguage":"Spanish"}'
```

---

## 5. Test the Admin portal

1. Run `create-admin.bat` (or register + promote manually) to make an ADMIN user.
2. Open **http://localhost:5173** and sign in.
3. You should see:
   - **Dashboard** — incident counts, severity breakdown, ack rate, location hotspots
   - **Hospitals** — the 5 seeded hospitals; add/delete one
   - **Ambulances** — 4 seeded units; change a status
   - **Users** — everyone who signed in (incl. your guests); change a role
   - **Incidents** — every incident with severity and confidence

> Non-admin accounts get **403** on these endpoints — that's the RBAC working.

---

## 6. Run the tests

```bash
cd apps/backend
npm test           # 35 unit tests
npm run test:e2e   # 20 end-to-end tests (needs Postgres up)
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| **`docker ps` fails / "cannot find the file specified"** | The privileged engine service is stopped. Right-click **Docker Desktop → Run as administrator**, or in an **elevated PowerShell**: `Start-Service com.docker.service` |
| `health` shows `"db":"down"` | Containers aren't up: `docker compose up -d`, then check `docker compose ps` |
| Port 3000 / 5173 / 5440 already in use | Stop the other process, or change `PORT` in `apps/backend/.env` (and the compose port mappings) |
| `prisma migrate dev` hangs | It's interactive. Use `npx prisma migrate deploy` (what `start.bat` does) |
| Admin portal shows a network error | The API isn't running, or CORS: leave `ALLOWED_ORIGINS` blank for local dev |
| `401` on API calls | Access tokens expire in 15 minutes — get a fresh one from `/auth/guest` or `/auth/login` |
| Register returns `400` | Password policy: min 8 chars **including a letter and a number** |
| Want a clean slate | `docker compose down -v` then re-run `start.bat` |

---

## 8. Going live (optional)

Everything runs on mocks by default. To use real providers, set keys in
`apps/backend/.env` and flip the switches:

```env
AI_PROVIDER=openai          OPENAI_API_KEY=sk-...
MAPS_PROVIDER=google        GOOGLE_MAPS_API_KEY=...
SMS_PROVIDER=twilio         TWILIO_ACCOUNT_SID=...  TWILIO_AUTH_TOKEN=...
NOTIFY_PROVIDER=fcm         FCM_SERVER_KEY=...
STORAGE_PROVIDER=s3         AWS_S3_BUCKET=...  AWS_REGION=...
VOICE_PROVIDER=openai
```
Each real provider falls back to its mock on error, so nothing breaks.

See [infra/README.md](../infra/README.md) for Docker/Kubernetes deployment.

> ⚠️ Before using this with real patients, read [SAFETY.md](SAFETY.md) — clinical,
> regulatory, and legal sign-off is required.
