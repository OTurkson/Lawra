import 'package:flutter/material.dart';

import '../lawra_widgets.dart';
import 'onboarding_tour_scope.dart';

/// Primary CTA on every onboarding tour slide — navigates to sign-in.
class TourSignInButton extends StatelessWidget {
  const TourSignInButton({super.key});

  @override
  Widget build(BuildContext context) {
    final onSignIn = OnboardingTourScope.of(context).onSignIn;
    return GradientButton(label: 'Sign In', onTap: onSignIn);
  }
}
