/**
 * "What's happening?" emergency recognizer (ROADMAP Phase 7).
 *
 * A fast branching decision tree for a panicked bystander: pick what they see,
 * answer at most one follow-up, and land on the right first-aid protocol with a
 * single immediate action. It NEVER diagnoses or prescribes — every terminal
 * routes to an existing, source-cited guidance topic (see guidance.data.ts).
 *
 * Static and dependency-free so the mobile client can bundle it for offline use,
 * exactly like the guidance content.
 */
import { Severity } from '@prisma/client';

export const RECOGNIZER_VERSION = '1.0.0';

/** A terminal: the protocol to open and the one thing to do right now. */
export interface RecognizerRoute {
  guidanceSlug: string; // must match a slug in GUIDANCE_TOPICS
  severity: Severity;
  callEmergency: boolean; // true = dial the local emergency number immediately
  immediateAction: string; // one imperative line — no diagnosis, no medication
}

export interface RecognizerOption {
  label: string; // what the bystander taps
  next?: string; // id of a follow-up node
  route?: RecognizerRoute; // or a terminal (exactly one of next/route)
}

export interface RecognizerNode {
  id: string;
  question: string;
  options: RecognizerOption[];
}

export const ROOT_ID = 'start';

export const RECOGNIZER_NODES: RecognizerNode[] = [
  {
    id: ROOT_ID,
    question: "What's happening? Tap the closest match.",
    options: [
      { label: 'Collapsed — not breathing normally or no response', next: 'collapsed-age' },
      { label: "Choking — can't breathe, speak, or cough", next: 'choking-age' },
      {
        label: 'Heavy bleeding that will not stop',
        route: {
          guidanceSlug: 'bleeding',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now and press hard and continuously on the wound with a clean cloth.',
        },
      },
      {
        label: 'Chest pain or pressure',
        route: {
          guidanceSlug: 'heart-attack',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now, help the person sit down and rest, and stay with them.',
        },
      },
      {
        label: 'Face droops, arm is weak, or speech is slurred',
        route: {
          guidanceSlug: 'stroke',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now and note the exact time the symptoms started.',
        },
      },
      {
        label: 'Seizure / convulsions',
        route: {
          guidanceSlug: 'seizures',
          severity: Severity.HIGH,
          callEmergency: false,
          immediateAction:
            'Clear hard objects away, cushion the head, and time how long the seizure lasts.',
        },
      },
      {
        label: 'Severe allergic reaction — swelling, hives, or trouble breathing',
        route: {
          guidanceSlug: 'anaphylaxis',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now and help them use their own adrenaline auto-injector (EpiPen) if they have one.',
        },
      },
      {
        label: 'Swallowed, inhaled, or took too much of something',
        route: {
          guidanceSlug: 'poisoning',
          severity: Severity.HIGH,
          callEmergency: true,
          immediateAction:
            'Call emergency services or poison control and keep the container to show responders.',
        },
      },
      {
        label: 'Burn or scald',
        route: {
          guidanceSlug: 'burns',
          severity: Severity.MEDIUM,
          callEmergency: false,
          immediateAction:
            'Cool the burn under cool running water for at least 20 minutes and remove tight items nearby.',
        },
      },
      {
        label: 'Pulled from water / drowning',
        route: {
          guidanceSlug: 'drowning',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now and check breathing — if not breathing normally, start CPR.',
        },
      },
    ],
  },
  {
    id: 'collapsed-age',
    question: 'How old is the person?',
    options: [
      {
        label: 'Adult or child older than 1 year',
        route: {
          guidanceSlug: 'cpr',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now and push hard and fast in the center of the chest, about twice a second.',
        },
      },
      {
        label: 'Baby under 1 year',
        route: {
          guidanceSlug: 'child-emergency',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Call emergency services now and give infant CPR using 2 fingers in the center of the chest.',
        },
      },
    ],
  },
  {
    id: 'choking-age',
    question: 'How old is the person?',
    options: [
      {
        label: 'Adult or child older than 1 year',
        route: {
          guidanceSlug: 'choking',
          severity: Severity.CRITICAL,
          callEmergency: true,
          immediateAction:
            'Give up to 5 back blows between the shoulder blades, then up to 5 abdominal thrusts.',
        },
      },
      {
        label: 'Baby under 1 year',
        route: {
          guidanceSlug: 'child-emergency',
          severity: Severity.CRITICAL,
          callEmergency: true,
          // Infants NEVER get abdominal thrusts — back blows + chest thrusts only.
          // Keep the phrase "abdominal thrust" out of an infant action entirely so
          // the safety check stays a simple, strong invariant.
          immediateAction:
            'Alternate 5 back blows and 5 chest thrusts — never use the adult Heimlich on a baby.',
        },
      },
    ],
  },
];

export function findNode(id: string): RecognizerNode | undefined {
  return RECOGNIZER_NODES.find((n) => n.id === id);
}
