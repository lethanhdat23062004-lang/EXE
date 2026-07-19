import 'package:flutter/material.dart';

import 'home_colors.dart';
import 'widgets/home_header.dart';
import 'widgets/hero_card.dart';
import 'widgets/mood_analytics.dart';
import 'widgets/quick_actions.dart';
import 'components/weekly_insight.dart';
import 'widgets/community_preview.dart';
import 'widgets/event_card.dart';
import 'widgets/safety_note.dart';
import 'widgets/home_bottom_nav.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const Color primary = HomeColors.primary;
  static const Color dark = HomeColors.dark;
  static const Color darkTeal = HomeColors.darkTeal;
  static const Color bg = HomeColors.bg;
  static const Color softMint = HomeColors.softMint;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: const SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(22, 18, 22, 26),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              HomeHeader(),
              SizedBox(height: 24),
              HeroCard(),
              SizedBox(height: 26),
              MoodAnalytics(),
              SizedBox(height: 28),
              QuickActions(),
              SizedBox(height: 28),
              WeeklyInsight(),
              SizedBox(height: 28),
              CommunityPreview(),
              SizedBox(height: 28),
              EventCard(),
              SizedBox(height: 28),
              SafetyNote(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const HomeBottomNav(),
    );
  }
}