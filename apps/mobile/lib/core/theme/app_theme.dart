import 'package:flutter/material.dart';

/// Material 3 theme with an emergency-forward palette. Both light and dark
/// are derived from a single seed so components stay consistent.
class AppTheme {
  static const Color emergencyRed = Color(0xFFE53935);
  static const Color safeGreen = Color(0xFF2E7D32);

  static ThemeData light() => _base(Brightness.light);
  static ThemeData dark() => _base(Brightness.dark);

  static ThemeData _base(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(
      seedColor: emergencyRed,
      brightness: brightness,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scheme.surface,
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        centerTitle: true,
        elevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        filled: true,
      ),
      // NOTE: the CardTheme/CardThemeData type changed across Flutter versions,
      // so we rely on the Material 3 default card styling rather than pin a type.
    );
  }

  /// Severity → color mapping used across triage/incident UI.
  static Color severityColor(String severity, ColorScheme scheme) {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return const Color(0xFFB71C1C);
      case 'HIGH':
        return emergencyRed;
      case 'MEDIUM':
        return const Color(0xFFF9A825);
      case 'LOW':
        return safeGreen;
      default:
        return scheme.primary;
    }
  }
}
