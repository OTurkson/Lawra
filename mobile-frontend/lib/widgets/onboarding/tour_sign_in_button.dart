import 'package:flutter/material.dart';

import '../lawra_widgets.dart';

/// Primary CTA on every onboarding tour slide — navigates to sign-in.
class TourSignInButton extends StatelessWidget {
  const TourSignInButton({super.key, required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return GradientButton(label: 'Sign In', onTap: onSignIn);
  }
}
