import { Injectable } from '@nestjs/common';
import { Severity } from '@prisma/client';
import {
  TriageInput,
  TriageProvider,
  TriageResult,
  TRIAGE_DISCLAIMER,
} from '../triage.types';
import { scrubActions } from '../triage.guardrails';

const ENGINE_VERSION = 'mock-rules-1.0.0';

interface Rule {
  id: string;
  // Keywords matched against complaint/symptoms/freeText (lowercased).
  keywords: string[];
  severity: Severity;
  facility?: string;
  actions: string[];
}

/**
 * Deterministic, rule-based triage grounded in widely-recognized emergency
 * red-flags (AHA / Red Cross / WHO first-aid guidance). It classifies severity
 * and offers first-aid steps — it does NOT diagnose or prescribe.
 *
 * Design: physiologic red-flags (airway/breathing/consciousness/bleeding) drive
 * the floor severity; keyword rules add condition-specific first-aid guidance
 * and facility routing. The two are combined by taking the max severity.
 */
@Injectable()
export class MockTriageProvider implements TriageProvider {
  readonly name = 'mock' as const;

  private readonly rules: Rule[] = [
    {
      // Life-threatening phrases spoken/typed in free text (voice assist relies
      // on this since it has no structured vitals flags).
      id: 'not-breathing-text',
      keywords: ['not breathing', 'stopped breathing', 'no breathing', 'cannot breathe', "can't breathe", 'not responsive to breathing'],
      severity: Severity.CRITICAL,
      facility: 'GENERAL',
      actions: [
        'Call your local emergency number now.',
        'If the person is not breathing normally, begin CPR immediately if you are able (push hard and fast on the center of the chest ~100–120/min).',
        'If an AED is available and the person is unresponsive, follow its voice prompts.',
      ],
    },
    {
      id: 'unconscious-text',
      keywords: ['unconscious', 'unresponsive', 'not responding', 'passed out and wont wake', "won't wake up", 'collapsed and not', 'no pulse'],
      severity: Severity.CRITICAL,
      facility: 'GENERAL',
      actions: [
        'Call your local emergency number now.',
        'Check for normal breathing. If absent, begin CPR if you are able.',
        'If they are breathing, place them in the recovery position (on their side).',
      ],
    },
    {
      id: 'cardiac',
      keywords: ['chest pain', 'chest tightness', 'heart attack', 'crushing chest', 'left arm pain'],
      severity: Severity.CRITICAL,
      facility: 'CARDIAC',
      actions: [
        'Call your local emergency number now.',
        'Help the person sit down, rest, and stay calm.',
        'Loosen tight clothing.',
        'If they become unresponsive and are not breathing normally, begin CPR (push hard and fast on the center of the chest ~100–120/min).',
        'If an AED is available and the person is unresponsive, follow the AED voice prompts.',
      ],
    },
    {
      id: 'stroke',
      keywords: ['face droop', 'slurred speech', 'weakness one side', 'stroke', 'numb arm', 'confusion speech'],
      severity: Severity.CRITICAL,
      facility: 'STROKE',
      actions: [
        'Call emergency services immediately — note the time symptoms started.',
        'Use FAST: Face drooping, Arm weakness, Speech difficulty, Time to call.',
        'Keep the person still and reassure them.',
        'Do not give food or drink.',
      ],
    },
    {
      id: 'choking',
      keywords: ['choking', 'cannot breathe', "can't breathe", 'airway blocked', 'something stuck throat'],
      severity: Severity.CRITICAL,
      facility: 'GENERAL',
      actions: [
        'If the person cannot cough, speak, or breathe, call emergency services.',
        'Give up to 5 back blows between the shoulder blades with the heel of your hand.',
        'Follow with up to 5 abdominal thrusts (Heimlich) for adults/children over 1 year.',
        'Alternate back blows and abdominal thrusts until the object clears or help arrives.',
      ],
    },
    {
      id: 'severe-bleeding',
      keywords: ['heavy bleeding', 'spurting blood', 'deep cut', 'severe bleeding', 'blood loss'],
      severity: Severity.HIGH,
      facility: 'TRAUMA_CENTER',
      actions: [
        'Call emergency services for severe bleeding.',
        'Apply firm, direct pressure to the wound with a clean cloth or dressing.',
        'Keep pressure continuous; add more cloth on top if it soaks through.',
        'If possible, raise the injured area above the level of the heart.',
      ],
    },
    {
      id: 'burn',
      keywords: ['burn', 'scald', 'burned', 'fire injury'],
      severity: Severity.HIGH,
      facility: 'BURN',
      actions: [
        'Cool the burn under cool (not ice-cold) running water for at least 20 minutes.',
        'Remove jewelry/clothing near the burn unless stuck to the skin.',
        'Cover loosely with a clean, non-fluffy cloth or cling film.',
        'Seek emergency care for large, deep, facial, or airway burns.',
      ],
    },
    {
      id: 'seizure',
      keywords: ['seizure', 'convulsion', 'fitting', 'shaking uncontrollably'],
      severity: Severity.HIGH,
      facility: 'GENERAL',
      actions: [
        'Clear the area of hard or sharp objects and cushion the head.',
        'Do not restrain the person or put anything in their mouth.',
        'Time the seizure. Call emergency services if it lasts over 5 minutes or repeats.',
        'After it stops, roll them onto their side (recovery position).',
      ],
    },
    {
      id: 'snake-bite',
      keywords: ['snake bite', 'snakebite', 'bitten by snake'],
      severity: Severity.HIGH,
      facility: 'GENERAL',
      actions: [
        'Call emergency services and keep the person calm and still.',
        'Keep the bitten limb still and below heart level.',
        'Remove rings/watches near the bite in case of swelling.',
        'Do NOT cut the wound, suck the venom, or apply a tourniquet.',
      ],
    },
    {
      id: 'poisoning',
      keywords: ['poison', 'overdose', 'swallowed chemical', 'ingested'],
      severity: Severity.HIGH,
      facility: 'GENERAL',
      actions: [
        'Call emergency services or your poison control center.',
        'Do not make the person vomit unless told to by professionals.',
        'If you know the substance, keep the container to show responders.',
      ],
    },
    {
      id: 'fracture',
      keywords: ['broken bone', 'fracture', 'bone sticking', 'deformed limb'],
      severity: Severity.MEDIUM,
      facility: 'TRAUMA_CENTER',
      actions: [
        'Keep the injured area still — do not try to straighten it.',
        'Support the limb with padding; immobilize above and below the injury.',
        'Apply a cold pack wrapped in cloth to reduce swelling.',
        'Seek medical care.',
      ],
    },
    {
      id: 'faint',
      keywords: ['fainted', 'dizzy', 'lightheaded', 'passed out briefly'],
      severity: Severity.MEDIUM,
      actions: [
        'Lay the person down and raise their legs slightly.',
        'Loosen tight clothing and ensure fresh air.',
        'If they do not recover quickly, call emergency services.',
      ],
    },
  ];

  async assess(input: TriageInput): Promise<TriageResult> {
    const haystack = [
      input.chiefComplaint,
      input.freeText ?? '',
      ...(input.symptoms ?? []),
    ]
      .join(' ')
      .toLowerCase();

    // 1. Keyword rule matching.
    const matched = this.rules.filter((r) => r.keywords.some((k) => haystack.includes(k)));

    // 2. Physiologic red-flag floor.
    const redFlags: { severity: Severity; action: string }[] = [];
    if (input.isBreathing === false) {
      redFlags.push({
        severity: Severity.CRITICAL,
        action:
          'Not breathing normally: call emergency services and begin CPR immediately if trained.',
      });
    }
    if (input.isConscious === false) {
      redFlags.push({
        severity: Severity.CRITICAL,
        action:
          'Unresponsive: call emergency services. If breathing, place in the recovery position.',
      });
    }
    if (input.hasBleeding === true) {
      redFlags.push({
        severity: Severity.HIGH,
        action: 'Bleeding present: apply firm direct pressure with a clean cloth.',
      });
    }

    // 3. Combine severities (take the max).
    const severities = [
      ...matched.map((r) => r.severity),
      ...redFlags.map((f) => f.severity),
    ];
    const severity = this.maxSeverity(severities);

    // 4. Assemble actions (dedup, keep order), always-on guidance last.
    const actionSet = new Set<string>();
    redFlags.forEach((f) => actionSet.add(f.action));
    matched.forEach((r) => r.actions.forEach((a) => actionSet.add(a)));
    if (actionSet.size === 0) {
      actionSet.add('Stay calm and keep the person comfortable.');
      actionSet.add('Monitor their breathing and responsiveness.');
      actionSet.add('If the situation worsens, call your local emergency number.');
    }

    const { actions } = scrubActions([...actionSet]);

    // 5. Confidence: how much signal did we actually have?
    const confidence = this.confidence(input, matched.length, redFlags.length);

    // 6. Facility suggestion — first matched rule with a facility, else by severity.
    const suggestedFacility =
      matched.find((r) => r.facility)?.facility ??
      (severity === Severity.CRITICAL ? 'GENERAL' : undefined);

    return {
      severity,
      confidence,
      chiefComplaint: input.chiefComplaint,
      isConscious: input.isConscious,
      isBreathing: input.isBreathing,
      hasBleeding: input.hasBleeding,
      patientAge: input.patientAge,
      symptoms: input.symptoms ?? [],
      recommendedActions: actions,
      suggestedFacility,
      disclaimer: TRIAGE_DISCLAIMER,
      engineVersion: ENGINE_VERSION,
      provider: this.name,
      rawModel: { matchedRules: matched.map((r) => r.id), redFlags: redFlags.length },
    };
  }

  private maxSeverity(list: Severity[]): Severity {
    const order = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];
    if (list.length === 0) return Severity.LOW;
    return list.reduce((max, s) => (order.indexOf(s) > order.indexOf(max) ? s : max), Severity.LOW);
  }

  private confidence(input: TriageInput, matches: number, redFlags: number): number {
    let signals = 0;
    let known = 0;
    for (const v of [input.isConscious, input.isBreathing, input.hasBleeding]) {
      signals += 1;
      if (v !== undefined) known += 1;
    }
    if (input.chiefComplaint?.trim()) known += 1;
    signals += 1;
    if (typeof input.patientAge === 'number') known += 1;
    signals += 1;

    const coverage = known / signals; // 0..1
    const ruleBoost = Math.min(0.2, (matches + redFlags) * 0.1);
    return Math.min(0.98, Math.round((0.5 + coverage * 0.35 + ruleBoost) * 100) / 100);
  }
}
