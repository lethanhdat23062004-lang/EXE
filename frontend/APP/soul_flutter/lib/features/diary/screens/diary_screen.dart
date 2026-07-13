import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';
import '../../../shared/widgets/gradient_button.dart';

// ── Models ────────────────────────────────────────────────────────────────────

class DiaryEntry {
  final String id;
  final String? title;
  final String content;
  final int? moodScore;
  final String? mood;
  final String? aiInsight;
  final DateTime createdAt;

  const DiaryEntry({
    required this.id,
    this.title,
    required this.content,
    this.moodScore,
    this.mood,
    this.aiInsight,
    required this.createdAt,
  });

  factory DiaryEntry.fromJson(Map<String, dynamic> json) => DiaryEntry(
        id: json['_id']?.toString() ?? '',
        title: json['title']?.toString(),
        content: json['content']?.toString() ?? '',
        moodScore: (json['moodScore'] as num?)?.toInt(),
        mood: json['mood']?.toString(),
        aiInsight: json['aiInsight']?.toString(),
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );

  String get moodEmoji {
    switch (mood?.toLowerCase()) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'stress': case 'stressed': return '😵';
      case 'anxious': return '😟';
      case 'angry': return '😤';
      default: return '🌱';
    }
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

class DiaryScreen extends StatefulWidget {
  const DiaryScreen({super.key});

  @override
  State<DiaryScreen> createState() => _DiaryScreenState();
}

class _DiaryScreenState extends State<DiaryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  List<DiaryEntry> _entries = [];
  bool _loading = true;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _loadEntries();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadEntries() async {
    try {
      final res = await dio.get(ApiConfig.diary);
      final data = res.data['data'] ?? res.data;
      final list = (data as List? ?? []);
      setState(() {
        _entries = list.map((e) => DiaryEntry.fromJson(e as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
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
        title: const Text('Nhật ký cảm xúc'),
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: SoulColors.primary,
          unselectedLabelColor: SoulColors.textMuted,
          indicatorColor: SoulColors.primary,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          tabs: const [
            Tab(text: 'Nhật ký'),
            Tab(text: 'Thống kê'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _showForm = true),
        backgroundColor: SoulColors.primary,
        child: const Icon(Icons.add_rounded, color: Colors.white),
      ),
      body: Stack(
        children: [
          TabBarView(
            controller: _tabCtrl,
            children: [
              _DiaryList(entries: _entries, loading: _loading, onRefresh: _loadEntries),
              _DiaryStats(entries: _entries),
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
        ],
      ),
    );
  }
}

// ── Diary List ────────────────────────────────────────────────────────────────

class _DiaryList extends StatelessWidget {
  final List<DiaryEntry> entries;
  final bool loading;
  final Future<void> Function() onRefresh;

  const _DiaryList({
    required this.entries,
    required this.loading,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: SoulColors.primary));
    }
    if (entries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.book_outlined, size: 64, color: SoulColors.textFaint),
            const SizedBox(height: 16),
            const Text('Chưa có nhật ký nào',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: SoulColors.textMuted)),
            const SizedBox(height: 6),
            const Text('Bấm + để ghi lại cảm xúc hôm nay',
              style: TextStyle(fontSize: 13, color: SoulColors.textFaint)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: SoulColors.primary,
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: entries.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (ctx, i) => _DiaryCard(entry: entries[i]),
      ),
    );
  }
}

class _DiaryCard extends StatelessWidget {
  final DiaryEntry entry;
  const _DiaryCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy • HH:mm').format(entry.createdAt);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: SoulColors.subtleShadow,
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(entry.moodEmoji, style: const TextStyle(fontSize: 26)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (entry.title != null && entry.title!.isNotEmpty)
                      Text(entry.title!,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                    Text(dateStr, style: const TextStyle(fontSize: 11, color: SoulColors.textMuted)),
                  ],
                ),
              ),
              if (entry.moodScore != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: SoulColors.bgPurpleSoft,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${entry.moodScore}/10',
                    style: const TextStyle(fontSize: 12, color: SoulColors.primary, fontWeight: FontWeight.w700),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            entry.content,
            style: const TextStyle(fontSize: 14, color: SoulColors.textMuted, height: 1.5),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          if (entry.aiInsight != null && entry.aiInsight!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: SoulColors.bgPurpleSoft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome, size: 14, color: SoulColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      entry.aiInsight!,
                      style: const TextStyle(fontSize: 12, color: SoulColors.primary, height: 1.4),
                      maxLines: 2, overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Diary Stats ───────────────────────────────────────────────────────────────

class _DiaryStats extends StatelessWidget {
  final List<DiaryEntry> entries;
  const _DiaryStats({required this.entries});

  @override
  Widget build(BuildContext context) {
    final total = entries.length;
    final withScore = entries.where((e) => e.moodScore != null).toList();
    final avgScore = withScore.isEmpty
        ? 0.0
        : withScore.map((e) => e.moodScore!).reduce((a, b) => a + b) / withScore.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Summary cards
          Row(
            children: [
              _SmallStat(value: total.toString(), label: 'Tổng nhật ký', icon: Icons.book_outlined, color: SoulColors.primary),
              const SizedBox(width: 12),
              _SmallStat(value: avgScore.toStringAsFixed(1), label: 'Mood TB', icon: Icons.favorite_outline, color: const Color(0xFF0F766E)),
            ],
          ),
          const SizedBox(height: 16),
          // Chart
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: SoulColors.subtleShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Điểm cảm xúc gần đây',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                const SizedBox(height: 16),
                SizedBox(
                  height: 120,
                  child: withScore.isEmpty
                      ? const Center(child: Text('Chưa có dữ liệu', style: TextStyle(color: SoulColors.textMuted)))
                      : Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: withScore.take(7).toList().reversed.toList().asMap().entries.map((e) {
                            final entry = e.value;
                            final barH = (entry.moodScore! / 10) * 100;
                            return Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text('${entry.moodScore}',
                                  style: const TextStyle(fontSize: 10, color: SoulColors.textMuted)),
                                const SizedBox(height: 2),
                                AnimatedContainer(
                                  duration: Duration(milliseconds: 400 + e.key * 60),
                                  width: 28, height: barH,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                                      begin: Alignment.bottomCenter,
                                      end: Alignment.topCenter,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  DateFormat('dd/M').format(entry.createdAt),
                                  style: const TextStyle(fontSize: 9, color: SoulColors.textFaint),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallStat extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  const _SmallStat({required this.value, required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: SoulColors.subtleShadow,
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
                Text(label, style: const TextStyle(fontSize: 11, color: SoulColors.textMuted)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Diary Form ────────────────────────────────────────────────────────────────

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

  final _moodOptions = [
    ('😊', 'happy'), ('😌', 'neutral'), ('😔', 'sad'),
    ('😵', 'stress'), ('😟', 'anxious'), ('😤', 'angry'),
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
      await dio.post(ApiConfig.diary, data: {
        'title': _titleCtrl.text.trim().isNotEmpty ? _titleCtrl.text.trim() : null,
        'content': _contentCtrl.text.trim(),
        'moodScore': _moodScore,
        'mood': _selectedMood,
      });
      widget.onSaved();
    } catch (_) {
      setState(() => _saving = false);
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
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  // Handle
                  Container(
                    width: 40, height: 4,
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    decoration: BoxDecoration(
                      color: SoulColors.borderSlate,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Ghi nhật ký',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: widget.onClose),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Mood selector
                          const Text('Cảm xúc hiện tại',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: _moodOptions.map((m) {
                              final selected = _selectedMood == m.$2;
                              return GestureDetector(
                                onTap: () => setState(() => _selectedMood = m.$2),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  width: 44, height: 44,
                                  decoration: BoxDecoration(
                                    color: selected ? SoulColors.bgPurpleSoft : const Color(0xFFF8F7FF),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: selected ? SoulColors.primary : SoulColors.border,
                                      width: selected ? 2 : 1,
                                    ),
                                  ),
                                  child: Center(child: Text(m.$1, style: const TextStyle(fontSize: 22))),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),

                          // Mood score slider
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Điểm cảm xúc',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: SoulColors.bgPurpleSoft,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text('$_moodScore/10',
                                  style: const TextStyle(fontSize: 13, color: SoulColors.primary, fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                          SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              activeTrackColor: SoulColors.primary,
                              thumbColor: SoulColors.primary,
                              inactiveTrackColor: SoulColors.borderLight,
                              overlayColor: SoulColors.primary.withOpacity(0.1),
                            ),
                            child: Slider(
                              value: _moodScore.toDouble(),
                              min: 1, max: 10, divisions: 9,
                              onChanged: (v) => setState(() => _moodScore = v.toInt()),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Title
                          const Text('Tiêu đề (tùy chọn)',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                          const SizedBox(height: 8),
                          _FormField(controller: _titleCtrl, hint: 'Hôm nay mình...', maxLines: 1),
                          const SizedBox(height: 16),

                          // Content
                          const Text('Nội dung *',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                          const SizedBox(height: 8),
                          _FormField(
                            controller: _contentCtrl,
                            hint: 'Hãy viết những gì bạn đang nghĩ và cảm thấy...',
                            maxLines: 6,
                          ),
                          const SizedBox(height: 24),

                          GradientButton(
                            label: 'Lưu nhật ký',
                            loading: _saving,
                            onPressed: _save,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;

  const _FormField({
    required this.controller,
    required this.hint,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8F7FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SoulColors.border, width: 1.5),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B), height: 1.5),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFFB0BEC5), fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(14),
        ),
      ),
    );
  }
}
