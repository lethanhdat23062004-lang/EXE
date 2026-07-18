import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  adminForumService,
  AdminForumPost,
  AdminForumPostStatus,
  AdminForumReport,
  AdminForumReportStatus,
} from "@/api/adminForumApi";
import { colors } from "@/constants/colors";

type ForumView = "posts" | "reports";
type PostFilter = "all" | AdminForumPostStatus | "flagged";
type ReportFilter = "all" | AdminForumReportStatus;
type ForumListItem =
  | { kind: "post"; data: AdminForumPost }
  | { kind: "report"; data: AdminForumReport };

type Notice = { type: "success" | "error"; message: string } | null;

const webFont = Platform.select({
  web: "'Inter', system-ui, sans-serif",
  default: undefined,
});
const displayFont = Platform.select({
  web: "'Lexend', 'Inter', system-ui",
  default: undefined,
});

const postFilters: { value: PostFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "flagged", label: "Bị gắn cờ" },
  { value: "hidden", label: "Đã ẩn" },
  { value: "deleted", label: "Đã xóa" },
];

const reportFilters: { value: ReportFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "appeal_pending", label: "Khiếu nại" },
  { value: "action_taken", label: "Đã xử lý" },
  { value: "dismissed", label: "Đã bỏ qua" },
];

const getRouteValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getEntityId = (
  value: string | { _id: string; content?: string } | null | undefined
) => (typeof value === "string" ? value : value?._id || "");

const getUserName = (
  value:
    | string
    | { _id: string; fullName?: string; email?: string }
    | null
    | undefined,
  fallback = "Người dùng SOUL"
) => (typeof value === "string" ? value : value?.fullName || fallback);

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const postStatusInfo = (post: AdminForumPost) => {
  if (post.isFlagged) {
    return {
      label: "Bị gắn cờ",
      color: colors.error,
      bg: colors.errorBg,
      icon: "flag-outline" as const,
    };
  }

  const map: Record<
    AdminForumPostStatus,
    {
      label: string;
      color: string;
      bg: string;
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
    }
  > = {
    pending: {
      label: "Chờ duyệt",
      color: colors.warning,
      bg: colors.warningBg,
      icon: "clock-outline",
    },
    approved: {
      label: "Đã duyệt",
      color: colors.success,
      bg: colors.successBg,
      icon: "check-circle-outline",
    },
    rejected: {
      label: "Bị từ chối",
      color: colors.error,
      bg: colors.errorBg,
      icon: "close-circle-outline",
    },
    hidden: {
      label: "Đã ẩn",
      color: colors.textSecondary,
      bg: colors.bgAlt,
      icon: "eye-off-outline",
    },
    deleted: {
      label: "Đã xóa",
      color: colors.error,
      bg: colors.errorBg,
      icon: "trash-can-outline",
    },
  };

  return map[post.status];
};

const reportStatusInfo = (status: AdminForumReportStatus) => {
  const map: Record<
    AdminForumReportStatus,
    { label: string; color: string; bg: string }
  > = {
    pending: {
      label: "Chờ xử lý",
      color: colors.warning,
      bg: colors.warningBg,
    },
    dismissed: {
      label: "Đã bỏ qua",
      color: colors.textSecondary,
      bg: colors.bgAlt,
    },
    action_taken: {
      label: "Đã xử lý",
      color: colors.success,
      bg: colors.successBg,
    },
    appeal_pending: {
      label: "Chờ xử lý khiếu nại",
      color: colors.primary,
      bg: colors.primaryBg,
    },
    appeal_accepted: {
      label: "Đã chấp nhận khiếu nại",
      color: colors.success,
      bg: colors.successBg,
    },
    appeal_rejected: {
      label: "Đã từ chối khiếu nại",
      color: colors.error,
      bg: colors.errorBg,
    },
  };
  return map[status];
};

export default function AdminForumScreen() {
  const params = useLocalSearchParams<{
    view?: string | string[];
    reportId?: string | string[];
  }>();
  const routeView = getRouteValue(params.view);
  const targetReportId = getRouteValue(params.reportId);
  const openedTargetRef = useRef<string | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const compact = width < 700;

  const [activeView, setActiveView] = useState<ForumView>(
    routeView === "reports" || targetReportId ? "reports" : "posts"
  );
  const [posts, setPosts] = useState<AdminForumPost[]>([]);
  const [reports, setReports] = useState<AdminForumReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("all");
  const [selectedPost, setSelectedPost] = useState<AdminForumPost | null>(null);
  const [selectedReport, setSelectedReport] =
    useState<AdminForumReport | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const showNotice = useCallback(
    (message: string, type: "success" | "error") => {
      setNotice({ message, type });
      setTimeout(() => setNotice(null), 3200);
    },
    []
  );

  const loadData = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const [postResponse, reportResponse] = await Promise.all([
          adminForumService.getPosts(),
          adminForumService.getReports(),
        ]);
        setPosts(Array.isArray(postResponse.data) ? postResponse.data : []);
        setReports(Array.isArray(reportResponse.data) ? reportResponse.data : []);
      } catch (requestError: any) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Không thể tải dữ liệu kiểm duyệt."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (routeView === "reports" || targetReportId) setActiveView("reports");
    if (routeView === "posts") setActiveView("posts");
  }, [routeView, targetReportId]);

  useEffect(() => {
    if (
      !targetReportId ||
      loading ||
      openedTargetRef.current === targetReportId
    ) {
      return;
    }

    const target = reports.find((report) => report._id === targetReportId);

    if (target) {
      openedTargetRef.current = targetReportId;
      setSelectedReport(target);
    } else if (!error) {
      showNotice("Không tìm thấy báo cáo được mở từ thông báo.", "error");
    }
  }, [error, loading, reports, showNotice, targetReportId]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return posts.filter((post) => {
      const statusMatch =
        postFilter === "all"
          ? true
          : postFilter === "flagged"
            ? Boolean(post.isFlagged)
            : post.status === postFilter;
      const author = post.isAnonymous
        ? post.anonymousName || "thành viên ẩn danh"
        : getUserName(post.authorId);
      const searchMatch =
        !keyword ||
        post.content.toLowerCase().includes(keyword) ||
        author.toLowerCase().includes(keyword) ||
        post.hashtags?.some((tag) => tag.toLowerCase().includes(keyword));
      return statusMatch && searchMatch;
    });
  }, [postFilter, posts, search]);

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return reports.filter((report) => {
      const statusMatch =
        reportFilter === "all" || report.status === reportFilter;
      const searchMatch =
        !keyword ||
        report.reason.toLowerCase().includes(keyword) ||
        report.description?.toLowerCase().includes(keyword) ||
        getUserName(report.reporterId, "Hệ thống AI")
          .toLowerCase()
          .includes(keyword) ||
        getUserName(report.reportedUserId).toLowerCase().includes(keyword) ||
        getEntityId(report.targetId).toLowerCase().includes(keyword);
      return statusMatch && Boolean(searchMatch);
    });
  }, [reportFilter, reports, search]);

  const items = useMemo<ForumListItem[]>(
    () =>
      activeView === "posts"
        ? filteredPosts.map((data) => ({ kind: "post" as const, data }))
        : filteredReports.map((data) => ({ kind: "report" as const, data })),
    [activeView, filteredPosts, filteredReports]
  );

  const runAction = useCallback(
    async (id: string, request: () => Promise<unknown>, success: string) => {
      setBusyId(id);
      try {
        await request();
        setSelectedPost(null);
        setSelectedReport(null);
        showNotice(success, "success");
        await loadData("refresh");
      } catch (requestError: any) {
        showNotice(
          requestError.response?.data?.message ||
            requestError.message ||
            "Không thể hoàn tất thao tác.",
          "error"
        );
      } finally {
        setBusyId(null);
      }
    },
    [loadData, showNotice]
  );

  const confirmAction = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        if (window.confirm(message)) onConfirm();
        return;
      }

      Alert.alert(title, message, [
        { text: "Hủy", style: "cancel" },
        { text: "Xác nhận", style: "destructive", onPress: onConfirm },
      ]);
    },
    []
  );

  const switchView = (view: ForumView) => {
    setActiveView(view);
    setSearch("");
  };

  const renderPost = (post: AdminForumPost) => {
    const status = postStatusInfo(post);
    const author = post.isAnonymous
      ? post.anonymousName || "Thành viên ẩn danh"
      : getUserName(post.authorId);
    const processing = busyId === post._id;

    return (
      <View style={styles.cardCell}>
        <View style={styles.contentCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.identityRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: post.isAnonymous ? colors.bgAlt : colors.tealBg },
                ]}
              >
                <MaterialCommunityIcons
                  name={post.isAnonymous ? "incognito" : "account-outline"}
                  size={20}
                  color={post.isAnonymous ? colors.textSecondary : colors.teal}
                />
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.identityTitle}>{author}</Text>
                <Text style={styles.identityMeta}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <MaterialCommunityIcons
                name={status.icon}
                size={12}
                color={status.color}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <Text style={styles.contentText} numberOfLines={4}>
            {post.content}
          </Text>

          {post.hashtags?.length ? (
            <Text style={styles.hashtags} numberOfLines={1}>
              {post.hashtags.map((tag) => `#${tag}`).join("  ")}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Meta icon="comment-outline" text={`${post.statistics?.commentCount || 0} bình luận`} />
            <Meta
              icon="flag-outline"
              text={`${post.statistics?.reportCount || 0} báo cáo`}
              color={post.statistics?.reportCount ? colors.error : colors.textSecondary}
            />
            {post.toxicityLevel && post.toxicityLevel !== "low" ? (
              <Meta icon="shield-alert-outline" text={`Mức ${post.toxicityLevel}`} color={colors.warning} />
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              icon="eye-outline"
              label="Chi tiết"
              color={colors.info}
              onPress={() => setSelectedPost(post)}
            />
            {post.status !== "approved" && post.status !== "deleted" ? (
              <ActionButton
                icon="check-circle-outline"
                label="Duyệt"
                color={colors.success}
                disabled={processing}
                onPress={() =>
                  runAction(
                    post._id,
                    () => adminForumService.approvePost(post._id),
                    "Đã duyệt bài viết."
                  )
                }
              />
            ) : null}
            {post.status !== "hidden" && post.status !== "deleted" ? (
              <ActionButton
                icon="eye-off-outline"
                label="Ẩn"
                color={colors.warning}
                disabled={processing}
                onPress={() =>
                  runAction(
                    post._id,
                    () =>
                      adminForumService.hidePost(
                        post._id,
                        "Ẩn sau khi admin kiểm duyệt"
                      ),
                    "Đã ẩn bài viết."
                  )
                }
              />
            ) : null}
            {post.status !== "deleted" ? (
              <ActionButton
                icon="trash-can-outline"
                label="Xóa"
                color={colors.error}
                disabled={processing}
                onPress={() =>
                  confirmAction(
                    "Xóa bài viết",
                    "Bài viết sẽ bị xóa khỏi cộng đồng. Bạn muốn tiếp tục?",
                    () =>
                      runAction(
                        post._id,
                        () =>
                          adminForumService.rejectPost(
                            post._id,
                            "Nội dung vi phạm quy tắc cộng đồng"
                          ),
                        "Đã xóa bài viết vi phạm."
                      )
                  )
                }
              />
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderReport = (report: AdminForumReport) => {
    const status = reportStatusInfo(report.status);
    const targetId = getEntityId(report.targetId);
    const processing = busyId === report._id;
    const highlighted = report._id === targetReportId;
    const reporter =
      report.reportSource === "system_ai"
        ? "Hệ thống AI"
        : getUserName(report.reporterId, "Người báo cáo");

    return (
      <View style={styles.cardCell}>
        <View
          style={[
            styles.contentCard,
            highlighted && styles.highlightedCard,
          ]}
        >
          {highlighted ? (
            <View style={styles.targetBanner}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.targetBannerText}>Mở từ thông báo</Text>
            </View>
          ) : null}

          <View style={styles.cardTopRow}>
            <View style={styles.identityRow}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor:
                      report.reportSource === "system_ai"
                        ? colors.primaryBg
                        : colors.errorBg,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={report.reportSource === "system_ai" ? "robot-outline" : "flag-outline"}
                  size={20}
                  color={report.reportSource === "system_ai" ? colors.primary : colors.error}
                />
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.identityTitle}>{reporter}</Text>
                <Text style={styles.identityMeta}>{formatDate(report.createdAt)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.reportTypeRow}>
            <Text style={styles.reportTypeText}>
              {report.targetType === "post" ? "Bài viết" : "Bình luận"}
            </Text>
            <Text style={styles.targetIdText}>#{targetId.slice(-8)}</Text>
          </View>

          <Text style={styles.reportReason}>{report.reason}</Text>
          {report.description ? (
            <Text style={styles.reportDescription} numberOfLines={3}>
              {report.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Meta
              icon="account-alert-outline"
              text={`Bị báo cáo: ${getUserName(report.reportedUserId)}`}
            />
            {report.aiReview?.severity ? (
              <Meta
                icon="shield-alert-outline"
                text={`AI: ${report.aiReview.severity}`}
                color={colors.warning}
              />
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              icon="eye-outline"
              label="Chi tiết"
              color={colors.info}
              onPress={() => setSelectedReport(report)}
            />
            {report.status === "pending" ? (
              <>
                <ActionButton
                  icon="close-circle-outline"
                  label="Bỏ qua"
                  color={colors.textSecondary}
                  disabled={processing}
                  onPress={() =>
                    runAction(
                      report._id,
                      () => adminForumService.dismissReport(report._id),
                      "Đã bỏ qua báo cáo và khôi phục hiển thị nội dung."
                    )
                  }
                />
                <ActionButton
                  icon="shield-check-outline"
                  label="Xử lý"
                  color={colors.error}
                  disabled={processing}
                  onPress={() =>
                    confirmAction(
                      "Xử lý nội dung vi phạm",
                      "Nội dung bị báo cáo sẽ bị xóa khỏi cộng đồng. Bạn muốn tiếp tục?",
                      () =>
                        runAction(
                          report._id,
                          () =>
                            adminForumService.takeActionReport(
                              report._id,
                              report.reason
                            ),
                          "Đã xử lý báo cáo vi phạm."
                        )
                    )
                  }
                />
              </>
            ) : null}
            {report.status === "appeal_pending" ? (
              <>
                <ActionButton
                  icon="check-circle-outline"
                  label="Chấp nhận"
                  color={colors.success}
                  disabled={processing}
                  onPress={() =>
                    runAction(
                      report._id,
                      () =>
                        adminForumService.resolveAppeal(
                          report._id,
                          "accept",
                          "Admin chấp nhận khiếu nại"
                        ),
                      "Đã chấp nhận khiếu nại và khôi phục nội dung."
                    )
                  }
                />
                <ActionButton
                  icon="close-circle-outline"
                  label="Từ chối"
                  color={colors.error}
                  disabled={processing}
                  onPress={() =>
                    runAction(
                      report._id,
                      () =>
                        adminForumService.resolveAppeal(
                          report._id,
                          "reject",
                          "Admin từ chối khiếu nại"
                        ),
                      "Đã từ chối khiếu nại."
                    )
                  }
                />
              </>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ForumListItem }) =>
    item.kind === "post" ? renderPost(item.data) : renderReport(item.data);

  const stats =
    activeView === "posts"
      ? [
          {
            label: "Tổng bài viết",
            value: posts.length,
            icon: "comment-text-outline" as const,
            color: colors.primary,
            bg: colors.primaryBg,
          },
          {
            label: "Chờ duyệt",
            value: posts.filter((item) => item.status === "pending").length,
            icon: "clock-outline" as const,
            color: colors.warning,
            bg: colors.warningBg,
          },
          {
            label: "Bị gắn cờ",
            value: posts.filter((item) => item.isFlagged).length,
            icon: "flag-outline" as const,
            color: colors.error,
            bg: colors.errorBg,
          },
          {
            label: "Đã ẩn",
            value: posts.filter((item) => item.status === "hidden").length,
            icon: "eye-off-outline" as const,
            color: colors.textSecondary,
            bg: colors.bgAlt,
          },
        ]
      : [
          {
            label: "Tổng báo cáo",
            value: reports.length,
            icon: "flag-variant-outline" as const,
            color: colors.primary,
            bg: colors.primaryBg,
          },
          {
            label: "Chờ xử lý",
            value: reports.filter((item) => item.status === "pending").length,
            icon: "clock-alert-outline" as const,
            color: colors.warning,
            bg: colors.warningBg,
          },
          {
            label: "Khiếu nại",
            value: reports.filter((item) => item.status === "appeal_pending")
              .length,
            icon: "message-alert-outline" as const,
            color: colors.error,
            bg: colors.errorBg,
          },
          {
            label: "Đã xử lý",
            value: reports.filter((item) => item.status === "action_taken")
              .length,
            icon: "shield-check-outline" as const,
            color: colors.success,
            bg: colors.successBg,
          },
        ];

  const filters = activeView === "posts" ? postFilters : reportFilters;
  const currentFilter = activeView === "posts" ? postFilter : reportFilter;

  return (
    <SafeAreaView style={styles.safeArea}>
      {notice ? (
        <View
          style={[
            styles.notice,
            notice.type === "success" ? styles.noticeSuccess : styles.noticeError,
          ]}
        >
          <MaterialCommunityIcons
            name={notice.type === "success" ? "check-circle" : "alert-circle"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.noticeText}>{notice.message}</Text>
        </View>
      ) : null}

      <LinearGradient
        colors={[colors.primary, colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerShell}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={() => router.replace("/(admin)" as any)}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Kiểm duyệt diễn đàn</Text>
            <Text style={styles.headerSubtitle}>
              Theo dõi bài viết, báo cáo và khiếu nại để duy trì cộng đồng SOUL an toàn.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        key={`${activeView}-${isDesktop ? "desktop" : "mobile"}`}
        data={loading ? [] : items}
        numColumns={isDesktop ? 2 : 1}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.kind}-${item.data._id}`}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => loadData("refresh")}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.viewTabs}>
              <TouchableOpacity
                style={[styles.viewTab, activeView === "posts" && styles.viewTabActive]}
                onPress={() => switchView("posts")}
              >
                <MaterialCommunityIcons
                  name="comment-text-multiple-outline"
                  size={18}
                  color={activeView === "posts" ? "#FFFFFF" : colors.textSecondary}
                />
                <Text style={[styles.viewTabText, activeView === "posts" && styles.viewTabTextActive]}>
                  Bài viết
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewTab, activeView === "reports" && styles.viewTabActive]}
                onPress={() => switchView("reports")}
              >
                <MaterialCommunityIcons
                  name="flag-variant-outline"
                  size={18}
                  color={activeView === "reports" ? "#FFFFFF" : colors.textSecondary}
                />
                <Text style={[styles.viewTabText, activeView === "reports" && styles.viewTabTextActive]}>
                  Báo cáo
                </Text>
                {reports.filter((item) => item.status === "pending" || item.status === "appeal_pending").length > 0 ? (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>
                      {reports.filter((item) => item.status === "pending" || item.status === "appeal_pending").length}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <View key={item.label} style={[styles.statCard, compact && styles.statCardCompact]}>
                  <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{loading ? "—" : item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.toolbar, compact && styles.toolbarCompact]}>
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={19} color={colors.textMuted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={activeView === "posts" ? "Tìm bài viết, tác giả, hashtag..." : "Tìm lý do, người dùng, mã nội dung..."}
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {filters.map((filter) => {
                  const active = currentFilter === filter.value;
                  return (
                    <TouchableOpacity
                      key={filter.value}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => {
                        if (activeView === "posts") setPostFilter(filter.value as PostFilter);
                        else setReportFilter(filter.value as ReportFilter);
                      }}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.stateText}>Đang tải dữ liệu kiểm duyệt...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <MaterialCommunityIcons name="cloud-alert-outline" size={42} color={colors.error} />
              <Text style={styles.stateTitle}>Không thể tải dữ liệu</Text>
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateBox}>
              <MaterialCommunityIcons
                name={activeView === "posts" ? "comment-off-outline" : "flag-off-outline"}
                size={42}
                color={colors.textMuted}
              />
              <Text style={styles.stateTitle}>
                {activeView === "posts" ? "Không có bài viết phù hợp" : "Không có báo cáo phù hợp"}
              </Text>
              <Text style={styles.stateText}>Hãy thử thay đổi từ khóa hoặc bộ lọc hiện tại.</Text>
            </View>
          )
        }
      />

      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      <ReportDetailModal
        report={selectedReport}
        busy={Boolean(selectedReport && busyId === selectedReport._id)}
        onClose={() => setSelectedReport(null)}
        onDismiss={(report) =>
          runAction(
            report._id,
            () => adminForumService.dismissReport(report._id),
            "Đã bỏ qua báo cáo và khôi phục hiển thị nội dung."
          )
        }
        onTakeAction={(report) =>
          confirmAction(
            "Xử lý nội dung vi phạm",
            "Nội dung bị báo cáo sẽ bị xóa khỏi cộng đồng. Bạn muốn tiếp tục?",
            () =>
              runAction(
                report._id,
                () => adminForumService.takeActionReport(report._id, report.reason),
                "Đã xử lý báo cáo vi phạm."
              )
          )
        }
        onAppeal={(report, action) =>
          runAction(
            report._id,
            () =>
              adminForumService.resolveAppeal(
                report._id,
                action,
                action === "accept" ? "Admin chấp nhận khiếu nại" : "Admin từ chối khiếu nại"
              ),
            action === "accept" ? "Đã chấp nhận khiếu nại." : "Đã từ chối khiếu nại."
          )
        }
      />
    </SafeAreaView>
  );
}

function Meta({
  icon,
  text,
  color = colors.textSecondary,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
  color?: string;
}) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.metaText, { color }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  disabled,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { borderColor: `${color}55` }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {disabled ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <MaterialCommunityIcons name={icon} size={14} color={color} />
      )}
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PostDetailModal({
  post,
  onClose,
}: {
  post: AdminForumPost | null;
  onClose: () => void;
}) {
  if (!post) return null;
  const author = post.isAnonymous
    ? post.anonymousName || "Thành viên ẩn danh"
    : getUserName(post.authorId);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết bài viết</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Detail label="Tác giả" value={author} />
          <Detail label="Ngày đăng" value={formatDate(post.createdAt)} />
          <Detail label="Nội dung" value={post.content} />
          <Detail label="Trạng thái" value={postStatusInfo(post).label} />
          {post.rejectedReason ? <Detail label="Lý do kiểm duyệt" value={post.rejectedReason} /> : null}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ReportDetailModal({
  report,
  busy,
  onClose,
  onDismiss,
  onTakeAction,
  onAppeal,
}: {
  report: AdminForumReport | null;
  busy: boolean;
  onClose: () => void;
  onDismiss: (report: AdminForumReport) => void;
  onTakeAction: (report: AdminForumReport) => void;
  onAppeal: (report: AdminForumReport, action: "accept" | "reject") => void;
}) {
  if (!report) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết báo cáo</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Detail label="Mã báo cáo" value={report._id} />
            <Detail label="Nguồn" value={report.reportSource === "system_ai" ? "Hệ thống AI" : getUserName(report.reporterId, "Người dùng")} />
            <Detail label="Đối tượng" value={`${report.targetType === "post" ? "Bài viết" : "Bình luận"} · ${getEntityId(report.targetId)}`} />
            <Detail label="Người bị báo cáo" value={getUserName(report.reportedUserId)} />
            <Detail label="Lý do" value={report.reason} />
            {report.description ? <Detail label="Mô tả" value={report.description} /> : null}
            {report.aiReview?.severity ? (
              <Detail label="Đánh giá AI" value={`${report.aiReview.violationType || "Nội dung nhạy cảm"} · mức ${report.aiReview.severity}${typeof report.aiReview.confidenceScore === "number" ? ` · ${report.aiReview.confidenceScore}%` : ""}`} />
            ) : null}
            {report.appealReason ? <Detail label="Nội dung khiếu nại" value={report.appealReason} /> : null}
            <Detail label="Trạng thái" value={reportStatusInfo(report.status).label} />
            <Detail label="Ngày tạo" value={formatDate(report.createdAt)} />

            {report.status === "pending" ? (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.secondaryModalButton} onPress={() => onDismiss(report)} disabled={busy}>
                  <Text style={styles.secondaryModalButtonText}>Bỏ qua</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerModalButton} onPress={() => onTakeAction(report)} disabled={busy}>
                  {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.primaryModalButtonText}>Xử lý vi phạm</Text>
                </TouchableOpacity>
              </View>
            ) : report.status === "appeal_pending" ? (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.secondaryModalButton} onPress={() => onAppeal(report, "reject")} disabled={busy}>
                  <Text style={styles.secondaryModalButtonText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryModalButton} onPress={() => onAppeal(report, "accept")} disabled={busy}>
                  {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.primaryModalButtonText}>Chấp nhận</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  headerShell: { paddingTop: 52, paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { width: "100%", maxWidth: 1280, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", fontFamily: displayFont },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.82)", marginTop: 3, fontFamily: webFont, fontWeight: "500" },
  listContent: { width: "100%", maxWidth: 1280, alignSelf: "center", paddingHorizontal: 14, paddingBottom: 42 },
  listHeader: { paddingTop: 18, paddingBottom: 8 },
  viewTabs: { flexDirection: "row", alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 4, borderRadius: 14, marginHorizontal: 6, marginBottom: 16 },
  viewTab: { minHeight: 38, paddingHorizontal: 15, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  viewTabActive: { backgroundColor: colors.primary },
  viewTabText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800", fontFamily: webFont },
  viewTabTextActive: { color: "#FFFFFF" },
  tabCount: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: colors.error, alignItems: "center", justifyContent: "center" },
  tabCountText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 6, marginBottom: 16 },
  statCard: { flex: 1, minWidth: 190, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statCardCompact: { minWidth: "46%", padding: 11 },
  statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statValue: { color: colors.textPrimary, fontSize: 19, fontWeight: "900", fontFamily: displayFont },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600", fontFamily: webFont, marginTop: 1 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 6, marginBottom: 14 },
  toolbarCompact: { flexDirection: "column", alignItems: "stretch" },
  searchBox: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 13 },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: webFont, fontSize: 13, fontWeight: "500", paddingVertical: 0 },
  filterRow: { gap: 7, alignItems: "center", paddingVertical: 2 },
  filterChip: { minHeight: 34, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", fontFamily: webFont },
  filterTextActive: { color: "#FFFFFF" },
  cardCell: { flex: 1, padding: 6 },
  contentCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, ...Platform.select({ web: { boxShadow: "0 5px 18px rgba(15,23,42,0.035)" }, ios: { shadowColor: colors.primary, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }, android: { elevation: 2 } }) },
  highlightedCard: { borderColor: colors.primary, borderWidth: 2, backgroundColor: "#FCFAFF" },
  targetBanner: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primaryBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
  targetBannerText: { color: colors.primary, fontSize: 10, fontWeight: "800", fontFamily: webFont },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  identityRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  identityCopy: { flex: 1, minWidth: 0 },
  identityTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "900", fontFamily: displayFont },
  identityMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2, fontFamily: webFont },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: "900", fontFamily: webFont },
  contentText: { color: colors.textPrimary, fontSize: 14, lineHeight: 21, fontFamily: webFont, fontWeight: "500", marginTop: 14 },
  hashtags: { color: colors.primary, fontSize: 12, fontWeight: "700", fontFamily: webFont, marginTop: 9 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 12 },
  metaItem: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 11, fontFamily: webFont, fontWeight: "600" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 7, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 13 },
  actionButton: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, backgroundColor: colors.surfaceAlt },
  actionText: { fontSize: 11, fontWeight: "800", fontFamily: webFont },
  disabled: { opacity: 0.55 },
  reportTypeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 },
  reportTypeText: { color: colors.primary, backgroundColor: colors.primaryBg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, fontSize: 10, fontWeight: "900", fontFamily: webFont },
  targetIdText: { color: colors.textMuted, fontSize: 10, fontWeight: "700", fontFamily: webFont },
  reportReason: { color: colors.textPrimary, fontSize: 15, fontWeight: "900", fontFamily: displayFont, marginTop: 11 },
  reportDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: webFont, marginTop: 5 },
  stateBox: { minHeight: 270, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 24, margin: 6 },
  stateTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "900", fontFamily: displayFont, marginTop: 12 },
  stateText: { color: colors.textSecondary, fontSize: 13, textAlign: "center", fontFamily: webFont, marginTop: 6 },
  retryButton: { minHeight: 38, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center", marginTop: 15 },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: webFont },
  notice: { position: "absolute", top: 16, alignSelf: "center", zIndex: 50, maxWidth: 520, minHeight: 44, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, elevation: 10 },
  noticeSuccess: { backgroundColor: colors.success },
  noticeError: { backgroundColor: colors.error },
  noticeText: { flex: 1, color: "#FFFFFF", fontSize: 13, fontWeight: "700", fontFamily: webFont },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.42)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalScroll: { flexGrow: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  modalCard: { width: "100%", maxWidth: 560, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12, ...Platform.select({ web: { boxShadow: "0 18px 48px rgba(15,23,42,0.2)" }, ios: { shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } }, android: { elevation: 10 } }) },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  modalTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "900", fontFamily: displayFont },
  detailRow: { gap: 3, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 9 },
  detailLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: "800", textTransform: "uppercase", fontFamily: webFont },
  detailValue: { color: colors.textPrimary, fontSize: 13, lineHeight: 19, fontWeight: "500", fontFamily: webFont },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 3 },
  secondaryModalButton: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  secondaryModalButtonText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800", fontFamily: webFont },
  primaryModalButton: { flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  dangerModalButton: { flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: colors.error, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  primaryModalButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", fontFamily: webFont },
  closeButton: { minHeight: 42, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 3 },
  closeButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", fontFamily: webFont },
});
