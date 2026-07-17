# EmergencyAI — Documentation

| Doc | What it covers |
|-----|----------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, backend module map, triage flow, security overview |
| [API.md](API.md) | Full REST/WebSocket endpoint reference with auth roles |
| [DATA_MODEL.md](DATA_MODEL.md) | ER diagram, entities, and the incident state machine |
| [SAFETY.md](SAFETY.md) | Clinical-safety stance: never diagnose/prescribe, how it's enforced, sources, pre-use requirements |
| [../SECURITY.md](../SECURITY.md) | Security controls, operational requirements, HIPAA/GDPR note, vuln reporting |

## Component docs
- Backend — [`apps/backend/README.md`](../apps/backend/README.md)
- Admin portal — [`apps/admin/README.md`](../apps/admin/README.md)
- Mobile app — [`apps/mobile/README.md`](../apps/mobile/README.md) · [bring-up checklist](../apps/mobile/BRINGUP.md)
- SDK — [`packages/sdk/README.md`](../packages/sdk/README.md)
- Infra / deploy — [`infra/README.md`](../infra/README.md)

## Project meta
- [ROADMAP.md](../ROADMAP.md) — status & changelog
- [CONTRIBUTING.md](../CONTRIBUTING.md) — dev workflow
- Live API docs (Swagger): run the backend and open `/docs`
