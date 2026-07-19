import 'package:flutter/material.dart';

import '../home_colors.dart';

class InsightChip extends StatelessWidget {
  final String label;

  const InsightChip({
    super.key,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: HomeColors.softMint,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: HomeColors.darkTeal,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}