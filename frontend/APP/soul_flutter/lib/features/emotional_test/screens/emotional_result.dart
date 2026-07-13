import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/colors.dart';
import '../../../shared/widgets/gradient_button.dart';

class EmotionalResultScreen extends StatelessWidget {
  final int score;
  final String testType;

  const EmotionalResultScreen({
    super.key,
    required this.score,
    required this.testType,
  });

  _ResultInfo get _info {
    if (testType == 'WHO5') {
      if (score >= 20) return const _ResultInfo(emoji: '🌟', level: 'Rất tốt', color: Color(0xFF22C55E), desc: 'Well-being của bạn đang rất tốt. Hãy tiếp tục duy trì thói quen tốt này!', advice: 'Tiếp tục thiền định, vận động và duy trì các mối quan hệ tích cực.');
      if (score >= 13) return const _ResultInfo(emoji: '😊', level: 'Khá tốt', color: Color(0xFF3B82F6), desc: 'Well-being của bạn ở mức tốt. Vẫn còn một số điểm có thể cải thiện.', advice: 'Hãy thử thêm hoạt động thể chất nhẹ nhàng và thực hành chánh niệm.');
      return const _ResultInfo(emoji: '💙', level: 'Cần chú ý', color: Color(0xFFF97316), desc: 'Well-being của bạn đang ở mức thấp. Đây là lúc cần chú ý đến sức khỏe tâm thần.', advice: 'Hãy nói chuyện với người thân hoặc chuyên gia tâm lý. SOUL AI luôn sẵn sàng lắng nghe.');
    } else {
      // PSS-10
      if (score <= 13) return const _ResultInfo(emoji: '😌', level: 'Ít căng thẳng', color: Color(0xFF22C55E), desc: 'Mức độ căng thẳng của bạn đang ở mức thấp. Tiếp tục giữ vững!', advice: 'Duy trì lịch sống lành mạnh và thực hành thở sâu khi cần.');
      if (score <= 26) return const _ResultInfo(emoji: '😐', level: 'Căng thẳng trung bình', color: Color(0xFFF59E0B), desc: 'Bạn đang trải qua mức căng thẳng trung bình. Hãy chú ý đến sức khỏe.', advice: 'Thử các kỹ thuật quản lý stress như thiền định, yoga hoặc viết nhật ký.');
      return const _ResultInfo(emoji: '😵', level: 'Căng thẳng cao', color: Color(0xFFEF4444), desc: 'Mức độ căng thẳng của bạn đang cao. Hãy tìm sự hỗ trợ ngay.', advice: 'Nên nói chuyện với chuyên gia tâm lý. Hãy thử SOUL AI để chia sẻ cảm xúc của bạn.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final info = _info;
    final maxScore = testType == 'WHO5' ? 25 : 40;
    final percentage = (score / maxScore).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Kết quả bài test'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.go('/emotional-test'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Score card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: SoulColors.cardShadow,
              ),
              child: Column(
                children: [
                  Text(info.emoji, style: const TextStyle(fontSize: 72)),
                  const SizedBox(height: 12),
                  Text(info.level,
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: info.color)),
                  const SizedBox(height: 8),
                  Text(
                    '$score / $maxScore điểm',
                    style: const TextStyle(fontSize: 16, color: SoulColors.textMuted, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 20),
                  // Progress arc
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: percentage,
                      minHeight: 10,
                      backgroundColor: SoulColors.borderLight,
                      valueColor: AlwaysStoppedAnimation<Color>(info.color),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Description
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: SoulColors.subtleShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Nhận xét',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                  const SizedBox(height: 8),
                  Text(info.desc,
                    style: const TextStyle(fontSize: 14, color: SoulColors.textMuted, height: 1.6)),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Advice
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: SoulColors.bgPurpleSoft,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: SoulColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: SoulColors.primary, size: 20),
                      const SizedBox(width: 8),
                      const Text('Gợi ý từ SOUL AI',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: SoulColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(info.advice,
                    style: const TextStyle(fontSize: 14, color: SoulColors.primary, height: 1.6)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Actions
            GradientButton(
              label: 'Trò chuyện với SOUL AI',
              icon: Icons.chat_bubble_outline_rounded,
              onPressed: () => context.push('/ai-chat'),
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => context.go('/emotional-test'),
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: SoulColors.border, width: 1.5),
                ),
                alignment: Alignment.center,
                child: const Text('Làm bài test khác',
                  style: TextStyle(fontWeight: FontWeight.w700, color: SoulColors.textMuted)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultInfo {
  final String emoji;
  final String level;
  final Color color;
  final String desc;
  final String advice;

  const _ResultInfo({
    required this.emoji,
    required this.level,
    required this.color,
    required this.desc,
    required this.advice,
  });
}
