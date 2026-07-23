import 'package:flutter/material.dart';

import '../../theme/lawra_theme.dart';
import 'tour_sign_in_button.dart';

const onboardingTourBody =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.';

class OnboardingTourPageLayout extends StatelessWidget {
  const OnboardingTourPageLayout({
    super.key,
    required this.title,
    required this.illustration,
    required this.pageIndex,
    required this.pageCount,
    required this.onSignIn,
  });

  final String title;
  final Widget illustration;
  final int pageIndex;
  final int pageCount;
  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 8, 28, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 40,
              fontWeight: FontWeight.w700,
              color: LawraColors.textDark,
              height: 1.05,
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            onboardingTourBody,
            style: TextStyle(
              color: LawraColors.textMuted,
              fontSize: 14,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 22),
          TourSignInButton(onSignIn: onSignIn),
          const SizedBox(height: 16),
          Expanded(child: illustration),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              pageCount,
              (dotIndex) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: pageIndex == dotIndex ? 18 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: pageIndex == dotIndex ? LawraColors.cyan : const Color(0xFFBFE7DD),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
