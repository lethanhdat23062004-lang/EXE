import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/colors.dart';
import '../../auth/providers/auth_provider.dart';

const _quickActions = [
  _QuickAction(title: 'SOUL AI', desc: 'AI Emotional Companion lắng nghe và phản hồi cảm xúc bằng tiếng Việt.', cta: 'Khám phá ngay', route: '/ai-chat', icon: Icons.chat_bubble_outline_rounded, color: Color(0xFF7C3AED), bg: Color(0xFFF3E8FF)),
  _QuickAction(title: 'Nhật ký cảm xúc', desc: 'Ghi lại mood, điểm cảm xúc, ghi chú riêng tư và AI insight.', cta: 'Ghi chép', route: '/diary', icon: Icons.book_outlined, color: Color(0xFFA855F7), bg: Color(0xFFF5E8FF)),
  _QuickAction(title: 'Theo dõi tâm trạng', desc: 'Nhìn lại xu hướng cảm xúc từ các nhật ký đã lưu.', cta: 'Xem thống kê', route: '/diary', icon: Icons.bar_chart_rounded, color: Color(0xFF0F766E), bg: Color(0xFFCCFBF1)),
  _QuickAction(title: 'Bài test cảm xúc', desc: 'Tự đánh giá bằng WHO-5 Well-being Check và PSS-10 Student Stress Check.', cta: 'Làm bài test', route: '/emotional-test', icon: Icons.assignment_outlined, color: Color(0xFFEF4444), bg: Color(0xFFFEE2E2)),
  _QuickAction(title: 'Sự kiện & Workshop', desc: 'Đăng ký workshop, talkshow, webinar và gửi rating sau khi được xác nhận.', cta: 'Lịch sự kiện', route: '/events', icon: Icons.event_outlined, color: Color(0xFF7C3AED), bg: Color(0xFFEDE9FE)),
  _QuickAction(title: 'Cộng đồng an toàn', desc: 'Chia sẻ ẩn danh tùy chọn, reaction, bình luận và AI/admin moderation.', cta: 'Tham gia', route: '/forum', icon: Icons.group_outlined, color: Color(0xFF64748B), bg: Color(0xFFF1F5F9)),
];

const _moodBars = [42.0, 58.0, 70.0, 45.0, 82.0, 64.0, 76.0];
const _weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const _moods = ['😊', '😌', '🙂', '🙏', '🌈'];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.firstName ?? 'bạn';

    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      body: CustomScrollView(
        slivers: [
          // ── App Bar ────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 0,
            floating: true,
            snap: true,
            backgroundColor: Colors.white,
            elevation: 0,
            title: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.spa_outlined, color: Colors.white, size: 16),
                ),
                const SizedBox(width: 8),
                const Text('SOUL', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Color(0xFF7C3AED))),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Color(0xFF1E293B)),
                onPressed: () {},
              ),
              GestureDetector(
                onTap: () => context.push('/profile'),
                child: Container(
                  width: 36, height: 36,
                  margin: const EdgeInsets.only(right: 16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U',
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Hero card ───────────────────────────────────────────
                _HeroCard(firstName: firstName),

                // ── Mood selector ───────────────────────────────────────
                _MoodSelector(),

                // ── Mini chart ──────────────────────────────────────────
                _MiniMoodChart(),

                // ── Quick actions ───────────────────────────────────────
                _QuickActionsSection(),

                // ── Stats ───────────────────────────────────────────────
                _StatsSection(),

                // ── Daily motivation ────────────────────────────────────
                _DailyMotivation(),

                // ── AI chat invite ──────────────────────────────────────
                _AiChatInvite(),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Hero Card ─────────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  final String firstName;
  const _HeroCard({required this.firstName});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: SoulColors.primaryShadow,
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '✦ Chào mừng trở lại, $firstName',
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Hôm nay bạn muốn chăm sóc tâm trí theo cách nào?',
            style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, height: 1.35),
          ),
          const SizedBox(height: 10),
          const Text(
            'SOUL luôn sẵn sàng lắng nghe và đồng hành cùng bạn.',
            style: TextStyle(color: Color(0xBFFFFFFF), fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => context.push('/ai-chat'),
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'Trò chuyện với SOUL AI',
                      style: TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => context.push('/diary'),
                child: Container(
                  height: 44, width: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.4)),
                  ),
                  child: const Icon(Icons.book_outlined, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Mood Selector ─────────────────────────────────────────────────────────────

class _MoodSelector extends StatefulWidget {
  @override
  State<_MoodSelector> createState() => _MoodSelectorState();
}

class _MoodSelectorState extends State<_MoodSelector> {
  int? _selected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Bạn đang cảm thấy thế nào?',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(_moods.length, (i) {
              final selected = _selected == i;
              return GestureDetector(
                onTap: () => setState(() => _selected = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 52, height: 52,
                  decoration: BoxDecoration(
                    color: selected ? SoulColors.bgPurpleSoft : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected ? SoulColors.primary : SoulColors.borderLight,
                      width: selected ? 2 : 1,
                    ),
                    boxShadow: selected ? SoulColors.subtleShadow : [],
                  ),
                  child: Center(child: Text(_moods[i], style: const TextStyle(fontSize: 24))),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ── Mini Mood Chart ───────────────────────────────────────────────────────────

class _MiniMoodChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: SoulColors.subtleShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Tâm trạng tuần này',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
              GestureDetector(
                onTap: () => context.push('/diary'),
                child: const Text('Xem chi tiết →',
                  style: TextStyle(fontSize: 12, color: SoulColors.primary, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 80,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(_moodBars.length, (i) {
                final barH = (_moodBars[i] / 100) * 72;
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    AnimatedContainer(
                      duration: Duration(milliseconds: 300 + i * 60),
                      width: 28,
                      height: barH,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: i == 4
                              ? [SoulColors.primary, SoulColors.primaryLight]
                              : [const Color(0xFFC4B5FD), const Color(0xFFDDD6FE)],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(_weekDays[i],
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: i == 4 ? FontWeight.w800 : FontWeight.w500,
                        color: i == 4 ? SoulColors.primary : SoulColors.textFaint,
                      )),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

class _QuickActionsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 24, 16, 14),
          child: Text('Công cụ hỗ trợ của bạn',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.88,
          ),
          itemCount: _quickActions.length,
          itemBuilder: (ctx, i) => _QuickActionCard(action: _quickActions[i]),
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final _QuickAction action;
  const _QuickActionCard({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(action.route),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: SoulColors.subtleShadow,
          border: Border.all(color: SoulColors.borderLight),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 46, height: 46,
              decoration: BoxDecoration(
                color: action.bg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(action.icon, color: action.color, size: 22),
            ),
            const SizedBox(height: 12),
            Text(action.title,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
            const SizedBox(height: 4),
            Expanded(
              child: Text(action.desc,
                style: const TextStyle(fontSize: 12, color: SoulColors.textMuted, height: 1.4),
                maxLines: 3, overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(height: 8),
            Text('${action.cta} →',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: action.color)),
          ],
        ),
      ),
    );
  }
}

// ── Stats Section ─────────────────────────────────────────────────────────────

class _StatsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF7F2FF), Color(0xFFECFDF5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: SoulColors.borderLight),
      ),
      child: Row(
        children: const [
          _StatItem(value: '12', label: 'Nhật ký', icon: Icons.book_outlined, color: Color(0xFF7C3AED)),
          _StatDivider(),
          _StatItem(value: '85', label: 'Well-being', icon: Icons.favorite_outline, color: Color(0xFF0F766E)),
          _StatDivider(),
          _StatItem(value: '5', label: 'Ngày streak', icon: Icons.local_fire_department_outlined, color: Color(0xFFF97316)),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  const _StatItem({required this.value, required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
          Text(label, style: const TextStyle(fontSize: 11, color: SoulColors.textMuted, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 40, color: SoulColors.borderLight);
  }
}

// ── Daily Motivation ──────────────────────────────────────────────────────────

class _DailyMotivation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: SoulColors.subtleShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.wb_sunny_outlined, color: Color(0xFFF97316), size: 24),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Động lực hôm nay',
                  style: TextStyle(fontSize: 12, color: SoulColors.textMuted, fontWeight: FontWeight.w500)),
                SizedBox(height: 2),
                Text('"Hãy bắt đầu bằng một hơi thở chậm."',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B), height: 1.4)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: SoulColors.textFaint),
        ],
      ),
    );
  }
}

// ── AI Chat Invite ────────────────────────────────────────────────────────────

class _AiChatInvite extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF5B21B6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: SoulColors.primaryShadow,
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 10),
              const Text('SOUL AI', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Online', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              '"Mình ở đây để lắng nghe. Bạn muốn chia sẻ điều gì không?"',
              style: TextStyle(color: Colors.white, fontSize: 13, height: 1.5, fontStyle: FontStyle.italic),
            ),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => context.push('/ai-chat'),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: const Text('Bắt đầu trò chuyện →',
                style: TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.w800, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Data Models ───────────────────────────────────────────────────────────────

class _QuickAction {
  final String title;
  final String desc;
  final String cta;
  final String route;
  final IconData icon;
  final Color color;
  final Color bg;

  const _QuickAction({
    required this.title,
    required this.desc,
    required this.cta,
    required this.route,
    required this.icon,
    required this.color,
    required this.bg,
  });
}
