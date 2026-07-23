import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/session_store.dart';
import 'auth/auth_screen.dart';
import 'dashboard_shell.dart';
import 'onboarding_screen.dart';
import 'splash/splash_screens.dart';

class LaunchGate extends StatefulWidget {
  const LaunchGate({super.key});

  @override
  State<LaunchGate> createState() => _LaunchGateState();
}

class _LaunchGateState extends State<LaunchGate> {
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
    return !(prefs.getBool(OnboardingScreen.tourCompletedKey) ?? false);
  }

  void _primeLaunchFlow() {
    _loadFirstLaunch().then((value) {
      if (!mounted) return;
      setState(() => _isFirstLaunch = value);
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
            builder: (_) => const OnboardingScreen(),
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
          ? const WhiteSplashScreen(key: ValueKey('white'))
          : const GreenSplashScreen(key: ValueKey('green')),
    );
  }
}
