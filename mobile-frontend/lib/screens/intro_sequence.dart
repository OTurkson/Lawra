import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/lawra_theme.dart';

/// Shows a short intro animation: page-0002 -> page-0003 then pushes onboarding.
class IntroSequence extends StatefulWidget {
  const IntroSequence({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<IntroSequence> createState() => _IntroSequenceState();
}

class _IntroSequenceState extends State<IntroSequence> {
  bool _showSecond = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // show first image for a short while, then transition to second
    _timer = Timer(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      setState(() => _showSecond = true);
      // after transition, complete
      Timer(const Duration(milliseconds: 700), () {
        if (!mounted) return;
        widget.onComplete();
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _showSecond ? Colors.white : Colors.transparent,
      body: Center(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 600),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          child: _showSecond
              ? SizedBox.expand(
                  key: const ValueKey('page-0003'),
                  child: Image.asset('assets/design/page-0003.png', fit: BoxFit.cover),
                )
              : SizedBox.expand(
                  key: const ValueKey('page-0002'),
                  child: Image.asset('assets/design/page-0002.png', fit: BoxFit.cover),
                ),
        ),
      ),
    );
  }
}
