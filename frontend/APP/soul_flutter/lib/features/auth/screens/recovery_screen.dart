import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class RecoveryScreen extends ConsumerStatefulWidget {
  const RecoveryScreen({super.key});
  @override
  ConsumerState<RecoveryScreen> createState() => _RecoveryScreenState();
}

class _RecoveryScreenState extends ConsumerState<RecoveryScreen> {
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _securePass = true;
  bool _secureConfirm = true;
  bool _loading = false;
  String _error = '';

  @override
  void dispose() {
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    if (_passwordCtrl.text.length < 6) {
      setState(() => _error = 'Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (_confirmCtrl.text != _passwordCtrl.text) {
      setState(() => _error = 'Mật khẩu xác nhận không khớp');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    final result = await ref.read(authProvider.notifier).resetPass(_passwordCtrl.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (result.success) {
      context.go('/login');
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
        title: const Text('Đặt lại mật khẩu'),
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
              child: const Icon(Icons.lock_open_outlined, color: SoulColors.primary, size: 28),
            ),
            const SizedBox(height: 20),
            const Text('Mật khẩu mới',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
            const SizedBox(height: 8),
            const Text('Tạo mật khẩu mới cho tài khoản của bạn.',
              style: TextStyle(fontSize: 14, color: SoulColors.textMuted)),
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
            _buildField('Mật khẩu mới', _passwordCtrl, _securePass, () => setState(() => _securePass = !_securePass)),
            const SizedBox(height: 16),
            _buildField('Xác nhận mật khẩu', _confirmCtrl, _secureConfirm, () => setState(() => _secureConfirm = !_secureConfirm)),
            const SizedBox(height: 32),
            GradientButton(label: 'Đổi mật khẩu', loading: _loading, onPressed: _handleReset),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl, bool secure, VoidCallback toggle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
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
              const Icon(Icons.lock_outline, size: 20, color: SoulColors.textFaint),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: ctrl,
                  obscureText: secure,
                  onChanged: (_) => setState(() => _error = ''),
                  style: const TextStyle(fontSize: 15, color: Color(0xFF1E293B)),
                  decoration: const InputDecoration(
                    hintText: '••••••••',
                    hintStyle: TextStyle(color: Color(0xFFB0BEC5)),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              IconButton(
                icon: Icon(secure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 20, color: SoulColors.textFaint),
                onPressed: toggle,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
