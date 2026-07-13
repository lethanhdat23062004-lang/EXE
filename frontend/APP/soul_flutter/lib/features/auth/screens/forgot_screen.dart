import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class ForgotScreen extends ConsumerStatefulWidget {
  const ForgotScreen({super.key});
  @override
  ConsumerState<ForgotScreen> createState() => _ForgotScreenState();
}

class _ForgotScreenState extends ConsumerState<ForgotScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';
  final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSend() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !_emailRegex.hasMatch(email)) {
      setState(() => _error = 'Vui lòng nhập email hợp lệ');
      return;
    }
    setState(() { _loading = true; _error = ''; });

    final result = await ref.read(authProvider.notifier).requestOtp(email);
    if (!mounted) return;
    setState(() => _loading = false);

    if (result.success) {
      ref.read(authProvider.notifier).setForgotEmail(email);
      context.push('/verify');
    } else {
      setState(() => _error = result.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/login');
            }
          },
        ),
        title: const Text('Quên mật khẩu'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: SoulColors.bgPurpleSoft,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.lock_reset_outlined,
                  color: SoulColors.primary, size: 28),
            ),
            const SizedBox(height: 20),
            const Text(
              'Khôi phục mật khẩu',
              style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 8),
            const Text(
              'Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để xác minh.',
              style: TextStyle(fontSize: 14, color: SoulColors.textMuted, height: 1.5),
            ),
            const SizedBox(height: 32),
            if (_error.isNotEmpty) ...[
              _ErrorBox(message: _error),
              const SizedBox(height: 16),
            ],
            const Text('Email', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
            const SizedBox(height: 8),
            Container(
              height: 52,
              decoration: BoxDecoration(
                color: const Color(0xFFF8F7FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: SoulColors.border, width: 1.5),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 14),
                  const Icon(Icons.email_outlined, size: 20, color: SoulColors.textFaint),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      onChanged: (_) => setState(() => _error = ''),
                      style: const TextStyle(fontSize: 15, color: Color(0xFF1E293B)),
                      decoration: const InputDecoration(
                        hintText: 'name@example.com',
                        hintStyle: TextStyle(color: Color(0xFFB0BEC5), fontSize: 15),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                ],
              ),
            ),
            const SizedBox(height: 28),
            GradientButton(
              label: 'Gửi mã OTP',
              loading: _loading,
              onPressed: _handleSend,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox({required this.message});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: SoulColors.errorBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SoulColors.errorBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, size: 16, color: SoulColors.error),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: const TextStyle(color: SoulColors.error, fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
