import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../theme/lawra_theme.dart';
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
  int _currentPage = 0;

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
  void initState() {
    super.initState();
    _controller.addListener(() {
      final page = _controller.page?.round() ?? 0;
      if (page != _currentPage) {
        setState(() => _currentPage = page);
      }
    });
  }

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
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _pages.length,
                    (dotIndex) => AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: _currentPage == dotIndex ? 18 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _currentPage == dotIndex ? LawraColors.cyan : const Color(0xFFBFE7DD),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
