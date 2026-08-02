import 'package:flutter/material.dart';

/// A single coached step: one big instruction, a short detail, an icon, the
/// line spoken aloud, and an optional auto-advance duration.
class RescueStep {
  final String title;
  final String detail;
  final IconData icon;
  final String voice;
  final Duration? autoAdvance;

  const RescueStep({
    required this.title,
    required this.detail,
    required this.icon,
    required this.voice,
    this.autoAdvance,
  });
}

enum RescueKind { cpr, steps }

/// A choreographed protocol. `cpr` protocols drive the metronome coach;
/// `steps` protocols drive the step coach.
class RescueProtocol {
  final String id;
  final String title;
  final RescueKind kind;
  final String intro; // spoken on entry
  final List<RescueStep> steps;
  final String severity; // for the incident we log in the background
  final String cprSubtitle; // technique line shown on the metronome coach

  const RescueProtocol({
    required this.id,
    required this.title,
    required this.kind,
    required this.intro,
    required this.steps,
    required this.severity,
    this.cprSubtitle = 'center of the chest • 110 / min',
  });
}

/// Evidence-based, bystander-focused protocols (AHA / Red Cross).
/// These are coaching aids — they never diagnose or prescribe medication.
class Protocols {
  static const cpr = RescueProtocol(
    id: 'cpr',
    title: 'CPR',
    kind: RescueKind.cpr,
    severity: 'CRITICAL',
    intro:
        'Starting CPR. Put the heel of your hand in the center of the chest, other hand on top. '
        'Push hard and fast, straight down. Follow my beat.',
    steps: [], // the CPR coach is driven by the metronome, not step cards
  );

  static const choking = RescueProtocol(
    id: 'choking',
    title: 'Choking',
    kind: RescueKind.steps,
    severity: 'CRITICAL',
    intro: 'They are choking and cannot breathe. Stand behind them. I will guide each step.',
    steps: [
      RescueStep(
        icon: Icons.pan_tool,
        title: '5 firm back blows',
        detail: 'Lean them forward. Strike between the shoulder blades with the heel of your hand.',
        voice: 'Lean them forward and give five firm blows between the shoulder blades.',
      ),
      RescueStep(
        icon: Icons.compress,
        title: '5 abdominal thrusts',
        detail: 'Fist just above the navel, grasp with your other hand, pull sharply in and up.',
        voice: 'Now five abdominal thrusts. Fist above the navel, pull sharply inward and upward.',
      ),
      RescueStep(
        icon: Icons.repeat,
        title: 'Repeat until it clears',
        detail: 'Alternate 5 back blows and 5 thrusts. Keep going until the object comes out.',
        voice: 'Keep alternating five back blows and five thrusts until the object clears.',
      ),
      RescueStep(
        icon: Icons.favorite,
        title: 'If they go limp — start CPR',
        detail: 'If they become unresponsive, lower them down and begin chest compressions.',
        voice: 'If they become unresponsive, lower them down and start C P R.',
      ),
    ],
  );

  static const bleeding = RescueProtocol(
    id: 'bleeding',
    title: 'Severe bleeding',
    kind: RescueKind.steps,
    severity: 'HIGH',
    intro: 'Severe bleeding. We need to stop it now. Press directly on the wound and do not let go.',
    steps: [
      RescueStep(
        icon: Icons.front_hand,
        title: 'Press HARD — directly on the wound',
        detail: 'Use a cloth or your hands. Push firmly. Do not lift to check.',
        voice: 'Press hard, directly on the wound, with a cloth or your hands. Do not stop pressing.',
      ),
      RescueStep(
        icon: Icons.layers,
        title: 'Soaked through? Add more on top',
        detail: 'Do not remove the first cloth — pile more on and keep pressing.',
        voice: 'If blood soaks through, add more cloth on top and keep pressing.',
      ),
      RescueStep(
        icon: Icons.arrow_upward,
        title: 'Raise the injured area',
        detail: 'If you can, lift it above the level of the heart while keeping pressure on.',
        voice: 'If you can, raise the injured area above the heart while keeping pressure.',
      ),
      RescueStep(
        icon: Icons.timer,
        title: 'Keep pressure until help arrives',
        detail: 'Do not release. Reassure them and keep them warm.',
        voice: 'Keep the pressure on until help arrives. Keep them calm and warm.',
      ),
    ],
  );

  static const recovery = RescueProtocol(
    id: 'recovery',
    title: 'Recovery position',
    kind: RescueKind.steps,
    severity: 'HIGH',
    intro:
        'They are unresponsive but breathing. Let us roll them onto their side so they can breathe safely.',
    steps: [
      RescueStep(
        icon: Icons.accessibility_new,
        title: 'Kneel beside them',
        detail: 'Place the near arm out at a right angle, palm up.',
        voice: 'Kneel beside them. Place the arm nearest you out at a right angle.',
      ),
      RescueStep(
        icon: Icons.swap_horiz,
        title: 'Roll them toward you',
        detail: 'Far hand against their cheek; pull the far knee up and roll them onto their side.',
        voice: 'Bring their far hand to their cheek, lift the far knee, and roll them toward you.',
      ),
      RescueStep(
        icon: Icons.air,
        title: 'Open the airway',
        detail: 'Tilt the head back slightly so the airway stays clear. Check they are still breathing.',
        voice: 'Tilt the head back gently to keep the airway open. Make sure they are still breathing.',
      ),
      RescueStep(
        icon: Icons.visibility,
        title: 'Stay and watch their breathing',
        detail: 'If breathing stops, roll them onto their back and start CPR.',
        voice: 'Stay with them. If they stop breathing, roll them onto their back and start C P R.',
      ),
    ],
  );

  static const aedUse = RescueProtocol(
    id: 'aed',
    title: 'Using the AED',
    kind: RescueKind.steps,
    severity: 'CRITICAL',
    intro: 'The defibrillator is here. Keep doing compressions while I set it up. Turn the AED on now.',
    steps: [
      RescueStep(
        icon: Icons.power_settings_new,
        title: 'Turn it on — follow its voice',
        detail: 'Press the power button. From now on, do exactly what the AED tells you.',
        voice: 'Turn the A E D on and follow its spoken instructions.',
      ),
      RescueStep(
        icon: Icons.checkroom,
        title: 'Bare the chest',
        detail: 'Remove clothing. If the chest is wet, wipe it dry. Remove any medicine patches.',
        voice: 'Bare the chest. Wipe it dry if wet, and remove any patches.',
      ),
      RescueStep(
        icon: Icons.add_box,
        title: 'Stick the pads on',
        detail: 'Follow the pictures on the pads: one upper-right chest, one on the lower-left ribs.',
        voice: 'Stick the pads on as shown: one upper right chest, one lower left side.',
      ),
      RescueStep(
        icon: Icons.pan_tool,
        title: 'Stand clear while it analyzes',
        detail: 'Make sure nobody is touching the person while the AED checks the heart.',
        voice: 'Stand clear. Make sure no one is touching them while it analyzes.',
      ),
      RescueStep(
        icon: Icons.bolt,
        title: 'If it says SHOCK — clear, then press it',
        detail: 'Shout "clear", check nobody is touching, then press the flashing shock button.',
        voice: 'If it says shock, shout clear, make sure no one is touching, then press the shock button.',
      ),
      RescueStep(
        icon: Icons.favorite,
        title: 'Resume CPR right away',
        detail: 'Start compressions again immediately. The AED will re-check about every 2 minutes.',
        voice: 'Start compressions again right away. The A E D will re-check every two minutes.',
      ),
    ],
  );

  // ── Infant variants (under 1 year) — technique differs from adults ──

  static const infantCpr = RescueProtocol(
    id: 'infant-cpr',
    title: 'Infant CPR',
    kind: RescueKind.cpr,
    severity: 'CRITICAL',
    cprSubtitle: '2 fingers, just below the nipple line • gentle, ~4 cm • 110 / min',
    intro:
        'Infant CPR. Use two fingers in the center of the chest, just below the nipple line. '
        'Press about one and a half centimeters, gently but fast. Follow my beat.',
    steps: [],
  );

  static const infantChoking = RescueProtocol(
    id: 'infant-choking',
    title: 'Infant choking',
    kind: RescueKind.steps,
    severity: 'CRITICAL',
    intro:
        'The baby is choking. Never do abdominal thrusts on a baby. Sit down and support them '
        'along your forearm. I will guide each step.',
    steps: [
      RescueStep(
        icon: Icons.child_care,
        title: 'Face down — 5 back blows',
        detail: 'Lay them face-down along your forearm, head low, supporting the jaw. Give 5 blows between the shoulder blades with the heel of your hand.',
        voice: 'Lay the baby face down along your forearm, head lower than the body. Give five back blows between the shoulder blades.',
      ),
      RescueStep(
        icon: Icons.flip,
        title: 'Turn over — 5 chest thrusts',
        detail: 'Turn them face-up. Two fingers on the center of the chest, just below the nipple line. Give 5 sharp thrusts. NO abdominal thrusts.',
        voice: 'Turn the baby face up. With two fingers on the center of the chest, give five sharp chest thrusts. Never push on the belly.',
      ),
      RescueStep(
        icon: Icons.repeat,
        title: 'Repeat until it clears',
        detail: 'Alternate 5 back blows and 5 chest thrusts. Check the mouth between rounds — only remove something you can clearly see.',
        voice: 'Keep alternating five back blows and five chest thrusts until the object comes out.',
      ),
      RescueStep(
        icon: Icons.favorite,
        title: 'If they go limp — start infant CPR',
        detail: 'If the baby becomes unresponsive, start infant CPR: two fingers, center of the chest, hard and fast.',
        voice: 'If the baby stops responding, start infant C P R with two fingers on the center of the chest.',
      ),
    ],
  );

  static const all = [cpr, choking, bleeding, recovery, aedUse, infantCpr, infantChoking];

  static RescueProtocol byId(String id) =>
      all.firstWhere((p) => p.id == id, orElse: () => cpr);
}
