import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/constants/colors.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/auth/screens/forgot_screen.dart';
import 'features/auth/screens/verify_screen.dart';
import 'features/auth/screens/recovery_screen.dart';
import 'features/auth/screens/congrats_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/home/screens/admin_dashboard_screen.dart';
import 'features/home/screens/profile_screen.dart';
import 'features/ai_chat/screens/ai_chat_screen.dart';
import 'features/diary/screens/diary_screen.dart';
import 'features/emotional_test/screens/emotional_test_main.dart';
import 'features/emotional_test/screens/emotional_assessment.dart';
import 'features/emotional_test/screens/emotional_result.dart';
import 'features/events/screens/events_screen.dart';
import 'features/events/screens/event_detail_screen.dart';
import 'features/forum/screens/forum_screen.dart';
import 'shared/widgets/soul_scaffold.dart';

class SoulApp extends ConsumerWidget {
  const SoulApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    final router = GoRouter(
      initialLocation: authState.isLoggedIn
          ? (authState.user?.isAdmin == true ? '/admin' : '/home')
          : '/login',
      redirect: (context, state) {
        final loggedIn = authState.isLoggedIn;
        final loggingIn = state.matchedLocation == '/login' ||
            state.matchedLocation == '/register' ||
            state.matchedLocation.startsWith('/forgot') ||
            state.matchedLocation == '/congrats';

        if (!loggedIn && !loggingIn) return '/login';
        
        if (loggedIn) {
          final isAdmin = authState.user?.isAdmin == true;
          if (loggingIn) {
            return isAdmin ? '/admin' : '/home';
          }
          if (!isAdmin && state.matchedLocation.startsWith('/admin')) {
            return '/home';
          }
          if (isAdmin && (state.matchedLocation == '/home' || state.matchedLocation == '/forum')) {
            return '/admin';
          }
        }
        return null;
      },
      routes: [
        // Auth routes
        GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
        GoRoute(path: '/register', builder: (c, s) => const RegisterScreen()),
        GoRoute(path: '/forgot', builder: (c, s) => const ForgotScreen()),
        GoRoute(path: '/verify', builder: (c, s) => const VerifyScreen()),
        GoRoute(path: '/recovery', builder: (c, s) => const RecoveryScreen()),
        GoRoute(path: '/congrats', builder: (c, s) => const CongratsScreen()),

        // Main app shell
        ShellRoute(
          builder: (context, state, child) => SoulScaffold(child: child),
          routes: [
            GoRoute(path: '/home', builder: (c, s) => const HomeScreen()),
            GoRoute(path: '/forum', builder: (c, s) => const ForumScreen()),
          ],
        ),

        // Admin route
        GoRoute(path: '/admin', builder: (c, s) => const AdminDashboardScreen()),

        // Profile route
        GoRoute(path: '/profile', builder: (c, s) => const ProfileScreen()),

        // Full-screen routes (no bottom nav)
        GoRoute(path: '/ai-chat', builder: (c, s) => const AiChatScreen()),
        GoRoute(path: '/diary', builder: (c, s) => const DiaryScreen()),
        GoRoute(
          path: '/emotional-test',
          builder: (c, s) => const EmotionalTestMainScreen(),
        ),
        GoRoute(
          path: '/emotional-test/assessment',
          builder: (c, s) {
            final type = s.uri.queryParameters['type'] ?? 'WHO5';
            return EmotionalAssessmentScreen(testType: type);
          },
        ),
        GoRoute(
          path: '/emotional-test/result',
          builder: (c, s) {
            final score = int.tryParse(s.uri.queryParameters['score'] ?? '0') ?? 0;
            final type = s.uri.queryParameters['type'] ?? 'WHO5';
            return EmotionalResultScreen(score: score, testType: type);
          },
        ),
        GoRoute(path: '/events', builder: (c, s) => const EventsScreen()),
        GoRoute(
          path: '/events/:id',
          builder: (c, s) => EventDetailScreen(eventId: s.pathParameters['id']!),
        ),
      ],
    );

    return MaterialApp.router(
      title: 'SOUL',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Inter',
        colorScheme: ColorScheme.fromSeed(
          seedColor: SoulColors.primary,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F3FF),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF1E293B),
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E293B),
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(fontFamily: 'Inter', color: Color(0xFF1E293B)),
          bodyMedium: TextStyle(fontFamily: 'Inter', color: Color(0xFF64748B)),
          bodySmall: TextStyle(fontFamily: 'Inter', color: Color(0xFF94A3B8)),
        ),
      ),
    );
  }
}
