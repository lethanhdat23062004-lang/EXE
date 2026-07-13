import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _secureText = true;
  bool _secureConfirm = true;
  bool _loading = false;
  bool _agreeTerms = false;

  String? _genderValue;
  DateTime? _dob;

  final _errors = <String, String>{};

  final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    _errors.clear();
    if (_fullNameCtrl.text.trim().isEmpty) {
      _errors['fullName'] = 'Vui lòng nhập họ và tên';
    }
    if (_emailCtrl.text.trim().isEmpty ||
        !_emailRegex.hasMatch(_emailCtrl.text)) {
      _errors['email'] = 'Email không hợp lệ';
    }
    if (_passwordCtrl.text.length < 6) {
      _errors['password'] = 'Mật khẩu tối thiểu 6 ký tự';
    }
    if (_confirmCtrl.text != _passwordCtrl.text) {
      _errors['confirm'] = 'Mật khẩu xác nhận không khớp';
    }
    if (!_agreeTerms) {
      _errors['terms'] = 'Bạn cần đồng ý với điều khoản';
    }
    setState(() {});
    return _errors.isEmpty;
  }

  Future<void> _handleRegister() async {
    if (!_validate()) return;

    setState(() => _loading = true);

    final result = await ref.read(authProvider.notifier).register(
          fullName: _fullNameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          phone: _phoneCtrl.text.trim().isNotEmpty
              ? _phoneCtrl.text.trim()
              : null,
          gender: _genderValue,
          dateOfBirth: _dob?.toIso8601String().split('T').first,
        );

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.success) {
      context.go('/congrats');
    } else {
      setState(() => _errors['server'] = result.message);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1940),
      lastDate: now,
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme:
              const ColorScheme.light(primary: SoulColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _dob = picked);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                        size: 20),
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/login');
                      }
                    },
                  ),
                  const Expanded(
                    child: Text(
                      'Tạo tài khoản',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // SOUL logo
                    Center(
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF7C3AED),
                              Color(0xFF6D28D9)
                            ],
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: SoulColors.primaryShadow,
                        ),
                        child: const Icon(Icons.spa_outlined,
                            color: Colors.white, size: 28),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Center(
                      child: Text(
                        'Bắt đầu hành trình chăm sóc tâm trí',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: SoulColors.textMuted,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    if (_errors['server'] != null) ...[
                      _ErrorBox(message: _errors['server']!),
                      const SizedBox(height: 16),
                    ],

                    _Field(
                      label: 'Họ và tên *',
                      controller: _fullNameCtrl,
                      hint: 'Nguyễn Văn A',
                      icon: Icons.person_outline,
                      error: _errors['fullName'],
                    ),
                    _Field(
                      label: 'Email *',
                      controller: _emailCtrl,
                      hint: 'name@example.com',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      error: _errors['email'],
                    ),
                    _Field(
                      label: 'Mật khẩu *',
                      controller: _passwordCtrl,
                      hint: '••••••••',
                      icon: Icons.lock_outline,
                      obscure: _secureText,
                      error: _errors['password'],
                      suffixIcon: IconButton(
                        icon: Icon(
                          _secureText
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          size: 20,
                          color: SoulColors.textFaint,
                        ),
                        onPressed: () =>
                            setState(() => _secureText = !_secureText),
                      ),
                    ),
                    _Field(
                      label: 'Xác nhận mật khẩu *',
                      controller: _confirmCtrl,
                      hint: '••••••••',
                      icon: Icons.lock_open_outlined,
                      obscure: _secureConfirm,
                      error: _errors['confirm'],
                      suffixIcon: IconButton(
                        icon: Icon(
                          _secureConfirm
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          size: 20,
                          color: SoulColors.textFaint,
                        ),
                        onPressed: () => setState(
                            () => _secureConfirm = !_secureConfirm),
                      ),
                    ),
                    _Field(
                      label: 'Số điện thoại',
                      controller: _phoneCtrl,
                      hint: '0901 234 567',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),

                    // Gender
                    _Label('Giới tính'),
                    Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F7FF),
                        borderRadius: BorderRadius.circular(14),
                        border:
                            Border.all(color: SoulColors.border, width: 1.5),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _genderValue,
                          hint: const Text(
                            'Chọn giới tính',
                            style: TextStyle(
                                color: Color(0xFFB0BEC5), fontSize: 15),
                          ),
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded,
                              color: SoulColors.textFaint),
                          items: const [
                            DropdownMenuItem(
                                value: 'male', child: Text('Nam')),
                            DropdownMenuItem(
                                value: 'female', child: Text('Nữ')),
                            DropdownMenuItem(
                                value: 'other', child: Text('Khác')),
                          ],
                          onChanged: (v) => setState(() => _genderValue = v),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Date of birth
                    _Label('Ngày sinh'),
                    GestureDetector(
                      onTap: _pickDate,
                      child: Container(
                        height: 52,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F7FF),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: SoulColors.border, width: 1.5),
                        ),
                        padding:
                            const EdgeInsets.symmetric(horizontal: 14),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined,
                                size: 20, color: SoulColors.textFaint),
                            const SizedBox(width: 10),
                            Text(
                              _dob == null
                                  ? 'DD/MM/YYYY'
                                  : '${_dob!.day.toString().padLeft(2, '0')}/${_dob!.month.toString().padLeft(2, '0')}/${_dob!.year}',
                              style: TextStyle(
                                fontSize: 15,
                                color: _dob == null
                                    ? const Color(0xFFB0BEC5)
                                    : const Color(0xFF1E293B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Terms
                    GestureDetector(
                      onTap: () =>
                          setState(() => _agreeTerms = !_agreeTerms),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 20,
                            height: 20,
                            margin: const EdgeInsets.only(top: 1),
                            decoration: BoxDecoration(
                              color: _agreeTerms
                                  ? SoulColors.primary
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: _agreeTerms
                                    ? SoulColors.primary
                                    : (_errors['terms'] != null
                                        ? SoulColors.error
                                        : SoulColors.borderSlate),
                                width: 1.5,
                              ),
                            ),
                            child: _agreeTerms
                                ? const Icon(Icons.check,
                                    size: 13, color: Colors.white)
                                : null,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: RichText(
                              text: const TextSpan(
                                style: TextStyle(
                                    fontSize: 13,
                                    color: SoulColors.textMuted,
                                    fontFamily: 'Inter'),
                                children: [
                                  TextSpan(
                                      text: 'Tôi đồng ý với '),
                                  TextSpan(
                                    text: 'Điều khoản dịch vụ',
                                    style: TextStyle(
                                        color: SoulColors.primary,
                                        fontWeight: FontWeight.w600),
                                  ),
                                  TextSpan(text: ' và '),
                                  TextSpan(
                                    text: 'Chính sách bảo mật',
                                    style: TextStyle(
                                        color: SoulColors.primary,
                                        fontWeight: FontWeight.w600),
                                  ),
                                  TextSpan(text: ' của SOUL.'),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_errors['terms'] != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 30),
                        child: Text(
                          _errors['terms']!,
                          style: const TextStyle(
                              fontSize: 12, color: SoulColors.error),
                        ),
                      ),
                    const SizedBox(height: 24),

                    GradientButton(
                      label: 'Tạo tài khoản',
                      loading: _loading,
                      onPressed: _handleRegister,
                    ),
                    const SizedBox(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Đã có tài khoản? ',
                            style: TextStyle(
                                fontSize: 14, color: SoulColors.textMuted)),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: const Text(
                            'Đăng nhập ngay',
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
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final TextInputType keyboardType;
  final Widget? suffixIcon;
  final String? error;

  const _Field({
    required this.label,
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.suffixIcon,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    final hasError = error != null && error!.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Label(label),
        Container(
          height: 52,
          decoration: BoxDecoration(
            color:
                hasError ? const Color(0xFFFFF5F5) : const Color(0xFFF8F7FF),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasError ? SoulColors.error : SoulColors.border,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              const SizedBox(width: 14),
              Icon(icon,
                  size: 20,
                  color: hasError ? SoulColors.error : SoulColors.textFaint),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscure,
                  keyboardType: keyboardType,
                  autocorrect: false,
                  style: const TextStyle(
                      fontSize: 15, color: Color(0xFF1E293B)),
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: const TextStyle(
                        color: Color(0xFFB0BEC5), fontSize: 15),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              if (suffixIcon != null) suffixIcon!,
              const SizedBox(width: 4),
            ],
          ),
        ),
        if (hasError)
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 8, left: 4),
            child: Text(
              error!,
              style:
                  const TextStyle(fontSize: 12, color: SoulColors.error),
            ),
          )
        else
          const SizedBox(height: 16),
      ],
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
            child: Text(message,
                style: const TextStyle(
                    color: SoulColors.error,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
