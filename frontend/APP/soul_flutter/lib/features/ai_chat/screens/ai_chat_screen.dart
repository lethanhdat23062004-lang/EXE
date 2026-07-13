import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';

// ── Types ─────────────────────────────────────────────────────────────────────

class ChatMessage {
  final String id;
  final String role; // 'user' | 'ai'
  final String text;
  final String? riskLevel;
  final String? emotion;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.text,
    this.riskLevel,
    this.emotion,
  });
}

class ChatSession {
  final String id;
  final String title;
  final DateTime createdAt;

  const ChatSession({
    required this.id,
    required this.title,
    required this.createdAt,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Cuộc trò chuyện mới',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

const _welcomeMessage = ChatMessage(
  id: 'welcome',
  role: 'ai',
  text: 'Hãy hít thở sâu. Bạn không cần phải mang tất cả một mình.\n\nMình là SOUL AI, luôn ở đây để lắng nghe bạn. 💜',
);

// ── Screen ────────────────────────────────────────────────────────────────────

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<ChatSession> _sessions = [];
  ChatSession? _currentSession;
  List<ChatMessage> _messages = [_welcomeMessage];

  bool _loading = false;
  bool _loadingSessions = true;
  bool _historyOpen = false;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSessions() async {
    try {
      final res = await dio.get('${ApiConfig.chat}/sessions');
      final list = (res.data['data'] ?? res.data) as List? ?? [];
      setState(() {
        _sessions = list.map((e) => ChatSession.fromJson(e as Map<String, dynamic>)).toList();
        _loadingSessions = false;
      });
      if (_sessions.isNotEmpty) await _openSession(_sessions.first);
    } catch (_) {
      setState(() => _loadingSessions = false);
    }
  }

  Future<void> _openSession(ChatSession session) async {
    setState(() { _currentSession = session; _historyOpen = false; });
    try {
      final res = await dio.get('${ApiConfig.chat}/sessions/${session.id}/messages');
      final list = (res.data['data'] ?? res.data) as List? ?? [];
      if (list.isEmpty) {
        setState(() => _messages = [_welcomeMessage]);
      } else {
        setState(() => _messages = list.map((e) => ChatMessage(
          id: e['_id']?.toString() ?? '',
          role: e['role'] == 'assistant' ? 'ai' : 'user',
          text: e['content']?.toString() ?? '',
          riskLevel: e['riskLevel']?.toString(),
          emotion: e['emotion']?.toString(),
        )).toList());
      }
      _scrollToBottom();
    } catch (_) {
      setState(() => _messages = [_welcomeMessage]);
    }
  }

  Future<void> _createNewSession() async {
    try {
      final res = await dio.post('${ApiConfig.chat}/sessions');
      final data = res.data['data'] ?? res.data;
      final session = ChatSession.fromJson(data as Map<String, dynamic>);
      setState(() {
        _sessions.insert(0, session);
        _currentSession = session;
        _messages = [_welcomeMessage];
        _historyOpen = false;
      });
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _loading) return;

    final userMsg = ChatMessage(id: DateTime.now().millisecondsSinceEpoch.toString(), role: 'user', text: text);
    setState(() {
      _messages = [..._messages, userMsg];
      _loading = true;
    });
    _inputCtrl.clear();
    _scrollToBottom();

    try {
      String sessionId = _currentSession?.id ?? '';
      if (sessionId.isEmpty) {
        final res = await dio.post('${ApiConfig.chat}/sessions');
        final data = res.data['data'] ?? res.data;
        final session = ChatSession.fromJson(data as Map<String, dynamic>);
        setState(() {
          _sessions.insert(0, session);
          _currentSession = session;
        });
        sessionId = session.id;
      }

      final res = await dio.post(
        '${ApiConfig.chat}/sessions/$sessionId/messages',
        data: {'content': text},
      );
      final reply = res.data['data'] ?? res.data;
      final aiMsg = ChatMessage(
        id: reply['_id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        role: 'ai',
        text: reply['content']?.toString() ?? '',
        riskLevel: reply['riskLevel']?.toString(),
        emotion: reply['emotion']?.toString(),
      );
      setState(() { _messages = [..._messages, aiMsg]; _loading = false; });
      _scrollToBottom();
    } on DioException catch (e) {
      setState(() => _loading = false);
      if (e.response?.statusCode == 403) {
        _showUpgradeDialog();
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showUpgradeDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Nâng cấp Premium', style: TextStyle(fontWeight: FontWeight.w800)),
        content: const Text('Bạn đã dùng hết lượt chat miễn phí. Nâng cấp để trò chuyện không giới hạn với SOUL AI.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Để sau')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: SoulColors.primary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Nâng cấp', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F2FF),
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
        title: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SOUL AI', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                Text(
                  _currentSession?.title ?? 'Cuộc trò chuyện mới',
                  style: const TextStyle(fontSize: 11, color: SoulColors.textMuted),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: SoulColors.primary),
            onPressed: _createNewSession,
            tooltip: 'Tạo cuộc trò chuyện mới',
          ),
          IconButton(
            icon: Icon(_historyOpen ? Icons.close_rounded : Icons.history_rounded,
              color: SoulColors.primary),
            onPressed: () => setState(() => _historyOpen = !_historyOpen),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Chat area
          Column(
            children: [
              Expanded(
                child: ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  itemCount: _messages.length + (_loading ? 1 : 0),
                  itemBuilder: (ctx, i) {
                    if (i == _messages.length) return _TypingIndicator();
                    return _MessageBubble(message: _messages[i]);
                  },
                ),
              ),
              _InputBar(
                controller: _inputCtrl,
                loading: _loading,
                onSend: _sendMessage,
              ),
            ],
          ),

          // History drawer
          if (_historyOpen)
            _HistoryDrawer(
              sessions: _sessions,
              currentId: _currentSession?.id,
              loading: _loadingSessions,
              onSelect: _openSession,
              onNew: _createNewSession,
              onClose: () => setState(() => _historyOpen = false),
            ),
        ],
      ),
    );
  }
}

// ── Message Bubble ────────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                borderRadius: BorderRadius.circular(9),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: isUser
                    ? const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)])
                    : null,
                color: isUser ? null : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
                boxShadow: SoulColors.subtleShadow,
                border: isUser ? null : Border.all(color: SoulColors.borderLight),
              ),
              child: Text(
                message.text,
                style: TextStyle(
                  color: isUser ? Colors.white : const Color(0xFF1E293B),
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

class _TypingIndicator extends StatefulWidget {
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.3, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
              ),
              boxShadow: SoulColors.subtleShadow,
            ),
            child: AnimatedBuilder(
              animation: _anim,
              builder: (_, __) => Row(
                children: List.generate(3, (i) => Container(
                  width: 7, height: 7,
                  margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: SoulColors.primaryLight.withOpacity(_anim.value - i * 0.1),
                    shape: BoxShape.circle,
                  ),
                )),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Input Bar ─────────────────────────────────────────────────────────────────

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool loading;
  final VoidCallback onSend;

  const _InputBar({
    required this.controller,
    required this.loading,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.fromLTRB(16, 10, 16, MediaQuery.of(context).viewInsets.bottom + 12),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF8F7FF),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: SoulColors.border, width: 1.5),
              ),
              child: TextField(
                controller: controller,
                maxLines: 4,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)),
                decoration: const InputDecoration(
                  hintText: 'Nhập tin nhắn...',
                  hintStyle: TextStyle(color: SoulColors.textFaint, fontSize: 14),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: loading ? null : onSend,
            child: Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                borderRadius: BorderRadius.circular(14),
                boxShadow: SoulColors.primaryShadow,
              ),
              child: loading
                  ? const Padding(
                      padding: EdgeInsets.all(10),
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

// ── History Drawer ────────────────────────────────────────────────────────────

class _HistoryDrawer extends StatelessWidget {
  final List<ChatSession> sessions;
  final String? currentId;
  final bool loading;
  final Function(ChatSession) onSelect;
  final VoidCallback onNew;
  final VoidCallback onClose;

  const _HistoryDrawer({
    required this.sessions,
    this.currentId,
    required this.loading,
    required this.onSelect,
    required this.onNew,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 0, right: 0, bottom: 0,
      width: MediaQuery.of(context).size.width * 0.78,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Color(0x1A000000), blurRadius: 24, offset: Offset(-4, 0))],
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Lịch sử trò chuyện',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: onClose,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GestureDetector(
                onTap: onNew,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_rounded, color: Colors.white, size: 18),
                      SizedBox(width: 6),
                      Text('Cuộc trò chuyện mới',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            if (loading)
              const Expanded(child: Center(child: CircularProgressIndicator(color: SoulColors.primary)))
            else if (sessions.isEmpty)
              const Expanded(
                child: Center(
                  child: Text('Chưa có cuộc trò chuyện nào',
                    style: TextStyle(color: SoulColors.textMuted, fontSize: 13)),
                ),
              )
            else
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: sessions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 4),
                  itemBuilder: (ctx, i) {
                    final s = sessions[i];
                    final active = s.id == currentId;
                    return GestureDetector(
                      onTap: () => onSelect(s),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: active ? SoulColors.bgPurpleSoft : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: active ? SoulColors.primary.withOpacity(0.3) : Colors.transparent,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.chat_bubble_outline_rounded,
                              size: 16,
                              color: active ? SoulColors.primary : SoulColors.textFaint),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                s.title,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                                  color: active ? SoulColors.primary : const Color(0xFF1E293B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
