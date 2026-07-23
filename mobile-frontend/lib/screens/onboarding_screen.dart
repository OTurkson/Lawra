import 'package:flutter/material.dart';

import '../../widgets/onboarding/onboarding_tour_page_layout.dart';
import '../../widgets/onboarding/tour_illustrations.dart';

class OnboardingTourPage {
  const OnboardingTourPage({
    required this.title,
    required this.illustration,
  });

  final String title;
  final Widget illustration;
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onSignIn});

  /// Called when the user taps SKIP or any tour [TourSignInButton].
  final VoidCallback onSignIn;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: widget.onSignIn,
                child: const Text(
                  'SKIP',
                  style: TextStyle(
                    color: Color(0xFF44AA80),
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
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
                    onSignIn: widget.onSignIn,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
