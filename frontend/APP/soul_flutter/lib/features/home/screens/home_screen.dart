import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';
import '../../auth/providers/auth_provider.dart';

// ─── Local EventModel ────────────────────────────────────────────────────────

class EventModel {
  final String id;
  final String title;
  final String? description;
  final String? eventType;
  final String? location;
  final DateTime? eventDate;
  final String status;
  final int? maxParticipants;

  const EventModel({
    required this.id,
    required this.title,
    this.description,
    this.eventType,
    this.location,
    this.eventDate,
    required this.status,
    this.maxParticipants,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) => EventModel(
        id: json['_id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        description: json['description']?.toString(),
        eventType: json['eventType']?.toString(),
        location: json['location']?.toString(),
        eventDate: DateTime.tryParse(json['eventDate']?.toString() ?? ''),
        status: json['status']?.toString() ?? 'upcoming',
        maxParticipants: (json['maxParticipants'] as num?)?.toInt(),
      );

  Color get statusColor {
    switch (status) {
      case 'ongoing': return const Color(0xFF0F766E);
      case 'completed': return const Color(0xFF9E9E9E);
      default: return _LM.primary;
    }
  }

  String get typeLabel {
    switch (eventType) {
      case 'workshop': return 'Workshop';
      case 'talkshow': return 'Talkshow';
      case 'webinar': return 'Webinar';
      default: return eventType ?? 'Sự kiện';
    }
  }

  IconData get typeIcon {
    switch (eventType) {
      case 'workshop': return Icons.handyman_outlined;
      case 'talkshow': return Icons.mic_outlined;
      case 'webinar': return Icons.video_call_outlined;
      default: return Icons.event_outlined;
    }
  }
}

// ─── Luminous Modernist Palette (matches HTML) ─────────────────────────────
class _LM {
  static const Color primary = Color(0xFF630ED4);
  static const Color primaryContainer = Color(0xFF7C3AED);
  static const Color onPrimaryContainer = Color(0xFFEDE0FF);
  static const Color surface = Color(0xFFF9F9FB);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF3F3F5);
  static const Color onSurface = Color(0xFF1A1C1D);
  static const Color onSurfaceVariant = Color(0xFF4A4455);
  static const Color outlineVariant = Color(0xFFCCC3D8);
  static const Color secondaryFixed = Color(0xFFF0DBFF);
  static const Color secondary = Color(0xFF8127CF);
  static const Color tertiaryFixed = Color(0xFF71F8E4);
  static const Color tertiary = Color(0xFF005950);
}

// ─── Mood Data ──────────────────────────────────────────────────────────────
const _moodItems = [
  _MoodItem(emoji: '😔', label: 'Sad'),
  _MoodItem(emoji: '😐', label: 'Meh'),
  _MoodItem(emoji: '😊', label: 'Good'),
  _MoodItem(emoji: '🤩', label: 'Great'),
];

// ─── Event images fallback by type ──────────────────────────────────────────
String _eventImageForType(String? type) {
  switch (type) {
    case 'webinar': return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=560&q=80';
    case 'talkshow': return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=560&q=80';
    case 'workshop': return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=560&q=80';
    default: return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=560&q=80';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────────────────────────

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _navIndex = 0;
  final _routes = ['/home', '/diary', '/ai-chat', '/events', '/forum'];

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.firstName ?? 'Sarah';

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: _LM.surface,
        body: Stack(
          children: [
            // ── Scrollable Content ─────────────────────────────────────────
            CustomScrollView(
              slivers: [
                // ── Sticky Header ──────────────────────────────────────────
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _StickyHeaderDelegate(firstName: firstName),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Welcome ──────────────────────────────────────
                        _WelcomeSection(firstName: firstName),
                        const SizedBox(height: 24),

                        // ── Mood Tracker ──────────────────────────────────
                        _MoodTrackerCard(),
                        const SizedBox(height: 16),

                        // ── AI Insight + Bento Grid ───────────────────────
                        _BentoGrid(),
                        const SizedBox(height: 24),

                        // ── Upcoming Events ───────────────────────────────
                        _UpcomingEvents(),
                        const SizedBox(height: 100), // space for bottom nav
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // ── FAB ────────────────────────────────────────────────────────
            Positioned(
              right: 24,
              bottom: 96,
              child: _FabButton(),
            ),

            // ── Bottom Navigation ──────────────────────────────────────────
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _BottomNav(
                currentIndex: _navIndex,
                onTap: (i) {
                  setState(() => _navIndex = i);
                  context.go(_routes[i]);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky Header Delegate
// ─────────────────────────────────────────────────────────────────────────────

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String firstName;
  const _StickyHeaderDelegate({required this.firstName});

  @override
  double get minExtent => 64;
  @override
  double get maxExtent => 64;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            color: _LM.surface.withOpacity(0.85),
            border: const Border(
              bottom: BorderSide(color: Color(0x20CCC3D8)),
            ),
            boxShadow: overlapsContent
                ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 2))]
                : null,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Brand
              Row(
                children: [
                  const Icon(Icons.spa_rounded, color: _LM.primary, size: 26),
                  const SizedBox(width: 8),
                  Text(
                    'SOUL',
                    style: GoogleFonts.manrope(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: _LM.primary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              // Actions
              Row(
                children: [
                  _IconBtn(Icons.notifications_outlined, onTap: () {}),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => context.push('/profile'),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: _LM.onPrimaryContainer,
                        shape: BoxShape.circle,
                        border: Border.all(color: _LM.outlineVariant),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U',
                        style: GoogleFonts.manrope(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: _LM.primary,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(_StickyHeaderDelegate old) => old.firstName != firstName;
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome Section
// ─────────────────────────────────────────────────────────────────────────────

class _WelcomeSection extends StatelessWidget {
  final String firstName;
  const _WelcomeSection({required this.firstName});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome back, $firstName',
          style: GoogleFonts.manrope(
            fontSize: 32,
            fontWeight: FontWeight.w700,
            color: _LM.onSurface,
            letterSpacing: -0.01 * 32,
            height: 1.25,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'How are you feeling today?',
          style: GoogleFonts.manrope(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: _LM.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood Tracker Card
// ─────────────────────────────────────────────────────────────────────────────

class _MoodTrackerCard extends StatefulWidget {
  @override
  State<_MoodTrackerCard> createState() => _MoodTrackerCardState();
}

class _MoodTrackerCardState extends State<_MoodTrackerCard> {
  int _selectedMood = 2; // 'Good' selected by default
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _TonalCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'MOOD TRACKER',
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _LM.onSurface,
                  letterSpacing: 0.8,
                ),
              ),
              Text(
                'Daily Goal 80%',
                style: GoogleFonts.manrope(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: _LM.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Emoji buttons
          Row(
            children: List.generate(_moodItems.length, (i) {
              final selected = _selectedMood == i;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < _moodItems.length - 1 ? 8 : 0),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedMood = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: selected ? _LM.primary.withOpacity(0.07) : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected ? _LM.primary : _LM.outlineVariant.withOpacity(0.5),
                          width: selected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(_moodItems[i].emoji, style: const TextStyle(fontSize: 24)),
                          const SizedBox(height: 4),
                          Text(
                            _moodItems[i].label,
                            style: GoogleFonts.manrope(
                              fontSize: 12,
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                              color: selected ? _LM.primary : _LM.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),

          // Textarea + Save button
          Stack(
            children: [
              Container(
                height: 96,
                decoration: BoxDecoration(
                  color: _LM.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _LM.outlineVariant.withOpacity(0.5)),
                ),
                child: TextField(
                  controller: _controller,
                  maxLines: null,
                  expands: true,
                  textAlignVertical: TextAlignVertical.top,
                  decoration: InputDecoration(
                    hintText: 'Start writing your thoughts...',
                    hintStyle: GoogleFonts.manrope(
                      fontSize: 16,
                      color: _LM.onSurfaceVariant.withOpacity(0.6),
                    ),
                    contentPadding: const EdgeInsets.fromLTRB(16, 12, 110, 12),
                    border: InputBorder.none,
                  ),
                  style: GoogleFonts.manrope(fontSize: 16, color: _LM.onSurface),
                ),
              ),
              Positioned(
                right: 12,
                bottom: 10,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _LM.primary,
                    foregroundColor: Colors.white,
                    elevation: 2,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: const StadiumBorder(),
                    textStyle: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  child: const Text('Save Reflection'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento Grid – AI Insight + Diary + Tests
// ─────────────────────────────────────────────────────────────────────────────

class _BentoGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // AI Insight – full width
        _AiInsightCard(),
        const SizedBox(height: 16),

        // Diary + Tests side by side
        Row(
          children: [
            Expanded(child: _BentoSquare(
              icon: Icons.edit_note_rounded,
              label: 'Diary',
              iconBg: _LM.secondaryFixed,
              iconColor: _LM.secondary,
              onTap: () => context.push('/diary'),
            )),
            const SizedBox(width: 16),
            Expanded(child: _BentoSquare(
              icon: Icons.quiz_rounded,
              label: 'Tests',
              iconBg: _LM.tertiaryFixed,
              iconColor: _LM.tertiary,
              onTap: () => context.push('/emotional-test'),
            )),
          ],
        ),
      ],
    );
  }
}

class _AiInsightCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _LM.primaryContainer,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: _LM.primary.withOpacity(0.18), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Stack(
        children: [
          // Decorative circle
          Positioned(
            right: -16,
            top: -16,
            child: Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: _LM.onPrimaryContainer.withOpacity(0.10),
                shape: BoxShape.circle,
              ),
            ),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.psychology_rounded, color: _LM.onPrimaryContainer, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'AI Insight',
                        style: GoogleFonts.manrope(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: _LM.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                  const Icon(Icons.auto_awesome, color: _LM.onPrimaryContainer, size: 16, fill: 0),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Your "Calm" entries have increased by 20% since you started the Daily Gratitude habit. Keep it up!',
                style: GoogleFonts.manrope(
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                  color: _LM.onPrimaryContainer,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BentoSquare extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color iconBg;
  final Color iconColor;
  final VoidCallback onTap;

  const _BentoSquare({
    required this.icon,
    required this.label,
    required this.iconBg,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: _TonalCard(
        child: AspectRatio(
          aspectRatio: 1,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _LM.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming Events – connected to backend
// ─────────────────────────────────────────────────────────────────────────────

class _UpcomingEvents extends StatefulWidget {
  @override
  State<_UpcomingEvents> createState() => _UpcomingEventsState();
}

class _UpcomingEventsState extends State<_UpcomingEvents> {
  List<EventModel> _events = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    try {
      final res = await dio.get(
        ApiConfig.events,
        queryParameters: {'status': 'upcoming', 'limit': 5},
      );
      final raw = (res.data['data'] ?? res.data) as List? ?? [];
      if (!mounted) return;
      setState(() {
        _events = raw
            .map((e) => EventModel.fromJson(e as Map<String, dynamic>))
            .where((e) => e.status == 'upcoming' || e.status == 'ongoing')
            .take(5)
            .toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Không tải được sự kiện';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Events',
              style: GoogleFonts.manrope(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: _LM.onSurface,
                letterSpacing: -0.01 * 24,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/events'),
              child: Text(
                'See All',
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _LM.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 230,
          child: _loading
              ? ListView.separated(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  itemCount: 3,
                  separatorBuilder: (_, __) => const SizedBox(width: 16),
                  itemBuilder: (_, __) => _EventCardSkeleton(),
                )
              : _error != null || _events.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.event_busy_rounded, size: 40, color: _LM.outlineVariant),
                          const SizedBox(height: 8),
                          Text(
                            _error ?? 'Chưa có sự kiện sắp tới',
                            style: GoogleFonts.manrope(
                              fontSize: 14,
                              color: _LM.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      scrollDirection: Axis.horizontal,
                      clipBehavior: Clip.none,
                      itemCount: _events.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 16),
                      itemBuilder: (context, i) => _EventCard(event: _events[i]),
                    ),
        ),
      ],
    );
  }
}

class _EventCard extends StatelessWidget {
  final EventModel event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    final dateStr = event.eventDate != null
        ? DateFormat('MMM dd').format(event.eventDate!).toUpperCase()
        : '';
    final isOnline = event.eventType == 'webinar';
    final imageUrl = _eventImageForType(event.eventType);

    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          color: _LM.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4)),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            SizedBox(
              height: 128,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: _LM.onPrimaryContainer,
                      child: Icon(event.typeIcon, color: Colors.white54, size: 40),
                    ),
                  ),
                  // Type badge
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: event.statusColor.withOpacity(0.92),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        event.typeLabel,
                        style: GoogleFonts.manrope(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  if (dateStr.isNotEmpty)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            color: Colors.white.withOpacity(0.9),
                            child: Text(
                              dateStr,
                              style: GoogleFonts.manrope(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: _LM.primary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Info
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: GoogleFonts.manrope(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _LM.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        isOnline ? Icons.videocam_outlined : Icons.location_on_outlined,
                        size: 14,
                        color: _LM.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          event.location ?? (isOnline ? 'Online' : 'TBA'),
                          style: GoogleFonts.manrope(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _LM.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Skeleton loading card ─────────────────────────────────────────────────────

class _EventCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      decoration: BoxDecoration(
        color: _LM.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 128, color: _LM.outlineVariant.withOpacity(0.25)),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 14, width: 160, decoration: BoxDecoration(color: _LM.outlineVariant.withOpacity(0.3), borderRadius: BorderRadius.circular(4))),
                const SizedBox(height: 8),
                Container(height: 12, width: 100, decoration: BoxDecoration(color: _LM.outlineVariant.withOpacity(0.2), borderRadius: BorderRadius.circular(4))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FAB
// ─────────────────────────────────────────────────────────────────────────────

class _FabButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/diary'),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: _LM.primary,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: _LM.primary.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Navigation
// ─────────────────────────────────────────────────────────────────────────────

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _BottomNav({required this.currentIndex, required this.onTap});

  static const _items = [
    _NavItem(icon: Icons.home_rounded, label: 'Home'),
    _NavItem(icon: Icons.edit_note_rounded, label: 'Diary'),
    _NavItem(icon: Icons.psychology_rounded, label: 'AI Guide'),
    _NavItem(icon: Icons.event_rounded, label: 'Events'),
    _NavItem(icon: Icons.group_rounded, label: 'Community'),
  ];

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 80,
          decoration: BoxDecoration(
            color: _LM.surface.withOpacity(0.92),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: const Border(top: BorderSide(color: Color(0x15CCC3D8))),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -4)),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_items.length, (i) {
              final active = currentIndex == i;
              return GestureDetector(
                onTap: () => onTap(i),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: active
                      ? BoxDecoration(
                          color: _LM.onPrimaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        )
                      : null,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _items[i].icon,
                        size: 22,
                        color: active ? _LM.primaryContainer : _LM.onSurfaceVariant,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _items[i].label,
                        style: GoogleFonts.manrope(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: active ? _LM.primaryContainer : _LM.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Tonal Card Widget
// ─────────────────────────────────────────────────────────────────────────────

class _TonalCard extends StatelessWidget {
  final Widget child;
  const _TonalCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _LM.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4)),
        ],
      ),
      child: child,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Small icon button
// ─────────────────────────────────────────────────────────────────────────────

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconBtn(this.icon, {required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.transparent,
        ),
        child: Icon(icon, color: _LM.onSurface, size: 24),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Models
// ─────────────────────────────────────────────────────────────────────────────

class _MoodItem {
  final String emoji;
  final String label;
  const _MoodItem({required this.emoji, required this.label});
}

class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem({required this.icon, required this.label});
}
