import 'package:flutter/material.dart';

import '../components/section_title.dart';
import 'grid_view_cards.dart';

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionTitle(title: "Explore SOUL"),
        SizedBox(height: 16),
        GridViewCards(),
      ],
    );
  }
}