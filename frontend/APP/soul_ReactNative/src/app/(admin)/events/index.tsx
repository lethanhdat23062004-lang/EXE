import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  FlatList,
  RefreshControl,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/colors";
import { eventAdminService } from "@/services/eventApi";
import { getComputedEventStatus, getFillRate } from "@/utils/eventRegistration";

type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

const statusMeta: Record<
  EventStatus,
  { label: string; bg: string; color: string; icon: string }
> = {
  upcoming: {
    label: "Sắp diễn ra",
    bg: colors.accentBg,
    color: colors.accent,
    icon: "calendar-clock",
  },
  ongoing: {
    label: "Đang diễn ra",
    bg: colors.successBg,
    color: colors.success,
    icon: "play-circle-outline",
  },
  completed: {
    label: "Đã kết thúc",
    bg: colors.bgAlt,
    color: colors.textSecondary,
    icon: "checkbox-marked-circle-outline",
  },
  cancelled: {
    label: "Đã hủy",
    bg: colors.errorBg,
    color: colors.error,
    icon: "close-circle-outline",
  },
};

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "upcoming", label: "Sắp diễn ra" },
  { key: "ongoing", label: "Đang diễn ra" },
  { key: "completed", label: "Đã kết thúc" },
  { key: "cancelled", label: "Đã hủy" },
  { key: "attendance_overdue", label: "Thiếu điểm danh" },
  { key: "archived", label: "Đã lưu trữ" },
];

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "Chưa xác định";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function EventCard({ item }: { item: any }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const computedStatus = getComputedEventStatus(item) as EventStatus;
  const status = statusMeta[computedStatus] || statusMeta.upcoming;
  const registeredCount = item.registeredCount || 0;
  const capacity = item.capacity || 0;
  const fillRate = getFillRate(item.capacity, registeredCount);
  const formattedTime = formatDateTime(item.startDateTime);

  return (
    <View style={[styles.cardCell, { minWidth: isDesktop ? 320 : "100%" }]}>
      <TouchableOpacity
        style={styles.eventCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/(admin)/events/${item._id}`)}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.bg, borderColor: status.color + "33" },
            ]}
          >
            <MaterialCommunityIcons name={status.icon as any} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          {item.isArchived && (
            <View style={styles.archivePill}>
              <MaterialCommunityIcons name="archive-outline" size={12} color="#6D5DFB" />
              <Text style={styles.archivePillText}>Đã lưu trữ</Text>
            </View>
          )}
        </View>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          {item.pendingAttendanceCount > 0 && computedStatus === "completed" && (
            <View style={styles.attendanceWarning}>
              <MaterialCommunityIcons name="account-clock-outline" size={14} color="#C2410C" />
              <Text style={styles.attendanceWarningText}>
                Còn {item.pendingAttendanceCount} người chưa hoàn tất điểm danh
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formattedTime}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location || "Online Zoom"}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="star" size={14} color="#D97706" />
            <Text style={styles.metaText}>
              {(item.ratingSummary?.average || 0).toFixed(1)} ({item.ratingSummary?.total || 0} đánh giá)
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {registeredCount} / {capacity || "không giới hạn"} người đăng ký
            </Text>
            <Text style={styles.progressPercent}>{fillRate}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(fillRate, 100)}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminEventsList() {
  const params = useLocalSearchParams();
  const initialFilter = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState(
    initialFilter === "attendance_overdue" ? "attendance_overdue" : "all"
  );
  const [searchFocused, setSearchFocused] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const numColumns = isDesktop ? 2 : 1;
  const compact = width < 760;

  const fetchEvents = async () => {
    try {
      const response = await eventAdminService.getEvents("all");
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách sự kiện");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEvents();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const filteredEvents = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return events.filter((event) => {
      const status = getComputedEventStatus(event) as EventStatus;
      const matchesStatus =
        activeFilter === "archived"
          ? event.isArchived === true
          : activeFilter === "attendance_overdue"
            ? status === "completed" && (event.pendingAttendanceCount || 0) > 0
            : event.isArchived !== true && (activeFilter === "all" || status === activeFilter);
      const haystack = [event.title, event.location, event.eventType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, events, searchText]);

  const counts = useMemo(() => {
    const statusCounts = events.reduce(
      (acc, event) => {
        if (event.isArchived) return acc;
        const status = getComputedEventStatus(event) as EventStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<EventStatus, number>
    );

    return {
      all: events.filter((event) => !event.isArchived).length,
      upcoming: statusCounts.upcoming || 0,
      ongoing: statusCounts.ongoing || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0,
      archived: events.filter((event) => event.isArchived).length,
      attendance_overdue: events.filter(
        (event) =>
          getComputedEventStatus(event) === "completed" &&
          (event.pendingAttendanceCount || 0) > 0
      ).length,
    };
  }, [events]);

  const totalRegistrations = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  }, [events]);

  const avgFillRate = useMemo(() => {
    if (!events.length) return 0;
    const rates = events.map(e => getFillRate(e.capacity, e.registeredCount));
    const totalRate = rates.reduce((sum, r) => sum + r, 0);
    return Math.round(totalRate / events.length);
  }, [events]);

  const getTabLabel = (key: string, label: string) => {
    const count = counts[key as keyof typeof counts] || 0;
    return `${label} (${count})`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

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
            <Text style={styles.headerTitle}>Quản lý sự kiện</Text>
            <Text style={styles.headerSubtitle}>
              Lên lịch workshop, talkshow và theo dõi tỉ lệ đăng ký tham gia.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => router.push("/(admin)/events/create")}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            {!compact && <Text style={styles.exportText}>Tạo mới</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main List view */}
      <FlatList
        key={isDesktop ? "desktop-list" : "mobile-list"}
        numColumns={numColumns}
        data={loading ? [] : filteredEvents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <EventCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Stats dashboard cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: "#F5F3FF" }]}>
                  <MaterialCommunityIcons
                    name="calendar-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{events.length}</Text>
                  <Text style={styles.statLabel}>Tổng sự kiện</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: "#E0F2FE" }]}>
                  <MaterialCommunityIcons
                    name="ticket-confirmation-outline"
                    size={20}
                    color="#0284C7"
                  />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{totalRegistrations}</Text>
                  <Text style={styles.statLabel}>Đăng ký</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: "#ECFDF5" }]}>
                  <MaterialCommunityIcons
                    name="chart-donut"
                    size={20}
                    color={colors.teal}
                  />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{avgFillRate}%</Text>
                  <Text style={styles.statLabel}>Tỉ lệ lấp đầy</Text>
                </View>
              </View>
            </View>



            {/* Search & Filter row */}
            <View
              style={[
                styles.searchFilterRow,
                !isDesktop && styles.searchFilterRowMobile,
              ]}
            >
              {/* Search Container with Focus Ring */}
              <View
                style={[
                  styles.searchContainer,
                  searchFocused && styles.searchContainerFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={searchFocused ? colors.primary : colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm sự kiện..."
                  placeholderTextColor={colors.textMuted}
                  value={searchText}
                  onChangeText={setSearchText}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Scroll Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContainer}
              >
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilter === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.filterTab, isActive && styles.filterTabActive]}
                      onPress={() => setActiveFilter(tab.key)}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          isActive && styles.filterTabTextActive,
                        ]}
                      >
                        {getTabLabel(tab.key, tab.label)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Đang tải danh sách sự kiện...</Text>
            </View>
          ) : (
            <View style={styles.centered}>
              <MaterialCommunityIcons name="calendar-search" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Không có sự kiện phù hợp</Text>
              <Text style={styles.emptyText}>
                Thử đổi từ khóa hoặc bộ lọc để xem thêm kết quả.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: displayFont,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 3,
    fontFamily: webFont,
    fontWeight: "500",
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
    paddingHorizontal: 16,
  },
  exportText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    fontFamily: webFont,
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 6,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 4px 20px rgba(109, 93, 251, 0.02)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 1,
    fontFamily: webFont,
  },

  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginBottom: 16,
    gap: 16,
  },
  searchFilterRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    ...Platform.select({
      web: { boxShadow: "0 0 0 3px rgba(109, 93, 251, 0.15)" },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
    fontFamily: webFont,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    gap: 8,
    alignItems: "center",
    paddingVertical: 2,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    fontFamily: webFont,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  cardCell: {
    flex: 1,
    padding: 6,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...Platform.select({
      web: { boxShadow: "0 4px 16px rgba(15, 23, 42, 0.02)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },
  archivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F4EFFF",
  },
  archivePillText: {
    color: "#6D5DFB",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: webFont,
  },
  metaContainer: {
    gap: 8,
    marginBottom: 16,
  },
  attendanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
  },
  attendanceWarningText: { color: "#9A3412", fontSize: 11, fontWeight: "800" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    fontFamily: webFont,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: webFont,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    fontFamily: webFont,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgAlt,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    fontFamily: webFont,
    paddingHorizontal: 40,
  },
});
