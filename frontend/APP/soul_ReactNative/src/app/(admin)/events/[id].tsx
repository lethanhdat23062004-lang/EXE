import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { colors } from "@/constants/colors";
import { EventApiError, eventAdminService } from "@/services/eventApi";

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

export default function AdminEventDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { width } = useWindowDimensions();
  const compact = width < 600;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [historyModal, setHistoryModal] = useState<null | {
    action: "cancel" | "archive";
    registrationCount: number;
    ratingCount: number;
  }>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const response = await eventAdminService.getEventById(id);
          if (response.success && response.data) {
            setEvent(response.data);
          } else {
            showAlert("Lỗi", "Không tìm thấy sự kiện");
            router.replace("/(admin)/events");
          }
        } catch (error: any) {
          const msg = error?.message || error?.error || "Không thể tải sự kiện";
          showAlert("Lỗi", msg);
          router.replace("/(admin)/events");
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }, [id])
  );

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
  };

  const handleDelete = async () => {
    if (actionLoading) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Xác nhận xóa",
        "Chỉ sự kiện chưa có lịch sử đăng ký hoặc đánh giá mới được xóa vĩnh viễn.",
        [
          { text: "Để sau", style: "cancel", onPress: () => resolve(false) },
          { text: "Xóa sự kiện", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const response = await eventAdminService.deleteEvent(id);
      if (response.success) router.replace("/(admin)/events");
    } catch (error: any) {
      if (error instanceof EventApiError && error.code === "EVENT_HAS_HISTORY") {
        setHistoryModal({
          action: error.data?.suggestedAction || "cancel",
          registrationCount: error.data?.registrationCount || 0,
          ratingCount: error.data?.ratingCount || 0,
        });
      } else {
        showAlert("Không thể xóa sự kiện", "Đã xảy ra lỗi khi xóa. Vui lòng thử lại.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const response = await eventAdminService.archiveEvent(id);
      if (response.success) {
        setEvent(response.data);
        setHistoryModal(null);
      }
    } catch {
      showAlert("Không thể lưu trữ", "Chỉ sự kiện đã kết thúc hoặc đã hủy mới có thể được lưu trữ.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const response = await eventAdminService.restoreEvent(id);
      if (response.success) setEvent(response.data);
    } catch {
      showAlert("Không thể khôi phục", "Vui lòng thử lại sau.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = cancellationReason.trim();
    if (!reason) {
      showAlert("Thiếu lý do hủy", "Vui lòng nhập lý do để người tham gia biết vì sao sự kiện bị hủy.");
      return;
    }
    if (reason.length > 500 || actionLoading) return;

    setActionLoading(true);
    try {
      const response = await eventAdminService.cancelEvent(id, reason);
      if (response.success) {
        setEvent(response.data);
        setHistoryModal(null);
        setCancellationReason("");
      }
    } catch {
      showAlert("Không thể hủy sự kiện", "Vui lòng kiểm tra trạng thái sự kiện và thử lại.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming": return "Sắp diễn ra";
      case "ongoing": return "Đang diễn ra";
      case "completed": return "Đã kết thúc";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "upcoming": return { text: "#D97706", bg: "#FEF3C7", dot: "#D97706" };
      case "ongoing": return { text: colors.success, bg: colors.successBg, dot: colors.success };
      case "completed": return { text: colors.textSecondary, bg: colors.bgAlt, dot: colors.textSecondary };
      case "cancelled": return { text: colors.error, bg: colors.errorBg, dot: colors.error };
      default: return { text: colors.textSecondary, bg: colors.bgAlt, dot: colors.textSecondary };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skeletonHeader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) return null;

  const st = getStatusStyle(event.status);

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(admin)/events")}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
            <Text style={styles.headerSubtitle}>Thông tin chi tiết và thống kê người tham gia.</Text>
          </View>
          <TouchableOpacity
            style={[styles.editHeaderButton, event.isArchived && styles.disabledButton]}
            onPress={() => router.push(`/(admin)/events/edit/${id}`)}
            disabled={event.isArchived}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Main Info Card */}
          <View style={styles.mainInfoCard}>
            <Text style={styles.eventTitleText}>{event.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
              <Text style={[styles.statusText, { color: st.text }]}>{getStatusText(event.status)}</Text>
            </View>
            {event.isArchived && (
              <View style={styles.archivedBadge}>
                <MaterialCommunityIcons name="archive-outline" size={14} color="#6D5DFB" />
                <Text style={styles.archivedBadgeText}>Đã lưu trữ</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={[styles.gridRow, compact && styles.gridRowCompact]}>
              <View style={styles.gridCol}>
                <View style={styles.metaField}>
                  <View style={styles.metaIconWrapper}>
                    <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.metaFieldContent}>
                    <Text style={styles.metaLabel}>Bắt đầu</Text>
                    <Text style={styles.metaValue}>{formatDate(event.startDateTime)}</Text>
                  </View>
                </View>
                <View style={styles.metaField}>
                  <View style={styles.metaIconWrapper}>
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.metaFieldContent}>
                    <Text style={styles.metaLabel}>Địa điểm</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{event.location || "Chưa cập nhật"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.gridCol}>
                <View style={styles.metaField}>
                  <View style={styles.metaIconWrapper}>
                    <MaterialCommunityIcons name="calendar-check" size={16} color={colors.teal} />
                  </View>
                  <View style={styles.metaFieldContent}>
                    <Text style={styles.metaLabel}>Kết thúc</Text>
                    <Text style={styles.metaValue}>
                      {event.endDateTime ? formatDate(event.endDateTime) : "Chưa xác định"}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaField}>
                  <View style={styles.metaIconWrapper}>
                    <MaterialCommunityIcons name="microphone" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.metaFieldContent}>
                    <Text style={styles.metaLabel}>Diễn giả</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{event.speakerName || "Chưa cập nhật"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{event.registeredCount ?? 0}</Text>
              <Text style={styles.statLabel}>Đã đăng ký</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{event.capacity || "∞"}</Text>
              <Text style={styles.statLabel}>Sức chứa</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {event.capacity ? Math.round(((event.registeredCount ?? 0) / event.capacity) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Lấp đầy</Text>
            </View>
          </View>

          {/* Navigation Links */}
          <TouchableOpacity
            style={styles.navRowCard}
            onPress={() => router.push(`/(admin)/events/registrations/${id}`)}
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIconContainer, { backgroundColor: colors.primaryBg }]}>
                <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.navRowCopy}>
                <Text style={styles.navRowTitle}>Quản lý người đăng ký</Text>
                <Text style={styles.navRowSubtitle}>Xem danh sách, trạng thái và xóa đăng ký khỏi sự kiện</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navRowCard}
            onPress={() =>
              router.push({
                pathname: "/(admin)/ratings",
                params: { eventId: String(id) },
              })
            }
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIconContainer, { backgroundColor: colors.accentBg }]}>
                <MaterialCommunityIcons name="message-star-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.navRowCopy}>
                <Text style={styles.navRowTitle}>Quản lý đánh giá</Text>
                <Text style={styles.navRowSubtitle}>Xem điểm trung bình, nhận xét và kiểm duyệt đánh giá</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {(event.cancelledAt || event.archivedAt) && (
            <View style={styles.historyCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Lịch sử vận hành</Text>
              </View>

              {event.cancelledAt && (
                <View style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.errorBg }]}>
                    <MaterialCommunityIcons name="calendar-remove-outline" size={18} color={colors.error} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>Sự kiện đã bị hủy</Text>
                    <Text style={styles.historyMeta}>
                      {formatDate(event.cancelledAt)} · {event.cancelledBy?.fullName || "Admin"}
                    </Text>
                    <Text style={styles.historyReason}>
                      Lý do: {event.cancellationReason || "Không có lý do được ghi nhận"}
                    </Text>
                    <View style={styles.deliveryBadge}>
                      <MaterialCommunityIcons
                        name={event.cancellationNotification?.status === "partial" ? "alert-circle-outline" : "check-circle-outline"}
                        size={14}
                        color={event.cancellationNotification?.status === "partial" ? "#D97706" : colors.success}
                      />
                      <Text style={styles.deliveryText}>
                        {event.cancellationNotification?.status === "not_required"
                          ? "Không có người đăng ký cần nhận thông báo"
                          : `Đã gửi ${event.cancellationNotification?.sentCount || 0}/${event.cancellationNotification?.recipientCount || 0} thông báo`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {event.archivedAt && (
                <View style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: "#F4EFFF" }]}>
                    <MaterialCommunityIcons name="archive-outline" size={18} color="#6D5DFB" />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>Sự kiện đã được lưu trữ</Text>
                    <Text style={styles.historyMeta}>
                      {formatDate(event.archivedAt)} · {event.archivedBy?.fullName || "Admin"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Detailed Description */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="card-text-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            </View>
            <Text style={styles.descText}>{event.description || "Chưa có mô tả."}</Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionRow}>
            {!event.isArchived && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => router.push(`/(admin)/events/edit/${id}`)}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFFFFF" />
                <Text style={styles.updateButtonText}>Cập nhật</Text>
              </TouchableOpacity>
            )}
            {event.isArchived ? (
              <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={actionLoading}>
                <MaterialCommunityIcons name="archive-arrow-up-outline" size={18} color="#FFFFFF" />
                <Text style={styles.updateButtonText}>{actionLoading ? "Đang khôi phục..." : "Khôi phục sự kiện"}</Text>
              </TouchableOpacity>
            ) : ["completed", "cancelled"].includes(event.status) ? (
              <TouchableOpacity style={styles.archiveButton} onPress={handleArchive} disabled={actionLoading}>
                <MaterialCommunityIcons name="archive-outline" size={18} color="#6D5DFB" />
                <Text style={styles.archiveButtonText}>{actionLoading ? "Đang lưu trữ..." : "Lưu trữ sự kiện"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.deleteButton, actionLoading && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={actionLoading}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                <Text style={styles.deleteButtonText}>{actionLoading ? "Đang xử lý..." : "Xóa sự kiện"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(historyModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.businessModal}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Sự kiện đã có lịch sử</Text>
            <Text style={styles.modalDescription}>
              Không thể xóa vĩnh viễn vì sự kiện có {historyModal?.registrationCount || 0} lượt đăng ký
              {historyModal?.ratingCount ? ` và ${historyModal.ratingCount} đánh giá` : ""}.
            </Text>
            {historyModal?.action === "cancel" ? (
              <>
                <Text style={styles.reasonLabel}>Lý do hủy sự kiện *</Text>
                <TextInput
                  value={cancellationReason}
                  onChangeText={setCancellationReason}
                  placeholder="Ví dụ: Thay đổi lịch tổ chức..."
                  multiline
                  maxLength={500}
                  style={styles.reasonInput}
                />
                <Text style={styles.reasonCounter}>{cancellationReason.length}/500</Text>
              </>
            ) : (
              <Text style={styles.modalHint}>
                Lưu trữ sẽ ẩn sự kiện khỏi danh sách công khai nhưng vẫn giữ đăng ký và đánh giá.
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondary} onPress={() => setHistoryModal(null)}>
                <Text style={styles.modalSecondaryText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={historyModal?.action === "archive" ? handleArchive : handleCancel}
                disabled={actionLoading}
              >
                <Text style={styles.modalPrimaryText}>
                  {historyModal?.action === "archive" ? "Lưu trữ sự kiện" : "Hủy sự kiện"}
                </Text>
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
  skeletonHeader: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: displayFont,
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 3,
    fontFamily: webFont,
    fontWeight: "500"
  },
  editHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center"
  },
  disabledButton: { opacity: 0.45 },
  archivedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F4EFFF",
  },
  archivedBadgeText: { color: "#6D5DFB", fontSize: 12, fontWeight: "800" },
  scrollContent: { flex: 1 },
  contentContainer: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16
  },
  mainInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  eventTitleText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textPrimary,
    fontFamily: displayFont,
    marginBottom: 10
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: displayFont
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20
  },
  gridRow: {
    flexDirection: "row",
    gap: 20
  },
  gridRowCompact: {
    flexDirection: "column",
    gap: 14
  },
  gridCol: {
    flex: 1,
    gap: 14
  },
  metaField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  metaIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  metaFieldContent: {
    flex: 1
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "700",
    fontFamily: webFont
  },
  metaValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "800",
    fontFamily: displayFont,
    marginTop: 2
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12
  },
  statCard: {
    flex: 1,
    minHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  statValue: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: "900",
    fontFamily: displayFont
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
    fontFamily: webFont
  },
  navRowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)", transition: "all 0.2s ease" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  navRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10
  },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderPrimary
  },
  navRowCopy: {
    flex: 1
  },
  navRowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont
  },
  navRowSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
    fontFamily: webFont,
    fontWeight: "500"
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  historyItem: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  historyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  historyContent: { flex: 1 },
  historyTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "900", fontFamily: displayFont },
  historyMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: "600", fontFamily: webFont },
  historyReason: { marginTop: 7, color: colors.textPrimary, fontSize: 12, lineHeight: 18, fontFamily: webFont },
  deliveryBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bgAlt },
  deliveryText: { color: colors.textSecondary, fontSize: 10, fontWeight: "800", fontFamily: webFont },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    fontFamily: webFont,
    fontWeight: "500"
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  },
  updateButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(109, 93, 251, 0.3)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: displayFont
  },
  deleteButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: displayFont
  },
  archiveButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  archiveButtonText: { color: "#6D5DFB", fontWeight: "800", fontFamily: webFont },
  restoreButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: "#6D5DFB",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.52)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  businessModal: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    ...Platform.select({ web: { boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)" } }),
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { marginTop: 16, color: colors.textPrimary, fontSize: 20, fontWeight: "900", fontFamily: displayFont },
  modalDescription: { marginTop: 8, color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: webFont },
  modalHint: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: "#F5F3FF", color: "#5B21B6", lineHeight: 19 },
  reasonLabel: { marginTop: 16, marginBottom: 8, color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  reasonInput: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    color: colors.textPrimary,
    textAlignVertical: "top",
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },
  reasonCounter: { marginTop: 5, textAlign: "right", color: colors.textSecondary, fontSize: 11 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalSecondary: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  modalSecondaryText: { color: colors.textPrimary, fontWeight: "800" },
  modalPrimary: { flex: 1.3, minHeight: 44, borderRadius: 12, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center" },
  modalPrimaryText: { color: "#FFFFFF", fontWeight: "900" },
});
