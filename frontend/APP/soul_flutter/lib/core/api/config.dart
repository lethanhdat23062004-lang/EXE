import 'package:flutter/foundation.dart' show kIsWeb;

/// API base URL configuration
/// Mirrors React Native src/api/config.ts
class ApiConfig {
  ApiConfig._();

  /// Change this to your backend IP address for Android device testing
  static const String _androidLocalUrl = 'http://192.168.2.43:5000/api';
  static const String _webLocalUrl = 'http://localhost:5000/api';

  /// Override with env variable at build time if needed
  /// e.g. flutter build apk --dart-define=API_URL=https://your-server.com/api
  static const String _envUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: '',
  );

  static String get baseUrl {
    if (_envUrl.isNotEmpty) return _envUrl;
    // Use localhost when running in browser (web), Android IP for native
    return kIsWeb ? _webLocalUrl : _androidLocalUrl;
  }

  // Endpoints
  static const String auth = '/auth';
  static const String diary = '/diary';
  static const String forum = '/forum';
  static const String emotionalTest = '/emotional-tests';
  static const String events = '/events';
  static const String userEvents = '/user-events';
  static const String notifications = '/notifications';
  static const String ratings = '/ratings';
  static const String chat = '/chat';
  static const String users = '/users';

  // Request timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
