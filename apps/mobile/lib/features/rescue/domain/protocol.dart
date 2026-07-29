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

  const RescueProtocol({
    required this.id,
    required this.title,
    required this.kind,
    required this.intro,
    required this.steps,
    required this.severity,
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

  static const all = [cpr, choking, bleeding, recovery];

  static RescueProtocol byId(String id) =>
      all.firstWhere((p) => p.id == id, orElse: () => cpr);
}
