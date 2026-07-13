import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'soul_bottom_nav.dart';

/// Shell scaffold wrapping tab screens with bottom nav
class SoulScaffold extends StatelessWidget {
  final Widget child;

  const SoulScaffold({super.key, required this.child});

  int _getIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/forum')) return 1;
    return 0; // home
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: SoulBottomNav(currentIndex: _getIndex(context)),
    );
  }
}
