import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_flow_screens.dart';
import 'dashboard_shell.dart';
import 'onboarding_screen.dart';
import 'intro_sequence.dart';
import '../data/session_store.dart';

class LaunchGate extends StatefulWidget {
  const LaunchGate({super.key});

  @override
  State<LaunchGate> createState() => _LaunchGateState();
}

class _LaunchGateState extends State<LaunchGate> {
  static const _firstLaunchKey = 'first_launch_done';
  static const _greenSplashDuration = Duration(milliseconds: 1100);
  static const _whiteSplashDuration = Duration(milliseconds: 850);

  bool _showWhiteSplash = false;
  bool? _isFirstLaunch;
  Timer? _greenTimer;
  Timer? _whiteTimer;

  @override
  void initState() {
    super.initState();
    _primeLaunchFlow();
  }

  Future<bool> _loadFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool(_firstLaunchKey) ?? false);
  }

  void _primeLaunchFlow() {
    _loadFirstLaunch().then((value) {
      _isFirstLaunch = value;
      _tryCompleteLaunch();
    });

    _greenTimer = Timer(_greenSplashDuration, () {
      if (!mounted) return;
      setState(() => _showWhiteSplash = true);
      _tryCompleteLaunch();
    });
  }

  void _tryCompleteLaunch() {
    if (!_showWhiteSplash || _isFirstLaunch == null || _whiteTimer != null) {
      return;
    }

    _whiteTimer = Timer(_whiteSplashDuration, () {
      if (!mounted) return;

      final firstLaunch = _isFirstLaunch ?? false;
      if (firstLaunch) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => IntroSequence(
              onComplete: () {
                // After the short intro sequence, show regular onboarding
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => OnboardingScreen(
                      onDone: () async {
                        await _completeTour();
                        if (!mounted) return;
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const AuthScreen()),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
          ),
        );
      } else {
        SessionStore.readAuth().then((session) {
          if (!mounted) return;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => session == null
                  ? const AuthScreen()
                  : DashboardShell(
                      session: session,
                      onSignedOut: () {
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(builder: (_) => const AuthScreen()),
                          (_) => false,
                        );
                      },
                    ),
            ),
          );
        });
      }
    });
  }

  Future<void> _completeTour() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_firstLaunchKey, true);
  }

  @override
  void dispose() {
    _greenTimer?.cancel();
    _whiteTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: _showWhiteSplash
          ? const _WhiteSplash(key: ValueKey('white'))
          : const _GreenSplash(key: ValueKey('green')),
    );
  }
}

class _GreenSplash extends StatelessWidget {
  const _GreenSplash({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: SizedBox.expand(
          child: Image(
            image: AssetImage('assets/design/page-0001.png'),
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}

class _WhiteSplash extends StatelessWidget {
  const _WhiteSplash({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SizedBox.expand(
          child: Image(
            image: AssetImage('assets/design/page-0002.png'),
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}
