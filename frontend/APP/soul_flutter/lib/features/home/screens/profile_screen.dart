import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isEditing = false;
  bool _saving = false;
  String _error = '';

  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  String? _gender;
  DateTime? _dob;

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  void _initFields() {
    final user = ref.read(authProvider).user;
    if (user != null) {
      _fullNameCtrl.text = user.fullName;
      _phoneCtrl.text = user.phone ?? '';
      _bioCtrl.text = user.bio ?? '';
      _gender = user.gender;
      if (user.dateOfBirth != null) {
        _dob = DateTime.tryParse(user.dateOfBirth!);
      }
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
          colorScheme: const ColorScheme.light(primary: SoulColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _dob = picked);
    }
  }

  Future<void> _saveProfile() async {
    if (_fullNameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Họ tên không được để trống');
      return;
    }

    setState(() {
      _saving = true;
      _error = '';
    });

    final dobStr = _dob != null ? DateFormat('yyyy-MM-dd').format(_dob!) : null;

    final result = await ref.read(authProvider.notifier).updateProfile(
          fullName: _fullNameCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
          gender: _gender,
          dateOfBirth: dobStr,
          bio: _bioCtrl.text.trim(),
        );

    if (!mounted) return;
    setState(() => _saving = false);

    if (result.success) {
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Cập nhật thông tin thành công!'),
          backgroundColor: const Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } else {
      setState(() => _error = result.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null) {
      return const Scaffold(body: Center(child: Text('Không tìm thấy thông tin tài khoản')));
    }

    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (_isEditing) {
              setState(() => _isEditing = false);
            } else {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            }
          },
        ),
        title: Text(_isEditing ? 'Chỉnh sửa hồ sơ' : 'Hồ sơ cá nhân'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: SoulColors.primary),
              onPressed: () {
                _initFields();
                setState(() {
                  _isEditing = true;
                  _error = '';
                });
              },
            )
          else
            IconButton(
              icon: const Icon(Icons.close_rounded, color: SoulColors.textMuted),
              onPressed: () => setState(() => _isEditing = false),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: SoulColors.subtleShadow,
              ),
              child: Column(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: SoulColors.primaryShadow,
                    ),
                    child: Center(
                      child: Text(
                        user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'U',
                        style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user.fullName,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user.bio ?? 'Chưa cập nhật giới thiệu cá nhân 🌱',
                    style: const TextStyle(fontSize: 13, color: SoulColors.textMuted),
                    textAlign: TextAlign.center,
                  ),
                  if (user.isPremium) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFFBBF24)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.workspace_premium, color: Color(0xFFD97706), size: 14),
                          SizedBox(width: 4),
                          Text(
                            'SOUL PRO',
                            style: TextStyle(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

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

            // Content Fields Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: SoulColors.subtleShadow,
              ),
              child: _isEditing ? _buildEditForm() : _buildProfileDetails(user),
            ),

            const SizedBox(height: 24),

            // Logout Button
            if (!_isEditing)
              GestureDetector(
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF5F5),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFEE2E2), width: 1.5),
                  ),
                  alignment: Alignment.center,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout_rounded, color: SoulColors.error, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Đăng xuất',
                        style: TextStyle(color: SoulColors.error, fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ],
                  ),
                ),
              )
            else
              GradientButton(
                label: 'Lưu thay đổi',
                loading: _saving,
                onPressed: _saveProfile,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileDetails(dynamic user) {
    final dobStr = user.dateOfBirth != null
        ? DateFormat('dd/MM/yyyy').format(DateTime.parse(user.dateOfBirth))
        : 'Chưa cập nhật';

    return Column(
      children: [
        _buildInfoRow(Icons.email_outlined, 'Email', user.email),
        _buildDivider(),
        _buildInfoRow(Icons.phone_outlined, 'Số điện thoại', user.phone ?? 'Chưa cập nhật'),
        _buildDivider(),
        _buildInfoRow(
          Icons.wc,
          'Giới tính',
          user.gender == 'male'
              ? 'Nam'
              : user.gender == 'female'
                  ? 'Nữ'
                  : user.gender == 'other'
                      ? 'Khác'
                      : 'Chưa cập nhật',
        ),
        _buildDivider(),
        _buildInfoRow(Icons.cake_outlined, 'Ngày sinh', dobStr),
        _buildDivider(),
        _buildInfoRow(Icons.verified_user_outlined, 'Vai trò', user.role == 'admin' ? 'Quản trị viên' : 'Thành viên'),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: SoulColors.primary),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: SoulColors.textMuted, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B), fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(height: 1, color: SoulColors.borderLight);
  }

  Widget _buildEditForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTextField('Họ và Tên', _fullNameCtrl, 'Họ và tên của bạn', Icons.person_outline),
        const SizedBox(height: 16),
        _buildTextField('Số điện thoại', _phoneCtrl, '0901 234 567', Icons.phone_outlined, keyboardType: TextInputType.phone),
        const SizedBox(height: 16),
        _buildTextField('Giới thiệu ngắn', _bioCtrl, 'Viết gì đó về bản thân...', Icons.info_outline, maxLines: 2),
        const SizedBox(height: 16),
        
        // Gender Dropdown
        const Text('Giới tính', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        Container(
          height: 52,
          decoration: BoxDecoration(
            color: const Color(0xFFF8F7FF),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: SoulColors.border, width: 1.5),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _gender,
              hint: const Text('Chọn giới tính', style: TextStyle(color: Color(0xFFB0BEC5), fontSize: 14)),
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: SoulColors.textFaint),
              items: const [
                DropdownMenuItem(value: 'male', child: Text('Nam')),
                DropdownMenuItem(value: 'female', child: Text('Nữ')),
                DropdownMenuItem(value: 'other', child: Text('Khác')),
              ],
              onChanged: (v) => setState(() => _gender = v),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // DOB Picker
        const Text('Ngày sinh', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFF8F7FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: SoulColors.border, width: 1.5),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 18, color: SoulColors.textFaint),
                const SizedBox(width: 10),
                Text(
                  _dob == null ? 'Chọn ngày sinh' : DateFormat('dd/MM/yyyy').format(_dob!),
                  style: TextStyle(
                    fontSize: 14,
                    color: _dob == null ? const Color(0xFFB0BEC5) : const Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController ctrl,
    String hint,
    IconData icon, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8F7FF),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: SoulColors.border, width: 1.5),
          ),
          child: Row(
            crossAxisAlignment: maxLines > 1 ? CrossAxisAlignment.start : CrossAxisAlignment.center,
            children: [
              const SizedBox(width: 14),
              Padding(
                padding: EdgeInsets.only(top: maxLines > 1 ? 14 : 0),
                child: Icon(icon, size: 20, color: SoulColors.textFaint),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: ctrl,
                  maxLines: maxLines,
                  keyboardType: keyboardType,
                  style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)),
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: const TextStyle(color: Color(0xFFB0BEC5), fontSize: 14),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: maxLines > 1 ? 14 : 0),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
