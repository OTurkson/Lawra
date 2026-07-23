import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../screens/auth/auth_screen.dart';
import '../../widgets/onboarding/onboarding_tour_page_layout.dart';
import '../../widgets/onboarding/onboarding_tour_scope.dart';
import '../../widgets/onboarding/tour_illustrations.dart';
import '../../widgets/onboarding/tour_skip_button.dart';

class OnboardingTourPage {
  const OnboardingTourPage({
    required this.title,
    required this.illustration,
  });

  final String title;
  final Widget illustration;
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static const tourCompletedKey = 'onboarding_tour_completed';

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();

  static const _pages = [
    OnboardingTourPage(
      title: 'Moderate\nInterest Rates',
      illustration: ModerateRatesIllustration(),
    ),
    OnboardingTourPage(
      title: 'Stress Free\nApplication',
      illustration: StressFreeIllustration(),
    ),
    OnboardingTourPage(
      title: 'Fast\nand Flexible',
      illustration: FastFlexibleIllustration(),
    ),
    OnboardingTourPage(
      title: 'Secure and\nReliable',
      illustration: SecureReliableIllustration(),
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _goToSignIn() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(OnboardingScreen.tourCompletedKey, true);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const AuthScreen(initialIsLogin: true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return OnboardingTourScope(
      onSignIn: _goToSignIn,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              const TourSkipButton(),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  itemBuilder: (context, i) {
                    final page = _pages[i];
                    return OnboardingTourPageLayout(
                      title: page.title,
                      illustration: page.illustration,
                      pageIndex: i,
                      pageCount: _pages.length,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
