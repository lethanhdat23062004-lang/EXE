import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  AdminNotificationBell,
  AdminNotificationSummary,
  useAdminNotifications,
} from "@/components/admin/AdminNotificationCenter";
import {
  AdminDashboardOverview,
  DistributionKey,
  EMPTY_ADMIN_OVERVIEW,
  getAdminDashboardOverview,
} from "@/api/adminDashboardApi";
import { useAuthStore } from "@/store";

type AdminAction = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route?: string;
  badge?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isWide = width >= 1280;
  const [overview, setOverview] = useState<AdminDashboardOverview>(EMPTY_ADMIN_OVERVIEW);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [distributionTab, setDistributionTab] = useState<DistributionKey>("age");
  const adminNotifications = useAdminNotifications();

  const loadOverview = React.useCallback(() => {
    let mounted = true;
    setIsLoadingStats(true);
    setStatsError(null);
    getAdminDashboardOverview()
      .then((response) => {
        if (mounted && response.success) {
          setOverview(response.data || EMPTY_ADMIN_OVERVIEW);
        }
      })
      .catch(() => {
        if (mounted) setStatsError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại.");
      })
      .finally(() => {
        if (mounted) setIsLoadingStats(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => loadOverview(), [loadOverview]);

  const eventStats = overview.events;

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản quản trị viên?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const adminActions: AdminAction[] = useMemo(
    () => [
      {
        key: "users",
        title: "Người dùng",
        description: "Xem, chặn và phân quyền tài khoản trong hệ thống.",
        icon: "account-cog-outline",
        color: "#6D5DFB",
        route: "/(admin)/users",
      },
      {
        key: "forum",
        title: "Forum",
        description: "Kiểm duyệt bài viết, bình luận và nội dung cộng đồng.",
        icon: "forum-outline",
        color: "#0F766E",
        route: "/(admin)/forum",
      },
      {
        key: "reports",
        title: "Báo cáo vi phạm",
        description: "Xử lý report từ cộng đồng và nội dung bị AI gắn cờ.",
        icon: "shield-alert-outline",
        color: "#E11D48",
        route: "/(admin)/forum?view=reports",
        badge:
          overview.moderation.pendingReports + overview.moderation.pendingAppeals > 0
            ? `${overview.moderation.pendingReports + overview.moderation.pendingAppeals} cần xử lý`
            : undefined,
      },
      {
        key: "events",
        title: "Sự kiện",
        description: "Tạo workshop, quản lý đăng ký, điểm danh và lịch diễn ra.",
        icon: "calendar-star-outline",
        color: "#0891B2",
        route: "/(admin)/events",
        badge:
          overview.events.overdueEventCount > 0
            ? `${overview.events.overdueEventCount} thiếu điểm danh`
            : undefined,
      },
      {
        key: "ratings",
        title: "Đánh giá sự kiện",
        description: "Theo dõi review, điểm sao và ẩn/khôi phục đánh giá.",
        icon: "message-star-outline",
        color: "#D97706",
        route: "/(admin)/ratings",
      },
      {
        key: "ai-settings",
        title: "Cấu hình AI",
        description: "Thiết lập ngưỡng an toàn và cấu hình phản hồi hỗ trợ.",
        icon: "robot-outline",
        color: "#475569",
        badge: "Sắp ra mắt",
        disabled: true,
      },
    ],
    [
      overview.events.overdueEventCount,
      overview.moderation.pendingAppeals,
      overview.moderation.pendingReports,
    ]
  );

  const filteredAdminActions = useMemo(() => {
    const keyword = moduleSearch.trim().toLocaleLowerCase("vi");
    if (!keyword) return adminActions;
    return adminActions.filter((action) =>
      `${action.title} ${action.description}`.toLocaleLowerCase("vi").includes(keyword)
    );
  }, [adminActions, moduleSearch]);

  const kpis = [
    {
      label: "Đăng ký sự kiện",
      value: eventStats.registeredCount,
      helper: `${eventStats.cancelledCount} đã hủy`,
      icon: "account-check-outline",
      color: "#14B8A6",
      bg: "#ECFDF5",
    },
    {
      label: "Điểm danh",
      value: `${eventStats.attendedCount}/${eventStats.absentCount}`,
      helper: "Đã tham dự / Vắng",
      icon: "account-star-outline",
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
    {
      label: "Tỷ lệ tham dự",
      value: `${eventStats.attendanceRate}%`,
      helper: "Từ dữ liệu EventRegistration",
      icon: "chart-donut",
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      label: "Tỷ lệ review",
      value: `${eventStats.reviewRate}%`,
      helper: `Điểm TB ${eventStats.averageRating.toFixed(1)}/5`,
      icon: "message-star-outline",
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
  ];

  const insightBars = [
    {
      label: "Attendance",
      value: eventStats.attendanceRate,
      color: "#6D5DFB",
    },
    {
      label: "Review",
      value: eventStats.reviewRate,
      color: "#14B8A6",
    },
    {
      label: "Rating",
      value: Math.min(100, (eventStats.averageRating / 5) * 100),
      color: "#F59E0B",
    },
  ];

  const riskItems = [
    {
      title: "Đánh giá sự kiện",
      subtitle:
        eventStats.reviewRate > 0
          ? "Đã có dữ liệu review từ người tham dự."
          : "Chưa có review đủ để phân tích chất lượng sự kiện.",
      icon: "star-outline",
      color: "#D97706",
      route: "/(admin)/ratings",
    },
    {
      title: "Điểm danh",
      subtitle:
        eventStats.overdueEventCount > 0
          ? `${eventStats.overdueEventCount} sự kiện còn ${eventStats.overdueRegistrationCount} người chưa hoàn tất điểm danh.`
          : "Không có sự kiện đã kết thúc còn thiếu điểm danh.",
      icon: "account-clock-outline",
      color: "#0F766E",
      route: "/(admin)/events?filter=attendance_overdue",
    },
    {
      title: "Báo cáo cộng đồng",
      subtitle:
        overview.moderation.pendingReports + overview.moderation.pendingAppeals > 0
          ? `${overview.moderation.pendingReports} report và ${overview.moderation.pendingAppeals} khiếu nại đang chờ xử lý.`
          : "Không có report hoặc khiếu nại đang chờ xử lý.",
      icon: "shield-search",
      color: "#E11D48",
      route: "/(admin)/forum?view=reports",
    },
  ];

  const distributionLabels: Record<DistributionKey, Record<string, string>> = {
    age: {
      under18: "Dưới 18",
      "18_22": "18–22",
      "23_30": "23–30",
      over30: "Trên 30",
      unknown: "Chưa cập nhật",
    },
    gender: { male: "Nam", female: "Nữ", other: "Khác", unknown: "Chưa cập nhật" },
    status: { active: "Đang hoạt động", inactive: "Chưa hoạt động", blocked: "Đã khóa" },
    role: { user: "Người dùng", event_organizer: "Người tổ chức", admin: "Admin" },
  };
  const distributionEntries = Object.entries(overview.users.distribution[distributionTab]).map(
    ([key, value]) => ({ key, label: distributionLabels[distributionTab][key] || key, value })
  );
  const distributionTotal = distributionEntries.reduce((sum, item) => sum + item.value, 0);
  const maxSatisfactionCount = Math.max(
    1,
    ...Object.values(overview.appSatisfaction.distribution)
  );

  const navigateAction = (action: AdminAction | { route?: string; title?: string }) => {
    if (action.route) {
      router.push(action.route as any);
      return;
    }

    if ("onPress" in action && action.onPress) {
      action.onPress();
      return;
    }

    Alert.alert("Đang hoàn thiện", `Tính năng "${action.title || "này"}" sẽ được bổ sung sau.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.shell, !isDesktop && styles.shellMobile]}>
        {isDesktop ? (
          <View style={styles.sidebar}>
            <Text style={styles.logo}>SOUL</Text>
            <Text style={styles.sidebarCaption}>Admin Dashboard</Text>

            <View style={styles.sidebarNav}>
              {[
                { label: "Overview", icon: "view-dashboard-outline", active: true },
                { label: "Users", icon: "account-group-outline", route: "/(admin)/users" },
                { label: "Forum", icon: "forum-outline", route: "/(admin)/forum" },
                { label: "Events", icon: "calendar-outline", route: "/(admin)/events" },
                { label: "Ratings", icon: "star-outline", route: "/(admin)/ratings" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, item.active && styles.navItemActive]}
                  activeOpacity={0.82}
                  onPress={() => item.route && router.push(item.route as any)}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={18}
                    color={item.active ? "#6D5DFB" : "#64748B"}
                  />
                  <Text style={[styles.navText, item.active && styles.navTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.helpCard}>
              <MaterialCommunityIcons name="lifebuoy" size={22} color="#6D5DFB" />
              <Text style={styles.helpTitle}>Cần hỗ trợ?</Text>
              <Text style={styles.helpText}>Kiểm tra report và sự kiện trước khi xử lý thủ công.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.main}>
          <View style={[styles.topbar, !isDesktop && styles.topbarMobile]}>
            {!isDesktop ? <Text style={styles.logo}>SOUL</Text> : null}

            <View style={[styles.searchBox, !isDesktop && styles.searchBoxMobile]}>
              <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
              <TextInput
                placeholder="Tìm kiếm module quản trị..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={moduleSearch}
                onChangeText={setModuleSearch}
                returnKeyType="search"
                onSubmitEditing={() => {
                  const firstAvailable = filteredAdminActions.find((action) => !action.disabled);
                  if (firstAvailable) navigateAction(firstAvailable);
                }}
              />
            </View>

            <View style={styles.topbarRight}>
              <AdminNotificationBell
                controller={adminNotifications}
                buttonStyle={styles.iconButton}
              />

              <TouchableOpacity
                style={styles.profilePill}
                activeOpacity={0.82}
                onPress={() => router.push("/(admin)/profile" as any)}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(user?.fullName || "A").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                {isWide ? (
                  <View>
                    <Text style={styles.profileName}>{user?.fullName || "Admin Soul"}</Text>
                    <Text style={styles.profileRole}>System Manager</Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.82}>
                <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {statsError ? (
              <View style={styles.dataErrorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={19} color="#B91C1C" />
                <Text style={styles.dataErrorText}>{statsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadOverview}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={[styles.heroRow, !isDesktop && styles.heroRowMobile]}>
              <View style={[styles.heroCard, !isDesktop && styles.noRightMargin]}>
                <View style={styles.eyebrow}>
                  <MaterialCommunityIcons name="auto-fix" size={14} color="#6D5DFB" />
                  <Text style={styles.eyebrowText}>Tổng quan hệ thống SOUL</Text>
                </View>
                <Text style={styles.heroTitle}>Chào Admin 👋</Text>
                <Text style={styles.heroDescription}>
                  Theo dõi đăng ký, điểm danh, đánh giá sự kiện và các khu vực cần kiểm duyệt trong cộng đồng.
                </Text>

                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.86}
                    onPress={() => router.push("/(admin)/events" as any)}
                  >
                    <Text style={styles.primaryButtonText}>Quản lý sự kiện</Text>
                    <MaterialCommunityIcons name="arrow-right" size={17} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.86}
                    onPress={() => router.push("/(admin)/ratings" as any)}
                  >
                    <Text style={styles.secondaryButtonText}>Xem đánh giá</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <LinearGradient
                colors={["#EEE7FF", "#F6F2FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.summaryCard, !isDesktop && styles.summaryCardMobile]}
              >
                <Text style={styles.summaryLabel}>Sức khỏe sự kiện</Text>
                <View style={styles.summaryNumbers}>
                  <View>
                    <Text style={styles.summaryNumber}>{eventStats.registeredCount}</Text>
                    <Text style={styles.summaryCaption}>Đăng ký</Text>
                  </View>
                  <View>
                    <Text style={styles.summaryNumber}>{eventStats.reviewRate}%</Text>
                    <Text style={styles.summaryCaption}>Review rate</Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
                <Text style={styles.summaryNote}>
                  Dữ liệu lấy từ EventRegistration và EventRating, không dùng số liệu mô phỏng.
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.kpiGrid}>
              {kpis.map((item) => (
                <View key={item.label} style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop]}>
                  <View style={[styles.kpiIcon, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.kpiValue}>{isLoadingStats ? "..." : item.value}</Text>
                  <Text style={styles.kpiLabel}>{item.label}</Text>
                  <Text style={styles.kpiHelper}>{item.helper}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.analyticsRow, !isDesktop && styles.analyticsRowMobile]}>
              <View style={[styles.chartCard, !isDesktop && styles.noRightMargin]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Chất lượng vận hành sự kiện</Text>
                    <Text style={styles.cardSubtitle}>Tổng hợp từ đăng ký, điểm danh và review.</Text>
                  </View>
                  <View style={styles.monthPill}>
                    <Text style={styles.monthPillText}>Hiện tại</Text>
                  </View>
                </View>

                <View style={styles.barChart}>
                  {insightBars.map((bar) => (
                    <View key={bar.label} style={styles.barRow}>
                      <Text style={styles.barLabel}>{bar.label}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(4, Math.min(100, bar.value))}%`, backgroundColor: bar.color },
                          ]}
                        />
                      </View>
                      <Text style={styles.barValue}>{Math.round(bar.value)}%</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.aiInsightBox}>
                  <MaterialCommunityIcons name="auto-fix" size={20} color="#6D5DFB" />
                  <Text style={styles.aiInsightText}>
                    Gợi ý: nếu tỷ lệ review thấp, admin nên kiểm tra lại trạng thái attendance và nhắc người đã tham dự đánh giá sự kiện.
                  </Text>
                </View>
              </View>

              <View style={[styles.distributionCard, !isDesktop && styles.mobileStackTop]}>
                <Text style={styles.cardTitle}>Điểm cần theo dõi</Text>
                <Text style={styles.cardSubtitle}>Ưu tiên các khu vực có tác động đến an toàn cộng đồng.</Text>

                {riskItems.map((item) => (
                  <TouchableOpacity
                    key={item.title}
                    style={styles.riskItem}
                    activeOpacity={0.82}
                    onPress={() => navigateAction(item)}
                  >
                    <View style={[styles.riskIcon, { backgroundColor: `${item.color}18` }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <View style={styles.riskContent}>
                      <Text style={styles.riskTitle}>{item.title}</Text>
                      <Text style={styles.riskSubtitle}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.insightGrid, !isDesktop && styles.analyticsRowMobile]}>
              <View style={[styles.satisfactionCard, !isDesktop && styles.noRightMargin]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Mức độ hài lòng về SOUL</Text>
                    <Text style={styles.cardSubtitle}>Đánh giá toàn ứng dụng, không bao gồm đánh giá sự kiện.</Text>
                  </View>
                  <View style={styles.satisfactionScorePill}>
                    <MaterialCommunityIcons name="star" size={16} color="#D97706" />
                    <Text style={styles.satisfactionScoreText}>
                      {overview.appSatisfaction.averageRating.toFixed(1)}/5
                    </Text>
                  </View>
                </View>

                {isLoadingStats ? (
                  <View style={styles.panelState}>
                    <ActivityIndicator color="#6D5DFB" />
                    <Text style={styles.panelStateText}>Đang tải dữ liệu hài lòng...</Text>
                  </View>
                ) : (
                <>
                <View style={styles.satisfactionStats}>
                  <View style={styles.satisfactionStatItem}>
                    <Text style={styles.satisfactionStatValue}>{overview.appSatisfaction.totalRatings}</Text>
                    <Text style={styles.satisfactionStatLabel}>Phản hồi</Text>
                  </View>
                  <View style={styles.satisfactionStatItem}>
                    <Text style={styles.satisfactionStatValue}>{overview.appSatisfaction.satisfactionRate}%</Text>
                    <Text style={styles.satisfactionStatLabel}>Hài lòng 4–5 sao</Text>
                  </View>
                  <View style={styles.satisfactionStatItem}>
                    <Text style={styles.satisfactionStatValue}>{overview.appSatisfaction.responseRate}%</Text>
                    <Text style={styles.satisfactionStatLabel}>Tỷ lệ phản hồi</Text>
                  </View>
                </View>

                <View style={styles.ratingDistribution}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = overview.appSatisfaction.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                    return (
                      <View key={star} style={styles.ratingDistributionRow}>
                        <Text style={styles.ratingDistributionLabel}>{star} ★</Text>
                        <View style={styles.ratingDistributionTrack}>
                          <View
                            style={[
                              styles.ratingDistributionFill,
                              { width: `${(count / maxSatisfactionCount) * 100}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.ratingDistributionCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.feedbackHeading}>Phản hồi gần đây</Text>
                {overview.appSatisfaction.recentFeedback.length ? (
                  overview.appSatisfaction.recentFeedback.map((feedback) => (
                    <View key={feedback._id} style={styles.feedbackRow}>
                      <View style={styles.feedbackAvatar}>
                        <Text style={styles.feedbackAvatarText}>
                          {(feedback.user?.fullName || "U").slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.feedbackContent}>
                        <View style={styles.feedbackMeta}>
                          <Text style={styles.feedbackName}>{feedback.user?.fullName || "Người dùng"}</Text>
                          <Text style={styles.feedbackStars}>{"★".repeat(feedback.rating)}</Text>
                        </View>
                        <Text style={styles.feedbackText} numberOfLines={2}>{feedback.feedback}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.inlineEmptyState}>
                    <MaterialCommunityIcons name="message-text-outline" size={22} color="#94A3B8" />
                    <Text style={styles.inlineEmptyText}>Chưa có phản hồi bằng nội dung.</Text>
                  </View>
                )}
                </>
                )}
              </View>

              <View style={[styles.userDistributionCard, !isDesktop && styles.mobileStackTop]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Phân bổ người dùng</Text>
                    <Text style={styles.cardSubtitle}>{overview.users.total} tài khoản trong hệ thống.</Text>
                  </View>
                </View>
                {isLoadingStats ? (
                  <View style={styles.panelState}>
                    <ActivityIndicator color="#6D5DFB" />
                    <Text style={styles.panelStateText}>Đang tải phân bổ người dùng...</Text>
                  </View>
                ) : distributionTotal === 0 ? (
                  <View style={styles.panelState}>
                    <MaterialCommunityIcons name="account-group-outline" size={24} color="#94A3B8" />
                    <Text style={styles.panelStateText}>Chưa có dữ liệu người dùng để phân tích.</Text>
                  </View>
                ) : (
                <>
                <View style={styles.distributionTabs}>
                  {([
                    ["age", "Độ tuổi"],
                    ["gender", "Giới tính"],
                    ["status", "Trạng thái"],
                    ["role", "Vai trò"],
                  ] as [DistributionKey, string][]).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.distributionTab, distributionTab === key && styles.distributionTabActive]}
                      onPress={() => setDistributionTab(key)}
                    >
                      <Text style={[styles.distributionTabText, distributionTab === key && styles.distributionTabTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.userDistributionList}>
                  {distributionEntries.map((item, index) => {
                    const rate = distributionTotal ? (item.value / distributionTotal) * 100 : 0;
                    const barColors = ["#6D5DFB", "#14B8A6", "#F59E0B", "#3B82F6", "#94A3B8"];
                    return (
                      <View key={item.key} style={styles.userDistributionRow}>
                        <View style={styles.userDistributionMeta}>
                          <Text style={styles.userDistributionLabel}>{item.label}</Text>
                          <Text style={styles.userDistributionValue}>{item.value} · {Math.round(rate)}%</Text>
                        </View>
                        <View style={styles.userDistributionTrack}>
                          <View
                            style={[
                              styles.userDistributionFill,
                              { width: `${rate}%`, backgroundColor: barColors[index % barColors.length] },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.userSummaryGrid}>
                  <View style={styles.userSummaryItem}>
                    <Text style={styles.userSummaryValue}>{overview.users.active}</Text>
                    <Text style={styles.userSummaryLabel}>Active</Text>
                  </View>
                  <View style={styles.userSummaryItem}>
                    <Text style={styles.userSummaryValue}>{overview.users.blocked}</Text>
                    <Text style={styles.userSummaryLabel}>Đã khóa</Text>
                  </View>
                </View>

                <Text style={styles.feedbackHeading}>Người dùng mới trong 6 tháng</Text>
                <View style={styles.growthChart}>
                  {overview.users.growth.map((item) => {
                    const maxGrowth = Math.max(1, ...overview.users.growth.map((row) => row.count));
                    return (
                      <View key={item.month} style={styles.growthColumn}>
                        <Text style={styles.growthValue}>{item.count}</Text>
                        <View style={styles.growthTrack}>
                          <View
                            style={[
                              styles.growthFill,
                              { height: `${Math.max(8, (item.count / maxGrowth) * 100)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.growthLabel}>{item.label}</Text>
                      </View>
                    );
                  })}
                </View>
                </>
                )}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Chức năng quản trị</Text>
                <Text style={styles.sectionSubtitle}>Các module thật đang có trong dự án SOUL.</Text>
              </View>
            </View>

            <View style={styles.actionsGrid}>
              {filteredAdminActions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={[
                    styles.moduleCard,
                    isDesktop && styles.moduleCardDesktop,
                    action.disabled && styles.moduleCardDisabled,
                  ]}
                  activeOpacity={0.84}
                  onPress={() => !action.disabled && navigateAction(action)}
                  disabled={action.disabled}
                >
                  <View style={styles.moduleTop}>
                    <View style={[styles.moduleIcon, { backgroundColor: `${action.color}18` }]}>
                      <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
                    </View>
                    {action.badge ? (
                      <View style={styles.moduleBadge}>
                        <Text style={styles.moduleBadgeText}>{action.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.moduleTitle}>{action.title}</Text>
                  <Text style={styles.moduleDescription}>{action.description}</Text>
                  <View style={styles.moduleFooter}>
                    <Text style={styles.moduleLink}>{action.disabled ? "Chưa khả dụng" : "Mở module"}</Text>
                    {!action.disabled && <MaterialCommunityIcons name="arrow-right" size={16} color="#6D5DFB" />}
                  </View>
                </TouchableOpacity>
              ))}
              {!filteredAdminActions.length && (
                <View style={styles.moduleSearchEmpty}>
                  <MaterialCommunityIcons name="magnify-close" size={28} color="#94A3B8" />
                  <Text style={styles.managementEmptyTitle}>Không tìm thấy module phù hợp</Text>
                  <TouchableOpacity onPress={() => setModuleSearch("")}>
                    <Text style={styles.moduleLink}>Xóa từ khóa</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={[styles.bottomRow, !isDesktop && styles.analyticsRowMobile]}>
              <View style={[styles.smallPanel, !isDesktop && styles.noRightMargin]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Thông báo hệ thống</Text>
                    <Text style={styles.cardSubtitle}>Ba thông báo quản trị gần nhất.</Text>
                  </View>
                  {adminNotifications.unreadCount > 0 ? (
                    <View style={styles.notificationCountPill}>
                      <Text style={styles.notificationCountText}>
                        {adminNotifications.unreadCount > 99
                          ? "99+ mới"
                          : `${adminNotifications.unreadCount} mới`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <AdminNotificationSummary controller={adminNotifications} />
              </View>

              <View style={[styles.smallPanel, !isDesktop && styles.mobileStackTop]}>
                <Text style={styles.cardTitle}>Tác vụ nhanh</Text>
                <TouchableOpacity
                  style={styles.quickTask}
                  activeOpacity={0.82}
                  onPress={() => router.push("/(admin)/events/create" as any)}
                >
                  <MaterialCommunityIcons name="calendar-plus" size={18} color="#6D5DFB" />
                  <Text style={styles.quickTaskText}>Tạo sự kiện mới</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickTask}
                  activeOpacity={0.82}
                  onPress={() => router.push("/(admin)/forum" as any)}
                >
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color="#0F766E" />
                  <Text style={styles.quickTaskText}>Kiểm tra nội dung forum</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickTask}
                  activeOpacity={0.82}
                  onPress={() => router.push("/(admin)/ratings" as any)}
                >
                  <MaterialCommunityIcons name="star-box-outline" size={18} color="#D97706" />
                  <Text style={styles.quickTaskText}>Xem đánh giá mới</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const shadowSoft = Platform.select({
  ios: {
    shadowColor: "#6D5DFB",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 3 },
  web: { boxShadow: "0 18px 45px rgba(93, 95, 239, 0.08)" },
  default: { elevation: 3 },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7FF",
  },

  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8F7FF",
  },

  shellMobile: {
    flexDirection: "column",
  },

  sidebar: {
    width: 238,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#ECE7FF",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
  },

  logo: {
    color: "#6D28D9",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  sidebarCaption: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  sidebarNav: {
    marginTop: 34,
  },

  navItem: {
    minHeight: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  navItemActive: {
    backgroundColor: "#F0EAFE",
  },

  navText: {
    marginLeft: 10,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  navTextActive: {
    color: "#6D5DFB",
  },

  helpCard: {
    marginTop: "auto",
    backgroundColor: "#F8F7FF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECE7FF",
  },

  helpTitle: {
    marginTop: 10,
    color: "#1E1B4B",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  helpText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  main: {
    flex: 1,
  },

  topbar: {
    minHeight: 72,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#ECE7FF",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  topbarMobile: {
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingVertical: 12,
  },

  searchBox: {
    width: 360,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#F7F3FF",
    borderWidth: 1,
    borderColor: "#EFE7FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  searchBoxMobile: {
    width: "100%",
    marginTop: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#0F172A",
    fontSize: 13,
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
    outlineStyle: "none" as any,
  },

  topbarRight: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  profilePill: {
    marginLeft: 10,
    minHeight: 42,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7FF",
    paddingLeft: 4,
    paddingRight: 14,
  },

  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#6D5DFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  profileName: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  profileRole: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  scrollContent: {
    padding: 24,
    paddingBottom: 44,
    maxWidth: 1320,
    width: "100%",
    alignSelf: "center",
  },

  heroRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  heroRowMobile: {
    flexDirection: "column",
  },

  heroCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    marginRight: 18,
    ...shadowSoft,
  },

  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4EFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18,
  },

  eyebrowText: {
    marginLeft: 6,
    color: "#6D5DFB",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  heroTitle: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  heroDescription: {
    marginTop: 12,
    maxWidth: 640,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  heroActions: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  primaryButton: {
    height: 44,
    borderRadius: 999,
    backgroundColor: "#6D5DFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 8,
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  secondaryButton: {
    height: 44,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: "#6D5DFB",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  summaryCard: {
    width: 310,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    ...shadowSoft,
  },

  summaryCardMobile: {
    width: "100%",
    marginTop: 14,
  },

  noRightMargin: {
    marginRight: 0,
  },

  mobileStackTop: {
    marginTop: 14,
    marginRight: 0,
  },

  summaryLabel: {
    color: "#4338CA",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  summaryNumbers: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryNumber: {
    color: "#4C1D95",
    fontSize: 34,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  summaryCaption: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(109, 93, 251, 0.16)",
    marginVertical: 18,
  },

  summaryNote: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 18,
  },

  kpiCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    padding: 18,
    margin: 6,
    ...shadowSoft,
  },

  kpiCardDesktop: {
    flex: 1,
    minWidth: 210,
  },

  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  kpiValue: {
    color: "#1E1B4B",
    fontSize: 26,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  kpiLabel: {
    marginTop: 4,
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  kpiHelper: {
    marginTop: 5,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  analyticsRow: {
    flexDirection: "row",
    marginBottom: 24,
  },

  analyticsRowMobile: {
    flexDirection: "column",
  },

  chartCard: {
    flex: 1.55,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    padding: 22,
    marginRight: 18,
    ...shadowSoft,
  },

  distributionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    padding: 22,
    ...shadowSoft,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  cardSubtitle: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  monthPill: {
    backgroundColor: "#F4EFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  monthPillText: {
    color: "#6D5DFB",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  barChart: {
    marginTop: 24,
  },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  barLabel: {
    width: 92,
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 999,
  },

  barValue: {
    width: 44,
    textAlign: "right",
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  aiInsightBox: {
    marginTop: 10,
    backgroundColor: "#F4EFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  aiInsightText: {
    flex: 1,
    marginLeft: 10,
    color: "#4C1D95",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  riskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
    marginTop: 16,
  },

  riskIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  riskContent: {
    flex: 1,
  },

  riskTitle: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  riskSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  sectionSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -7,
    marginBottom: 18,
  },

  moduleCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    padding: 20,
    margin: 7,
    ...shadowSoft,
  },

  moduleCardDesktop: {
    width: "31.7%",
    minWidth: 260,
  },

  moduleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  moduleBadge: {
    backgroundColor: "#FFF1F2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  moduleBadgeText: {
    color: "#E11D48",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  moduleTitle: {
    marginTop: 18,
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined }),
  },

  moduleDescription: {
    marginTop: 7,
    minHeight: 42,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  moduleFooter: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  moduleLink: {
    color: "#6D5DFB",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 6,
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  bottomRow: {
    flexDirection: "row",
  },

  smallPanel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    padding: 22,
    marginRight: 18,
    ...shadowSoft,
  },

  notificationCountPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F4EFFF",
  },

  notificationCountText: {
    color: "#6D5DFB",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },

  quickTask: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EFE7FF",
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  quickTaskText: {
    marginLeft: 10,
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
  },
  dataErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  dataErrorText: { flex: 1, color: "#991B1B", fontSize: 13, fontWeight: "700" },
  retryButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: "#B91C1C" },
  retryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  insightGrid: { flexDirection: "row", marginBottom: 28 },
  satisfactionCard: {
    flex: 1.35,
    marginRight: 18,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    backgroundColor: "#FFFFFF",
    ...shadowSoft,
  },
  userDistributionCard: {
    flex: 0.9,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFE7FF",
    backgroundColor: "#FFFFFF",
    ...shadowSoft,
  },
  satisfactionScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFBEB",
  },
  satisfactionScoreText: { color: "#92400E", fontSize: 13, fontWeight: "900" },
  satisfactionStats: { flexDirection: "row", gap: 10, marginTop: 18 },
  satisfactionStatItem: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: "#FAF9FF" },
  satisfactionStatValue: { color: "#312E81", fontSize: 20, fontWeight: "900" },
  satisfactionStatLabel: { marginTop: 4, color: "#64748B", fontSize: 10, fontWeight: "700" },
  ratingDistribution: { marginTop: 18, gap: 8 },
  ratingDistributionRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  ratingDistributionLabel: { width: 30, color: "#D97706", fontSize: 11, fontWeight: "800" },
  ratingDistributionTrack: { flex: 1, height: 7, borderRadius: 999, backgroundColor: "#F1F5F9", overflow: "hidden" },
  ratingDistributionFill: { height: "100%", borderRadius: 999, backgroundColor: "#F59E0B" },
  ratingDistributionCount: { width: 24, textAlign: "right", color: "#64748B", fontSize: 11, fontWeight: "800" },
  feedbackHeading: { marginTop: 20, marginBottom: 5, color: "#111827", fontSize: 13, fontWeight: "900" },
  feedbackRow: { flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  feedbackAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F4EFFF" },
  feedbackAvatarText: { color: "#6D5DFB", fontSize: 12, fontWeight: "900" },
  feedbackContent: { flex: 1 },
  feedbackMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  feedbackName: { flex: 1, color: "#1E293B", fontSize: 12, fontWeight: "800" },
  feedbackStars: { color: "#F59E0B", fontSize: 10 },
  feedbackText: { marginTop: 3, color: "#64748B", fontSize: 11, lineHeight: 16 },
  inlineEmptyState: { minHeight: 76, alignItems: "center", justifyContent: "center", gap: 7 },
  inlineEmptyText: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
  panelState: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 10 },
  panelStateText: { color: "#64748B", fontSize: 12, fontWeight: "700", textAlign: "center" },
  distributionTabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 },
  distributionTab: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: "#E2E8F0" },
  distributionTabActive: { borderColor: "#6D5DFB", backgroundColor: "#F4EFFF" },
  distributionTabText: { color: "#64748B", fontSize: 10, fontWeight: "800" },
  distributionTabTextActive: { color: "#6D5DFB" },
  userDistributionList: { marginTop: 18, gap: 14 },
  userDistributionRow: { gap: 6 },
  userDistributionMeta: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  userDistributionLabel: { color: "#334155", fontSize: 11, fontWeight: "800" },
  userDistributionValue: { color: "#64748B", fontSize: 10, fontWeight: "700" },
  userDistributionTrack: { height: 8, borderRadius: 999, overflow: "hidden", backgroundColor: "#F1F5F9" },
  userDistributionFill: { height: "100%", borderRadius: 999 },
  userSummaryGrid: { flexDirection: "row", gap: 10, marginTop: 22 },
  userSummaryItem: { flex: 1, padding: 13, borderRadius: 14, backgroundColor: "#F8FAFC" },
  userSummaryValue: { color: "#312E81", fontSize: 18, fontWeight: "900" },
  userSummaryLabel: { marginTop: 3, color: "#64748B", fontSize: 10, fontWeight: "700" },
  growthChart: { minHeight: 126, flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 8 },
  growthColumn: { flex: 1, alignItems: "center" },
  growthValue: { marginBottom: 5, color: "#475569", fontSize: 9, fontWeight: "800" },
  growthTrack: {
    width: "100%",
    maxWidth: 32,
    height: 80,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
  },
  growthFill: { width: "100%", borderRadius: 9, backgroundColor: "#8B5CF6" },
  growthLabel: { marginTop: 6, color: "#94A3B8", fontSize: 9, fontWeight: "800" },
  moduleCardDisabled: { opacity: 0.62, backgroundColor: "#F8FAFC" },
  moduleSearchEmpty: { width: "100%", minHeight: 150, alignItems: "center", justifyContent: "center", gap: 9 },
  managementEmptyTitle: { color: "#334155", fontSize: 14, fontWeight: "900" },
});
