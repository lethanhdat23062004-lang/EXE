import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';
import '../../../shared/widgets/gradient_button.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Map<String, dynamic>? _event;
  bool _loading = true;
  bool _registering = false;
  bool _registered = false;
  int _rating = 0;
  final _commentCtrl = TextEditingController();
  bool _submittingRating = false;

  @override
  void initState() {
    super.initState();
    _loadEvent();
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadEvent() async {
    try {
      final res = await dio.get('${ApiConfig.events}/${widget.eventId}');
      final data = res.data['data'] ?? res.data;
      setState(() { _event = data as Map<String, dynamic>; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _register() async {
    setState(() => _registering = true);
    try {
      await dio.post('${ApiConfig.userEvents}/${widget.eventId}/register');
      setState(() { _registered = true; _registering = false; });
      _showSnack('Đăng ký tham dự thành công!', isSuccess: true);
    } on DioException catch (e) {
      setState(() => _registering = false);
      _showSnack(e.response?.data?['message']?.toString() ?? 'Đăng ký thất bại');
    }
  }

  Future<void> _submitRating() async {
    if (_rating == 0) return;
    setState(() => _submittingRating = true);
    try {
      await dio.post('${ApiConfig.ratings}', data: {
        'eventId': widget.eventId,
        'rating': _rating,
        if (_commentCtrl.text.trim().isNotEmpty) 'comment': _commentCtrl.text.trim(),
      });
      setState(() => _submittingRating = false);
      _showSnack('Đánh giá thành công! Cảm ơn bạn.', isSuccess: true);
    } catch (_) {
      setState(() => _submittingRating = false);
    }
  }

  void _showSnack(String msg, {bool isSuccess = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isSuccess ? const Color(0xFF16A34A) : SoulColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: SoulColors.primary)));
    }
    if (_event == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text('Không tìm thấy sự kiện')));
    }

    final title = _event!['title']?.toString() ?? '';
    final desc = _event!['description']?.toString() ?? '';
    final status = _event!['status']?.toString() ?? '';
    final location = _event!['location']?.toString() ?? '';
    final eventDate = DateTime.tryParse(_event!['eventDate']?.toString() ?? '');
    final isCompleted = status == 'completed';
    final isUpcoming = status == 'upcoming';

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
              context.go('/events');
            }
          },
        ),
        title: const Text('Chi tiết sự kiện'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF7C3AED), Color(0xFF0F766E)],
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
                    child: Text(
                      isCompleted ? '✓ Đã kết thúc' : isUpcoming ? '● Sắp diễn ra' : '● Đang diễn ra',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(title,
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, height: 1.3)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Info card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: SoulColors.subtleShadow,
              ),
              child: Column(
                children: [
                  if (eventDate != null)
                    _InfoRow(
                      icon: Icons.schedule_outlined,
                      label: 'Thời gian',
                      value: DateFormat('dd/MM/yyyy • HH:mm').format(eventDate),
                    ),
                  if (location.isNotEmpty)
                    _InfoRow(
                      icon: Icons.location_on_outlined,
                      label: 'Địa điểm',
                      value: location,
                    ),
                  if (_event!['eventType'] != null)
                    _InfoRow(
                      icon: Icons.category_outlined,
                      label: 'Loại sự kiện',
                      value: _event!['eventType']?.toString() ?? '',
                    ),
                  if (_event!['maxParticipants'] != null)
                    _InfoRow(
                      icon: Icons.people_outline,
                      label: 'Số chỗ',
                      value: '${_event!['maxParticipants']} người',
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Description
            if (desc.isNotEmpty) ...[
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
                    const Text('Mô tả sự kiện',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                    const SizedBox(height: 8),
                    Text(desc, style: const TextStyle(fontSize: 14, color: SoulColors.textMuted, height: 1.6)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Register button (upcoming events)
            if (isUpcoming && !_registered) ...[
              GradientButton(
                label: 'Đăng ký tham dự',
                loading: _registering,
                icon: Icons.event_available_outlined,
                onPressed: _register,
              ),
              const SizedBox(height: 12),
            ],

            if (_registered)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF86EFAC)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle_outline, color: Color(0xFF16A34A), size: 20),
                    SizedBox(width: 8),
                    Text('Bạn đã đăng ký thành công!',
                      style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w700, fontSize: 14)),
                  ],
                ),
              ),

            // Rating section (completed events)
            if (isCompleted) ...[
              const SizedBox(height: 4),
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
                    const Text('Đánh giá sự kiện',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    const Text('Chia sẻ trải nghiệm của bạn với cộng đồng',
                      style: TextStyle(fontSize: 13, color: SoulColors.textMuted)),
                    const SizedBox(height: 16),
                    // Stars
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (i) {
                        return GestureDetector(
                          onTap: () => setState(() => _rating = i + 1),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              i < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                              color: i < _rating ? const Color(0xFFFBBF24) : SoulColors.textFaint,
                              size: 40,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F7FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: SoulColors.border, width: 1.5),
                      ),
                      child: TextField(
                        controller: _commentCtrl,
                        maxLines: 3,
                        style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)),
                        decoration: const InputDecoration(
                          hintText: 'Bình luận của bạn (tùy chọn)...',
                          hintStyle: TextStyle(color: Color(0xFFB0BEC5), fontSize: 13),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.all(14),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    GradientButton(
                      label: 'Gửi đánh giá',
                      loading: _submittingRating,
                      onPressed: _rating > 0 ? _submitRating : null,
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: SoulColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: SoulColors.textMuted, fontWeight: FontWeight.w500)),
                Text(value, style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B), fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
