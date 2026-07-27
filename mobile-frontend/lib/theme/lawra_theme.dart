import 'package:flutter/material.dart';

class LawraColors {
  static const green = Color(0xFF1DBA53);
  static const cyan = Color(0xFF21B2DB);
  static const textDark = Color(0xFF33363D);
  static const textMuted = Color(0xFF80868D);
  static const lightBg = Color(0xFFF3F3F3);
  static const white = Color(0xFFFFFFFF);
  static const cardBg = Color(0xFFFFFFFF);
  static const borderLight = Color(0xFFE7E7E7);
  static const destructive = Color(0xFFE53935);
  static const approve = Color(0xFF1DBA53);
  static const warning = Color(0xFFFFA726);
  static const info = Color(0xFF21B2DB);
  static const darkOverlay = Color(0x80000000);
}

ThemeData buildLawraTheme() {
  return ThemeData(
    useMaterial3: false,
    fontFamily: 'Roboto',
    scaffoldBackgroundColor: LawraColors.lightBg,
    primaryColor: LawraColors.green,
    colorScheme: ColorScheme.fromSeed(
      seedColor: LawraColors.green,
      primary: LawraColors.green,
      secondary: LawraColors.cyan,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: LawraColors.cardBg,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: LawraColors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: BorderSide(color: LawraColors.green.withOpacity(0.4)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: BorderSide(color: LawraColors.green.withOpacity(0.4)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: LawraColors.green, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      labelStyle: const TextStyle(color: LawraColors.textMuted),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: LawraColors.green,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
        elevation: 0,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: LawraColors.green,
      unselectedItemColor: Color(0xFF9E9E9E),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
  );
}