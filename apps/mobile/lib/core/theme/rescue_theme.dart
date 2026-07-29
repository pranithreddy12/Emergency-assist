import 'package:flutter/material.dart';

/// "Calm under pressure" design language.
///
/// Dark, high-contrast, minimal chrome. One unmistakable action per screen.
/// Red is *reserved* for the single critical action — never decoration — so it
/// always means "do this now". Green means "they're safe / good".
class Rescue {
  // Surfaces
  static const bg = Color(0xFF0B0F14);
  static const surface = Color(0xFF141B23);
  static const surfaceHi = Color(0xFF1E2732);
  static const line = Color(0xFF2A3542);

  // Text
  static const text = Color(0xFFEAF0F6);
  static const muted = Color(0xFF8A97A6);

  // Semantic
  static const critical = Color(0xFFFF3B30); // the one action
  static const pulse = Color(0xFFFF2D55); // CPR beat
  static const go = Color(0xFF30D158); // safe / breathing
  static const calm = Color(0xFF0A84FF); // secondary / info
  static const warn = Color(0xFFFFD60A);

  static ThemeData theme() {
    const scheme = ColorScheme.dark(
      surface: bg,
      primary: critical,
      secondary: calm,
      error: critical,
      onSurface: text,
    );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    return base.copyWith(
      scaffoldBackgroundColor: bg,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: text,
        elevation: 0,
        centerTitle: false,
      ),
      textTheme: base.textTheme
          .apply(bodyColor: text, displayColor: text)
          .copyWith(
            displayLarge: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -1),
            headlineMedium: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
            titleLarge: const TextStyle(fontWeight: FontWeight.w700),
          ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: surfaceHi,
        contentTextStyle: TextStyle(color: text),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
