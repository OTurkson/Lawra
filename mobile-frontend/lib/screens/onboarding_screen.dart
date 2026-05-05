import 'package:flutter/material.dart';

import '../theme/lawra_theme.dart';
import '../widgets/lawra_widgets.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onDone});

  final VoidCallback onDone;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  final List<_TourPageData> _pages = const [
    _TourPageData(
      title: 'Secure and Reliable',
      description:
          'Access your loans and investments quickly with a secure and reliable experience.',
      imagePage: '0025',
    ),
    _TourPageData(
      title: 'Stress Free Application',
      description:
          'Apply in simple guided steps with a clean and stress-free application process.',
      imagePage: '0026',
    ),
    _TourPageData(
      title: 'Moderate Interest Rates',
      description:
          'Track and manage offers with transparent terms and moderate interest rates.',
      imagePage: '0027',
    ),
  ];
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _index = i),
            itemCount: _pages.length,
            itemBuilder: (_, i) {
              final page = _pages[i];
              return Padding(
                padding: const EdgeInsets.fromLTRB(28, 86, 28, 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      page.title,
                      style: const TextStyle(
                        fontSize: 58,
                        fontWeight: FontWeight.w700,
                        color: LawraColors.textDark,
                        height: 0.92,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      page.description,
                      style: const TextStyle(
                        color: LawraColors.textMuted,
                        fontSize: 15.5,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 26),
                    GradientButton(label: 'Sign In', onTap: widget.onDone),
                    const SizedBox(height: 24),
                    Expanded(
                      child: Center(
                        child: Image.asset(
                          'assets/design/page-${page.imagePage}.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _pages.length,
                        (dotIndex) => AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: _index == dotIndex ? 18 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _index == dotIndex ? LawraColors.cyan : const Color(0xFFBFE7DD),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                ),
              );
            },
          ),
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTap: () {
                if (_index == _pages.length - 1) {
                  widget.onDone();
                } else {
                  _controller.nextPage(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeOut,
                  );
                }
              },
            ),
          ),
          Positioned(
            top: 50,
            right: 24,
            child: GestureDetector(
              onTap: widget.onDone,
              child: const Text(
                'SKIP',
                style: TextStyle(
                  color: Color(0xFF44AA80),
                  fontSize: 34 / 1.2,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TourPageData {
  const _TourPageData({
    required this.title,
    required this.description,
    required this.imagePage,
  });

  final String title;
  final String description;
  final String imagePage;
}
