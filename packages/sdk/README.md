# @emergencyai/sdk

Typed, dependency-free API client for the EmergencyAI backend. Works in browsers
and Node 18+ (uses the global `fetch`). Consumed by the admin portal; usable by
any TS/JS client.

## Install / build

Within this monorepo it's referenced from source (the admin app aliases it via
Vite). Standalone:

```bash
cd packages/sdk
npm install
npm run build        # -> dist/  (ESM + .d.ts)
```

## Usage

```ts
import { EmergencyAiClient } from '@emergencyai/sdk';

const client = new EmergencyAiClient({
  baseUrl: 'http://localhost:3000/api/v1',
  // Optional: persist/retrieve the access token (defaults to in-memory)
  getToken: () => localStorage.getItem('token'),
  onTokens: (t) => localStorage.setItem('token', t.accessToken),
});

// Auth
await client.guest();                       // Emergency Guest Mode
await client.login('jane@x.com', 'S3cret1'); // or register(...)
const me = await client.me();

// Triage (never diagnoses)
const result = await client.assess({
  chiefComplaint: 'severe chest pain',
  isBreathing: true,
});
console.log(result.severity, result.confidence, result.recommendedActions);

// Incidents
const incident = await client.createIncident({
  latitude: 37.77, longitude: -122.41,
  triage: { chiefComplaint: 'unconscious', isBreathing: false },
});
await client.updateIncidentStatus(incident.id, 'DISPATCHED');

// Admin (requires an ADMIN token)
const hospitals = await client.admin.listHospitals();
const stats = await client.analytics.overview();
```

## Error handling

Failed requests throw `EmergencyAiError` with a `.status` (HTTP code) and
`.message` (server message, arrays joined). Everything is fully typed — see
[`src/types.ts`](src/types.ts) for the request/response shapes.

## Notes
- Native `fetch` is bound to the global at construction (`globalThis.fetch.bind`)
  — pass your own `fetch` via options for custom environments.
- Auth endpoints (`guest`/`login`/`register`) store the returned access token;
  refresh-token rotation is handled by the caller (or the mobile Dio client).
