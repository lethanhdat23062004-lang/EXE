import 'package:flutter/material.dart';
import '../home_colors.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Hi, Vy 🌊",
              style: TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w900,
                color: HomeColors.dark,
              ),
            ),
            SizedBox(height: 6),
            Text(
              "Welcome back to your safe space",
              style: TextStyle(
                fontSize: 15,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        Container(
          height: 56,
          width: 56,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(
            Icons.notifications_none_rounded,
            color: HomeColors.darkTeal,
          ),
        ),
      ],
    );
  }
}