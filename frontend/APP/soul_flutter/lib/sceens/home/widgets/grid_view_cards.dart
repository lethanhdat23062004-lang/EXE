import 'package:flutter/material.dart';
import '../components/action_card.dart';

class GridViewCards extends StatelessWidget {
  const GridViewCards({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.03,
      children: const [
        ActionCard(
          icon: Icons.psychology_rounded,
          title: "AI Companion",
          subtitle: "Emotion-aware chat",
          color: Color(0xFFD9FBEF),
          iconColor: Color(0xFF0F766E),
        ),
      ],
    );
  }
}