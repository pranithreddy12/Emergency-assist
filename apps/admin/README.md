# EmergencyAI — Admin Portal

React + Vite + TypeScript. Consumes [`@emergencyai/sdk`](../../packages/sdk).
Login (ADMIN-gated), analytics dashboard, and CRUD for hospitals, ambulances,
users, and incidents.

## Run

```bash
cd apps/admin
npm install
npm run dev          # http://localhost:5173  (needs the backend running)
```

Point it at a non-default backend with an env var:
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1 npm run dev
```

Sign in with an **ADMIN** user. To promote a user:
```bash
# in apps/backend, with the DB up:
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.update({where:{email:'you@x.com'},data:{role:'ADMIN'}}).then(()=>process.exit(0))"
```

## Build

```bash
npm run build        # tsc typecheck + vite build -> dist/
npm run preview      # serve the production build
```

The SDK is resolved from source via a Vite alias (`vite.config.ts`), so a build
also compiles the SDK — no separate SDK build step needed.

## Layout
```
src/
  api.ts            EmergencyAiClient instance + token storage
  App.tsx           auth gate + sidebar navigation
  Login.tsx         admin sign-in (verifies role === ADMIN)
  useAsync.ts       tiny data-fetching hook
  pages/            Dashboard · Hospitals · Ambulances · Users · Incidents
```

## Container
Built and served via nginx — see [`Dockerfile`](Dockerfile) and
[`../../infra/README.md`](../../infra/README.md). Build context is the **repo
root** (it needs `packages/sdk`).
