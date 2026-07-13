import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _secureText = true;
  bool _rememberMe = false;
  bool _loading = false;

  String _emailError = '';
  String _passwordError = '';
  String _serverError = '';

  final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _validateEmail(String v) {
    setState(() {
      if (v.trim().isEmpty) {
        _emailError = 'Vui lòng nhập email';
      } else if (!_emailRegex.hasMatch(v)) {
        _emailError = 'Email không hợp lệ';
      } else {
        _emailError = '';
      }
    });
  }

  void _validatePassword(String v) {
    setState(() {
      _passwordError = v.isEmpty ? 'Vui lòng nhập mật khẩu' : '';
    });
  }

  Future<void> _handleLogin() async {
    _validateEmail(_emailCtrl.text);
    _validatePassword(_passwordCtrl.text);
    if (_emailError.isNotEmpty || _passwordError.isNotEmpty) return;

    setState(() {
      _loading = true;
      _serverError = '';
    });

    final result = await ref
        .read(authProvider.notifier)
        .login(_emailCtrl.text.trim(), _passwordCtrl.text);

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.success) {
      final user = ref.read(authProvider).user;
      if (user?.isAdmin == true) {
        context.go('/admin');
      } else {
        context.go('/home');
      }
    } else {
      setState(() => _serverError = result.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      body: SafeArea(
        child: Column(
          children: [
            // ── Brand header ─────────────────────────────────────────────
            _BrandHeader(),
            // ── Form card ───────────────────────────────────────────────
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(28, 36, 28, 28),
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Chào mừng trở lại',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Đăng nhập để tiếp tục hành trình của bạn.',
                        style: TextStyle(
                          fontSize: 14,
                          color: SoulColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Server error
                      if (_serverError.isNotEmpty) ...[
                        _ErrorBox(message: _serverError),
                        const SizedBox(height: 16),
                      ],

                      // Email
                      _FieldLabel('Địa chỉ Email'),
                      _InputField(
                        controller: _emailCtrl,
                        hint: 'name@example.com',
                        icon: Icons.email_outlined,
                        error: _emailError,
                        keyboardType: TextInputType.emailAddress,
                        onChanged: (v) {
                          setState(() => _serverError = '');
                          _validateEmail(v);
                        },
                      ),
                      if (_emailError.isNotEmpty)
                        _FieldError(_emailError),

                      const SizedBox(height: 4),

                      // Password header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _FieldLabel('Mật khẩu'),
                          GestureDetector(
                            onTap: () => context.push('/forgot'),
                            child: const Text(
                              'Quên mật khẩu?',
                              style: TextStyle(
                                fontSize: 13,
                                color: SoulColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      _InputField(
                        controller: _passwordCtrl,
                        hint: '••••••••',
                        icon: Icons.lock_outline,
                        error: _passwordError,
                        obscureText: _secureText,
                        suffix: IconButton(
                          icon: Icon(
                            _secureText
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: SoulColors.textFaint,
                            size: 20,
                          ),
                          onPressed: () =>
                              setState(() => _secureText = !_secureText),
                        ),
                        onChanged: (v) {
                          setState(() => _serverError = '');
                          _validatePassword(v);
                        },
                      ),
                      if (_passwordError.isNotEmpty)
                        _FieldError(_passwordError),

                      const SizedBox(height: 8),

                      // Remember me
                      GestureDetector(
                        onTap: () =>
                            setState(() => _rememberMe = !_rememberMe),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: _rememberMe
                                    ? SoulColors.primary
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: _rememberMe
                                      ? SoulColors.primary
                                      : SoulColors.borderSlate,
                                  width: 1.5,
                                ),
                              ),
                              child: _rememberMe
                                  ? const Icon(Icons.check,
                                      size: 13, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Ghi nhớ thiết bị này',
                              style: TextStyle(
                                fontSize: 14,
                                color: SoulColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Sign in button
                      GradientButton(
                        label: 'Đăng nhập',
                        loading: _loading,
                        onPressed: _handleLogin,
                      ),
                      const SizedBox(height: 24),

                      // Divider
                      const _Divider(),
                      const SizedBox(height: 20),

                      // Social buttons
                      Row(
                        children: [
                          Expanded(
                            child: _SocialButton(
                              icon: Icons.g_mobiledata_rounded,
                              iconColor: const Color(0xFFEA4335),
                              label: 'Google',
                              onTap: () {},
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _SocialButton(
                              icon: Icons.facebook_rounded,
                              iconColor: const Color(0xFF1877F2),
                              label: 'Facebook',
                              onTap: () {},
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 28),

                      // Register link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Chưa có tài khoản? ',
                            style: TextStyle(
                              fontSize: 14,
                              color: SoulColors.textMuted,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.push('/register'),
                            child: const Text(
                              'Tạo tài khoản',
                              style: TextStyle(
                                fontSize: 14,
                                color: SoulColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Brand Header ─────────────────────────────────────────────────────────────

class _BrandHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF6D28D9), Color(0xFF5B21B6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.fromLTRB(28, 32, 28, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo
          Row(
            children: [
              const Icon(Icons.spa_outlined, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              const Text(
                'SOUL',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Text(
            'Nuôi dưỡng\nsự bình an nội tâm.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              height: 1.3,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Hơn 2 triệu người dùng đang tìm lại sự cân bằng cùng SOUL.',
            style: TextStyle(
              color: Color(0xBFFFFFFF),
              fontSize: 13,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _StatChip(value: '98%', label: 'GIẢM CĂNG THẲNG'),
              const SizedBox(width: 12),
              _StatChip(value: '2M+', label: 'NGƯỜI DÙNG'),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String value;
  final String label;
  const _StatChip({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xA8FFFFFF),
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Form Helpers ─────────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String label;
  const _FieldLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151),
        ),
      ),
    );
  }
}

class _FieldError extends StatelessWidget {
  final String message;
  const _FieldError(this.message);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 10, left: 4),
      child: Text(
        message,
        style: const TextStyle(
          fontSize: 12,
          color: SoulColors.error,
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final String error;
  final bool obscureText;
  final TextInputType keyboardType;
  final Widget? suffix;
  final ValueChanged<String>? onChanged;

  const _InputField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.error = '',
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.suffix,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final hasError = error.isNotEmpty;
    return Container(
      height: 52,
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: hasError ? const Color(0xFFFFF5F5) : const Color(0xFFF8F7FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: hasError ? SoulColors.error : SoulColors.border,
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(
            icon,
            size: 20,
            color: hasError ? SoulColors.error : SoulColors.textFaint,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: obscureText,
              keyboardType: keyboardType,
              autocorrect: false,
              onChanged: onChanged,
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF1E293B),
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(
                  color: Color(0xFFB0BEC5),
                  fontSize: 15,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          if (suffix != null) suffix!,
          const SizedBox(width: 4),
        ],
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
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: SoulColors.error,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
            child: Divider(color: SoulColors.border, thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'HOẶC TIẾP TỤC VỚI',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: SoulColors.textFaint,
              letterSpacing: 1,
            ),
          ),
        ),
        const Expanded(
            child: Divider(color: SoulColors.border, thickness: 1)),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: SoulColors.borderSlate, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
