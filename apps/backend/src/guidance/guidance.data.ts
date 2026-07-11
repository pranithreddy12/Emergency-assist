/**
 * Evidence-based first-aid guidance content (AHA / American Red Cross / WHO).
 * This is guidance for bystanders — it never diagnoses or prescribes medication.
 * Content is static and versioned so the mobile client can bundle it for offline use.
 */

export const GUIDANCE_VERSION = '1.0.0';

export interface GuidanceStep {
  order: number;
  text: string;
}

export interface GuidanceTopic {
  slug: string;
  title: string;
  category: 'cardiac' | 'airway' | 'trauma' | 'environmental' | 'neuro' | 'toxic' | 'obstetric' | 'pediatric';
  icon: string; // material icon name for the client
  summary: string;
  steps: GuidanceStep[];
  donts: string[];
  callEmergencyIf: string[];
  sources: string[];
}

function steps(...lines: string[]): GuidanceStep[] {
  return lines.map((text, i) => ({ order: i + 1, text }));
}

const AHA = 'American Heart Association';
const ARC = 'American Red Cross';
const WHO = 'World Health Organization';

export const GUIDANCE_TOPICS: GuidanceTopic[] = [
  {
    slug: 'cpr',
    title: 'CPR (Adult)',
    category: 'cardiac',
    icon: 'favorite',
    summary: 'Hands-only CPR for an unresponsive adult who is not breathing normally.',
    steps: steps(
      'Check responsiveness — tap the shoulders and shout. If no response, call emergency services (or have someone call) and get an AED if available.',
      'Place the person on their back on a firm, flat surface.',
      'Kneel beside them. Put the heel of one hand in the center of the chest; place the other hand on top and interlock fingers.',
      'Push hard and fast: compress at least 5 cm (2 inches) deep, at a rate of 100–120 compressions per minute.',
      'Let the chest fully recoil between compressions. Minimize interruptions.',
      'Continue until the person shows signs of life, an AED is ready, or trained help takes over.',
      'If an AED arrives, turn it on and follow its spoken prompts.',
    ),
    donts: [
      'Do not delay compressions to check for a pulse if you are untrained.',
      'Do not lean on the chest between compressions.',
    ],
    callEmergencyIf: ['The person is unresponsive and not breathing normally — call immediately.'],
    sources: [AHA],
  },
  {
    slug: 'choking',
    title: 'Choking (Adult & Child >1yr)',
    category: 'airway',
    icon: 'air',
    summary: 'Clearing a blocked airway when someone cannot cough, speak, or breathe.',
    steps: steps(
      'Ask "Are you choking?" If they can cough or speak, encourage them to keep coughing.',
      'If they cannot cough, speak, or breathe, call for emergency help.',
      'Give up to 5 back blows between the shoulder blades with the heel of your hand.',
      'If unresolved, give up to 5 abdominal thrusts (Heimlich): stand behind them, fist above the navel, and pull sharply inward and upward.',
      'Alternate 5 back blows and 5 abdominal thrusts until the object clears.',
      'If the person becomes unresponsive, lower them to the ground and begin CPR.',
    ),
    donts: [
      'Do not perform abdominal thrusts on infants under 1 year — use back blows and chest thrusts instead.',
      'Do not do a blind finger sweep in the mouth.',
    ],
    callEmergencyIf: ['The person cannot breathe, becomes weak, or loses consciousness.'],
    sources: [ARC, AHA],
  },
  {
    slug: 'heart-attack',
    title: 'Heart Attack',
    category: 'cardiac',
    icon: 'monitor_heart',
    summary: 'Recognizing and responding to signs of a heart attack.',
    steps: steps(
      'Call emergency services immediately — this is time-critical.',
      'Help the person sit down, rest, and stay calm. Loosen tight clothing.',
      'Keep them still and reassure them while waiting for help.',
      'If they become unresponsive and are not breathing normally, begin CPR.',
      'If an AED is available and the person is unresponsive, follow its prompts.',
    ),
    donts: [
      'Do not let the person drive themselves to hospital.',
      'Do not give any medication unless directed by emergency professionals.',
    ],
    callEmergencyIf: [
      'Chest pain or pressure, pain spreading to the arm/jaw/back, shortness of breath, cold sweat, or nausea.',
    ],
    sources: [AHA],
  },
  {
    slug: 'stroke',
    title: 'Stroke',
    category: 'neuro',
    icon: 'psychology',
    summary: 'Use FAST to spot a stroke and act fast.',
    steps: steps(
      'Check FAST — Face drooping, Arm weakness, Speech difficulty, Time to call emergency services.',
      'Note the exact time symptoms started — responders need this.',
      'Keep the person still, calm, and comfortable.',
      'If unresponsive but breathing, place them in the recovery position.',
    ),
    donts: [
      'Do not give food, drink, or medication — swallowing may be impaired.',
      'Do not let symptoms "wait and see" — call immediately.',
    ],
    callEmergencyIf: ['Any one FAST sign is present, even if it goes away.'],
    sources: [AHA, ARC],
  },
  {
    slug: 'bleeding',
    title: 'Severe Bleeding',
    category: 'trauma',
    icon: 'bloodtype',
    summary: 'Controlling heavy external bleeding.',
    steps: steps(
      'Call emergency services for severe bleeding.',
      'Apply firm, direct pressure to the wound with a clean cloth or dressing.',
      'Keep pressure continuous. If blood soaks through, add more cloth on top — do not remove the first layer.',
      'If possible, raise the injured area above the level of the heart.',
      'If bleeding is life-threatening from a limb and does not stop, a tourniquet applied by a trained person may be used as a last resort.',
    ),
    donts: [
      'Do not remove large embedded objects — pad around them instead.',
      'Do not keep lifting the dressing to check the wound.',
    ],
    callEmergencyIf: ['Bleeding is heavy, spurting, or does not stop with pressure.'],
    sources: [ARC],
  },
  {
    slug: 'burns',
    title: 'Burns',
    category: 'trauma',
    icon: 'local_fire_department',
    summary: 'First aid for thermal burns and scalds.',
    steps: steps(
      'Stop the burning — remove the person from the source of heat.',
      'Cool the burn under cool (not ice-cold) running water for at least 20 minutes.',
      'Remove jewelry and clothing near the burn, unless stuck to the skin.',
      'Cover loosely with a clean, non-fluffy cloth or cling film.',
      'Keep the person warm and treat for shock if needed.',
    ),
    donts: [
      'Do not apply ice, butter, toothpaste, or ointments.',
      'Do not burst blisters.',
    ],
    callEmergencyIf: [
      'The burn is large, deep, on the face/hands/genitals, or involves the airway (smoke, soot, hoarse voice).',
    ],
    sources: [ARC, WHO],
  },
  {
    slug: 'electric-shock',
    title: 'Electric Shock',
    category: 'environmental',
    icon: 'electric_bolt',
    summary: 'Responding to electrical injury safely.',
    steps: steps(
      'Do not touch the person if they are still in contact with the electrical source.',
      'Turn off the power at the source if you can do so safely.',
      'Once safe, call emergency services.',
      'Check breathing. If not breathing normally, begin CPR.',
      'Cool any burns with running water and cover loosely.',
    ),
    donts: [
      'Do not touch a person connected to a live current with bare hands.',
      'Do not move them unnecessarily if a fall may have caused a spinal injury.',
    ],
    callEmergencyIf: ['High-voltage contact, burns, unconsciousness, or abnormal breathing/heartbeat.'],
    sources: [ARC],
  },
  {
    slug: 'poisoning',
    title: 'Poisoning',
    category: 'toxic',
    icon: 'science',
    summary: 'Suspected swallowed, inhaled, or absorbed poison.',
    steps: steps(
      'Call emergency services or your local poison control center.',
      'Identify the substance if you can, and keep the container to show responders.',
      'For inhaled poison, move the person to fresh air.',
      'For skin/eye contact, rinse with running water.',
      'If the person is unresponsive and not breathing normally, begin CPR.',
    ),
    donts: [
      'Do not make the person vomit unless a professional tells you to.',
      'Do not give anything to eat or drink unless directed.',
    ],
    callEmergencyIf: ['Any suspected poisoning, especially with drowsiness, vomiting, or trouble breathing.'],
    sources: [WHO, ARC],
  },
  {
    slug: 'snake-bite',
    title: 'Snake Bite',
    category: 'environmental',
    icon: 'pest_control',
    summary: 'First aid for a suspected venomous snake bite.',
    steps: steps(
      'Move away from the snake and keep the person calm and still.',
      'Call emergency services.',
      'Keep the bitten limb still and below heart level.',
      'Remove rings, watches, and tight clothing near the bite in case of swelling.',
      'Note the time of the bite and the snake\'s appearance if seen safely.',
    ),
    donts: [
      'Do not cut the wound or try to suck out venom.',
      'Do not apply a tourniquet or ice.',
      'Do not give the person alcohol or caffeine.',
    ],
    callEmergencyIf: ['Any suspected venomous bite, spreading pain/swelling, or difficulty breathing.'],
    sources: [WHO],
  },
  {
    slug: 'seizures',
    title: 'Seizures',
    category: 'neuro',
    icon: 'bolt',
    summary: 'Keeping a person safe during and after a seizure.',
    steps: steps(
      'Clear the area of hard or sharp objects and cushion the head.',
      'Time the seizure.',
      'Loosen anything tight around the neck.',
      'Once movements stop, gently roll them onto their side (recovery position).',
      'Stay with them and reassure them as they recover.',
    ),
    donts: [
      'Do not restrain the person.',
      'Do not put anything in their mouth.',
    ],
    callEmergencyIf: [
      'The seizure lasts over 5 minutes, repeats, or the person is injured, pregnant, or does not regain consciousness.',
    ],
    sources: [ARC],
  },
  {
    slug: 'fractures',
    title: 'Fractures',
    category: 'trauma',
    icon: 'healing',
    summary: 'Suspected broken bone.',
    steps: steps(
      'Keep the injured area still — support it in the position found.',
      'Immobilize the joint above and below the injury with padding.',
      'Apply a cold pack wrapped in cloth to reduce swelling.',
      'Treat any bleeding with direct pressure around (not on) protruding bone.',
      'Seek medical care.',
    ),
    donts: [
      'Do not try to straighten or push a bone back in.',
      'Do not move the person if a spinal injury is possible — wait for responders.',
    ],
    callEmergencyIf: ['Open fracture, deformed limb, loss of pulse/sensation, or suspected spine/neck injury.'],
    sources: [ARC],
  },
  {
    slug: 'drowning',
    title: 'Drowning',
    category: 'environmental',
    icon: 'pool',
    summary: 'Rescue and resuscitation after drowning.',
    steps: steps(
      'Get the person out of the water safely — do not put yourself at risk.',
      'Call emergency services.',
      'Check breathing. If not breathing normally, begin CPR (rescue breaths are especially important in drowning if you are trained).',
      'If breathing, place in the recovery position and keep them warm.',
    ),
    donts: [
      'Do not attempt a swimming rescue unless trained — reach or throw a flotation aid instead.',
      'Do not assume recovery — seek medical care even if they seem fine.',
    ],
    callEmergencyIf: ['Any drowning event, even a brief one, especially with coughing or trouble breathing afterward.'],
    sources: [ARC, WHO],
  },
  {
    slug: 'heat-stroke',
    title: 'Heat Stroke',
    category: 'environmental',
    icon: 'thermostat',
    summary: 'Life-threatening overheating.',
    steps: steps(
      'Call emergency services — heat stroke is a medical emergency.',
      'Move the person to a cool, shaded, or air-conditioned place.',
      'Remove excess clothing.',
      'Cool them rapidly: cool water on the skin, wet cloths, fanning, or cold packs to the neck, armpits, and groin.',
      'If fully alert, give small sips of cool water.',
    ),
    donts: [
      'Do not give fluids if the person is confused or unconscious.',
      'Do not give caffeinated or alcoholic drinks.',
    ],
    callEmergencyIf: ['High body temperature with confusion, hot/dry or profusely sweating skin, or collapse.'],
    sources: [ARC, WHO],
  },
  {
    slug: 'hypothermia',
    title: 'Hypothermia',
    category: 'environmental',
    icon: 'ac_unit',
    summary: 'Dangerously low body temperature.',
    steps: steps(
      'Call emergency services for moderate to severe hypothermia.',
      'Move the person somewhere warm and shielded from wind.',
      'Remove wet clothing and replace with dry layers or blankets, covering the head.',
      'Warm the center of the body first (chest, neck, groin).',
      'If alert, give warm, sweet, non-alcoholic drinks.',
    ),
    donts: [
      'Do not rub or massage the limbs.',
      'Do not use direct high heat (hot water, heating pads on bare skin).',
    ],
    callEmergencyIf: ['Shivering stops, confusion, slurred speech, drowsiness, or a weak pulse.'],
    sources: [ARC],
  },
  {
    slug: 'child-emergency',
    title: 'Child & Infant Emergency',
    category: 'pediatric',
    icon: 'child_care',
    summary: 'Key differences when helping a child or infant.',
    steps: steps(
      'Call emergency services for any serious child emergency.',
      'For an unresponsive infant not breathing normally, give CPR using 2 fingers on the chest, compressing about 4 cm deep.',
      'For choking in an infant under 1 year, alternate 5 back blows and 5 chest thrusts (never abdominal thrusts).',
      'Keep the child warm and comfort them; keep a caregiver present if possible.',
      'For high fever with a stiff neck, rash, or drowsiness, seek urgent care.',
    ),
    donts: [
      'Do not use adult abdominal thrusts on an infant.',
      'Do not leave a feverish or injured child unattended.',
    ],
    callEmergencyIf: ['Trouble breathing, unresponsiveness, seizure, severe dehydration, or a non-fading rash.'],
    sources: [AHA, WHO],
  },
  {
    slug: 'pregnancy-emergency',
    title: 'Pregnancy Emergency',
    category: 'obstetric',
    icon: 'pregnant_woman',
    summary: 'Warning signs and support during pregnancy emergencies.',
    steps: steps(
      'Call emergency services for any severe symptom.',
      'Help the person into a comfortable position — lying on the left side can help blood flow.',
      'Keep them calm and warm.',
      'If bleeding, note how much and keep them still while waiting for help.',
      'If birth is imminent, support the process gently and keep mother and baby warm — do not pull.',
    ),
    donts: [
      'Do not give medication.',
      'Do not have the person lie flat on their back for long in late pregnancy.',
    ],
    callEmergencyIf: [
      'Heavy bleeding, severe abdominal pain, severe headache with vision changes, seizures, or reduced baby movement.',
    ],
    sources: [WHO],
  },
];

export function findTopic(slug: string): GuidanceTopic | undefined {
  return GUIDANCE_TOPICS.find((t) => t.slug === slug);
}
