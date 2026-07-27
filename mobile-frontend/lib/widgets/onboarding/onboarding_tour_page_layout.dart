import 'package:flutter/material.dart';

import '../../theme/lawra_theme.dart';
import 'tour_sign_in_button.dart';

const onboardingTourBody =
    'Lawra is a stress-free, one-in-a-million, game-changing financial solution.';

class OnboardingTourPageLayout extends StatelessWidget {
  const OnboardingTourPageLayout({
    super.key,
    required this.title,
    required this.illustration,
    required this.pageIndex,
    required this.pageCount,
  });

  final String title;
  final Widget illustration;
  final int pageIndex;
  final int pageCount;

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
          const TourSignInButton(),
          const SizedBox(height: 16),
          Expanded(child: illustration),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
