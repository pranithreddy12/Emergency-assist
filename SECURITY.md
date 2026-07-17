# Security Policy

EmergencyAI handles sensitive health information. This document describes the
security posture and how to report vulnerabilities.

## Reporting a vulnerability

**Do not open a public issue for security problems.** Report privately to the
repository owner (via a GitHub private security advisory, or direct contact).
Include steps to reproduce, affected endpoints/components, and impact. We aim to
acknowledge within a few business days.

Please do not access, modify, or exfiltrate data that isn't yours while testing,
and give us reasonable time to remediate before any disclosure.

## What's implemented

| Control | Where |
|---------|-------|
| **Field encryption** (AES-256-GCM) for PII/PHI | `common/crypto/field-crypto.service.ts` (e.g. insurance) |
| **Auth** — argon2 password hashing, JWT access (15 min) + rotating refresh (14 d) | `auth/` |
| **Refresh-token reuse detection** — replay of a rotated token revokes all sessions | `auth/auth.service.ts` |
| **RBAC** — USER / RESPONDER / HOSPITAL_STAFF / ADMIN | `common/guards/roles.guard.ts` |
| **Audit trail** — every state-changing request logged (who/action/resource/ip), **request bodies never stored** | `common/interceptors/audit.interceptor.ts` |
| **Security headers** (HSTS, nosniff, frame options…) via Helmet | `app-config.ts` |
| **CORS allowlist** — no wildcard-with-credentials (`ALLOWED_ORIGINS`) | `app-config.ts` |
| **Rate limiting** — global throttle + tighter on auth (register 5/min, login 10/min) | `app.module.ts`, `auth/auth.controller.ts` |
| **Input validation** — global whitelist + `forbidNonWhitelisted` DTO validation | `app-config.ts` |
| **Password policy** — ≥8 chars incl. a letter and a number | `auth/dto/auth.dto.ts` |
| **Secrets isolation in k8s** — no Secret object inside the auto-applied `infra/k8s/` | `infra/k8s-secrets.example.yaml` |

## Operational requirements (deployment)

These are **not** guaranteed by the code and must be enforced in production:

- **TLS everywhere.** Terminate HTTPS at the ingress/load balancer; never serve
  the API over plain HTTP in production (remove the mobile dev cleartext flag).
- **Real secrets.** Generate strong `JWT_*` secrets and a fresh 32-byte
  `FIELD_ENCRYPTION_KEY` (`openssl rand -base64 32`). Never commit them; use a
  secret manager / Sealed Secrets. Rotating `FIELD_ENCRYPTION_KEY` requires
  re-encrypting existing data.
- **Set `ALLOWED_ORIGINS`** to your real frontend origins.
- **Least-privilege DB credentials** and network policies between pods.
- **Backups + encryption at rest** for Postgres and object storage.

## HIPAA / GDPR note

The architecture is **HIPAA-inspired and GDPR-aware** (encryption, audit logs,
access control, data-subject-friendly models) — it is **not** a certified
compliant system. Production use with real patient data additionally requires,
at minimum: signed BAAs with infrastructure/AI providers, a formal risk
assessment, breach-notification procedures, data-retention/erasure workflows,
and legal review. See [`docs/SAFETY.md`](docs/SAFETY.md) for the clinical-safety
stance.
