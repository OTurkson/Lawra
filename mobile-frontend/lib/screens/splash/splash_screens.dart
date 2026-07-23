import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../widgets/lawra_branding.dart';

class GreenSplashScreen extends StatelessWidget {
  const GreenSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: DecoratedBox(
        decoration: BoxDecoration(gradient: lawraSplashGradient),
        child: Scaffold(
          backgroundColor: Colors.transparent,
          body: Center(child: LawraWordmark(fontSize: 56, white: true)),
        ),
      ),
    );
  }
}

class WhiteSplashScreen extends StatelessWidget {
  const WhiteSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: Center(child: LawraWordmark(fontSize: 56, gradient: true)),
    );
  }
}
