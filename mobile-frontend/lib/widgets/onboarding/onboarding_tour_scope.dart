import 'package:flutter/material.dart';

/// Provides the shared tour exit action used by [TourSignInButton] and SKIP.
class OnboardingTourScope extends InheritedWidget {
  const OnboardingTourScope({
    super.key,
    required this.onSignIn,
    required super.child,
  });

  final VoidCallback onSignIn;

  static OnboardingTourScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<OnboardingTourScope>();
    assert(scope != null, 'OnboardingTourScope not found in widget tree');
    return scope!;
  }

  @override
  bool updateShouldNotify(OnboardingTourScope oldWidget) =>
      onSignIn != oldWidget.onSignIn;
}
