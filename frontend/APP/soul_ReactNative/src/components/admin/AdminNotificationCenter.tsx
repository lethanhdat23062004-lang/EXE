import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  AppNotification,
  getNotifications,
  markAllRead,
  markAsRead,
} from "@/api/notificationApi";

const POLLING_INTERVAL_MS = 30_000;

type NotificationVisual = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  backgroundColor: string;
};

const NOTIFICATION_VISUALS: Record<string, NotificationVisual> = {
  moderation_review: {
    icon: "shield-search",
    color: "#E11D48",
    backgroundColor: "#FFF1F2",
  },
  report_update: {
    icon: "shield-alert-outline",
    color: "#E11D48",
    backgroundColor: "#FFF1F2",
  },
  appeal_review: {
    icon: "message-alert-outline",
    color: "#B45309",
    backgroundColor: "#FFFBEB",
  },
  appeal_update: {
    icon: "message-alert-outline",
    color: "#B45309",
    backgroundColor: "#FFFBEB",
  },
  rating_alert: {
    icon: "star-box-outline",
    color: "#D97706",
    backgroundColor: "#FFFBEB",
  },
  event_capacity_alert: {
    icon: "account-group-outline",
    color: "#0284C7",
    backgroundColor: "#EFF6FF",
  },
  attendance_overdue: {
    icon: "account-clock-outline",
    color: "#C2410C",
    backgroundColor: "#FFF7ED",
  },
  safety_alert: {
    icon: "alert-circle-outline",
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  system: {
    icon: "information-outline",
    color: "#6D5DFB",
    backgroundColor: "#F4EFFF",
  },
  default: {
    icon: "bell-outline",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
  },
};

function getNotificationVisual(type: string) {
  return NOTIFICATION_VISUALS[type] || NOTIFICATION_VISUALS.default;
}

function getRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Date(value).toLocaleDateString("vi-VN");
}

function getRelatedId(item: AppNotification) {
  return item.related?.id ? String(item.related.id) : null;
}

function navigateFromNotification(item: AppNotification) {
  const relatedId = getRelatedId(item);

  if (
    item.type === "moderation_review" ||
    item.type === "report_update" ||
    item.type === "appeal_review" ||
    item.type === "appeal_update"
  ) {
    router.push({
      pathname: "/(admin)/forum",
      params: {
        view: "reports",
        ...(relatedId ? { reportId: relatedId } : {}),
        notificationType: item.type,
      },
    } as any);
    return;
  }

  if (item.type === "rating_alert") {
    router.push({
      pathname: "/(admin)/ratings",
      params: relatedId ? { ratingId: relatedId } : {},
    } as any);
    return;
  }

  if (item.type === "event_capacity_alert") {
    if (relatedId) {
      router.push({ pathname: "/(admin)/events/[id]", params: { id: relatedId } } as any);
    } else {
      router.push("/(admin)/events" as any);
    }
    return;
  }

  if (item.type === "attendance_overdue") {
    if (relatedId) {
      router.push(`/(admin)/events/registrations/${relatedId}` as any);
    } else {
      router.push("/(admin)/events" as any);
    }
    return;
  }

  Alert.alert(item.title, item.content);
}

export type AdminNotificationController = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  visible: boolean;
  markingAll: boolean;
  toggle: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  markAll: () => Promise<void>;
  openNotification: (item: AppNotification) => Promise<void>;
};

export function useAdminNotifications(): AdminNotificationController {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadNotifications = useCallback(async (showLoading = false) => {
    const requestSequence = ++requestSequenceRef.current;
    if (showLoading && mountedRef.current) setLoading(true);
    if (mountedRef.current) setError(null);

    try {
      const response = await getNotifications(1, 50);
      if (
        !mountedRef.current ||
        requestSequence !== requestSequenceRef.current
      ) {
        return;
      }
      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
      loadedRef.current = true;
    } catch (loadError: any) {
      if (
        !mountedRef.current ||
        requestSequence !== requestSequenceRef.current
      ) {
        return;
      }
      setError(loadError?.message || "Không thể tải thông báo. Vui lòng thử lại.");
    } finally {
      if (
        mountedRef.current &&
        requestSequence === requestSequenceRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications(!loadedRef.current);
      const intervalId = setInterval(() => {
        void loadNotifications(false);
      }, POLLING_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }, [loadNotifications])
  );

  const toggle = useCallback(() => {
    setVisible((current) => {
      const next = !current;
      if (next) void loadNotifications(!loadedRef.current);
      return next;
    });
  }, [loadNotifications]);

  const close = useCallback(() => setVisible(false), []);

  const refresh = useCallback(async () => {
    await loadNotifications(notifications.length === 0);
  }, [loadNotifications, notifications.length]);

  const markOne = useCallback(async (item: AppNotification) => {
    if (item.isRead) return;
    requestSequenceRef.current += 1;
    await markAsRead(item._id);
    if (!mountedRef.current) return;

    setNotifications((current) =>
      current.map((notification) =>
        notification._id === item._id
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const markAll = useCallback(async () => {
    if (unreadCount === 0 || markingAll) return;
    requestSequenceRef.current += 1;
    setMarkingAll(true);
    setError(null);
    try {
      await markAllRead();
      if (!mountedRef.current) return;
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true, readAt }))
      );
      setUnreadCount(0);
    } catch (markError: any) {
      if (mountedRef.current) {
        setError(markError?.message || "Không thể đánh dấu tất cả đã đọc.");
      }
    } finally {
      if (mountedRef.current) setMarkingAll(false);
    }
  }, [markingAll, unreadCount]);

  const openNotification = useCallback(
    async (item: AppNotification) => {
      if (!item.isRead) {
        try {
          await markOne(item);
        } catch (markError: any) {
          if (mountedRef.current) {
            setError(markError?.message || "Không thể đánh dấu thông báo đã đọc.");
          }
        }
      }

      if (mountedRef.current) setVisible(false);
      navigateFromNotification(item);
    },
    [markOne]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    visible,
    markingAll,
    toggle,
    close,
    refresh,
    markAll,
    openNotification,
  };
}

function NotificationRow({
  item,
  onPress,
  compact = false,
}: {
  item: AppNotification;
  onPress: () => void;
  compact?: boolean;
}) {
  const visual = getNotificationVisual(item.type);

  return (
    <TouchableOpacity
      style={[styles.notificationRow, compact && styles.notificationRowCompact, !item.isRead && styles.unreadRow]}
      activeOpacity={0.78}
      onPress={onPress}
    >
      <View style={[styles.notificationIcon, { backgroundColor: visual.backgroundColor }]}>
        <MaterialCommunityIcons name={visual.icon} size={18} color={visual.color} />
      </View>
      <View style={styles.notificationBody}>
        <View style={styles.notificationTitleRow}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.notificationContent} numberOfLines={compact ? 1 : 2}>
          {item.content}
        </Text>
        <Text style={styles.notificationTime}>{getRelativeTime(item.createdAt)}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

function LoadingRows({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.loadingList}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={[styles.loadingRow, compact && styles.loadingRowCompact]}>
          <View style={styles.loadingIcon} />
          <View style={styles.loadingBody}>
            <View style={styles.loadingTitle} />
            <View style={styles.loadingLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

function DropdownContent({ controller }: { controller: AdminNotificationController }) {
  return (
    <View style={styles.dropdownContent}>
      <View style={styles.dropdownHeader}>
        <View>
          <Text style={styles.dropdownTitle}>Thông báo quản trị</Text>
          <Text style={styles.dropdownSubtitle}>
            {controller.unreadCount > 0
              ? `${controller.unreadCount} thông báo chưa đọc`
              : "Bạn đã xem tất cả thông báo"}
          </Text>
        </View>
        <View style={styles.dropdownHeaderActions}>
          {controller.unreadCount > 0 ? (
            <TouchableOpacity
              onPress={() => void controller.markAll()}
              disabled={controller.markingAll}
              style={styles.markAllButton}
              activeOpacity={0.76}
            >
              <Text style={styles.markAllText}>
                {controller.markingAll ? "Đang xử lý" : "Đọc tất cả"}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={controller.close} style={styles.closeButton} activeOpacity={0.76}>
            <MaterialCommunityIcons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {controller.error && controller.notifications.length > 0 ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
          <Text style={styles.errorText} numberOfLines={2}>
            {controller.error}
          </Text>
          <TouchableOpacity onPress={() => void controller.refresh()} activeOpacity={0.76}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
        {controller.loading && controller.notifications.length === 0 ? (
          <LoadingRows />
        ) : controller.error && controller.notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, styles.errorStateIcon]}>
              <MaterialCommunityIcons name="cloud-alert-outline" size={26} color="#DC2626" />
            </View>
            <Text style={styles.emptyTitle}>Chưa tải được thông báo</Text>
            <Text style={styles.emptyDescription}>{controller.error}</Text>
            <TouchableOpacity
              style={styles.summaryRetryButton}
              onPress={() => void controller.refresh()}
              activeOpacity={0.76}
            >
              <Text style={styles.summaryRetryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : controller.notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="bell-check-outline" size={26} color="#6D5DFB" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có thông báo mới</Text>
            <Text style={styles.emptyDescription}>
              Cảnh báo cần xử lý từ Forum, đánh giá và sự kiện sẽ xuất hiện tại đây.
            </Text>
          </View>
        ) : (
          controller.notifications.map((item) => (
            <NotificationRow
              key={item._id}
              item={item}
              onPress={() => void controller.openNotification(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export function AdminNotificationBell({
  controller,
  buttonStyle,
}: {
  controller: AdminNotificationController;
  buttonStyle?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const useDesktopDropdown = Platform.OS === "web" && width >= 700;

  return (
    <>
      <TouchableOpacity
        style={[styles.bellButton, buttonStyle, controller.visible && styles.bellButtonActive]}
        activeOpacity={0.78}
        onPress={controller.toggle}
        accessibilityRole="button"
        accessibilityLabel={`Thông báo quản trị, ${controller.unreadCount} chưa đọc`}
      >
        <MaterialCommunityIcons
          name={controller.visible ? "bell" : "bell-outline"}
          size={20}
          color={controller.visible ? "#6D5DFB" : "#0F172A"}
        />
        {controller.unreadCount > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {controller.unreadCount > 99 ? "99+" : controller.unreadCount}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal
        visible={controller.visible}
        transparent
        animationType="fade"
        onRequestClose={controller.close}
      >
        {useDesktopDropdown ? (
          <>
            <Pressable style={styles.webBackdrop as any} onPress={controller.close} />
            <View style={styles.webDropdown as any}>
              <DropdownContent controller={controller} />
            </View>
          </>
        ) : (
          <>
            <Pressable style={styles.mobileBackdrop} onPress={controller.close} />
            <View style={styles.mobileSheet}>
              <View style={styles.sheetHandle} />
              <DropdownContent controller={controller} />
            </View>
          </>
        )}
      </Modal>
    </>
  );
}

export function AdminNotificationSummary({
  controller,
}: {
  controller: AdminNotificationController;
}) {
  if (controller.loading && controller.notifications.length === 0) {
    return <LoadingRows compact />;
  }

  if (controller.error && controller.notifications.length === 0) {
    return (
      <View style={styles.summaryError}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={22} color="#DC2626" />
        <Text style={styles.summaryErrorText}>{controller.error}</Text>
        <TouchableOpacity style={styles.summaryRetryButton} onPress={() => void controller.refresh()}>
          <Text style={styles.summaryRetryText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (controller.notifications.length === 0) {
    return (
      <View style={styles.summaryEmpty}>
        <MaterialCommunityIcons name="bell-check-outline" size={24} color="#6D5DFB" />
        <View style={styles.summaryEmptyBody}>
          <Text style={styles.summaryEmptyTitle}>Không có cảnh báo cần xử lý</Text>
          <Text style={styles.summaryEmptyText}>Thông báo mới sẽ tự cập nhật sau mỗi 30 giây.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.summaryList}>
      {controller.notifications.slice(0, 3).map((item) => (
        <NotificationRow
          key={item._id}
          item={item}
          compact
          onPress={() => void controller.openNotification(item)}
        />
      ))}
    </View>
  );
}

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });

const styles = StyleSheet.create({
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  bellButtonActive: {
    backgroundColor: "#F4EFFF",
    borderColor: "#DDD6FE",
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -7,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    fontFamily: webFont,
  },
  webBackdrop: {
    position: "fixed" as any,
    inset: 0,
    zIndex: 9997,
    backgroundColor: "rgba(15, 23, 42, 0.04)",
  },
  webDropdown: {
    position: "fixed" as any,
    top: 76,
    right: 22,
    width: 410,
    maxHeight: 570,
    zIndex: 9998,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E2FF",
    boxShadow: "0 24px 65px rgba(76, 29, 149, 0.18)",
  },
  dropdownContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  dropdownHeader: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1EDFF",
  },
  dropdownTitle: {
    color: "#1E1B4B",
    fontSize: 16,
    fontWeight: "900",
    fontFamily: webFont,
  },
  dropdownSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: webFont,
  },
  dropdownHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  markAllButton: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4EFFF",
  },
  markAllText: {
    color: "#6D5DFB",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: webFont,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    backgroundColor: "#F8FAFC",
  },
  errorBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    flex: 1,
    marginHorizontal: 8,
    color: "#991B1B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: webFont,
  },
  retryText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: webFont,
  },
  dropdownList: {
    maxHeight: 480,
  },
  notificationRow: {
    minHeight: 86,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F4F1FA",
    backgroundColor: "#FFFFFF",
  },
  notificationRowCompact: {
    minHeight: 76,
    paddingHorizontal: 0,
  },
  unreadRow: {
    backgroundColor: "#FBF9FF",
  },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  notificationBody: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationTitle: {
    flex: 1,
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: webFont,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 7,
    backgroundColor: "#6D5DFB",
  },
  notificationContent: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: webFont,
  },
  notificationTime: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: webFont,
  },
  loadingList: {
    paddingHorizontal: 16,
  },
  loadingRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F4F1FA",
  },
  loadingRowCompact: {
    minHeight: 76,
  },
  loadingIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    marginRight: 11,
    backgroundColor: "#F1EDFF",
  },
  loadingBody: {
    flex: 1,
  },
  loadingTitle: {
    width: "45%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EDE9FE",
  },
  loadingLine: {
    width: "76%",
    height: 9,
    marginTop: 9,
    borderRadius: 5,
    backgroundColor: "#F1F5F9",
  },
  emptyState: {
    minHeight: 260,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4EFFF",
  },
  errorStateIcon: {
    backgroundColor: "#FEF2F2",
  },
  emptyTitle: {
    marginTop: 14,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: webFont,
  },
  emptyDescription: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: webFont,
  },
  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  mobileSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "82%",
    minHeight: 360,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    ...Platform.select({
      ios: {
        shadowColor: "#1E1B4B",
        shadowOpacity: 0.16,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 22 },
      default: {},
    }),
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    alignSelf: "center",
    backgroundColor: "#DDD6FE",
  },
  summaryList: {
    marginTop: 10,
  },
  summaryEmpty: {
    marginTop: 16,
    minHeight: 92,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBFAFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  summaryEmptyBody: {
    flex: 1,
    marginLeft: 12,
  },
  summaryEmptyTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: webFont,
  },
  summaryEmptyText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: webFont,
  },
  summaryError: {
    marginTop: 16,
    minHeight: 100,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  summaryErrorText: {
    marginTop: 7,
    color: "#991B1B",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: webFont,
  },
  summaryRetryButton: {
    minHeight: 30,
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  summaryRetryText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: webFont,
  },
});
