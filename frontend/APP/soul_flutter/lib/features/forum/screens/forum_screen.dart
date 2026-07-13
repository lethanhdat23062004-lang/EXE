import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/colors.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/config.dart';
import '../../../shared/widgets/gradient_button.dart';

// ── Models ────────────────────────────────────────────────────────────────────

class ForumPost {
  final String id;
  final String content;
  final String? authorName;
  final bool isAnonymous;
  final String? mood;
  final List<String> tags;
  final Map<String, int> reactions;
  final int commentCount;
  final DateTime createdAt;

  const ForumPost({
    required this.id,
    required this.content,
    this.authorName,
    this.isAnonymous = false,
    this.mood,
    this.tags = const [],
    this.reactions = const {},
    this.commentCount = 0,
    required this.createdAt,
  });

  factory ForumPost.fromJson(Map<String, dynamic> json) => ForumPost(
        id: json['_id']?.toString() ?? '',
        content: json['content']?.toString() ?? '',
        authorName: json['isAnonymous'] == true
            ? 'Ẩn danh'
            : json['author']?['fullName']?.toString() ?? json['authorName']?.toString(),
        isAnonymous: json['isAnonymous'] == true,
        mood: json['mood']?.toString(),
        tags: ((json['tags'] ?? []) as List).map((t) => t.toString()).toList(),
        reactions: ((json['reactions'] ?? {}) as Map<String, dynamic>)
            .map((k, v) => MapEntry(k, (v as num).toInt())),
        commentCount: (json['commentCount'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );

  String get moodEmoji {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'stress': return '😵';
      case 'anxious': return '😟';
      case 'angry': return '😤';
      default: return '🌱';
    }
  }

  int get totalReactions => reactions.values.fold(0, (a, b) => a + b);
}

// ── Screen ────────────────────────────────────────────────────────────────────

class ForumScreen extends StatefulWidget {
  const ForumScreen({super.key});

  @override
  State<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen> {
  List<ForumPost> _posts = [];
  bool _loading = true;
  bool _showCreateForm = false;
  String _activeFilter = 'all';
  final _filterOptions = ['all', 'stress', 'self-care', 'student-life', 'deadline'];

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    try {
      final res = await dio.get('${ApiConfig.forum}/posts/approved');
      final data = (res.data['data'] ?? res.data['posts'] ?? res.data) as List? ?? [];
      setState(() {
        _posts = data.map((e) => ForumPost.fromJson(e as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _react(String postId, String reaction) async {
    try {
      await dio.post('${ApiConfig.forum}/posts/$postId/react', data: {'reaction': reaction});
      _loadPosts();
    } catch (_) {}
  }

  List<ForumPost> get _filteredPosts {
    if (_activeFilter == 'all') return _posts;
    return _posts.where((p) => p.tags.contains(_activeFilter)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SoulColors.bgMain,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                snap: true,
                backgroundColor: Colors.white,
                elevation: 0,
                title: const Text('Cộng đồng SOUL',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline_rounded, color: SoulColors.primary),
                    onPressed: () => setState(() => _showCreateForm = true),
                  ),
                ],
              ),

              // Filter chips
              SliverToBoxAdapter(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                  child: Row(
                    children: _filterOptions.map((f) {
                      final active = _activeFilter == f;
                      return GestureDetector(
                        onTap: () => setState(() => _activeFilter = f),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: active ? SoulColors.primary : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: active ? SoulColors.primary : SoulColors.borderLight,
                            ),
                          ),
                          child: Text(
                            f == 'all' ? 'Tất cả' : '#$f',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: active ? Colors.white : SoulColors.textMuted,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),

              // Posts
              if (_loading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: SoulColors.primary)),
                )
              else if (_filteredPosts.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.forum_outlined, size: 64, color: SoulColors.textFaint),
                        SizedBox(height: 16),
                        Text('Chưa có bài viết nào',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: SoulColors.textMuted)),
                        SizedBox(height: 6),
                        Text('Hãy là người đầu tiên chia sẻ!',
                          style: TextStyle(fontSize: 13, color: SoulColors.textFaint)),
                      ],
                    ),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => _PostCard(
                      post: _filteredPosts[i],
                      onReact: (r) => _react(_filteredPosts[i].id, r),
                    ),
                    childCount: _filteredPosts.length,
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),

          // Create post form
          if (_showCreateForm)
            _CreatePostForm(
              onClose: () => setState(() => _showCreateForm = false),
              onPosted: () {
                setState(() => _showCreateForm = false);
                _loadPosts();
              },
            ),
        ],
      ),
    );
  }
}

// ── Post Card ─────────────────────────────────────────────────────────────────

class _PostCard extends StatelessWidget {
  final ForumPost post;
  final Function(String) onReact;

  const _PostCard({required this.post, required this.onReact});

  @override
  Widget build(BuildContext context) {
    final timeStr = _timeAgo(post.createdAt);
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: SoulColors.subtleShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author row
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Center(
                  child: Text(
                    post.authorName?.isNotEmpty == true ? post.authorName![0].toUpperCase() : 'A',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(post.authorName ?? 'Ẩn danh',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                        if (post.isAnonymous) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: SoulColors.bgCard,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('Ẩn danh', style: TextStyle(fontSize: 10, color: SoulColors.textMuted)),
                          ),
                        ],
                      ],
                    ),
                    Text(timeStr, style: const TextStyle(fontSize: 11, color: SoulColors.textFaint)),
                  ],
                ),
              ),
              Text(post.moodEmoji, style: const TextStyle(fontSize: 22)),
            ],
          ),
          const SizedBox(height: 12),

          // Content
          Text(post.content,
            style: const TextStyle(fontSize: 14, color: SoulColors.textBody, height: 1.55)),

          // Tags
          if (post.tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: post.tags.map((t) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: SoulColors.bgPurpleSoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('#$t', style: const TextStyle(fontSize: 11, color: SoulColors.primary, fontWeight: FontWeight.w600)),
              )).toList(),
            ),
          ],
          const SizedBox(height: 12),

          // Reactions
          Row(
            children: [
              _ReactionBtn(emoji: '💙', label: 'Support', onTap: () => onReact('support')),
              const SizedBox(width: 8),
              _ReactionBtn(emoji: '🤗', label: 'Hug', onTap: () => onReact('hug')),
              const SizedBox(width: 8),
              _ReactionBtn(emoji: '💪', label: 'Cheer', onTap: () => onReact('encourage')),
              const Spacer(),
              Icon(Icons.chat_bubble_outline_rounded, size: 15, color: SoulColors.textFaint),
              const SizedBox(width: 4),
              Text('${post.commentCount}',
                style: const TextStyle(fontSize: 12, color: SoulColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    return '${diff.inDays} ngày trước';
  }
}

class _ReactionBtn extends StatelessWidget {
  final String emoji;
  final String label;
  final VoidCallback onTap;

  const _ReactionBtn({required this.emoji, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: SoulColors.bgCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: SoulColors.borderLight),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 3),
            Text(label, style: const TextStyle(fontSize: 11, color: SoulColors.textMuted, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

// ── Create Post Form ──────────────────────────────────────────────────────────

class _CreatePostForm extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onPosted;

  const _CreatePostForm({required this.onClose, required this.onPosted});

  @override
  State<_CreatePostForm> createState() => _CreatePostFormState();
}

class _CreatePostFormState extends State<_CreatePostForm> {
  final _contentCtrl = TextEditingController();
  bool _anonymous = false;
  String _mood = 'neutral';
  List<String> _selectedTags = [];
  bool _posting = false;

  final _allTags = ['stress', 'self-care', 'student-life', 'deadline', 'motivation', 'advice'];
  final _moodOptions = [('😊', 'happy'), ('😌', 'neutral'), ('😔', 'sad'), ('😵', 'stress'), ('😟', 'anxious')];

  @override
  void dispose() {
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    if (_contentCtrl.text.trim().isEmpty) return;
    setState(() => _posting = true);
    try {
      await dio.post('${ApiConfig.forum}/posts', data: {
        'content': _contentCtrl.text.trim(),
        'isAnonymous': _anonymous,
        'mood': _mood,
        'tags': _selectedTags,
      });
      widget.onPosted();
    } catch (_) {
      setState(() => _posting = false);
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
              height: MediaQuery.of(context).size.height * 0.82,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 40, height: 4,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(color: SoulColors.borderSlate, borderRadius: BorderRadius.circular(2)),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Chia sẻ với cộng đồng',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
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
                          // Content input
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8F7FF),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: SoulColors.border, width: 1.5),
                            ),
                            child: TextField(
                              controller: _contentCtrl,
                              maxLines: 5,
                              style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B), height: 1.5),
                              decoration: const InputDecoration(
                                hintText: 'Chia sẻ những gì bạn đang nghĩ và cảm thấy...',
                                hintStyle: TextStyle(color: Color(0xFFB0BEC5), fontSize: 13),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.all(14),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Mood
                          const Text('Cảm xúc', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                          const SizedBox(height: 8),
                          Row(
                            children: _moodOptions.map((m) {
                              final selected = _mood == m.$2;
                              return GestureDetector(
                                onTap: () => setState(() => _mood = m.$2),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  width: 44, height: 44,
                                  margin: const EdgeInsets.only(right: 8),
                                  decoration: BoxDecoration(
                                    color: selected ? SoulColors.bgPurpleSoft : const Color(0xFFF8F7FF),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: selected ? SoulColors.primary : SoulColors.border, width: selected ? 2 : 1),
                                  ),
                                  child: Center(child: Text(m.$1, style: const TextStyle(fontSize: 22))),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),

                          // Tags
                          const Text('Tags', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8, runSpacing: 8,
                            children: _allTags.map((t) {
                              final selected = _selectedTags.contains(t);
                              return GestureDetector(
                                onTap: () => setState(() {
                                  if (selected) _selectedTags.remove(t);
                                  else _selectedTags.add(t);
                                }),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: selected ? SoulColors.primary : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: selected ? SoulColors.primary : SoulColors.borderLight),
                                  ),
                                  child: Text('#$t',
                                    style: TextStyle(fontSize: 12, color: selected ? Colors.white : SoulColors.textMuted, fontWeight: FontWeight.w600)),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),

                          // Anonymous toggle
                          GestureDetector(
                            onTap: () => setState(() => _anonymous = !_anonymous),
                            child: Row(
                              children: [
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  width: 20, height: 20,
                                  decoration: BoxDecoration(
                                    color: _anonymous ? SoulColors.primary : Colors.white,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: _anonymous ? SoulColors.primary : SoulColors.borderSlate, width: 1.5),
                                  ),
                                  child: _anonymous ? const Icon(Icons.check, size: 13, color: Colors.white) : null,
                                ),
                                const SizedBox(width: 10),
                                const Text('Đăng ẩn danh', style: TextStyle(fontSize: 14, color: SoulColors.textMuted)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          GradientButton(
                            label: 'Đăng bài',
                            loading: _posting,
                            onPressed: _post,
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
