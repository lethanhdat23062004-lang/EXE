import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

const _tests = [
  _TestInfo(
    id: 'WHO5',
    title: 'WHO-5 Well-being',
    desc: 'Bài tự đánh giá mức độ well-being trong 2 tuần gần đây.',
    questionCount: 5,
    icon: Icons.favorite_outline,
    color: Color(0xFF7C3AED),
    bg: Color(0xFFF3E8FF),
    minutes: '3-5',
  ),
  _TestInfo(
    id: 'PSS10',
    title: 'PSS-10 Stress',
    desc: 'Bài tự đánh giá mức độ căng thẳng trong 1 tháng gần đây.',
    questionCount: 10,
    icon: Icons.psychology_outlined,
    color: Color(0xFFA855F7),
    bg: Color(0xFFF5E8FF),
    minutes: '5-8',
  ),
];

class EmotionalTestMainScreen extends StatelessWidget {
  const EmotionalTestMainScreen({super.key});

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
        title: const Text('Bài test sức khỏe tinh thần'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: SoulColors.primaryShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text('Bài test tự đánh giá',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 12),
                  const Text('Đo lường sức khỏe tinh thần của bạn',
                    style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, height: 1.3)),
                  const SizedBox(height: 8),
                  const Text(
                    'WHO-5 và PSS-10 giúp bạn tự quan sát trạng thái hiện tại. Kết quả chỉ mang tính tham khảo, không phải chẩn đoán y khoa.',
                    style: TextStyle(color: Color(0xBFFFFFFF), fontSize: 13, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text('Chọn bài test',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
            const SizedBox(height: 12),

            ..._tests.map((test) => _TestCard(test: test)),

            const SizedBox(height: 24),

            // Disclaimer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFFF97316), size: 20),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Lưu ý: Các bài test này chỉ mang tính chất tham khảo. Nếu bạn đang gặp khó khăn về sức khỏe tâm thần, hãy tìm kiếm sự hỗ trợ từ chuyên gia.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.5),
                    ),
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

class _TestCard extends StatelessWidget {
  final _TestInfo test;
  const _TestCard({required this.test});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/emotional-test/assessment?type=${test.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: SoulColors.subtleShadow,
          border: Border.all(color: SoulColors.borderLight),
        ),
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(color: test.bg, borderRadius: BorderRadius.circular(16)),
              child: Icon(test.icon, color: test.color, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(test.title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                  const SizedBox(height: 4),
                  Text(test.desc,
                    style: const TextStyle(fontSize: 13, color: SoulColors.textMuted, height: 1.4),
                    maxLines: 2),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _Tag(label: '${test.questionCount} câu'),
                      const SizedBox(width: 6),
                      _Tag(label: '${test.minutes} phút'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Icon(Icons.arrow_forward_ios_rounded, size: 16, color: test.color),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  const _Tag({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: SoulColors.bgPurpleSoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: const TextStyle(fontSize: 11, color: SoulColors.primary, fontWeight: FontWeight.w600)),
    );
  }
}

class _TestInfo {
  final String id;
  final String title;
  final String desc;
  final int questionCount;
  final IconData icon;
  final Color color;
  final Color bg;
  final String minutes;

  const _TestInfo({
    required this.id,
    required this.title,
    required this.desc,
    required this.questionCount,
    required this.icon,
    required this.color,
    required this.bg,
    required this.minutes,
  });
}
