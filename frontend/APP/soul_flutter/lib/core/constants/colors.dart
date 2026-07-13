import 'package:flutter/material.dart';

/// SOUL App Color Palette - mirrors React Native constants/colors.ts
class SoulColors {
  SoulColors._();

  // Primary
  static const Color primary = Color(0xFF7C3AED);
  static const Color primaryDark = Color(0xFF6D28D9);
  static const Color primaryDeep = Color(0xFF5B21B6);
  static const Color primaryLight = Color(0xFFA855F7);

  // Accent / Teal
  static const Color teal = Color(0xFF0F766E);
  static const Color tealLight = Color(0xFF14B8A6);
  static const Color tealBg = Color(0xFFCCFBF1);

  // Backgrounds
  static const Color bgMain = Color(0xFFF5F3FF);
  static const Color bgWhite = Color(0xFFFFFFFF);
  static const Color bgCard = Color(0xFFF8FAFC);
  static const Color bgPurpleSoft = Color(0xFFF3E8FF);
  static const Color bgViolet = Color(0xFFEDE9FE);

  // Borders
  static const Color border = Color(0xFFE9E2FF);
  static const Color borderLight = Color(0xFFF1F5F9);
  static const Color borderSlate = Color(0xFFE2E8F0);

  // Text
  static const Color textDark = Color(0xFF111827);
  static const Color textBody = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF64748B);
  static const Color textFaint = Color(0xFF94A3B8);
  static const Color textSlate = Color(0xFF475569);

  // Status
  static const Color error = Color(0xFFDC2626);
  static const Color errorBg = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFCA5A5);
  static const Color errorLight = Color(0xFFFEE2E2);

  static const Color success = Color(0xFF16A34A);
  static const Color successBg = Color(0xFFF0FDF4);

  // Mood colors
  static const Color moodGreen = Color(0xFF22C55E);
  static const Color moodBlue = Color(0xFF3B82F6);
  static const Color moodYellow = Color(0xFFF59E0B);
  static const Color moodOrange = Color(0xFFF97316);
  static const Color moodRed = Color(0xFFEF4444);

  // Gradient helpers
  static const List<Color> primaryGradient = [primary, primaryDark];
  static const List<Color> heroGradient = [primary, primaryLight, tealLight];
  static const List<Color> cardGradient = [bgPurpleSoft, bgWhite];

  // Shadows
  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: const Color(0xFF0F172A).withOpacity(0.05),
      blurRadius: 22,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> primaryShadow = [
    BoxShadow(
      color: primary.withOpacity(0.28),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> subtleShadow = [
    BoxShadow(
      color: const Color(0xFF0F172A).withOpacity(0.04),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
}
