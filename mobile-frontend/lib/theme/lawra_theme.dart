import 'package:flutter/material.dart';

class LawraColors {
  static const green = Color(0xFF1DBA53);
  static const cyan = Color(0xFF21B2DB);
  static const textDark = Color(0xFF33363D);
  static const textMuted = Color(0xFF80868D);
  static const lightBg = Color(0xFFF3F3F3);
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
      backgroundColor: LawraColors.green,
      foregroundColor: Colors.white,
      elevation: 1,
    ),
  );
}
