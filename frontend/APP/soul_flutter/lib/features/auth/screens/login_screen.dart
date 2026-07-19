import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';

// Login Colors defined inline to avoid creating new files
class LoginColors {
  static const Color primary = Color(0xFF630ED4);
  static const Color primaryContainer = Color(0xFF7C3AED);
  static const Color onPrimaryContainer = Color(0xFFEDE0FF);
  static const Color secondary = Color(0xFF8127CF);
  static const Color secondaryContainer = Color(0xFF9C48EA);
  static const Color background = Color(0xFFF9F9FB);
  static const Color surface = Color(0xFFF9F9FB);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF3F3F5);
  static const Color surfaceContainer = Color(0xFFEDEEF0);
  static const Color surfaceContainerHigh = Color(0xFFE8E8EA);
  static const Color onSurface = Color(0xFF1A1C1D);
  static const Color onSurfaceVariant = Color(0xFF4A4455);
  static const Color onSurfaceSubtle = Color(0xFF4A4455);
  static const Color outline = Color(0xFF7B7487);
  static const Color outlineVariant = Color(0xFFCCC3D8);
  static const Color tealAccent = Color(0xFF14B8A6);
  static const Color error = Color(0xFFBA1A1A);
  static const Color errorBg = Color(0xFFFFF5F5);
  static const Color errorBorder = Color(0xFFFFD1D1);
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _isPasswordVisible = false;
  bool _showSuccessNotification = false;
  bool _loading = false;
  String _serverError = '';

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  late AnimationController _notificationController;
  late Animation<double> _notificationOpacity;
  late Animation<Offset> _notificationOffset;

  @override
  void initState() {
    super.initState();

    // Pulse animation for the background atmospheric circles
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.9, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Notification animation
    _notificationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _notificationOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _notificationController, curve: Curves.easeOut),
    );

    _notificationOffset = Tween<Offset>(
      begin: const Offset(0, -1.0),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _notificationController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _pulseController.dispose();
    _notificationController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
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
        setState(() {
          _showSuccessNotification = true;
        });
        _notificationController.forward();

        final user = ref.read(authProvider).user;
        final targetPath = (user?.isAdmin == true) ? '/admin' : '/home';

        // Navigate to dashboard after 1.8 seconds (to let the notification be readable)
        Timer(const Duration(milliseconds: 1800), () {
          _notificationController.reverse().then((_) {
            if (mounted) {
              context.go(targetPath);
            }
          });
        });
      } else {
        setState(() => _serverError = result.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: LoginColors.background,
      body: Stack(
        children: [
          // Background Atmospheric Layer
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Stack(
                  children: [
                    // Top-Left Blur Circle
                    Positioned(
                      top: -size.height * 0.15,
                      left: -size.width * 0.15,
                      width: size.width * 0.65 * _pulseAnimation.value,
                      height: size.width * 0.65 * _pulseAnimation.value,
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: LoginColors.primary.withOpacity(0.08),
                        ),
                      ),
                    ),
                    // Bottom-Right Blur Circle
                    Positioned(
                      bottom: -size.height * 0.15,
                      right: -size.width * 0.15,
                      width: size.width * 0.55 * (2.0 - _pulseAnimation.value),
                      height: size.width * 0.55 * (2.0 - _pulseAnimation.value),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: LoginColors.secondary.withOpacity(0.06),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Main Scrollable Area
          Positioned.fill(
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Branding Section
                        _buildBranding(),
                        const SizedBox(height: 36),

                        // Login Card Container
                        _buildLoginCard(context),
                        const SizedBox(height: 32),

                        // Registration Link Footer
                        _buildFooter(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Success Notification Toast
          if (_showSuccessNotification)
            Positioned(
              top: 40,
              left: 0,
              right: 0,
              child: Center(
                child: SlideTransition(
                  position: _notificationOffset,
                  child: FadeTransition(
                    opacity: _notificationOpacity,
                    child: _buildSuccessNotification(),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBranding() {
    return Column(
      children: [
        // Spa Icon Container
        MouseRegion(
          cursor: SystemMouseCursors.click,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: LoginColors.primaryContainer,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: LoginColors.primaryContainer.withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(
              Icons.spa,
              color: Colors.white,
              size: 44,
            ),
          ),
        ),
        const SizedBox(height: 16),
        // SOUL Title
        Text(
          'SOUL',
          style: GoogleFonts.manrope(
            fontSize: 40,
            fontWeight: FontWeight.w800,
            color: LoginColors.primary,
            letterSpacing: -0.8,
          ),
        ),
        const SizedBox(height: 4),
        // Subtitle
        Text(
          'Mindful clarity for the modern professional',
          textAlign: TextAlign.center,
          style: GoogleFonts.manrope(
            fontSize: 15,
            fontWeight: FontWeight.w400,
            color: LoginColors.onSurfaceVariant,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildLoginCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: LoginColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: LoginColors.outlineVariant.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Back Header
            Text(
              'Welcome Back',
              style: GoogleFonts.manrope(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: LoginColors.onSurface,
              ),
            ),
            const SizedBox(height: 24),

            // Server Error Box
            if (_serverError.isNotEmpty) ...[
              _buildErrorBox(_serverError),
              const SizedBox(height: 16),
            ],

            // Email Label
            _buildInputLabel('Email Address'),
            const SizedBox(height: 6),
            // Email Input Field
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              style: GoogleFonts.manrope(
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: LoginColors.onSurface,
              ),
              decoration: _buildInputDecoration(
                hintText: 'name@company.com',
                prefixIcon: Icons.mail_outline_rounded,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter your email';
                }
                final emailRegExp = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                if (!emailRegExp.hasMatch(value)) {
                  return 'Please enter a valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            // Password Label
            _buildInputLabel('Password'),
            const SizedBox(height: 6),
            // Password Input Field
            TextFormField(
              controller: _passwordCtrl,
              obscureText: !_isPasswordVisible,
              style: GoogleFonts.manrope(
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: LoginColors.onSurface,
              ),
              decoration: _buildInputDecoration(
                hintText: '••••••••',
                prefixIcon: Icons.lock_outline_rounded,
                suffixIcon: IconButton(
                  icon: Icon(
                    _isPasswordVisible
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: LoginColors.outline,
                    size: 22,
                  ),
                  onPressed: () {
                    setState(() {
                      _isPasswordVisible = !_isPasswordVisible;
                    });
                  },
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your password';
                }
                if (value.length < 6) {
                  return 'Password must be at least 6 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Forgot Password
            Align(
              alignment: Alignment.centerRight,
              child: MouseRegion(
                cursor: SystemMouseCursors.click,
                child: GestureDetector(
                  onTap: () => context.push('/forgot'),
                  child: Text(
                    'Forgot password?',
                    style: GoogleFonts.manrope(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: LoginColors.primary,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _loading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: LoginColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: LoginColors.primary.withOpacity(0.6),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Log In',
                            style: GoogleFonts.manrope(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.arrow_forward_rounded,
                            size: 20,
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),

            // Divider Line
            Row(
              children: [
                Expanded(
                  child: Divider(
                    color: LoginColors.outlineVariant.withOpacity(0.5),
                    thickness: 1,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'OR CONTINUE WITH',
                    style: GoogleFonts.manrope(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: LoginColors.onSurfaceVariant,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                Expanded(
                  child: Divider(
                    color: LoginColors.outlineVariant.withOpacity(0.5),
                    thickness: 1,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Social Logins
            _buildSocialButton(
              onPressed: () {},
              text: 'Google',
              icon: CustomPaint(
                size: const Size(20, 20),
                painter: GoogleLogoPainter(),
              ),
            ),
            const SizedBox(height: 12),
            _buildSocialButton(
              onPressed: () {},
              text: 'Apple',
              icon: const Icon(
                Icons.apple_rounded,
                color: Colors.black,
                size: 24,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: LoginColors.onSurfaceVariant,
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration({
    required String hintText,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: LoginColors.outline.withOpacity(0.7),
      ),
      prefixIcon: Icon(
        prefixIcon,
        color: LoginColors.outline,
        size: 22,
      ),
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      filled: true,
      fillColor: LoginColors.surfaceContainerLowest,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(
          color: LoginColors.outlineVariant,
          width: 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(
          color: LoginColors.primary,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(
          color: LoginColors.error,
          width: 1,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(
          color: LoginColors.error,
          width: 2,
        ),
      ),
      errorStyle: GoogleFonts.manrope(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: LoginColors.error,
      ),
    );
  }

  Widget _buildSocialButton({
    required VoidCallback onPressed,
    required String text,
    required Widget icon,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: LoginColors.surfaceContainerLowest,
          side: const BorderSide(
            color: LoginColors.outlineVariant,
            width: 1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 12),
            Text(
              text,
              style: GoogleFonts.manrope(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: LoginColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Don't have an account?",
          style: GoogleFonts.manrope(
            fontSize: 15,
            fontWeight: FontWeight.w400,
            color: LoginColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: 6),
        MouseRegion(
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: () => context.push('/register'),
            child: Text(
              'Create Account',
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: LoginColors.primary,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorBox(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: LoginColors.errorBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: LoginColors.errorBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, size: 16, color: LoginColors.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.manrope(
                color: LoginColors.error,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessNotification() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: LoginColors.tealAccent.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: LoginColors.tealAccent.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              color: LoginColors.tealAccent,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome to SOUL',
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: LoginColors.onSurface,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Redirecting to your dashboard...',
                style: GoogleFonts.manrope(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: LoginColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Custom Painter to draw standard vector Google Logo without images
class GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    
    final Paint paint = Paint()..style = PaintingStyle.fill..isAntiAlias = true;
    
    final double scaleX = w / 24.0;
    final double scaleY = h / 24.0;
    
    canvas.save();
    canvas.scale(scaleX, scaleY);
    
    // Draw Blue part
    paint.color = const Color(0xFF4285F4);
    final Path bluePath = Path()
      ..moveTo(22.56, 12.25)
      ..cubicTo(22.56, 11.47, 22.49, 10.72, 22.36, 10.0)
      ..lineTo(12.0, 10.0)
      ..lineTo(12.0, 14.26)
      ..lineTo(17.92, 14.26)
      ..cubicTo(17.66, 15.63, 16.88, 16.79, 15.71, 17.57)
      ..lineTo(15.71, 20.34)
      ..lineTo(19.28, 20.34)
      ..cubicTo(21.36, 18.42, 22.56, 15.6, 22.56, 12.25)
      ..close();
    canvas.drawPath(bluePath, paint);
    
    // Draw Green part
    paint.color = const Color(0xFF34A853);
    final Path greenPath = Path()
      ..moveTo(12.0, 23.0)
      ..cubicTo(14.97, 23.0, 17.46, 22.02, 19.28, 20.34)
      ..lineTo(15.71, 17.57)
      ..cubicTo(14.73, 18.23, 13.48, 18.63, 12.0, 18.63)
      ..cubicTo(9.14, 18.63, 6.71, 16.7, 5.84, 14.1)
      ..lineTo(2.18, 16.94)
      ..cubicTo(3.99, 20.53, 7.7, 23.0, 12.0, 23.0)
      ..close();
    canvas.drawPath(greenPath, paint);
    
    // Draw Yellow part
    paint.color = const Color(0xFFFBBC05);
    final Path yellowPath = Path()
      ..moveTo(5.84, 14.09)
      ..cubicTo(5.62, 13.43, 5.49, 12.73, 5.49, 12.0)
      ..cubicTo(5.49, 11.27, 5.62, 10.57, 5.84, 9.91)
      ..lineTo(2.18, 7.07)
      ..cubicTo(1.43, 8.55, 1.0, 10.22, 1.0, 12.0)
      ..cubicTo(1.0, 13.78, 1.43, 15.45, 2.18, 16.93)
      ..lineTo(5.84, 14.09)
      ..close();
    canvas.drawPath(yellowPath, paint);
    
    // Draw Red part
    paint.color = const Color(0xFFEA4335);
    final Path redPath = Path()
      ..moveTo(12.0, 5.38)
      ..cubicTo(13.62, 5.38, 15.06, 5.94, 16.21, 7.02)
      ..lineTo(19.36, 3.87)
      ..cubicTo(17.45, 2.09, 14.97, 1.0, 12.0, 1.0)
      ..cubicTo(7.7, 1.0, 3.99, 3.47, 2.18, 7.07)
      ..lineTo(5.84, 9.91)
      ..cubicTo(6.71, 7.31, 9.14, 5.38, 12.0, 5.38)
      ..close();
    canvas.drawPath(redPath, paint);
    
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
