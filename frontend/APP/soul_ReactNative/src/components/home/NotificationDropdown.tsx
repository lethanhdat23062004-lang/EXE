import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  getNotifications,
  markAllRead,
  markAsRead,
  type AppNotification,
} from "@/api/notificationApi";

const webFont = Platform.select({
  web: "'Inter', system-ui, sans-serif",
  default: undefined,
});

// ─── Inject web animation CSS ────────────────────────────────────────────────
if (Platform.OS === "web" && typeof document !== "undefined") {
  const styleId = "soul-notification-dropdown-styles";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.innerHTML = `
    @keyframes notif-slide-in {
      from { opacity:0; transform: translateY(-8px) scale(0.97); }
      to   { opacity:1; transform: translateY(0)   scale(1); }
    }
    .notif-dropdown { animation: notif-slide-in 0.18s cubic-bezier(0.16,1,0.3,1) both; }
    .notif-item:hover { background: #F5F3FF !important; }
    .notif-item { transition: background 0.12s ease; }
  `;
    document.head.appendChild(s);
  }
}

// ─── Icon map theo type ───────────────────────────────────────────────────────
const TYPE_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  welcome:            { icon: "hand-wave",           color: "#7C3AED", bg: "#EDE9FE" },
  event_registration: { icon: "ticket-confirmation",  color: "#059669", bg: "#D1FAE5" },
  event_reminder:     { icon: "calendar-clock",        color: "#D97706", bg: "#FEF3C7" },
  safety_alert:       { icon: "alert-circle",          color: "#EF4444", bg: "#FEE2E2" },
  system:             { icon: "bell-ring",             color: "#3B82F6", bg: "#DBEAFE" },
  mental_insight:     { icon: "brain",                 color: "#8B5CF6", bg: "#EDE9FE" },
  report_update:      { icon: "file-document-edit",    color: "#64748B", bg: "#F1F5F9" },
  default:            { icon: "bell",                  color: "#64748B", bg: "#F1F5F9" },
};

function getTypeConfig(type: string) {
  return TYPE_ICON[type] ?? TYPE_ICON.default;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

// ─── Notification Item ────────────────────────────────────────────────────────
function NotifItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const cfg = getTypeConfig(item.type);
  return (
    <TouchableOpacity
      // @ts-ignore
      className="notif-item"
      style={[s.item, !item.isRead && s.itemUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[s.iconWrap, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons
          name={cfg.icon as any}
          size={18}
          color={cfg.color}
        />
      </View>
      <View style={s.itemBody}>
        <View style={s.itemTop}>
          <Text style={s.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={s.unreadDot} />}
        </View>
        <Text style={s.itemContent} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<View>;
};

export function NotificationDropdown({ visible, onClose }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!visible) return;
    setLoading(true);
    try {
      const res = await getNotifications(1, 20);
      setNotifications(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemPress = async (item: AppNotification) => {
    // 1. Mark as read if unread
    if (!item.isRead) {
      await handleRead(item._id);
    }

    // 2. Close dropdown
    onClose();

    // 3. Handle navigation or display details
    if (item.type === "event_registration" || item.type === "event_reminder") {
      if (item.related?.id) {
        router.push(`/user-events/${item.related.id}`);
      } else {
        router.push("/user-events");
      }
    } else if (item.type === "mental_insight" || item.type === "report_update") {
      router.push("/emotional-test");
    } else {
      Alert.alert(item.title, item.content);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  // ── Web: fixed dropdown ──────────────────────────────────────────────────
  if (Platform.OS === "web") {
    if (!visible) return null;
    return (
      <>
        <Pressable onPress={onClose} style={webS.backdrop as any} />
        <View
          style={webS.dropdown as any}
          // @ts-ignore
          className="notif-dropdown"
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Thông báo</Text>
            {unread > 0 && (
              <TouchableOpacity onPress={handleMarkAll} disabled={markingAll}>
                <Text style={s.markAllBtn}>
                  {markingAll ? "Đang xử lý..." : "Đọc tất cả"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={s.centered}>
                <ActivityIndicator color="#7C3AED" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={s.centered}>
                <MaterialCommunityIcons name="bell-off-outline" size={40} color="#CBD5E1" />
                <Text style={s.emptyText}>Chưa có thông báo nào</Text>
              </View>
            ) : (
              notifications.map((n) => (
                <NotifItem key={n._id} item={n} onPress={() => handleItemPress(n)} />
              ))
            )}
          </ScrollView>
        </View>
      </>
    );
  }

  // ── Mobile: Modal ───────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.mobileBackdrop} onPress={onClose} />
      <View style={s.mobileSheet}>
        {/* Handle bar */}
        <View style={s.handle} />
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Thông báo</Text>
          {unread > 0 && (
            <TouchableOpacity onPress={handleMarkAll} disabled={markingAll}>
              <Text style={s.markAllBtn}>
                {markingAll ? "Đang xử lý..." : "Đọc tất cả"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={s.centered}>
              <ActivityIndicator color="#7C3AED" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={s.centered}>
              <MaterialCommunityIcons name="bell-off-outline" size={40} color="#CBD5E1" />
              <Text style={s.emptyText}>Chưa có thông báo nào</Text>
            </View>
          ) : (
            notifications.map((n) => (
              <NotifItem key={n._id} item={n} onPress={() => handleItemPress(n)} />
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Web fixed styles ─────────────────────────────────────────────────────────
const webS = {
  backdrop: {
    position: "fixed" as any,
    inset: 0,
    zIndex: 8888,
  },
  dropdown: {
    position: "fixed" as any,
    top: 68,
    right: 20,
    width: 380,
    maxHeight: 520,
    borderRadius: 20,
    backgroundColor: "#fff",
    zIndex: 8889,
    boxShadow: "0 16px 48px rgba(124,58,237,0.15), 0 0 0 1px rgba(124,58,237,0.07)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as any,
  },
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
    fontFamily: webFont,
  },
  markAllBtn: {
    fontSize: 13,
    color: "#7C3AED",
    fontWeight: "600",
    fontFamily: webFont,
  },
  list: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: webFont,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  itemUnread: {
    backgroundColor: "#FAFAFF",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: webFont,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    marginLeft: 8,
    flexShrink: 0,
  },
  itemContent: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    fontFamily: webFont,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: webFont,
  },
  // Mobile
  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,10,30,0.4)",
  },
  mobileSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    paddingBottom: 32,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 32, shadowOffset: { width: 0, height: -8 } },
      android: { elevation: 24 },
      default: {},
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
});
