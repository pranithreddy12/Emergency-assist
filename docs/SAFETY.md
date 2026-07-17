# Clinical Safety & Scope

> ⚠️ **EmergencyAI is an assistant, not a medical device, and not a replacement
> for emergency services.** In a real emergency, call your local emergency
> number immediately.

## What this software does

- Collects structured information about an emergency.
- Classifies **severity** (LOW / MEDIUM / HIGH / CRITICAL) with a confidence
  score to help prioritize action.
- Surfaces **evidence-based first-aid guidance** for bystanders.
- Helps locate appropriate facilities and coordinate responders/contacts.

## What this software MUST NOT do — and how that's enforced

**It never diagnoses a condition and never prescribes or recommends a specific
medication or dose.** This is enforced in code, not just policy:

- **Guardrails** (`triage/triage.guardrails.ts`) scrub prescription/dosing and
  diagnosis language from any generated guidance, including LLM output.
- The triage engine returns *first-aid actions and severity*, never a diagnosis.
- Vision/voice AI outputs carry an explicit non-diagnostic disclaimer.
- **Tests assert the absence of unsafe language**: the guidance content and
  every triage rule are unit-tested to contain no prescription/diagnosis text
  (`guidance.spec.ts`, `triage.spec.ts`), and the no-diagnosis disclaimer is
  checked over HTTP in the e2e suite.

## How severity is decided (transparency)

The default (mock) triage engine is **deterministic and rule-based**, so its
decisions are auditable:

1. **Physiologic red-flags** set a severity floor — not breathing / unconscious
   → CRITICAL; heavy bleeding → HIGH.
2. **Keyword + free-text phrase rules** add condition-specific first-aid and
   facility routing (e.g. chest pain → CRITICAL, cardiac facility).
3. Severity is the **maximum** across all signals; confidence reflects how much
   structured input was available.

The optional OpenAI provider uses a constrained prompt and passes its output
through the **same guardrails**, and falls back to the deterministic engine on
any error — so triage is always available and always scrubbed.

## Sources

Guidance content is derived from widely-recognized public first-aid guidance:

- **American Heart Association (AHA)** — CPR, choking, cardiac, stroke
- **American Red Cross (ARC)** — bleeding, burns, fractures, seizures, and more
- **World Health Organization (WHO)** — poisoning, snake bite, environmental,
  pediatric, obstetric

Each topic in `guidance.data.ts` records its source attribution.

## Required before real-world use

This repository is an engineering implementation with conservative safeguards.
Before it is used to guide care for a real person, it requires:

- [ ] **Clinical validation** — review and sign-off of all guidance content and
      triage severity rules by qualified medical professionals for the target
      region and protocols.
- [ ] **Localization** of emergency numbers, protocols, and language.
- [ ] **Regulatory review** — depending on jurisdiction and claims, software
      that influences clinical decisions may be regulated as a medical device.
- [ ] **Legal review** — liability, consent, disclaimers, and data-protection
      (see [`../SECURITY.md`](../SECURITY.md)).

The disclaimers surfaced throughout the app are a floor, not a substitute for
the above.
