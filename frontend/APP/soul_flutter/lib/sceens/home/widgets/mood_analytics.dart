import 'package:flutter/material.dart';

import '../components/section_title.dart';
import '../components/mood_bar.dart';

class MoodAnalytics extends StatelessWidget {
  const MoodAnalytics({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle(title: "Weekly Mood Analytics"),
        const SizedBox(height: 16),

        SizedBox(
          height: 150,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: const [
              MoodBar(day: "Mon", height: 70),
              MoodBar(day: "Tue", height: 110),
              MoodBar(day: "Wed", height: 55),
              MoodBar(day: "Thu", height: 125),
              MoodBar(day: "Fri", height: 95),
              MoodBar(day: "Sat", height: 50),
              MoodBar(day: "Sun", height: 115),
            ],
          ),
        ),
      ],
    );
  }
}