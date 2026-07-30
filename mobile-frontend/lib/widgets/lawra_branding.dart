import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/lawra_theme.dart';

/// Brand gradient used on splash, buttons, and the wordmark.
const lawraBrandGradient = LinearGradient(
  begin: Alignment.centerLeft,
  end: Alignment.centerRight,
  colors: [Color(0xFF20A4C4), LawraColors.green],
);

const lawraSplashGradient = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [Color(0xFF20A4C4), LawraColors.green],
);

const lawraWordmarkGradient = LinearGradient(
  begin: Alignment.centerLeft,
  end: Alignment.centerRight,
  colors: [Color(0xFF20A4C4), LawraColors.green],
);

class LawraWordmark extends StatelessWidget {
  const LawraWordmark({
    super.key,
    this.fontSize = 52,
    this.white = false,
    this.gradient = false,
  });

  final double fontSize;
  final bool white;
  final bool gradient;

  TextStyle _baseStyle() {
    return GoogleFonts.comfortaa(
      fontSize: fontSize,  
      fontWeight: FontWeight.w500,
      letterSpacing: -0.5,
    );
  }

  @override
  Widget build(BuildContext context) {
    final style = _baseStyle().copyWith(
      color: white ? Colors.white : LawraColors.textDark,
    );

    if (gradient && !white) {
      return ShaderMask(
        shaderCallback: (bounds) => lawraWordmarkGradient.createShader(
          Rect.fromLTWH(0, 0, bounds.width, bounds.height),
        ),
        child: Text('lawra', style: style.copyWith(color: Colors.white)),
      );
    }

    return Text('lawra', style: style);
  }
}
