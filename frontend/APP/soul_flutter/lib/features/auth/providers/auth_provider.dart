import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';
import '../../../core/storage/storage.dart';

/// Auth state - mirrors Zustand AuthState in store/index.ts
class AuthState {
  final UserModel? user;
  final String? token;
  final bool isLoggedIn;
  final bool isLoading;

  // Forgot password flow
  final String? forgotEmail;
  final String? forgotCode;

  const AuthState({
    this.user,
    this.token,
    this.isLoggedIn = false,
    this.isLoading = false,
    this.forgotEmail,
    this.forgotCode,
  });

  AuthState copyWith({
    UserModel? user,
    String? token,
    bool? isLoggedIn,
    bool? isLoading,
    String? forgotEmail,
    String? forgotCode,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      token: token ?? this.token,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      isLoading: isLoading ?? this.isLoading,
      forgotEmail: forgotEmail ?? this.forgotEmail,
      forgotCode: forgotCode ?? this.forgotCode,
    );
  }
}

/// Auth provider - mirrors Zustand useAuthStore
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _restore();
  }

  /// Restore session from local storage on app start
  Future<void> _restore() async {
    final token = await SoulStorage.getToken();
    final userJson = await SoulStorage.getUser();
    if (token != null && userJson != null) {
      try {
        final user = UserModel.fromJson(jsonDecode(userJson));
        ApiClient.instance.setAuthToken(token);
        state = state.copyWith(user: user, token: token, isLoggedIn: true);
      } catch (_) {
        await SoulStorage.clearToken();
      }
    }
  }

  /// Login with email + password
  Future<({bool success, String message})> login(
      String email, String password) async {
    state = state.copyWith(isLoading: true);
    final targetUrl = '${dio.options.baseUrl}${ApiConfig.auth}/login';
    print('[Auth] Request URL: $targetUrl');
    try {
      final res = await dio.post(
        '${ApiConfig.auth}/login',
        data: {'email': email, 'password': password},
      );
      final data = res.data;
      print('[Auth] Response data: $data');
      if (data['success'] == true && data['data'] != null) {
        final token = data['data']['token']?.toString() ?? '';
        final user = UserModel.fromJson(data['data']['user']);
        await SoulStorage.saveToken(token);
        await SoulStorage.saveUser(user.toJsonString());
        ApiClient.instance.setAuthToken(token);
        state = state.copyWith(
          user: user,
          token: token,
          isLoggedIn: true,
          isLoading: false,
        );
        return (success: true, message: 'Đăng nhập thành công');
      }
      state = state.copyWith(isLoading: false);
      return (
        success: false,
        message: data['message']?.toString() ?? 'Đăng nhập thất bại'
      );
    } on DioException catch (e) {
      print('[Auth] DioException: $e');
      if (e.response != null) {
        print('[Auth] Response error data: ${e.response?.data}');
      }
      state = state.copyWith(isLoading: false);
      final msg = e.response?.data?['message']?.toString() ??
          e.message ??
          'Đăng nhập thất bại';
      return (success: false, message: msg);
    } catch (e) {
      print('[Auth] General Exception: $e');
      state = state.copyWith(isLoading: false);
      return (success: false, message: e.toString());
    }
  }

  /// Register new account
  Future<({bool success, String message})> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
    String? gender,
    String? dateOfBirth,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await dio.post(
        '${ApiConfig.auth}/register',
        data: {
          'fullName': fullName,
          'email': email,
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          if (gender != null && gender.isNotEmpty) 'gender': gender,
          if (dateOfBirth != null && dateOfBirth.isNotEmpty)
            'dateOfBirth': dateOfBirth,
        },
      );
      state = state.copyWith(isLoading: false);
      final data = res.data;
      if (data['success'] == true) {
        return (success: true, message: data['message']?.toString() ?? 'Đăng ký thành công');
      }
      return (
        success: false,
        message: data['message']?.toString() ?? 'Đăng ký thất bại'
      );
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false);
      return (
        success: false,
        message: e.response?.data?['message']?.toString() ?? 'Đăng ký thất bại'
      );
    }
  }

  /// Set session from OAuth (Google)
  Future<void> setSession(String token, UserModel user) async {
    await SoulStorage.saveToken(token);
    await SoulStorage.saveUser(user.toJsonString());
    ApiClient.instance.setAuthToken(token);
    state = state.copyWith(user: user, token: token, isLoggedIn: true);
  }

  /// Logout
  Future<void> logout() async {
    ApiClient.instance.clearAuthToken();
    await SoulStorage.clearToken();
    state = const AuthState();
  }

  /// Update profile
  Future<({bool success, String message})> updateProfile({
    String? fullName,
    String? phone,
    String? gender,
    String? dateOfBirth,
    String? avatarUrl,
    String? bio,
  }) async {
    try {
      final res = await dio.put(
        '${ApiConfig.users}/profile',
        data: {
          if (fullName != null) 'fullName': fullName,
          if (phone != null) 'phone': phone,
          if (gender != null) 'gender': gender,
          if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
          if (avatarUrl != null) 'avatarUrl': avatarUrl,
          if (bio != null) 'bio': bio,
        },
      );
      if (res.data['success'] == true) {
        final updated = state.user!.copyWith(
          fullName: fullName,
          phone: phone,
          gender: gender,
          dateOfBirth: dateOfBirth,
          avatarUrl: avatarUrl,
          bio: bio,
        );
        state = state.copyWith(user: updated);
        await SoulStorage.saveUser(updated.toJsonString());
        return (success: true, message: 'Cập nhật thành công');
      }
      return (success: false, message: res.data['message']?.toString() ?? 'Thất bại');
    } on DioException catch (e) {
      return (
        success: false,
        message: e.response?.data?['message']?.toString() ?? 'Thất bại'
      );
    }
  }

  // ── Forgot Password Flow ─────────────────────────────────────────────────

  void setForgotEmail(String email) =>
      state = state.copyWith(forgotEmail: email);

  void setForgotCode(String code) => state = state.copyWith(forgotCode: code);

  Future<({bool success, String message, String? code})> requestOtp(
      String email) async {
    try {
      final res = await dio.post(
        '${ApiConfig.auth}/forgot-password',
        data: {'email': email},
      );
      final data = res.data;
      if (data['success'] == true) {
        return (
          success: true,
          message: data['message']?.toString() ?? 'OTP đã gửi',
          code: data['code']?.toString()
        );
      }
      return (
        success: false,
        message: data['message']?.toString() ?? 'Thất bại',
        code: null
      );
    } on DioException catch (e) {
      return (
        success: false,
        message:
            e.response?.data?['message']?.toString() ?? 'Không gửi được OTP',
        code: null
      );
    }
  }

  Future<({bool success, String message})> verifyOtp(String code) async {
    try {
      final res = await dio.post(
        '${ApiConfig.auth}/verify-otp',
        data: {'email': state.forgotEmail, 'code': code},
      );
      final data = res.data;
      if (data['success'] == true) {
        return (success: true, message: data['message']?.toString() ?? 'OTP hợp lệ');
      }
      return (success: false, message: data['message']?.toString() ?? 'OTP không hợp lệ');
    } on DioException catch (e) {
      return (
        success: false,
        message: e.response?.data?['message']?.toString() ?? 'Xác thực thất bại'
      );
    }
  }

  Future<({bool success, String message})> resetPass(
      String newPassword) async {
    try {
      final res = await dio.post(
        '${ApiConfig.auth}/reset-password',
        data: {
          'email': state.forgotEmail,
          'code': state.forgotCode,
          'newPassword': newPassword,
        },
      );
      final data = res.data;
      if (data['success'] == true) {
        return (success: true, message: data['message']?.toString() ?? 'Đặt lại mật khẩu thành công');
      }
      return (success: false, message: data['message']?.toString() ?? 'Thất bại');
    } on DioException catch (e) {
      return (
        success: false,
        message: e.response?.data?['message']?.toString() ?? 'Thất bại'
      );
    }
  }
}

// ── Riverpod Provider ────────────────────────────────────────────────────────

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);
