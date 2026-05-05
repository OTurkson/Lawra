import 'package:flutter/material.dart';

import '../theme/lawra_theme.dart';

class GradientButton extends StatelessWidget {
  const GradientButton({super.key, required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [LawraColors.green, LawraColors.cyan]),
          borderRadius: BorderRadius.circular(30),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18.9,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class GradientChip extends StatelessWidget {
  const GradientChip({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [LawraColors.green, LawraColors.cyan]),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
    );
  }
}

class LawraInput extends StatelessWidget {
  const LawraInput({super.key, required this.hint});

  final String hint;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 54,
      decoration: BoxDecoration(
        color: const Color(0xFF8A99A1),
        borderRadius: BorderRadius.circular(4),
      ),
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Text(
        hint,
        style: const TextStyle(color: Colors.white70, fontSize: 18),
      ),
    );
  }
}

class LawraLineInput extends StatelessWidget {
  const LawraLineInput({
    super.key,
    required this.label,
    this.dropdown = false,
  });

  final String label;
  final bool dropdown;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 15.8)),
              const Divider(height: 10, thickness: 1),
            ],
          ),
        ),
        if (dropdown)
          const Icon(
            Icons.arrow_drop_down_circle,
            color: LawraColors.cyan,
          ),
      ],
    );
  }
}
