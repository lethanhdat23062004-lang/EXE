import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class VerifyScreen extends ConsumerStatefulWidget {
  const VerifyScreen({super.key});
  @override
  ConsumerState<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends ConsumerState<VerifyScreen> {
  final _controllers = List.generate(6, (_) => TextEditingController());
  final _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String _error = '';

  String get _otp =>
      _controllers.map((c) => c.text).join();

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    for (final f in _focusNodes) f.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    if (_otp.length < 6) {
      setState(() => _error = 'Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    final result = await ref.read(authProvider.notifier).verifyOtp(_otp);
    if (!mounted) return;
    setState(() => _loading = false);
    if (result.success) {
      ref.read(authProvider.notifier).setForgotCode(_otp);
      context.push('/recovery');
    } else {
      setState(() => _error = result.message);
    }
  }

  void _onDigitChanged(int index, String val) {
    if (val.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (val.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    setState(() {});
  }

  Future<void> _resendOtp() async {
    final email = ref.read(authProvider).forgotEmail ?? '';
    if (email.isEmpty) return;
    setState(() { _loading = true; _error = ''; });
    final result = await ref.read(authProvider.notifier).requestOtp(email);
    if (!mounted) return;
    setState(() => _loading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.success ? 'Đã gửi lại mã OTP thành công!' : result.message),
        backgroundColor: result.success ? const Color(0xFF16A34A) : SoulColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final email = ref.watch(authProvider).forgotEmail ?? '';
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
        title: const Text('Xác minh OTP'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                color: SoulColors.bgPurpleSoft,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.sms_outlined, color: SoulColors.primary, size: 28),
            ),
            const SizedBox(height: 20),
            const Text('Nhập mã xác nhận',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
            const SizedBox(height: 8),
            Text(
              'Chúng tôi đã gửi mã OTP 6 chữ số đến\n$email',
              style: const TextStyle(fontSize: 14, color: SoulColors.textMuted, height: 1.5),
            ),
            const SizedBox(height: 32),
            if (_error.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: SoulColors.errorBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: SoulColors.errorBorder),
                ),
                child: Text(_error, style: const TextStyle(color: SoulColors.error, fontSize: 13)),
              ),
              const SizedBox(height: 16),
            ],
            // OTP boxes
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (i) => _OtpBox(
                controller: _controllers[i],
                focusNode: _focusNodes[i],
                onChanged: (v) => _onDigitChanged(i, v),
              )),
            ),
            const SizedBox(height: 32),
            GradientButton(
              label: 'Xác nhận',
              loading: _loading,
              onPressed: _handleVerify,
            ),
            Center(
              child: TextButton(
                onPressed: _resendOtp,
                child: const Text('Gửi lại mã OTP',
                  style: TextStyle(color: SoulColors.primary, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46, height: 56,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        onChanged: onChanged,
        style: const TextStyle(
          fontSize: 22, fontWeight: FontWeight.w800, color: SoulColors.primary),
        decoration: InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: SoulColors.border, width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: SoulColors.primary, width: 2),
          ),
          fillColor: const Color(0xFFF8F7FF),
          filled: true,
        ),
      ),
    );
  }
}
