import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/colors";
import { eventAdminService } from "@/services/eventApi";
import {
  AttendanceStatus,
  EventStatus,
  normalizeEventRegistration,
  RegistrationStatus,
  ReviewStatus,
} from "@/utils/eventRegistration";

type ParticipantFilter =
  | "all"
  | RegistrationStatus
  | AttendanceStatus;

type RegistrationUser = {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
};

type EventRegistration = {
  _id: string;
  userId: RegistrationUser | string;
  registrationStatus: RegistrationStatus;
  attendanceStatus: AttendanceStatus;
  reviewStatus: ReviewStatus;
  registeredAt?: string;
  cancelledAt?: string | null;
  checkedInAt?: string | null;
};

type AttendanceChange = {
  registration: EventRegistration;
  nextStatus: AttendanceStatus;
} | null;

type AttendanceAudit = {
  _id: string;
  userId?: RegistrationUser | null;
  changedBy?: RegistrationUser | null;
  fromStatus: AttendanceStatus;
  toStatus: AttendanceStatus;
  reason?: string;
  createdAt: string;
};

const filters: { label: string; value: ParticipantFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Đã đăng ký", value: "registered" },
  { label: "Đã hủy", value: "cancelled" },
  { label: "Chưa điểm danh", value: "not_checked_in" },
  { label: "Đã tham dự", value: "attended" },
  { label: "Vắng mặt", value: "absent" },
];

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const getUserId = (registration: EventRegistration) =>
  typeof registration.userId === "string"
    ? registration.userId
    : registration.userId._id || "";

const getUserInfo = (registration: EventRegistration) => {
  if (typeof registration.userId === "string") {
    return { name: "Người dùng", email: "Không có email", phone: "" };
  }
  return {
    name: registration.userId.fullName || "Người dùng",
    email: registration.userId.email || "Không có email",
    phone: registration.userId.phone || "",
  };
};

const initials = (name?: string) =>
  (name || "SOUL User")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const getAvatarColors = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    bg: `hsl(${h}, 70%, 94%)`,
    text: `hsl(${h}, 65%, 42%)`
  };
};

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa cập nhật";

export default function AdminEventRegistrations() {
  const params = useLocalSearchParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : String(params.id || "");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("upcoming");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartDateTime, setEventStartDateTime] = useState("");
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [filter, setFilter] = useState<ParticipantFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [change, setChange] = useState<AttendanceChange>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeView, setActiveView] = useState<"participants" | "audits">("participants");
  const [audits, setAudits] = useState<AttendanceAudit[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const compact = width < 760;

  const fetchRegistrations = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await eventAdminService.getEventRegistrations(eventId, "all");
      if (response.success && response.data) {
        setEventTitle(response.data.event?.title || "");
        setEventStatus(response.data.event?.status || "upcoming");
        setEventLocation(response.data.event?.location || "");
        setEventStartDateTime(response.data.event?.startDateTime || "");
        setRegistrations((response.data.registrations || []).map((item: EventRegistration) => ({
          ...item,
          ...(normalizeEventRegistration(item) || {}),
          reviewStatus: item.reviewStatus === "reviewed" ? "reviewed" : "not_reviewed",
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => void fetchRegistrations(), [fetchRegistrations]));

  const fetchAudits = useCallback(async (page = 1) => {
    if (!eventId) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await eventAdminService.getAttendanceAudits(eventId, page, 20);
      if (response.success) {
        setAudits(response.data?.audits || []);
        setAuditPage(response.pagination?.page || page);
        setAuditTotalPages(Math.max(1, response.pagination?.totalPages || 1));
      }
    } catch {
      setAuditError("Không thể tải lịch sử điểm danh. Vui lòng thử lại.");
    } finally {
      setAuditLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      if (activeView === "audits") void fetchAudits(auditPage);
    }, [activeView, auditPage, fetchAudits])
  );

  const counts = useMemo(() => ({
    all: registrations.length,
    registered: registrations.filter((item) => item.registrationStatus === "registered").length,
    cancelled: registrations.filter((item) => item.registrationStatus === "cancelled").length,
    not_checked_in: registrations.filter((item) => item.attendanceStatus === "not_checked_in").length,
    attended: registrations.filter((item) => item.attendanceStatus === "attended").length,
    absent: registrations.filter((item) => item.attendanceStatus === "absent").length,
  }), [registrations]);

  const filteredRegistrations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return registrations.filter((registration) => {
      const user = getUserInfo(registration);
      const matchesState = filter === "all" ||
        registration.registrationStatus === filter ||
        registration.attendanceStatus === filter;
      const matchesSearch = !keyword ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.toLowerCase().includes(keyword);
      return matchesState && matchesSearch;
    });
  }, [filter, registrations, searchText]);

  const requestChange = (
    registration: EventRegistration,
    nextStatus: AttendanceStatus
  ) => {
    if (eventStatus === "upcoming" || registration.registrationStatus === "cancelled") return;
    setReason("");
    setChange({ registration, nextStatus });
  };

  const confirmChange = async () => {
    if (!change) return;
    if (eventStatus === "completed" && !reason.trim()) return;
    const userId = getUserId(change.registration);
    if (!userId) return;

    setSaving(true);
    try {
      await eventAdminService.updateAttendance(
        eventId,
        userId,
        change.nextStatus,
        reason.trim()
      );
      setChange(null);
      await fetchRegistrations();
    } finally {
      setSaving(false);
    }
  };

  const getStatusTextHeader = (status: string) => {
    switch (status) {
      case "upcoming": return "Upcoming";
      case "ongoing": return "Ongoing";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const renderParticipantRow = ({ item }: { item: EventRegistration }) => {
    const user = getUserInfo(item);
    const userAvatar = getAvatarColors(user.name);

    const regColor = item.registrationStatus === "cancelled" ? colors.error : colors.success;
    const attColor = item.attendanceStatus === "attended" ? colors.primary : item.attendanceStatus === "absent" ? colors.accent : colors.textSecondary;
    const isClickable = item.registrationStatus === "registered" && (eventStatus === "ongoing" || eventStatus === "completed");

    return (
      <View style={styles.tableRow}>
        {/* Người tham gia */}
        <View style={[styles.cell, { flex: 2, flexDirection: "row", alignItems: "center", gap: 10 }]}>
          <View style={[styles.avatar, { backgroundColor: userAvatar.bg }]}>
            <Text style={[styles.avatarText, { color: userAvatar.text }]}>{initials(user.name)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>

        {/* Đăng ký */}
        <View style={[styles.cell, { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }]}>
          <View style={[styles.statusDot, { backgroundColor: regColor }]} />
          <Text style={[styles.cellText, { color: regColor, fontWeight: "700" }]}>
            {item.registrationStatus === "cancelled" ? "Đã hủy" : "Đã đăng ký"}
          </Text>
        </View>

        {/* Điểm danh */}
        <View style={[styles.cell, { flex: 1.2 }]}>
          <TouchableOpacity
            disabled={!isClickable}
            onPress={() => {
              const nextStatus = item.attendanceStatus === "attended" ? "absent" : "attended";
              requestChange(item, nextStatus);
            }}
            style={[styles.clickableCell, isClickable && styles.cellHoverEffect]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={[styles.statusDot, { backgroundColor: attColor }]} />
              <Text style={[styles.cellText, { color: attColor, fontWeight: "700" }]}>
                {item.attendanceStatus === "attended" ? "Đã tham dự" : item.attendanceStatus === "absent" ? "Vắng mặt" : "Chưa điểm danh"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Đánh giá */}
        <View style={[styles.cell, { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }]}>
          <MaterialCommunityIcons
            name={item.reviewStatus === "reviewed" ? "star" : "star-outline"}
            size={16}
            color={item.reviewStatus === "reviewed" ? colors.accent : colors.textMuted}
          />
          <Text style={[styles.cellText, { color: item.reviewStatus === "reviewed" ? colors.accent : colors.textSecondary }]}>
            {item.reviewStatus === "reviewed" ? "Đã đánh giá" : "—"}
          </Text>
        </View>
      </View>
    );
  };

  const renderAuditRow = ({ item }: { item: AttendanceAudit }) => {
    const participant = item.userId?.fullName || "Người dùng";
    const admin = item.changedBy?.fullName || "Admin";
    const statusLabel: Record<AttendanceStatus, string> = {
      not_checked_in: "Chưa điểm danh",
      attended: "Đã tham dự",
      absent: "Vắng mặt",
    };
    return (
      <View style={styles.auditCard}>
        <View style={styles.auditIcon}>
          <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
        </View>
        <View style={styles.auditContent}>
          <View style={styles.auditHeader}>
            <Text style={styles.auditParticipant}>{participant}</Text>
            <Text style={styles.auditTime}>{formatDateTime(item.createdAt)}</Text>
          </View>
          <View style={styles.auditChangeRow}>
            <Text style={styles.auditStatusOld}>{statusLabel[item.fromStatus]}</Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textMuted} />
            <Text style={styles.auditStatusNew}>{statusLabel[item.toStatus]}</Text>
          </View>
          <Text style={styles.auditAdmin}>Thực hiện bởi {admin}</Text>
          <Text style={styles.auditReason}>Lý do: {item.reason?.trim() || "Không có ghi chú"}</Text>
        </View>
      </View>
    );
  };

  const renderParticipantCard = ({ item }: { item: EventRegistration }) => {
    const user = getUserInfo(item);
    const userAvatar = getAvatarColors(user.name);
    const regColor = item.registrationStatus === "cancelled" ? colors.error : colors.success;
    const attColor = item.attendanceStatus === "attended" ? colors.primary : item.attendanceStatus === "absent" ? colors.accent : colors.textSecondary;
    const isClickable = item.registrationStatus === "registered" && (eventStatus === "ongoing" || eventStatus === "completed");

    return (
      <View style={styles.mobileCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: userAvatar.bg }]}>
            <Text style={[styles.avatarText, { color: userAvatar.text }]}>{initials(user.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.cardBadge, { backgroundColor: item.registrationStatus === "cancelled" ? colors.errorBg : colors.successBg }]}>
            <View style={[styles.statusDot, { backgroundColor: regColor }]} />
            <Text style={[styles.badgeText, { color: regColor }]}>
              {item.registrationStatus === "cancelled" ? "Đã hủy" : "Đã đăng ký"}
            </Text>
          </View>

          <View style={[styles.cardBadge, { backgroundColor: item.attendanceStatus === "attended" ? colors.primaryBg : item.attendanceStatus === "absent" ? colors.accentBg : colors.bgAlt }]}>
            <View style={[styles.statusDot, { backgroundColor: attColor }]} />
            <Text style={[styles.badgeText, { color: attColor }]}>
              {item.attendanceStatus === "attended" ? "Đã tham dự" : item.attendanceStatus === "absent" ? "Vắng mặt" : "Chưa điểm danh"}
            </Text>
          </View>
        </View>

        {isClickable && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.attendedButton]}
              onPress={() => requestChange(item, "attended")}
              disabled={item.attendanceStatus === "attended"}
            >
              <Text style={styles.attendedButtonText}>Điểm danh tham dự</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.absentButton]}
              onPress={() => requestChange(item, "absent")}
              disabled={item.attendanceStatus === "absent"}
            >
              <Text style={styles.absentButtonText}>Đánh dấu vắng</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Block (LinearGradient) */}
      <LinearGradient
        colors={[colors.primary, colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerShell}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Người tham gia</Text>
              <View style={[styles.statusBadgeHeader, { backgroundColor: eventStatus === "completed" ? colors.successBg : colors.warningBg }]}>
                <Text style={[styles.statusBadgeHeaderText, { color: eventStatus === "completed" ? colors.success : "#D97706" }]}>
                  {getStatusTextHeader(eventStatus)}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {eventTitle || "Sự kiện SOUL"} · {formatDateTime(eventStartDateTime)} · {eventLocation || "Online Zoom"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={activeView === "participants" ? filteredRegistrations : audits}
        keyExtractor={(item: any) => item._id || getUserId(item)}
        renderItem={({ item }: { item: any }) =>
          activeView === "participants"
            ? compact
              ? renderParticipantCard({ item })
              : renderParticipantRow({ item })
            : renderAuditRow({ item })
        }
        refreshing={activeView === "participants" ? loading : auditLoading}
        onRefresh={() =>
          activeView === "participants" ? fetchRegistrations() : fetchAudits(auditPage)
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.viewTabs}>
              <TouchableOpacity
                style={[styles.viewTab, activeView === "participants" && styles.viewTabActive]}
                onPress={() => setActiveView("participants")}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={17}
                  color={activeView === "participants" ? "#FFFFFF" : colors.textSecondary}
                />
                <Text style={[styles.viewTabText, activeView === "participants" && styles.viewTabTextActive]}>
                  Người tham gia
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewTab, activeView === "audits" && styles.viewTabActive]}
                onPress={() => {
                  setActiveView("audits");
                  if (!audits.length) void fetchAudits(1);
                }}
              >
                <MaterialCommunityIcons
                  name="history"
                  size={17}
                  color={activeView === "audits" ? "#FFFFFF" : colors.textSecondary}
                />
                <Text style={[styles.viewTabText, activeView === "audits" && styles.viewTabTextActive]}>
                  Lịch sử điểm danh
                </Text>
              </TouchableOpacity>
            </View>

            {auditError && activeView === "audits" && (
              <View style={styles.auditError}>
                <Text style={styles.auditErrorText}>{auditError}</Text>
                <TouchableOpacity onPress={() => fetchAudits(auditPage)}>
                  <Text style={styles.auditRetryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
            {eventStatus === "upcoming" && (
              <View style={styles.notice}>
                <MaterialCommunityIcons name="lock-clock" size={18} color="#92400E" />
                <Text style={styles.noticeText}>Điểm danh sẽ mở khi sự kiện bắt đầu.</Text>
              </View>
            )}

            {/* Bento Stats Block (with vertical dividers) */}
            <View style={styles.statsCardGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{counts.all}</Text>
                <Text style={styles.statLabel}>Tổng cộng</Text>
              </View>
              <View style={styles.statCellDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{counts.registered}</Text>
                <Text style={styles.statLabel}>Đã đăng ký</Text>
              </View>
              <View style={styles.statCellDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{counts.attended}</Text>
                <Text style={styles.statLabel}>Đã tham dự</Text>
              </View>
              <View style={styles.statCellDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{counts.absent}</Text>
                <Text style={styles.statLabel}>Vắng mặt</Text>
              </View>
              <View style={styles.statCellDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>
                  {counts.registered ? Math.round((counts.attended / counts.registered) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Tỉ lệ tham dự</Text>
              </View>
            </View>

            {activeView === "participants" && <>
            {/* Toolbar */}
            <View style={styles.toolbar}>
              <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
                <MaterialCommunityIcons name="magnify" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Tìm kiếm..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.filterDropdownWrapper}>
                <TouchableOpacity
                  style={styles.filterDropdownButton}
                  onPress={() => setShowDropdown((prev) => !prev)}
                >
                  <Text style={styles.filterDropdownText}>
                    {filters.find((f) => f.value === filter)?.label || "Tất cả"} ({counts[filter === "all" ? "all" : filter]})
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showDropdown && (
                  <View style={styles.dropdownPopover}>
                    {filters.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[styles.dropdownItem, filter === item.value && styles.dropdownItemActive]}
                        onPress={() => {
                          setFilter(item.value);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, filter === item.value && styles.dropdownItemTextActive]}>
                          {item.label} ({counts[item.value === "all" ? "all" : item.value]})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.resultCountText}>{filteredRegistrations.length} kết quả</Text>
            </View>

            {/* Table Header Row (Hidden on mobile/compact) */}
            {!compact && (
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderLabel, { flex: 2 }]}>NGƯỜI THAM GIA</Text>
                <Text style={[styles.tableHeaderLabel, { flex: 1 }]}>ĐĂNG KÝ</Text>
                <Text style={[styles.tableHeaderLabel, { flex: 1.2 }]}>ĐIỂM DANH</Text>
                <Text style={[styles.tableHeaderLabel, { flex: 1 }]}>ĐÁNH GIÁ</Text>
              </View>
            )}
            </>}
          </View>
        }
        ListEmptyComponent={
          (activeView === "participants" ? loading : auditLoading) ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name={activeView === "participants" ? "account-off-outline" : "history"}
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {activeView === "participants"
                  ? "Không có người tham gia phù hợp."
                  : "Chưa có thay đổi điểm danh nào."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          activeView === "audits" && auditTotalPages > 1 ? (
            <View style={styles.auditPagination}>
              <TouchableOpacity
                style={[styles.auditPageButton, auditPage <= 1 && styles.disabled]}
                disabled={auditPage <= 1 || auditLoading}
                onPress={() => fetchAudits(auditPage - 1)}
              >
                <Text style={styles.auditPageButtonText}>Trang trước</Text>
              </TouchableOpacity>
              <Text style={styles.auditPageLabel}>{auditPage}/{auditTotalPages}</Text>
              <TouchableOpacity
                style={[styles.auditPageButton, auditPage >= auditTotalPages && styles.disabled]}
                disabled={auditPage >= auditTotalPages || auditLoading}
                onPress={() => fetchAudits(auditPage + 1)}
              >
                <Text style={styles.auditPageButtonText}>Trang sau</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <Modal visible={!!change} transparent animationType="fade" onRequestClose={() => !saving && setChange(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => !saving && setChange(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Xác nhận {change?.nextStatus === "absent" ? "vắng mặt" : "tham dự"}
            </Text>
            <Text style={styles.modalText}>
              {eventStatus === "completed"
                ? "Sự kiện đã kết thúc. Vui lòng nhập lý do để lưu lịch sử kiểm duyệt."
                : "Hãy kiểm tra lại thông tin điểm danh trước khi lưu."}
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={eventStatus === "completed" ? "Lý do chỉnh sửa (bắt buộc)" : "Ghi chú (tùy chọn)"}
              multiline
              maxLength={500}
              style={styles.reasonInput}
            />
            {eventStatus === "completed" && !reason.trim() && (
              <Text style={styles.requiredText}>Cần nhập lý do để tiếp tục.</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setChange(null)} disabled={saving}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, eventStatus === "completed" && !reason.trim() && styles.disabled]}
                onPress={confirmChange}
                disabled={saving || (eventStatus === "completed" && !reason.trim())}
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: displayFont,
    letterSpacing: 0.5
  },
  statusBadgeHeader: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: displayFont
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 5,
    fontFamily: webFont,
    fontWeight: "500"
  },
  content: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 40
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  noticeText: {
    flex: 1,
    color: "#92400E",
    fontWeight: "700",
    fontSize: 12,
    fontFamily: webFont
  },
  statsCardGrid: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statCellDivider: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: "stretch",
    marginVertical: 4
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    fontFamily: displayFont
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
    fontFamily: webFont
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    zIndex: 10,
    position: "relative"
  },
  searchBox: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.02)" },
      ios: { shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  searchBoxFocused: {
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 0,
    fontFamily: webFont,
    fontWeight: "500"
  },
  filterDropdownWrapper: {
    position: "relative",
    zIndex: 20,
  },
  filterDropdownButton: {
    minHeight: 40,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6
  },
  filterDropdownText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: webFont
  },
  dropdownPopover: {
    position: "absolute",
    top: 46,
    right: 0,
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryBg,
  },
  dropdownItemText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: webFont
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  resultCountText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: webFont,
    marginLeft: "auto"
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: displayFont
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cell: {
    justifyContent: "center",
  },
  cellText: {
    fontSize: 13,
    fontFamily: webFont,
  },
  clickableCell: {
    alignSelf: "flex-start",
  },
  cellHoverEffect: {
    // Opacity feedback or border highlights can be placed here
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderPrimary
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "900",
    fontFamily: displayFont
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: displayFont
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: webFont,
    marginTop: 2
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  mobileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  attendedButton: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  absentButton: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  attendedButtonText: {
    color: colors.success,
    fontWeight: "800",
    fontSize: 11,
    fontFamily: webFont,
  },
  absentButtonText: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 11,
    fontFamily: webFont,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: webFont,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    fontFamily: displayFont
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontFamily: webFont
  },
  reasonInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    textAlignVertical: "top",
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: webFont
  },
  requiredText: {
    color: colors.error,
    fontSize: 11,
    marginTop: 6,
    fontFamily: webFont,
    fontWeight: "600"
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  cancelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: "800",
    fontSize: 13,
    fontFamily: webFont
  },
  confirmButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    fontFamily: webFont
  },
  disabled: {
    opacity: 0.45
  },
  viewTabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  viewTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  viewTabActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  viewTabText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: webFont },
  viewTabTextActive: { color: "#FFFFFF" },
  auditError: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: colors.errorBg,
  },
  auditErrorText: { flex: 1, color: colors.error, fontSize: 12, fontWeight: "700" },
  auditRetryText: { color: colors.error, fontSize: 12, fontWeight: "900" },
  auditCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  auditIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryBg },
  auditContent: { flex: 1 },
  auditHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  auditParticipant: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: "900", fontFamily: displayFont },
  auditTime: { color: colors.textSecondary, fontSize: 10, fontWeight: "600", fontFamily: webFont },
  auditChangeRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
  auditStatusOld: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  auditStatusNew: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  auditAdmin: { marginTop: 8, color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  auditReason: { marginTop: 4, color: colors.textPrimary, fontSize: 11, lineHeight: 16 },
  auditPagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 18 },
  auditPageButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.primaryBg },
  auditPageButtonText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  auditPageLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "800" },
});
