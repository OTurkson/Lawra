import 'package:flutter/material.dart';

import 'screens/launch_gate.dart';
import 'theme/lawra_theme.dart';

void main() => runApp(const LawraApp());

class LawraApp extends StatelessWidget {
  const LawraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Lawra',
      theme: buildLawraTheme(),
      home: const LaunchGate(),
    );
  }
}
