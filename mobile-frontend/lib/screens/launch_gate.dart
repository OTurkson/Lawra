import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_flow_screens.dart';
import 'onboarding_screen.dart';

class LaunchGate extends StatefulWidget {
  const LaunchGate({super.key});

  @override
  State<LaunchGate> createState() => _LaunchGateState();
}

class _LaunchGateState extends State<LaunchGate> {
  static const _firstLaunchKey = 'first_launch_done';
  late final Future<bool> _future;

  @override
  void initState() {
    super.initState();
    _future = _loadFirstLaunch();
  }

  Future<bool> _loadFirstLaunch() async {
    await Future<void>.delayed(const Duration(milliseconds: 1400));
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool(_firstLaunchKey) ?? false);
  }

  Future<void> _completeTour() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_firstLaunchKey, true);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SplashScreen();
        }
        if (snapshot.data == true) {
          return OnboardingScreen(
            onDone: () async {
              await _completeTour();
              if (!mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const AuthScreen()),
              );
            },
          );
        }
        return const AuthScreen();
      },
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SizedBox(
          width: 180,
          child: Image.asset(
            'assets/design/page-0001.png',
            fit: BoxFit.contain,
          ),
        ),
      ),
    );
  }
}
