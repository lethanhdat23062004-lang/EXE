import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';

// ── Models ────────────────────────────────────────────────────────────────────

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
      case 'completed': return SoulColors.textMuted;
      default: return SoulColors.primary;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Đã kết thúc';
      default: return status;
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

// ── Screen ────────────────────────────────────────────────────────────────────

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  List<EventModel> _allEvents = [];
  List<EventModel> _myEvents = [];
  bool _loadingAll = true;
  bool _loadingMy = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _loadAll();
    _loadMy();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    try {
      final res = await dio.get(ApiConfig.events);
      final data = (res.data['data'] ?? res.data) as List? ?? [];
      setState(() {
        _allEvents = data.map((e) => EventModel.fromJson(e as Map<String, dynamic>)).toList();
        _loadingAll = false;
      });
    } catch (_) {
      setState(() => _loadingAll = false);
    }
  }

  Future<void> _loadMy() async {
    try {
      final res = await dio.get(ApiConfig.userEvents);
      final data = (res.data['data'] ?? res.data) as List? ?? [];
      setState(() {
        _myEvents = data.map((e) {
          final evt = e['event'] ?? e;
          return EventModel.fromJson(evt as Map<String, dynamic>);
        }).toList();
        _loadingMy = false;
      });
    } catch (_) {
      setState(() => _loadingMy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: const Text('Sự kiện & Workshop'),
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: SoulColors.primary,
          unselectedLabelColor: SoulColors.textMuted,
          indicatorColor: SoulColors.primary,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          tabs: const [
            Tab(text: 'Tất cả sự kiện'),
            Tab(text: 'Của tôi'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _EventList(events: _allEvents, loading: _loadingAll, onRefresh: _loadAll, showRegister: true),
          _EventList(events: _myEvents, loading: _loadingMy, onRefresh: _loadMy, showRegister: false),
        ],
      ),
    );
  }
}

// ── Event List ────────────────────────────────────────────────────────────────

class _EventList extends StatelessWidget {
  final List<EventModel> events;
  final bool loading;
  final Future<void> Function() onRefresh;
  final bool showRegister;

  const _EventList({
    required this.events,
    required this.loading,
    required this.onRefresh,
    required this.showRegister,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: SoulColors.primary));
    }
    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.event_busy_outlined, size: 64, color: SoulColors.textFaint),
            SizedBox(height: 16),
            Text('Chưa có sự kiện nào', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: SoulColors.textMuted)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: SoulColors.primary,
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: events.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (ctx, i) => _EventCard(event: events[i], showRegister: showRegister),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final EventModel event;
  final bool showRegister;

  const _EventCard({required this.event, required this.showRegister});

  @override
  Widget build(BuildContext context) {
    final dateStr = event.eventDate != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(event.eventDate!)
        : 'Chưa có lịch';

    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: SoulColors.subtleShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header gradient
            Container(
              height: 80,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEDE9FE), Color(0xFFCCFBF1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(event.typeIcon, color: SoulColors.primary, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: event.statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(event.statusLabel,
                            style: TextStyle(fontSize: 11, color: event.statusColor, fontWeight: FontWeight.w700)),
                        ),
                        const SizedBox(height: 3),
                        Text(event.typeLabel,
                          style: const TextStyle(fontSize: 12, color: SoulColors.textMuted)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: SoulColors.textFaint),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                  if (event.description != null) ...[
                    const SizedBox(height: 4),
                    Text(event.description!,
                      style: const TextStyle(fontSize: 13, color: SoulColors.textMuted, height: 1.4),
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.schedule_outlined, size: 14, color: SoulColors.textFaint),
                      const SizedBox(width: 4),
                      Text(dateStr, style: const TextStyle(fontSize: 12, color: SoulColors.textMuted)),
                      if (event.location != null) ...[
                        const SizedBox(width: 10),
                        const Icon(Icons.location_on_outlined, size: 14, color: SoulColors.textFaint),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(event.location!,
                            style: const TextStyle(fontSize: 12, color: SoulColors.textMuted),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      ],
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
