import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class CongratsScreen extends StatelessWidget {
  const CongratsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Confetti-like animation container
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(36),
                  boxShadow: SoulColors.primaryShadow,
                ),
                child: const Icon(Icons.celebration_outlined, color: Colors.white, size: 52),
              ),
              const SizedBox(height: 32),
              const Text('🎉 Tạo tài khoản thành công!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF1E293B), height: 1.3)),
              const SizedBox(height: 14),
              const Text(
                'Chào mừng bạn đến với SOUL!\nBắt đầu hành trình chăm sóc tâm trí ngay hôm nay.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: SoulColors.textMuted, height: 1.6)),
              const SizedBox(height: 48),
              GradientButton(
                label: 'Bắt đầu ngay',
                onPressed: () => context.go('/login'),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Đăng nhập', style: TextStyle(color: SoulColors.primary, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
