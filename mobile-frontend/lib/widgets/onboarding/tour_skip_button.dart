import 'package:flutter/material.dart';

import 'onboarding_tour_scope.dart';

/// SKIP control on the onboarding tour — exits to sign-in like [TourSignInButton].
class TourSkipButton extends StatelessWidget {
  const TourSkipButton({super.key});

  @override
  Widget build(BuildContext context) {
    final onSignIn = OnboardingTourScope.of(context).onSignIn;

    return Align(
      alignment: Alignment.centerRight,
      child: TextButton(
        onPressed: onSignIn,
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
    );
  }
}
