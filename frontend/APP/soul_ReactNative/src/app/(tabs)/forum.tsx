import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store";

import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getApprovedPosts,
  getComments,
  getMyPosts,
  getMyReports,
  getTags,
  reactToComment,
  reactToPost,
  reportComment,
  reportPost,
  updateComment,
  updatePost,
} from "@/api/forumApi";

import { forumStyles as s } from "@/styles/forum.styles";
import { ForumHeader } from "@/components/forum/ForumHeader";
import { PostCard } from "@/components/forum/PostCard";
import { CreatePostModal } from "@/components/forum/CreatePostModal";
import { ForumBottomSwitcher } from "@/components/forum/ForumBottomSwitcher";
import { EmptyForum } from "@/components/forum/EmptyForum";
import { ReportModal } from "@/components/forum/ReportModal";
import { MyReportsModal } from "@/components/forum/MyReportsModal";

type ReactionType = "support" | "hug" | "encourage" | "thankyou";

const defaultFilters = ["all", "stress", "self-care", "student-life", "deadline"];

const emotions = [
  { value: "happy", label: "😊", text: "Happy" },
  { value: "sad", label: "😔", text: "Sad" },
  { value: "stress", label: "😵", text: "Stress" },
  { value: "anxious", label: "😟", text: "Anxious" },
  { value: "angry", label: "😤", text: "Angry" },
  { value: "neutral", label: "🌱", text: "Neutral" },
];

function normalizeList(res: any) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.posts)) return res.posts;
  if (Array.isArray(res?.comments)) return res.comments;
  if (Array.isArray(res?.reports)) return res.reports;
  if (Array.isArray(res?.data?.posts)) return res.data.posts;
  if (Array.isArray(res?.data?.comments)) return res.data.comments;
  if (Array.isArray(res?.data?.reports)) return res.data.reports;
  return [];
}

function isApiSuccess(res: any) {
  return res?.success === true || res?.status === "success" || !!res?.message;
}

function moodLabel(mood: string) {
  const found = emotions.find((item) => item.value === mood);
  return found ? `${found.label} ${found.text}` : "🌱 Neutral";
}

function getUserIdFromToken(token: string | null) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded =
      typeof atob !== "undefined"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");

    const parsed = JSON.parse(decoded);

    return (
      parsed._id ||
      parsed.id ||
      parsed.userId ||
      parsed.user?._id ||
      parsed.user?.id ||
      null
    );
  } catch {
    return null;
  }
}

export default function ForumScreen() {
  const user = useAuthStore((state: any) => state.user);

  const [token, setToken] = useState<string | null>(null);
  const currentUserId = user?._id || user?.id || getUserIdFromToken(token);

  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [filters, setFilters] = useState(defaultFilters);

  const [mode, setMode] = useState<"community" | "mine">("community");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [hashtags, setHashtags] = useState("stress, deadline");
  const [emotionStatus, setEmotionStatus] = useState("stress");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [anonymousName, setAnonymousName] = useState("");

  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [openReplyCommentId, setOpenReplyCommentId] = useState<string | null>(null);

  const [reportTarget, setReportTarget] = useState<{
    type: "post" | "comment";
    id: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    postId: string;
    commentId: string;
  } | null>(null);

  const [showMyReports, setShowMyReports] = useState(false);

  const requireLogin = () => {
    if (!token) {
      Alert.alert("Bạn cần đăng nhập", "Vui lòng đăng nhập để dùng chức năng này.");
      return false;
    }

    return true;
  };

  const loadTags = async () => {
    try {
      const res = await getTags();
      const tags = normalizeList(res).map((tag: any) => tag.name).filter(Boolean);
      setFilters(["all", ...new Set([...defaultFilters.slice(1), ...tags])]);
    } catch {
      setFilters(defaultFilters);
    }
  };

  const loadPosts = async (
    nextMode: "community" | "mine" = mode,
    currentToken: string | null = token
  ) => {
    if (nextMode === "mine") {
      if (!currentToken) return;

      const res = await getMyPosts(currentToken);
      setPosts(normalizeList(res));
      return;
    }

    const res = await getApprovedPosts({
      search,
      hashtag: filter === "all" ? undefined : filter,
    });

    setPosts(normalizeList(res));
  };

  const loadReports = async () => {
    if (!token) return;

    const res = await getMyReports(token);
    setReports(normalizeList(res));
  };

  const reloadComments = async (postId: string) => {
    const res = await getComments(postId);

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: normalizeList(res),
    }));
  };

  const init = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      setToken(savedToken);

      await loadTags();

      const res = await getApprovedPosts();
      setPosts(normalizeList(res));
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không tải được forum.");
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mode === "community") {
        loadPosts("community", token).catch(() => {});
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [search, filter]);

  const visiblePosts = useMemo(() => {
  if (mode === "community") {
    return posts.filter((post) => post?.isFlagged !== true);
  }

  return posts;
}, [posts, mode]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadPosts(mode, token);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể làm mới dữ liệu.");
    } finally {
      setRefreshing(false);
    }
  };

  const resetPostForm = () => {
    setEditingPost(null);
    setContent("");
    setMediaUrl("");
    setHashtags("stress, deadline");
    setEmotionStatus("stress");
    setIsAnonymous(true);
    setAnonymousName(user?.anonymousAlias || "");
  };

  const openCreateModal = () => {
    resetPostForm();
    setShowCreate(true);
  };

  const openEditPost = (post: any) => {
    setEditingPost(post);
    setContent(post.content || "");
    setMediaUrl(post.mediaUrls?.[0]?.url || "");
    setHashtags((post.hashtags || []).join(", "));
    setEmotionStatus(post.emotionStatus || "neutral");
    setIsAnonymous(!!post.isAnonymous);
    setAnonymousName(post.anonymousName || user?.anonymousAlias || "");
    setShowCreate(true);
  };

  const handleSubmitPost = async () => {
    if (!requireLogin()) return;

    if (!content.trim()) {
      Alert.alert("Thiếu nội dung", "Nhập nội dung bài viết trước nha.");
      return;
    }

    const body = {
      content: content.trim(),
      mediaUrls: mediaUrl.trim()
        ? [
            {
              url: mediaUrl.trim(),
              type: mediaUrl.trim().includes(".mp4") ? "video" : "image",
            },
          ]
        : [],
      emotionStatus,
      hashtags: hashtags
        .split(",")
        .map((tag) => tag.replace("#", "").trim())
        .filter(Boolean),
      isAnonymous,
      anonymousName: isAnonymous ? anonymousName.trim() || "Anonymous Soul" : null,
      visibility: "public",
    };

    try {
      const res = editingPost
        ? await updatePost(token as string, editingPost._id, body)
        : await createPost(token as string, body);

      if (isApiSuccess(res)) {
        const data = res?.data;
        const isFlagged =
          data?.isFlagged === true ||
          res?.moderation?.isViolationSuspected === true;

        Alert.alert(
          editingPost ? "Đã cập nhật bài viết" : "Bài viết đã được đăng 🌿",
          isFlagged
            ? "SOUL AI phát hiện nội dung nhạy cảm và đã gửi cho admin xem xét. Bài của bạn vẫn được đăng trong khi chờ xử lý."
            : "Bài viết của bạn đã xuất hiện trong cộng đồng. SOUL AI vẫn có thể kiểm tra để giữ không gian an toàn."
        );

        setShowCreate(false);
        resetPostForm();

        setMode("mine");
        await loadPosts("mine", token);
      }
    } catch (error: any) {
      Alert.alert("Không thể lưu bài", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleDeletePost = async (postId: string) => {
  if (!requireLogin()) return;

  Alert.alert("Xóa bài viết", "Bạn có chắc muốn xóa bài này không?", [
    { text: "Hủy", style: "cancel" },
    {
      text: "Xóa",
      style: "destructive",
      onPress: async () => {
        try {
          await deletePost(token as string, postId);

          setPosts((prev) =>
            prev.filter((post) => {
              const id = post?._id?.toString?.() || post?._id;
              return id !== postId;
            })
          );

          Alert.alert("Đã xóa", "Bài viết đã được xóa thành công.");
        } catch (error: any) {
          Alert.alert(
            "Không thể xóa bài",
            error?.message || "Đã có lỗi xảy ra."
          );
        }
      },
    },
  ]);
};

  const handleReactPost = async (postId: string, type: ReactionType) => {
    if (!requireLogin()) return;

    try {
      await reactToPost(token as string, postId, type);
      await loadPosts(mode, token);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể react bài viết.");
    }
  };

  const toggleComments = async (postId: string) => {
    if (openCommentPostId === postId) {
      setOpenCommentPostId(null);
      return;
    }

    setOpenCommentPostId(postId);

    try {
      await reloadComments(postId);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không tải được bình luận.");
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!requireLogin()) return;

    const text = commentInputs[postId]?.trim();

    if (!text) {
      Alert.alert("Thiếu nội dung", "Nhập bình luận trước nha.");
      return;
    }

    try {
      await createComment(token as string, {
        postId,
        content: text,
        isAnonymous: false,
      });

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      await reloadComments(postId);
      await loadPosts(mode, token);
    } catch (error: any) {
      Alert.alert("Không thể bình luận", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleReplyComment = async (
    postId: string,
    parentCommentId: string,
    inputCommentId?: string
  ) => {
    if (!requireLogin()) return;

    const inputKey = inputCommentId || parentCommentId;
    const text = replyInputs[inputKey]?.trim();

    if (!text) {
      Alert.alert("Thiếu nội dung", "Nhập nội dung trả lời trước nha.");
      return;
    }

    try {
      await createComment(token as string, {
        postId,
        parentCommentId,
        content: text,
        isAnonymous: false,
      });

      setReplyInputs((prev) => ({
        ...prev,
        [inputKey]: "",
      }));

      setOpenReplyCommentId(null);

      await reloadComments(postId);
      await loadPosts(mode, token);
    } catch (error: any) {
      Alert.alert("Không thể trả lời", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleReactComment = async (
    postId: string,
    commentId: string,
    type: ReactionType
  ) => {
    if (!requireLogin()) return;

    try {
      await reactToComment(token as string, commentId, type);
      await reloadComments(postId);
    } catch (error: any) {
      Alert.alert("Không thể react comment", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleEditComment = async (
    postId: string,
    commentId: string,
    text: string
  ) => {
    if (!requireLogin()) return;

    if (!text.trim()) {
      Alert.alert("Thiếu nội dung", "Nội dung bình luận không được để trống.");
      return;
    }

    try {
      await updateComment(token as string, commentId, text.trim());
      await reloadComments(postId);
    } catch (error: any) {
      Alert.alert("Không thể sửa bình luận", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (!requireLogin()) return;

    setDeleteTarget({
      postId,
      commentId,
    });
  };

  const confirmDeleteComment = async () => {
    if (!deleteTarget || !token) return;

    try {
      await deleteComment(token, deleteTarget.commentId);
      await reloadComments(deleteTarget.postId);
      await loadPosts(mode, token);

      setDeleteTarget(null);
    } catch (error: any) {
      Alert.alert(
        "Không thể xóa bình luận",
        error?.message || "Đã có lỗi xảy ra."
      );
    }
  };

  const openReport = (type: "post" | "comment", id: string) => {
    if (!requireLogin()) return;
    setReportTarget({ type, id });
  };

  const submitReport = async (reason: string, description: string) => {
    if (!token || !reportTarget) return;

    try {
      if (reportTarget.type === "post") {
        await reportPost(token, reportTarget.id, reason, description);
      } else {
        await reportComment(token, reportTarget.id, reason, description);
      }

      Alert.alert("Đã gửi report", "Admin sẽ xem xét nội dung này.");
      setReportTarget(null);
    } catch (error: any) {
      Alert.alert("Không thể report", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const openMyReports = async () => {
    if (!requireLogin()) return;

    try {
      await loadReports();
      setShowMyReports(true);
    } catch (error: any) {
      Alert.alert("Không thể tải report", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  return (
    <View style={s.page}>
      <ForumHeader
        onCreatePress={openCreateModal}
        onReportsPress={openMyReports}
        onBackPress={() => router.replace("/(tabs)" as any)}
      />

      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            mode={mode}
            moodLabel={moodLabel}
            openCommentPostId={openCommentPostId}
            commentsByPost={commentsByPost}
            commentInputs={commentInputs}
            replyInputs={replyInputs}
            openReplyCommentId={openReplyCommentId}
            currentUserId={currentUserId}
            setCommentInputs={setCommentInputs}
            setReplyInputs={setReplyInputs}
            setOpenReplyCommentId={setOpenReplyCommentId}
            onReactPost={handleReactPost}
            onReportPost={(postId) => openReport("post", postId)}
            onToggleComments={toggleComments}
            onSendComment={handleSendComment}
            onReplyComment={handleReplyComment}
            onReactComment={handleReactComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onReportComment={(commentId) => openReport("comment", commentId)}
            onEditPost={openEditPost}
            onDeletePost={handleDeletePost}
          />
        )}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingBottom: 8 }}>
            {/* Standardized Purple Hero Card */}
            <View style={s.heroCard}>
              <View style={s.heroBadge}>
                <MaterialCommunityIcons name="star-four-points" size={15} color="#FFFFFF" />
                <Text style={s.heroBadgeText}>SOUL Forum</Text>
              </View>
              <Text style={s.heroTitle}>Connect & Heal</Text>
              <Text style={s.heroText}>
                Share your stories, offer support to others, and grow in a safe, mindful community.
              </Text>
              <Pressable
                style={s.heroButton}
                onPress={openCreateModal}
              >
                <Text style={s.heroButtonText}>Write a story</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.dark} />
              </Pressable>
            </View>

            {/* Standardized Search Box */}
            <View style={s.stdSearchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search stories, feelings, hashtags..."
                placeholderTextColor="#94A3B8"
                style={s.stdSearchInput}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* Standardized Filter Row */}
            <View style={s.stdFilterRow}>
              {filters.map((item) => {
                const active = filter === item;
                return (
                  <Pressable
                    key={item}
                    style={[s.stdFilterButton, active && s.stdActiveFilter]}
                    onPress={() => setFilter(item)}
                  >
                    <Text
                      style={[
                        s.stdFilterText,
                        active && s.stdActiveFilterText,
                      ]}
                    >
                      {item === "all" ? "✦ All" : `#${item}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyForum mode={mode} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <CreatePostModal
        visible={showCreate}
        isEditing={!!editingPost}
        content={content}
        mediaUrl={mediaUrl}
        hashtags={hashtags}
        emotionStatus={emotionStatus}
        isAnonymous={isAnonymous}
        anonymousName={anonymousName}
        emotions={emotions}
        setContent={setContent}
        setMediaUrl={setMediaUrl}
        setHashtags={setHashtags}
        setEmotionStatus={setEmotionStatus}
        setIsAnonymous={setIsAnonymous}
        setAnonymousName={setAnonymousName}
        onClose={() => {
          setShowCreate(false);
          resetPostForm();
        }}
        onSubmit={handleSubmitPost}
      />

      <ReportModal
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
      />

      <MyReportsModal
        visible={showMyReports}
        reports={reports}
        onClose={() => setShowMyReports(false)}
      />

      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={s.confirmBackdrop}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>Delete Comment</Text>

            <Text style={s.confirmText}>
              Are you sure you want to delete this comment?
            </Text>

            <View style={s.confirmActions}>
              <Pressable
                style={s.cancelButton}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={s.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={s.deleteButton} onPress={confirmDeleteComment}>
                <Text style={s.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ForumBottomSwitcher
        mode={mode}
        onCommunityPress={() => {
          setMode("community");
          loadPosts("community", token);
        }}
        onMinePress={() => {
          if (!requireLogin()) return;
          setMode("mine");
          loadPosts("mine", token);
        }}
      />
    </View>
  );
}