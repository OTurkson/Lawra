import 'package:flutter/material.dart';

import '../theme/lawra_theme.dart';
import '../widgets/lawra_widgets.dart';
import 'home_and_dashboards.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool signUp = true;

  @override
  Widget build(BuildContext context) {
    final topHeight = MediaQuery.sizeOf(context).height * 0.42;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              height: topHeight,
              width: double.infinity,
              child: Image.asset(
                signUp ? 'assets/design/page-0006.png' : 'assets/design/page-0007.png',
                fit: BoxFit.fitWidth,
                alignment: Alignment.topCenter,
              ),
            ),
            Container(
              color: LawraColors.cyan,
              child: Row(
                children: [
                  _AuthTab(
                    label: 'Sign up',
                    selected: signUp,
                    onTap: () => setState(() => signUp = true),
                  ),
                  _AuthTab(
                    label: 'Log in',
                    selected: !signUp,
                    onTap: () => setState(() => signUp = false),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22),
              child: Column(
                children: [
                  const LawraInput(hint: 'email'),
                  const SizedBox(height: 12),
                  const LawraInput(hint: 'password'),
                  if (signUp) ...[
                    const SizedBox(height: 12),
                    const LawraInput(hint: 'confirm password'),
                  ],
                  const SizedBox(height: 24),
                  GradientButton(
                    label: 'Continue',
                    onTap: () {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const SetupProfileScreen()),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {},
                    child: const Text(
                      'Forget your password? Tap to reset',
                      style: TextStyle(color: LawraColors.textMuted),
                    ),
                  ),
                  if (signUp)
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text(
                        'An email has been sent. Verify your email',
                        style: TextStyle(color: LawraColors.textMuted),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SetupProfileScreen extends StatelessWidget {
  const SetupProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 22),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text(
                    'lawra',
                    style: TextStyle(
                      color: LawraColors.cyan,
                      fontSize: 40 / 1.2,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Setup your profile',
                  style: TextStyle(
                    fontSize: 56 / 1.4,
                    fontWeight: FontWeight.w600,
                    color: LawraColors.textDark,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const _SetupItem(
              title: 'Personal Details',
              subtitle: 'Enter your name',
              icon: Icons.person,
            ),
            const _SetupItem(
              title: 'Company Details',
              subtitle: 'Enter your company credentials',
              icon: Icons.badge_outlined,
            ),
            const _SetupItem(
              title: 'Upload a Picture',
              subtitle: 'Choose a photo',
              icon: Icons.add_a_photo_outlined,
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: LawraColors.cyan),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Agree to our Terms and Conditions and Data Privacy',
                      style: TextStyle(fontSize: 15),
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.all(20),
              child: GradientButton(
                label: 'Continue',
                onTap: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const HomeScreen()),
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

class _AuthTab extends StatelessWidget {
  const _AuthTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

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
          child: Text(
            label,
            style: const TextStyle(fontSize: 17, color: Colors.white),
          ),
        ),
      ),
    );
  }
}

class _SetupItem extends StatelessWidget {
  const _SetupItem({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE4E4E4))),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: const LinearGradient(colors: [LawraColors.cyan, LawraColors.green]),
            ),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 18.3, fontWeight: FontWeight.w500),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(color: LawraColors.textMuted),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_drop_down_circle, color: LawraColors.cyan),
        ],
      ),
    );
  }
}
