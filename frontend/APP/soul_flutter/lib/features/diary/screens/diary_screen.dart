import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';

// ─── Luminous Modernist Palette ─────────────────────────────────────────────
class _C {
  static const primary = Color(0xFF630ED4);
  static const primaryContainer = Color(0xFF7C3AED);
  static const onPrimaryContainer = Color(0xFFEDE0FF);
  static const surface = Color(0xFFF9F9FB);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF3F3F5);
  static const outlineVariant = Color(0xFFCCC3D8);
  static const onSurface = Color(0xFF1A1C1D);
  static const onSurfaceVariant = Color(0xFF4A4455);
  static const primaryFixed = Color(0xFFEADDFF);
  static const secondaryFixed = Color(0xFFF0DBFF);
  static const onSecondaryFixedVariant = Color(0xFF6900B3);
  static const tertiaryFixed = Color(0xFF71F8E4);
  static const tertiaryFixedDim = Color(0xFF4FDBC8);
  static const tertiary = Color(0xFF005950);
  static const errorContainer = Color(0xFFFFDAD6);
  static const error = Color(0xFFBA1A1A);
}

// ─── Model ───────────────────────────────────────────────────────────────────

class _DiaryEntry {
  final String id;
  final String? title;
  final String content;
  final int? moodScore;
  final String? mood;
  final String? aiInsight;
  final DateTime createdAt;

  const _DiaryEntry({
    required this.id,
    this.title,
    required this.content,
    this.moodScore,
    this.mood,
    this.aiInsight,
    required this.createdAt,
  });

  factory _DiaryEntry.fromJson(Map<String, dynamic> json) {
    String? insightText;
    final raw = json['aiInsight'];
    if (raw is Map) {
      final summary = raw['summary']?.toString().trim();
      final suggestion = raw['suggestion']?.toString().trim();
      insightText = (summary?.isNotEmpty == true) ? summary : suggestion;
    } else if (raw is String && raw.trim().isNotEmpty) {
      insightText = raw.trim();
    }

    return _DiaryEntry(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString(),
      content: json['content']?.toString() ?? '',
      moodScore: (json['moodScore'] as num?)?.toInt(),
      mood: json['mood']?.toString(),
      aiInsight: insightText,
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  IconData get moodIcon {
    switch (mood?.toLowerCase()) {
      case 'happy': return Icons.favorite_rounded;
      case 'neutral': return Icons.psychology_rounded;
      case 'sad': return Icons.sentiment_dissatisfied_rounded;
      case 'stress':
      case 'stressed': return Icons.sentiment_very_dissatisfied_rounded;
      case 'anxious': return Icons.sentiment_dissatisfied_rounded;
      case 'angry': return Icons.sentiment_very_dissatisfied_rounded;
      default: return Icons.sentiment_satisfied_alt_rounded;
    }
  }

  Color get iconBg {
    switch (mood?.toLowerCase()) {
      case 'happy': return _C.tertiaryFixed;
      case 'neutral': return _C.primaryFixed;
      case 'sad':
      case 'stress':
      case 'stressed':
      case 'anxious':
      case 'angry': return _C.errorContainer;
      default: return _C.tertiaryFixedDim;
    }
  }

  Color get iconColor {
    switch (mood?.toLowerCase()) {
      case 'happy': return _C.tertiary;
      case 'neutral': return _C.primary;
      case 'sad':
      case 'stress':
      case 'stressed':
      case 'anxious':
      case 'angry': return _C.error;
      default: return _C.tertiary;
    }
  }

  List<String> get tags {
    final t = <String>[];
    final m = mood?.toLowerCase();
    if (m != null && m.isNotEmpty && m != 'neutral') t.add(m);
    if (aiInsight != null) t.add('AI insight');
    if (moodScore != null && moodScore! >= 8) t.add('great day');
    if (moodScore != null && moodScore! <= 3) t.add('tough day');
    return t.take(3).toList();
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

class DiaryScreen extends StatefulWidget {
  const DiaryScreen({super.key});

  @override
  State<DiaryScreen> createState() => _DiaryScreenState();
}

class _DiaryScreenState extends State<DiaryScreen> {
  List<_DiaryEntry> _entries = [];
  bool _loading = true;
  DateTime? _selectedDate; // null means show all entries
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  Future<void> _loadEntries() async {
    try {
      final res = await dio.get(ApiConfig.diaries);
      final data = res.data['data'] ?? res.data;
      final list = (data as List? ?? []);
      if (!mounted) return;
      setState(() {
        _entries = list
            .map((e) => _DiaryEntry.fromJson(e as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  List<_DiaryEntry> get _filteredEntries {
    if (_selectedDate == null) return _entries;
    return _entries.where((e) {
      return e.createdAt.year == _selectedDate!.year &&
          e.createdAt.month == _selectedDate!.month &&
          e.createdAt.day == _selectedDate!.day;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: _C.surface,
        body: Stack(
          children: [
            CustomScrollView(
              slivers: [
                SliverPersistentHeader(pinned: true, delegate: _HeaderDelegate()),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Your Diary',
                            style: GoogleFonts.manrope(
                                fontSize: 32,
                                fontWeight: FontWeight.w700,
                                color: _C.onSurface,
                                letterSpacing: -0.32)),
                        const SizedBox(height: 4),
                        Text('Reflecting on your inner world',
                            style: GoogleFonts.manrope(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _C.onSurfaceVariant)),
                        const SizedBox(height: 24),
                        _DatePicker(
                          selectedDate: _selectedDate,
                          allEntryDates:
                              _entries.map((e) => e.createdAt).toList(),
                          onDateSelected: (d) =>
                              setState(() => _selectedDate = d),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('ENTRIES',
                                style: GoogleFonts.manrope(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: _C.onSurfaceVariant,
                                    letterSpacing: 0.8)),
                            TextButton.icon(
                              onPressed: () =>
                                  setState(() => _selectedDate = null),
                              icon: const Icon(Icons.filter_list_rounded,
                                  size: 16, color: _C.primary),
                              label: Text('All',
                                  style: GoogleFonts.manrope(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: _C.primary)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _loading
                            ? _LoadingList()
                            : _filteredEntries.isEmpty
                                ? _EmptyState(
                                    onAdd: () =>
                                        setState(() => _showForm = true))
                                : _EntriesList(entries: _filteredEntries),
                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            if (_showForm)
              _DiaryForm(
                onClose: () => setState(() => _showForm = false),
                onSaved: () {
                  setState(() => _showForm = false);
                  _loadEntries();
                },
              ),

            if (!_showForm)
              Positioned(
                right: 24,
                bottom: 96,
                child: GestureDetector(
                  onTap: () => setState(() => _showForm = true),
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: _C.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                            color: _C.primary.withOpacity(0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 6))
                      ],
                    ),
                    child: const Icon(Icons.add_rounded,
                        color: Colors.white, size: 28),
                  ),
                ),
              ),

            Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: _BottomNav()),
          ],
        ),
      ),
    );
  }
}

// ─── Sticky Header ───────────────────────────────────────────────────────────

class _HeaderDelegate extends SliverPersistentHeaderDelegate {
  @override double get minExtent => 64;
  @override double get maxExtent => 64;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            color: _C.surface.withOpacity(0.85),
            border: const Border(bottom: BorderSide(color: Color(0x20CCC3D8))),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                const Icon(Icons.spa_rounded, color: _C.primary, size: 26),
                const SizedBox(width: 8),
                Text('SOUL',
                    style: GoogleFonts.manrope(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: _C.primary,
                        letterSpacing: -0.5)),
              ]),
              const Row(children: [
                Icon(Icons.notifications_outlined, color: _C.onSurface, size: 24),
                SizedBox(width: 12),
                Icon(Icons.account_circle_outlined,
                    color: _C.onSurface, size: 24),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(_HeaderDelegate old) => false;
}

// ─── Date Picker ─────────────────────────────────────────────────────────────

class _DatePicker extends StatefulWidget {
  final DateTime? selectedDate;
  final List<DateTime> allEntryDates;
  final ValueChanged<DateTime> onDateSelected;

  const _DatePicker({
    required this.selectedDate,
    required this.allEntryDates,
    required this.onDateSelected,
  });

  @override
  State<_DatePicker> createState() => _DatePickerState();
}

class _DatePickerState extends State<_DatePicker> {
  late DateTime _monthStart;
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    final initialDate = widget.selectedDate ?? DateTime.now();
    _monthStart = DateTime(initialDate.year, initialDate.month, 1);
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToSelected());
  }

  void _scrollToSelected() {
    final activeDate = widget.selectedDate ?? DateTime.now();
    final offset = (activeDate.day - 1) * 60.0;
    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(
        offset.clamp(0.0, _scrollCtrl.position.maxScrollExtent),
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  bool _hasEntry(DateTime date) => widget.allEntryDates.any(
      (d) => d.year == date.year && d.month == date.month && d.day == date.day);

  @override
  Widget build(BuildContext context) {
    final daysInMonth =
        DateUtils.getDaysInMonth(_monthStart.year, _monthStart.month);
    final monthLabel = DateFormat('MMMM yyyy').format(_monthStart);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(monthLabel,
                  style: GoogleFonts.manrope(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _C.onSurface)),
              Row(children: [
                _NavBtn(
                    icon: Icons.chevron_left_rounded,
                    onTap: () => setState(() => _monthStart =
                        DateTime(_monthStart.year, _monthStart.month - 1, 1))),
                const SizedBox(width: 8),
                _NavBtn(
                    icon: Icons.chevron_right_rounded,
                    onTap: () => setState(() => _monthStart =
                        DateTime(_monthStart.year, _monthStart.month + 1, 1))),
              ]),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 72,
            child: ListView.builder(
              controller: _scrollCtrl,
              scrollDirection: Axis.horizontal,
              itemCount: daysInMonth,
              itemBuilder: (context, i) {
                final date =
                    DateTime(_monthStart.year, _monthStart.month, i + 1);
                final isSelected = widget.selectedDate != null &&
                    date.year == widget.selectedDate!.year &&
                    date.month == widget.selectedDate!.month &&
                    date.day == widget.selectedDate!.day;
                final hasEntry = _hasEntry(date);
                final dayName =
                    DateFormat('E').format(date).substring(0, 3);

                return GestureDetector(
                  onTap: () => widget.onDateSelected(date),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 52,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? _C.primaryContainer
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(dayName,
                            style: GoogleFonts.manrope(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: isSelected
                                    ? _C.onPrimaryContainer
                                    : _C.onSurfaceVariant)),
                        const SizedBox(height: 4),
                        Text('${i + 1}',
                            style: GoogleFonts.manrope(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isSelected
                                    ? _C.onPrimaryContainer
                                    : _C.onSurface)),
                        const SizedBox(height: 2),
                        hasEntry && !isSelected
                            ? Container(
                                width: 5,
                                height: 5,
                                decoration: const BoxDecoration(
                                    color: _C.primary,
                                    shape: BoxShape.circle))
                            : const SizedBox(height: 5),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _NavBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
              color: const Color(0xFFF3F3F5),
              borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 20, color: _C.onSurface),
        ),
      );
}

// ─── Entry List & Card ────────────────────────────────────────────────────────

class _EntriesList extends StatelessWidget {
  final List<_DiaryEntry> entries;
  const _EntriesList({required this.entries});

  @override
  Widget build(BuildContext context) => Column(
        children: List.generate(entries.length, (i) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _EntryCard(entry: entries[i]),
        )),
      );
}

class _EntryCard extends StatelessWidget {
  final _DiaryEntry entry;
  const _EntryCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final diff = now.difference(entry.createdAt);
    final String timeStr = diff.inDays == 0
        ? DateFormat('hh:mm a').format(entry.createdAt)
        : diff.inDays == 1
            ? 'Yesterday'
            : DateFormat('MMM d').format(entry.createdAt);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _C.outlineVariant.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, 4))
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration:
                BoxDecoration(color: entry.iconBg, shape: BoxShape.circle),
            child: Icon(entry.moodIcon, color: entry.iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        entry.title?.isNotEmpty == true
                            ? entry.title!
                            : _defaultTitle(entry.mood),
                        style: GoogleFonts.manrope(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: _C.onSurface),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(timeStr,
                        style: GoogleFonts.manrope(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _C.onSurfaceVariant)),
                  ],
                ),
                if (entry.content.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(entry.content,
                      style: GoogleFonts.manrope(
                          fontSize: 14,
                          color: _C.onSurfaceVariant,
                          height: 1.5),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                ],
                if (entry.aiInsight != null &&
                    entry.aiInsight!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(children: [
                    const Icon(Icons.auto_awesome,
                        size: 12, color: _C.primary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(entry.aiInsight!,
                          style: GoogleFonts.manrope(
                              fontSize: 12,
                              color: _C.primary,
                              height: 1.4),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                  ]),
                ],
                if (entry.tags.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    children: entry.tags
                        .map((t) => _Tag(label: '#$t'))
                        .toList(),
                  ),
                ],
                if (entry.moodScore != null) ...[
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _C.primaryFixed,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text('${entry.moodScore}/10',
                          style: GoogleFonts.manrope(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _C.primary)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _defaultTitle(String? mood) {
    switch (mood?.toLowerCase()) {
      case 'happy': return 'Grateful Moment';
      case 'sad': return 'Feeling Down';
      case 'stress':
      case 'stressed': return 'Feeling Overwhelmed';
      case 'anxious': return 'Anxious Thoughts';
      case 'angry': return 'Frustrating Day';
      default: return 'Daily Reflection';
    }
  }
}

class _Tag extends StatelessWidget {
  final String label;
  const _Tag({required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: _C.secondaryFixed,
            borderRadius: BorderRadius.circular(999)),
        child: Text(label,
            style: GoogleFonts.manrope(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: _C.onSecondaryFixedVariant,
                letterSpacing: 0.5)),
      );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

class _LoadingList extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Column(
        children: List.generate(
          3,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              height: 110,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: _C.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                        color: _C.outlineVariant.withOpacity(0.3),
                        shape: BoxShape.circle)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                          height: 14,
                          width: 140,
                          decoration: BoxDecoration(
                              color: _C.outlineVariant.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(4))),
                      const SizedBox(height: 10),
                      Container(
                          height: 12,
                          width: double.infinity,
                          decoration: BoxDecoration(
                              color: _C.outlineVariant.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4))),
                      const SizedBox(height: 6),
                      Container(
                          height: 12,
                          width: 200,
                          decoration: BoxDecoration(
                              color: _C.outlineVariant.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4))),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ),
      );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyState({required this.onAdd});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Column(children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                  color: _C.primaryFixed, shape: BoxShape.circle),
              child: const Icon(Icons.book_outlined,
                  size: 36, color: _C.primary),
            ),
            const SizedBox(height: 16),
            Text('No entries this day',
                style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: _C.onSurface)),
            const SizedBox(height: 6),
            Text('Tap + to write about today',
                style: GoogleFonts.manrope(
                    fontSize: 14, color: _C.onSurfaceVariant)),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: onAdd,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                    color: _C.primary,
                    borderRadius: BorderRadius.circular(999)),
                child: Text('Write Now',
                    style: GoogleFonts.manrope(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
              ),
            ),
          ]),
        ),
      );
}

// ─── Diary Form ───────────────────────────────────────────────────────────────

class _DiaryForm extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onSaved;
  const _DiaryForm({required this.onClose, required this.onSaved});

  @override
  State<_DiaryForm> createState() => _DiaryFormState();
}

class _DiaryFormState extends State<_DiaryForm> {
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  int _moodScore = 5;
  String _selectedMood = 'neutral';
  bool _saving = false;

  final _moodOptions = const [
    ('😊', 'happy'),
    ('😌', 'neutral'),
    ('😔', 'sad'),
    ('😵', 'stress'),
    ('😟', 'anxious'),
    ('😤', 'angry'),
  ];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_contentCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await dio.post(ApiConfig.diaries, data: {
        'title': _titleCtrl.text.trim().isNotEmpty
            ? _titleCtrl.text.trim()
            : null,
        'content': _contentCtrl.text.trim(),
        'moodScore': _moodScore,
        'mood': _selectedMood,
      });
      widget.onSaved();
    } catch (_) {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onClose,
      child: Container(
        color: Colors.black54,
        child: GestureDetector(
          onTap: () {},
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              height: MediaQuery.of(context).size.height * 0.88,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius:
                    BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(children: [
                Container(
                  width: 40,
                  height: 4,
                  margin:
                      const EdgeInsets.only(top: 12, bottom: 8),
                  decoration: BoxDecoration(
                      color: _C.outlineVariant,
                      borderRadius: BorderRadius.circular(2)),
                ),
                Padding(
                  padding:
                      const EdgeInsets.fromLTRB(20, 4, 8, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Write in Diary',
                          style: GoogleFonts.manrope(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: _C.onSurface)),
                      IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: widget.onClose),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding:
                        const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('How are you feeling?',
                            style: GoogleFonts.manrope(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _C.onSurface)),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: _moodOptions.map((m) {
                            final selected = _selectedMood == m.$2;
                            return GestureDetector(
                              onTap: () => setState(
                                  () => _selectedMood = m.$2),
                              child: AnimatedContainer(
                                duration:
                                    const Duration(milliseconds: 150),
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: selected
                                      ? _C.primaryFixed
                                      : const Color(0xFFF3F3F5),
                                  borderRadius:
                                      BorderRadius.circular(12),
                                  border: Border.all(
                                    color: selected
                                        ? _C.primary
                                        : _C.outlineVariant,
                                    width: selected ? 2 : 1,
                                  ),
                                ),
                                child: Center(
                                    child: Text(m.$1,
                                        style: const TextStyle(
                                            fontSize: 22))),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Mood Score',
                                style: GoogleFonts.manrope(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: _C.onSurface)),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                  color: _C.primaryFixed,
                                  borderRadius:
                                      BorderRadius.circular(999)),
                              child: Text('$_moodScore/10',
                                  style: GoogleFonts.manrope(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: _C.primary)),
                            ),
                          ],
                        ),
                        SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            activeTrackColor: _C.primary,
                            thumbColor: _C.primary,
                            inactiveTrackColor: _C.outlineVariant,
                            overlayColor:
                                _C.primary.withOpacity(0.1),
                          ),
                          child: Slider(
                            value: _moodScore.toDouble(),
                            min: 1,
                            max: 10,
                            divisions: 9,
                            onChanged: (v) => setState(
                                () => _moodScore = v.toInt()),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text('Title (optional)',
                            style: GoogleFonts.manrope(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _C.onSurface)),
                        const SizedBox(height: 8),
                        _Field(
                            controller: _titleCtrl,
                            hint: 'Today I felt...',
                            maxLines: 1),
                        const SizedBox(height: 16),
                        Text('Content *',
                            style: GoogleFonts.manrope(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _C.onSurface)),
                        const SizedBox(height: 8),
                        _Field(
                            controller: _contentCtrl,
                            hint:
                                'Write about your thoughts and feelings...',
                            maxLines: 6),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _saving ? null : _save,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _C.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  vertical: 16),
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(14)),
                              elevation: 0,
                              textStyle: GoogleFonts.manrope(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700),
                            ),
                            child: _saving
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2))
                                : const Text('Save Entry'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;
  const _Field(
      {required this.controller, required this.hint, this.maxLines = 1});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: _C.surfaceContainerLow,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _C.outlineVariant, width: 1.5),
        ),
        child: TextField(
          controller: controller,
          maxLines: maxLines,
          style: GoogleFonts.manrope(
              fontSize: 14, color: _C.onSurface, height: 1.5),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.manrope(
                color: _C.onSurfaceVariant.withOpacity(0.5),
                fontSize: 14),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.all(14),
          ),
        ),
      );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

class _BottomNav extends StatelessWidget {
  static const _items = [
    (Icons.home_rounded, 'Home', '/home'),
    (Icons.edit_note_rounded, 'Diary', '/diary'),
    (Icons.psychology_rounded, 'AI Guide', '/ai-chat'),
    (Icons.event_rounded, 'Events', '/events'),
    (Icons.group_rounded, 'Community', '/forum'),
  ];

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    return ClipRRect(
      borderRadius:
          const BorderRadius.vertical(top: Radius.circular(20)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 80,
          decoration: BoxDecoration(
            color: _C.surface.withOpacity(0.92),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(20)),
            border: const Border(
                top: BorderSide(color: Color(0x15CCC3D8))),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, -4))
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _items.map((item) {
              final active = loc == item.$3;
              return GestureDetector(
                onTap: () => context.go(item.$3),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                  decoration: active
                      ? BoxDecoration(
                          color: _C.onPrimaryContainer,
                          borderRadius: BorderRadius.circular(999))
                      : null,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(item.$1,
                          size: 22,
                          color: active
                              ? _C.primaryContainer
                              : _C.onSurfaceVariant),
                      const SizedBox(height: 2),
                      Text(item.$2,
                          style: GoogleFonts.manrope(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: active
                                  ? _C.primaryContainer
                                  : _C.onSurfaceVariant)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
