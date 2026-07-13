import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';
import '../../../shared/widgets/gradient_button.dart';

// ── Questions data ─────────────────────────────────────────────────────────────

const _who5Questions = [
  'Tôi cảm thấy vui vẻ và trong tâm trạng tốt',
  'Tôi cảm thấy bình tĩnh và thư giãn',
  'Tôi cảm thấy năng động và tràn đầy năng lượng',
  'Tôi thức dậy thấy tươi mới và nghỉ ngơi đủ giấc',
  'Cuộc sống hàng ngày của tôi chứa đầy những điều thú vị',
];

const _pss10Questions = [
  'Bạn đã bị quấy rầy bởi điều bất ngờ không mong đợi?',
  'Bạn cảm thấy không kiểm soát được những điều quan trọng trong cuộc sống?',
  'Bạn cảm thấy căng thẳng và lo lắng?',
  'Bạn cảm thấy bất lực, không vượt qua được khó khăn?',
  'Bạn cảm thấy mọi thứ đang đi đúng hướng?',
  'Bạn thấy mình không thể đối phó với mọi việc cần làm?',
  'Bạn có thể kiểm soát sự khó chịu trong cuộc sống?',
  'Bạn cảm thấy nắm quyền kiểm soát cuộc sống của mình?',
  'Bạn cảm thấy tức giận vì những thứ ngoài tầm kiểm soát?',
  'Khó khăn đang chồng chất đến mức bạn không thể vượt qua?',
];

const _who5Answers = [
  (value: 5, label: 'Tất cả thời gian'),
  (value: 4, label: 'Hầu hết thời gian'),
  (value: 3, label: 'Hơn nửa thời gian'),
  (value: 2, label: 'Đôi khi'),
  (value: 1, label: 'Hiếm khi'),
  (value: 0, label: 'Không lúc nào'),
];

const _pss10Answers = [
  (value: 0, label: 'Không bao giờ'),
  (value: 1, label: 'Gần như không'),
  (value: 2, label: 'Thỉnh thoảng'),
  (value: 3, label: 'Thường xuyên'),
  (value: 4, label: 'Rất thường xuyên'),
];

class EmotionalAssessmentScreen extends StatefulWidget {
  final String testType;
  const EmotionalAssessmentScreen({super.key, required this.testType});

  @override
  State<EmotionalAssessmentScreen> createState() =>
      _EmotionalAssessmentScreenState();
}

class _EmotionalAssessmentScreenState
    extends State<EmotionalAssessmentScreen> {
  int _currentQ = 0;
  final Map<int, int> _answers = {};
  bool _submitting = false;

  List<String> get _questions =>
      widget.testType == 'WHO5' ? _who5Questions : _pss10Questions;

  List<({int value, String label})> get _answerOptions =>
      widget.testType == 'WHO5' ? _who5Answers : _pss10Answers;

  bool get _isLast => _currentQ == _questions.length - 1;
  double get _progress => (_currentQ + 1) / _questions.length;

  Future<void> _submit() async {
    if (_answers.length < _questions.length) return;

    setState(() => _submitting = true);
    try {
      final answers = _answers.entries.map((e) => {'questionIndex': e.key, 'score': e.value}).toList();
      final totalScore = _answers.values.reduce((a, b) => a + b);

      await dio.post(ApiConfig.emotionalTest, data: {
        'testType': widget.testType,
        'answers': answers,
        'totalScore': totalScore,
      });

      if (mounted) {
        context.pushReplacement(
          '/emotional-test/result?type=${widget.testType}&score=$totalScore',
        );
      }
    } catch (_) {
      setState(() => _submitting = false);
    }
  }

  void _selectAnswer(int value) {
    setState(() {
      _answers[_currentQ] = value;
      if (!_isLast) {
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) setState(() => _currentQ++);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final question = _questions[_currentQ];
    final selected = _answers[_currentQ];

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
              context.go('/emotional-test');
            }
          },
        ),
        title: Text(
          widget.testType == 'WHO5' ? 'WHO-5 Well-being' : 'PSS-10 Stress',
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: _progress,
            backgroundColor: SoulColors.borderLight,
            valueColor: const AlwaysStoppedAnimation<Color>(SoulColors.primary),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question counter
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: SoulColors.bgPurpleSoft,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Câu ${_currentQ + 1} / ${_questions.length}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: SoulColors.primary,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '${(_progress * 100).toInt()}% hoàn thành',
                  style: const TextStyle(fontSize: 12, color: SoulColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Question
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: Container(
                key: ValueKey(_currentQ),
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: SoulColors.subtleShadow,
                ),
                child: Text(
                  question,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                    height: 1.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Answers
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: ListView(
                  key: ValueKey(_currentQ),
                  children: _answerOptions.map((opt) {
                    final isSelected = selected == opt.value;
                    return GestureDetector(
                      onTap: () => _selectAnswer(opt.value),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: isSelected ? SoulColors.bgPurpleSoft : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? SoulColors.primary : SoulColors.borderLight,
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: isSelected ? SoulColors.subtleShadow : [],
                        ),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              width: 22, height: 22,
                              decoration: BoxDecoration(
                                color: isSelected ? SoulColors.primary : Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? SoulColors.primary : SoulColors.borderSlate,
                                  width: 2,
                                ),
                              ),
                              child: isSelected
                                  ? const Icon(Icons.check_rounded, size: 13, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                opt.label,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? SoulColors.primary : const Color(0xFF1E293B),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Navigation buttons
            Row(
              children: [
                if (_currentQ > 0) ...[
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _currentQ--),
                      child: Container(
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: SoulColors.border, width: 1.5),
                        ),
                        alignment: Alignment.center,
                        child: const Text('← Câu trước',
                          style: TextStyle(fontWeight: FontWeight.w700, color: SoulColors.textMuted)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: 2,
                  child: _isLast
                      ? GradientButton(
                          label: 'Hoàn thành',
                          loading: _submitting,
                          onPressed: _answers.length == _questions.length ? _submit : null,
                        )
                      : GestureDetector(
                          onTap: selected != null
                              ? () => setState(() => _currentQ++)
                              : null,
                          child: AnimatedOpacity(
                            opacity: selected != null ? 1.0 : 0.5,
                            duration: const Duration(milliseconds: 150),
                            child: Container(
                              height: 50,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                    colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)]),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              alignment: Alignment.center,
                              child: const Text('Câu tiếp →',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
