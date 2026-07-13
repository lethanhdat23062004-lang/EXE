import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api/api_client.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize Dio HTTP client
  ApiClient.instance.init();
  runApp(
    const ProviderScope(
      child: SoulApp(),
    ),
  );
}