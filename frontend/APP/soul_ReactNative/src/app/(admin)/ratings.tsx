import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  adminRatingService,
  EventRating,
  RatingSort,
  RatingStatus,
} from "@/api/ratingApi";
import { StarRating } from "@/components/ratings/StarRating";
import { colors } from "@/constants/colors";

type Stats = {
  average: number;
  total: number;
  ratedEvents: number;
  hiddenTotal: number;
  distribution: Record<number, number>;
};

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const EMPTY_STATS: Stats = {
  average: 0,
  total: 0,
  ratedEvents: 0,
  hiddenTotal: 0,
  distribution: {},
};

const STAR = colors.accent; // #F59E0B

const reasons = [
  ["spam", "Spam"],
  ["offensive", "Nội dung xúc phạm"],
  ["advertisement", "Quảng cáo"],
  ["other", "Khác"],
];

const sortOptions: { value: RatingSort; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest", label: "Cao nhất" },
  { value: "lowest", label: "Thấp nhất" },
];

const statusOptions: { value: "all" | RatingStatus; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "visible", label: "Hiển thị" },
  { value: "hidden", label: "Đã ẩn" },
];

const initials = (name?: string) =>
  (name || "SOUL User")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

export default function AdminRatingsScreen() {
  const { eventId: routeEventId, ratingId: routeRatingId } = useLocalSearchParams<{
    eventId?: string | string[];
    ratingId?: string | string[];
  }>();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const isDesktop = width >= 900;
  const numColumns = isDesktop ? 2 : 1;

  const initialEventId = Array.isArray(routeEventId)
    ? routeEventId[0]
    : routeEventId;
  const targetRatingId = Array.isArray(routeRatingId)
    ? routeRatingId[0]
    : routeRatingId;
  const [eventFilter, setEventFilter] = useState(
    initialEventId && /^[0-9a-fA-F]{24}$/.test(initialEventId)
      ? initialEventId
      : undefined
  );

  const [ratings, setRatings] = useState<EventRating[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | RatingStatus>("all");
  const [stars, setStars] = useState<number | undefined>();
  const [sort, setSort] = useState<RatingSort>("newest");
  const [selected, setSelected] = useState<EventRating | null>(null);
  const [hideTarget, setHideTarget] = useState<EventRating | null>(null);
  const [hideReason, setHideReason] = useState("spam");
  const [hideNote, setHideNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    if (!targetRatingId || !/^[0-9a-fA-F]{24}$/.test(targetRatingId)) {
      return;
    }

    let active = true;

    const openTargetRating = async () => {
      try {
        const response = await adminRatingService.getDetail(targetRatingId);
        if (active && response?.data) {
          setSelected(response.data as EventRating);
        }
      } catch (error: any) {
        if (active) {
          showToast(
            error.response?.data?.message ||
              error.message ||
              "Không thể mở đánh giá từ thông báo",
            "error"
          );
        }
      }
    };

    openTargetRating();

    return () => {
      active = false;
    };
  }, [showToast, targetRatingId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        adminRatingService.getRatings({
          search: search || undefined,
          status,
          rating: stars,
          sort,
          eventId: eventFilter,
          limit: 100,
        }),
        adminRatingService.getStatistics(eventFilter),
      ]);
      const listData = list.data as
        | EventRating[]
        | { ratings?: EventRating[] }
        | undefined;
      setRatings(
        Array.isArray(listData)
          ? listData
          : Array.isArray(listData?.ratings)
            ? listData.ratings
            : []
      );
      setStats(summary.data || EMPTY_STATS);
    } catch (error: any) {
      showToast(
        error.response?.data?.message || error.message || "Không thể tải đánh giá",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [eventFilter, search, showToast, sort, stars, status]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const qualityBadge = useMemo(() => {
    if (!stats.total) return { label: "Chưa có dữ liệu", color: colors.textSecondary, bg: colors.bgAlt };
    if (stats.average >= 4.5) return { label: "↑ Xuất sắc", color: colors.success, bg: colors.successBg };
    if (stats.average >= 4) return { label: "Tốt", color: colors.teal, bg: colors.tealBg };
    if (stats.average >= 3) return { label: "Ổn định", color: colors.accent, bg: colors.accentBg };
    return { label: "Cần cải thiện", color: colors.error, bg: colors.errorBg };
  }, [stats.average, stats.total]);

  const confirmHide = async () => {
    if (!hideTarget) return;
    if (hideReason === "other" && !hideNote.trim()) {
      showToast("Vui lòng mô tả lý do khác.", "error");
      return;
    }

    setSaving(true);
    try {
      await adminRatingService.hide(hideTarget._id, hideReason, hideNote.trim());
      setHideTarget(null);
      setHideNote("");
      showToast("Đã ẩn đánh giá.", "success");
      await load();
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || "Không thể ẩn đánh giá", "error");
    } finally {
      setSaving(false);
    }
  };

  const restore = async (item: EventRating) => {
    try {
      await adminRatingService.restore(item._id);
      showToast("Đã khôi phục đánh giá.", "success");
      await load();
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || "Không thể khôi phục", "error");
    }
  };

  const exportCsv = async () => {
    try {
      const csv = await adminRatingService.exportCsv();
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `event-ratings-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("Đã xuất báo cáo CSV.", "success");
      } else {
        Alert.alert("Xuất CSV", "Tải file CSV hiện được hỗ trợ trên phiên bản web.");
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || "Không thể xuất CSV", "error");
    }
  };

  const renderRating = ({ item }: { item: EventRating }) => {
    const user = typeof item.userId === "string" ? null : item.userId;
    const event = typeof item.eventId === "string" ? null : item.eventId;
    const hidden = item.status === "hidden";
    const expanded = Boolean(expandedReviews[item._id]);
    const canExpand = Boolean(item.comment && item.comment.length > 150);

    return (
      <View style={[styles.cardCell, { minWidth: isDesktop ? 320 : "100%" }]}>
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
            </View>
            <View style={styles.reviewIdentity}>
              <Text style={styles.userName}>{user?.fullName || "Người dùng SOUL"}</Text>
              <Text style={styles.eventName} numberOfLines={1}>
                {event?.title || "Sự kiện SOUL"}
              </Text>
            </View>
            <View style={[styles.statusBadge, hidden ? styles.hiddenBadge : styles.visibleBadge]}>
              <Text style={[styles.statusBadgeText, hidden ? styles.hiddenText : styles.visibleText]}>
                {hidden ? "Đã ẩn" : "Hiển thị"}
              </Text>
            </View>
          </View>

          <View style={styles.reviewMetaRow}>
            <StarRating value={item.rating} size={16} disabled />
            <View style={styles.metaDot} />
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString("vi-VN")}
            </Text>
          </View>

          {item.comment ? (
            <View>
              <Text style={styles.reviewComment} numberOfLines={expanded ? undefined : 3}>
                “{item.comment}”
              </Text>
              {canExpand && (
                <TouchableOpacity
                  style={styles.readMoreButton}
                  onPress={() => setExpandedReviews((current) => ({
                    ...current,
                    [item._id]: !expanded,
                  }))}
                >
                  <Text style={styles.readMoreText}>{expanded ? "Thu gọn" : "Đọc thêm"}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noComment}>Không có nhận xét bằng văn bản.</Text>
          )}

          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.detailButton} onPress={() => setSelected(item)}>
              <MaterialCommunityIcons name="open-in-new" size={15} color={colors.textSecondary} />
              <Text style={styles.detailButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moderationButton, hidden ? styles.restoreButton : styles.hideButton]}
              onPress={() => hidden ? restore(item) : setHideTarget(item)}
            >
              <MaterialCommunityIcons
                name={hidden ? "eye-outline" : "eye-off-outline"}
                size={15}
                color={hidden ? colors.success : colors.error}
              />
              <Text style={[styles.moderationButtonText, hidden ? styles.restoreButtonText : styles.hideButtonText]}>
                {hidden ? "Hiện đánh giá" : "Ẩn đánh giá"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && (
        <View style={[styles.toast, toast.type === "success" ? styles.toastSuccess : styles.toastError]}>
          <MaterialCommunityIcons
            name={toast.type === "success" ? "check-circle" : "alert-circle"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header Block (LinearGradient) */}
      <LinearGradient
        colors={[colors.primary, colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerShell}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(admin)")}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Quản lý đánh giá</Text>
            <Text style={styles.headerSubtitle}>
              Phản hồi và kiểm duyệt ý kiến từ người tham dự sự kiện.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportCsv}
          >
            <MaterialCommunityIcons name="download-outline" size={18} color="#FFFFFF" />
            {!compact && <Text style={styles.exportText}>Xuất CSV</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        key={isDesktop ? "desktop-list" : "mobile-list"}
        numColumns={numColumns}
        data={loading ? [] : ratings}
        renderItem={renderRating}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={load}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.statsGrid}>
              <StatCard
                icon="star-outline"
                iconColor={colors.accent}
                iconBg={colors.accentBg}
                value={loading ? "—" : stats.average.toFixed(1)}
                label="Điểm trung bình"
                context={qualityBadge.label}
                contextColor={qualityBadge.color}
                contextBg={qualityBadge.bg}
                compact={compact}
              />
              <StatCard
                icon="message-text-outline"
                iconColor={colors.primary}
                iconBg={colors.primaryBg}
                value={loading ? "—" : stats.total}
                label="Tổng đánh giá"
                compact={compact}
              />
              <StatCard
                icon="calendar-check-outline"
                iconColor={colors.teal}
                iconBg={colors.tealBg}
                value={loading ? "—" : stats.ratedEvents}
                label="Sự kiện có đánh giá"
                compact={compact}
              />
              <StatCard
                icon="eye-off-outline"
                iconColor={colors.textSecondary}
                iconBg={colors.bgAlt}
                value={loading ? "—" : stats.hiddenTotal}
                label="Đã ẩn"
                compact={compact}
              />
            </View>

            <View style={[styles.overviewCard, compact && styles.overviewCardCompact]}>
              <Text style={styles.sectionEyebrow}>TỔNG QUAN ĐIỂM</Text>
              <View style={[styles.overviewBody, compact && styles.overviewBodyCompact]}>
                <View style={[styles.averageBlock, compact && styles.averageBlockCompact]}>
                  <Text style={styles.overviewAverage}>{stats.average.toFixed(1)}</Text>
                  <StarRating value={Math.round(stats.average)} size={18} disabled />
                  <Text style={styles.overviewCount}>{stats.total} đánh giá</Text>
                </View>
                <View style={[styles.distributionList, compact && styles.distributionListCompact]}>
                  {[5, 4, 3, 2, 1].map((value) => {
                    const count = stats.distribution?.[value] || 0;
                    const percentage = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <View key={value} style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>☆ {value}</Text>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${percentage}%` as any }]} />
                        </View>
                        <Text style={styles.distributionCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.listHeadingRow}>
              <View>
                <Text style={styles.listHeading}>Danh sách đánh giá</Text>
                <Text style={styles.resultCount}>{ratings.length} kết quả phù hợp</Text>
              </View>
            </View>

            {eventFilter && (
              <View style={styles.eventFilterRow}>
                <View style={styles.eventFilterChip}>
                  <MaterialCommunityIcons name="calendar-filter" size={16} color={colors.primary} />
                  <Text style={styles.eventFilterText}>
                    Đang lọc theo sự kiện · {eventFilter.slice(-6)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEventFilter(undefined)}
                    accessibilityRole="button"
                    accessibilityLabel="Xóa bộ lọc sự kiện"
                  >
                    <MaterialCommunityIcons name="close" size={17} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.eventFilterHint}>Xóa bộ lọc để xem đánh giá của mọi sự kiện.</Text>
              </View>
            )}

            <View style={styles.toolbar}>
              <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
                <MaterialCommunityIcons name="magnify" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Tìm user, sự kiện hoặc nội dung..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {searchInput.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchInput("")}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.statusFilters}>
                {statusOptions.map((item) => (
                  <FilterChip
                    key={item.value}
                    label={item.label}
                    active={status === item.value}
                    onPress={() => setStatus(item.value)}
                  />
                ))}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryFilters}
            >
              {sortOptions.map((item) => (
                <FilterChip
                  key={item.value}
                  label={item.label}
                  active={sort === item.value}
                  onPress={() => setSort(item.value)}
                />
              ))}
              {[5, 4, 3, 2, 1].map((value) => (
                <FilterChip
                  key={value}
                  label={`${value}★`}
                  active={stars === value}
                  onPress={() => setStars(stars === value ? undefined : value)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3].map((item) => <ReviewSkeleton key={item} />)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="message-star-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Không có đánh giá phù hợp</Text>
              <Text style={styles.emptyText}>Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả.</Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchInput("");
                  setStatus("all");
                  setStars(undefined);
                  setSort("newest");
                  setEventFilter(undefined);
                }}
              >
                <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <Modal visible={Boolean(hideTarget)} transparent animationType="fade" onRequestClose={() => setHideTarget(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setHideTarget(null)} />
          <View style={styles.actionModal}>
            <Text style={styles.modalTitle}>Ẩn đánh giá</Text>
            <Text style={styles.modalSubtitle}>Chọn lý do để lưu lịch sử kiểm duyệt.</Text>
            {reasons.map(([value, label]) => (
              <TouchableOpacity key={value} style={styles.reasonRow} onPress={() => setHideReason(value)}>
                <MaterialCommunityIcons
                  name={hideReason === value ? "radiobox-marked" : "radiobox-blank"}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.reasonText}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              value={hideNote}
              onChangeText={setHideNote}
              placeholder="Ghi chú kiểm duyệt"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              style={styles.noteInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setHideTarget(null)}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmHide} disabled={saving}>
                {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={styles.confirmButtonText}>{saving ? "Đang lưu..." : "Xác nhận ẩn"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)} />
          <View style={styles.actionModal}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đánh giá</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <MaterialCommunityIcons name="close" size={21} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <Detail label="Người dùng" value={typeof selected.userId === "string" ? selected.userId : `${selected.userId.fullName} (${selected.userId.email || "không có email"})`} />
                <Detail label="Sự kiện" value={typeof selected.eventId === "string" ? selected.eventId : selected.eventId.title} />
                <StarRating value={selected.rating} disabled />
                <Detail label="Nhận xét" value={selected.comment || "Không có nhận xét"} />
                <Detail label="Trạng thái" value={selected.status === "visible" ? "Hiển thị" : "Đã ẩn"} />
                {selected.hiddenReason ? <Detail label="Lý do ẩn" value={`${selected.hiddenReason}${selected.hiddenNote ? ` – ${selected.hiddenNote}` : ""}`} /> : null}
                <Detail label="Ngày tạo" value={new Date(selected.createdAt).toLocaleString("vi-VN")} />
              </>
            )}
            <TouchableOpacity style={styles.confirmButton} onPress={() => setSelected(null)}>
              <Text style={styles.confirmButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  context,
  contextColor,
  contextBg,
  compact,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  context?: string;
  contextColor?: string;
  contextBg?: string;
  compact: boolean;
}) {
  return (
    <View style={[styles.statCard, compact && styles.statCardCompact]}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {context && (
        <View style={[styles.contextBadge, { backgroundColor: contextBg }]}>
          <Text style={[styles.contextText, { color: contextColor }]}>{context}</Text>
        </View>
      )}
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.filterChipButton, active && styles.activeFilterChipButton]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>{label}</Text>
    </TouchableOpacity>
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

function ReviewSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeleton, styles.skeletonAvatar]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[styles.skeleton, { width: "36%", height: 14 }]} />
          <View style={[styles.skeleton, { width: "55%", height: 11 }]} />
        </View>
      </View>
      <View style={[styles.skeleton, { width: "24%", height: 13 }]} />
      <View style={[styles.skeleton, { width: "90%", height: 12 }]} />
      <View style={[styles.skeleton, { width: "70%", height: 12 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  headerShell: {
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center"
  },
  headerCopy: { flex: 1 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: displayFont,
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 3,
    fontFamily: webFont,
    fontWeight: "500"
  },
  exportButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16
  },
  exportText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    fontFamily: webFont
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 40
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 6,
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
      default: { elevation: 3 },
    }),
  },
  statCardCompact: { flexBasis: "46%", minHeight: 110, padding: 12 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { color: colors.textPrimary, fontWeight: "800", fontSize: 24, fontFamily: displayFont },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2, fontFamily: webFont },
  contextBadge: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  contextText: { fontSize: 10, fontWeight: "800", fontFamily: webFont },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    marginHorizontal: 6,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
      default: { elevation: 3 },
    }),
  },
  overviewCardCompact: { padding: 14 },
  sectionEyebrow: { color: colors.textPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 0.4, marginBottom: 14, fontFamily: displayFont },
  overviewBody: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  overviewBodyCompact: { flexDirection: "column", gap: 14 },
  averageBlock: { width: 120, alignItems: "center" },
  averageBlockCompact: { width: "100%" },
  overviewAverage: { fontSize: 40, color: colors.textPrimary, fontWeight: "800", fontFamily: displayFont, marginBottom: 4 },
  overviewCount: { color: colors.textSecondary, fontSize: 12, marginTop: 6, fontFamily: webFont, fontWeight: "600" },
  distributionList: { flex: 1, gap: 8, paddingTop: 2 },
  distributionListCompact: { width: "100%", alignSelf: "stretch" },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  distributionLabel: { width: 28, color: STAR, fontSize: 12, fontWeight: "700", fontFamily: webFont },
  progressTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: colors.bgAlt, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: STAR },
  distributionCount: { width: 24, textAlign: "right", color: colors.textSecondary, fontSize: 12, fontFamily: webFont, fontWeight: "600" },
  listHeadingRow: { marginBottom: 12, paddingHorizontal: 6 },
  listHeading: { color: colors.textPrimary, fontSize: 16, fontWeight: "900", fontFamily: displayFont },
  resultCount: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontFamily: webFont },
  eventFilterRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 6 },
  eventFilterChip: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    backgroundColor: colors.primaryBg,
  },
  eventFilterText: { color: colors.primary, fontSize: 12, fontWeight: "700", fontFamily: webFont },
  eventFilterHint: { color: colors.textSecondary, fontSize: 12, fontFamily: webFont },
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 10, paddingHorizontal: 6 },
  searchBox: {
    flexGrow: 1,
    flexBasis: 320,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
      ios: { shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }),
  },
  searchBoxFocused: {
    borderColor: colors.primary,
    ...Platform.select({
      web: { boxShadow: "0 0 0 3px rgba(109, 93, 251, 0.15)" },
    }),
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13, paddingVertical: 0, fontFamily: webFont, fontWeight: "500" },
  statusFilters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  secondaryFilters: { flexDirection: "row", gap: 6, paddingBottom: 12, paddingHorizontal: 6 },
  filterChipButton: { minHeight: 32, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  activeFilterChipButton: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", fontFamily: webFont },
  activeFilterChipText: { color: "#FFFFFF" },
  cardCell: {
    flex: 1,
    padding: 6,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 4px 16px rgba(15, 23, 42, 0.02)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  reviewHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderPrimary },
  avatarText: { color: colors.primary, fontSize: 12, fontWeight: "900", fontFamily: displayFont },
  reviewIdentity: { flex: 1, minWidth: 0 },
  userName: { color: colors.textPrimary, fontSize: 14, fontWeight: "900", fontFamily: displayFont },
  eventName: { color: colors.primary, fontSize: 12, marginTop: 2, fontWeight: "700", fontFamily: webFont },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  visibleBadge: { backgroundColor: colors.successBg },
  hiddenBadge: { backgroundColor: colors.errorBg },
  statusBadgeText: { fontSize: 10, fontWeight: "900", fontFamily: webFont },
  visibleText: { color: colors.success },
  hiddenText: { color: colors.error },
  reviewMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border },
  reviewDate: { color: colors.textSecondary, fontSize: 11, fontFamily: webFont, fontWeight: "500" },
  reviewComment: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 10, fontFamily: webFont, fontWeight: "500" },
  noComment: { color: colors.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 10, fontFamily: webFont },
  readMoreButton: { alignSelf: "flex-start", marginTop: 4 },
  readMoreText: { color: colors.primary, fontSize: 12, fontWeight: "800", fontFamily: webFont },
  reviewActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  detailButton: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  detailButtonText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: webFont },
  moderationButton: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, backgroundColor: colors.surface },
  hideButton: { borderColor: colors.error, backgroundColor: colors.errorBg },
  restoreButton: { borderColor: colors.success, backgroundColor: colors.successBg },
  moderationButtonText: { color: colors.error, fontSize: 12, fontWeight: "800", fontFamily: webFont },
  restoreButtonText: { color: colors.success },
  hideButtonText: { color: colors.error },
  skeletonList: { gap: 12, paddingHorizontal: 6 },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
  skeletonHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  skeleton: { backgroundColor: colors.bgAlt, borderRadius: 999 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 12 },
  emptyState: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", paddingVertical: 42, paddingHorizontal: 20, marginHorizontal: 6 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryBg, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "900", marginTop: 12, fontFamily: displayFont },
  emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 5, fontFamily: webFont },
  clearFiltersButton: { marginTop: 16, minHeight: 38, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.primary, justifyContent: "center" },
  clearFiltersText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: webFont },
  toast: { position: "absolute", zIndex: 20, top: 16, alignSelf: "center", maxWidth: 460, minHeight: 44, marginHorizontal: 16, paddingHorizontal: 14, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 8, shadowColor: "#000000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 8 },
  toastSuccess: { backgroundColor: colors.success },
  toastError: { backgroundColor: colors.error },
  toastText: { flex: 1, color: "#FFFFFF", fontSize: 13, fontWeight: "700", fontFamily: webFont },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.38)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  actionModal: { width: "100%", maxWidth: 520, backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12, shadowColor: "#000000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 10, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", fontFamily: displayFont },
  modalSubtitle: { color: colors.textSecondary, fontSize: 13, fontFamily: webFont },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  reasonText: { color: colors.textPrimary, fontSize: 13, fontFamily: webFont, fontWeight: "500" },
  noteInput: { minHeight: 80, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, textAlignVertical: "top", color: colors.textPrimary, fontFamily: webFont, fontSize: 13 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceAlt },
  cancelButtonText: { color: colors.textSecondary, fontWeight: "800", fontFamily: webFont, fontSize: 13 },
  confirmButton: { flex: 1, minHeight: 40, borderRadius: 10, backgroundColor: colors.primary, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  confirmButtonText: { color: "#FFFFFF", fontWeight: "800", fontFamily: webFont, fontSize: 13 },
  detailModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailRow: { gap: 3, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: "800", textTransform: "uppercase", fontFamily: webFont },
  detailValue: { color: colors.textPrimary, lineHeight: 18, fontSize: 13, fontFamily: webFont, fontWeight: "500" },
});
