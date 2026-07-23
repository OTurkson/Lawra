import 'package:flutter/material.dart';

import '../../theme/lawra_theme.dart';

/// Header illustration for login / sign-up screens (similar to design page 0007).
class AuthHeaderIllustration extends StatelessWidget {
  const AuthHeaderIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: -40,
              top: 20,
              child: Transform.rotate(
                angle: -0.35,
                child: Container(
                  width: constraints.maxWidth * 0.9,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCDEFD8),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
            Positioned(
              right: -20,
              top: 48,
              child: Transform.rotate(
                angle: -0.35,
                child: Container(
                  width: constraints.maxWidth * 0.7,
                  height: 24,
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8E8E0),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
            Positioned(
              left: constraints.maxWidth * 0.22,
              top: 36,
              child: Container(
                width: 110,
                height: 190,
                decoration: BoxDecoration(
                  color: const Color(0xFF212121),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(10),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: const Color(0xFF90A4AE),
                      child: Icon(Icons.person, size: 36, color: Colors.grey.shade200),
                    ),
                    const SizedBox(height: 10),
                    Container(height: 8, color: const Color(0xFFB0BEC5)),
                    const SizedBox(height: 6),
                    Container(height: 8, width: 50, color: const Color(0xFFB0BEC5)),
                  ],
                ),
              ),
            ),
            Positioned(
              left: constraints.maxWidth * 0.08,
              bottom: 8,
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFECEFF1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Icon(Icons.laptop_mac, color: Colors.grey.shade600, size: 28),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF5D4037),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              right: 24,
              top: 12,
              child: Icon(Icons.circle_outlined, size: 18, color: LawraColors.cyan.withValues(alpha: 0.5)),
            ),
          ],
        );
      },
    );
  }
}

class AuthTabBar extends StatelessWidget {
  const AuthTabBar({
    super.key,
    required this.isLogin,
    required this.onLoginTap,
    required this.onSignupTap,
  });

  final bool isLogin;
  final VoidCallback onLoginTap;
  final VoidCallback onSignupTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: LawraColors.cyan,
      child: Row(
        children: [
          _AuthTab(label: 'Log in', selected: isLogin, onTap: onLoginTap),
          _AuthTab(label: 'Sign up', selected: !isLogin, onTap: onSignupTap),
        ],
      ),
    );
  }
}

class _AuthTab extends StatelessWidget {
  const _AuthTab({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: selected ? LawraColors.green : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(label, style: const TextStyle(fontSize: 17, color: Colors.white)),
        ),
      ),
    );
  }
}
