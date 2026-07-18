import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
  AdminUser,
} from "@/api/adminApi";
import { colors } from "@/constants/colors";

// ── Constants ──────────────────────────────────────────────────
const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  user: { label: "Người dùng", color: colors.teal, bg: colors.tealBg, icon: "account-outline" },
  event_organizer: {
    label: "Organizer",
    color: colors.accent,
    bg: colors.accentBg,
    icon: "calendar-star",
  },
  admin: {
    label: "Quản trị viên",
    color: colors.primary,
    bg: colors.primaryBg,
    icon: "shield-crown-outline",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Hoạt động", color: colors.success, bg: colors.successBg },
  blocked: { label: "Bị khóa", color: colors.error, bg: colors.errorBg },
  inactive: { label: "Không hoạt động", color: colors.textSecondary, bg: colors.bgAlt },
};

const FILTER_TABS = [
  { key: "", label: "Tất cả" },
  { key: "user", label: "User" },
  { key: "event_organizer", label: "Organizer" },
  { key: "admin", label: "Admin" },
  { key: "blocked", label: "Bị khóa" },
];

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

// ── UserCard component ─────────────────────────────────────────
function UserCard({
  user,
  onAction,
}: {
  user: AdminUser;
  onAction: (user: AdminUser) => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
  const status = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
  const initials = user.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.cardCell, { minWidth: isDesktop ? 320 : "100%" }]}>
      <View style={styles.userCard}>
        {/* Left Side: Avatar & Basic Info */}
        <View style={[styles.avatar, { backgroundColor: getAvatarColors(user.fullName).bg }]}>
          <Text style={[styles.avatarText, { color: getAvatarColors(user.fullName).text }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.fullName}
          </Text>
          <View style={styles.emailRow}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: role.bg }]}>
              <MaterialCommunityIcons name={role.icon as any} size={11} color={role.color} />
              <Text style={[styles.badgeText, { color: role.color }]}>{role.label}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Right Side: Options/More Actions button */}
        <TouchableOpacity style={styles.menuTrigger} onPress={() => onAction(user)}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen component ──────────────────────────────────────
export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Modal actions state
  const [selectedUserForModal, setSelectedUserForModal] = useState<AdminUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: "role" | "status";
    targetValue: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const numColumns = isDesktop ? 2 : 1;

  const fetchUsers = async () => {
    try {
      const response = await getAdminUsers();
      if (response.success && response.data) {
        const usersArray = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.users)
          ? response.data.users
          : [];
        setUsers(usersArray);
      } else {
        Alert.alert("Lỗi", response.message || "Không thể tải danh sách người dùng");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Đã xảy ra lỗi khi tải danh sách");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Stats computation
  const totalUsers = users.length;
  const organizerCount = users.filter((u) => u.role === "event_organizer").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  // Filtered Users logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Role / Status tab filter
      if (filterTab) {
        if (filterTab === "blocked") {
          if (user.status !== "blocked") return false;
        } else {
          if (user.role !== filterTab) return false;
        }
      }

      // 2. Search query filter
      const keyword = search.trim().toLowerCase();
      if (keyword) {
        const matchesName = user.fullName.toLowerCase().includes(keyword);
        const matchesEmail = user.email.toLowerCase().includes(keyword);
        if (!matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [users, filterTab, search]);

  const getTabLabel = (key: string, label: string) => {
    let count = 0;
    if (!key) {
      count = users.length;
    } else if (key === "blocked") {
      count = blockedCount;
    } else {
      count = users.filter((u) => u.role === key).length;
    }
    return `${label} (${count})`;
  };

  // User Actions handlers
  const handleUserAction = (user: AdminUser) => {
    setSelectedUserForModal(user);
    setShowActionModal(true);
  };

  const openConfirmChange = (
    type: "role" | "status",
    targetValue: string,
    title: string,
    message: string
  ) => {
    setShowActionModal(false);
    setConfirmConfig({
      title,
      message,
      type,
      targetValue,
      onConfirm: async () => {
        if (!selectedUserForModal) return;
        setShowConfirmModal(false);
        setActionLoading(true);
        try {
          let response;
          if (type === "role") {
            response = await updateAdminUserRole(selectedUserForModal._id, targetValue as any);
          } else {
            response = await updateAdminUserStatus(selectedUserForModal._id, targetValue as any);
          }

          if (response.success) {
            // Update local state directly
            setUsers((prev) =>
              prev.map((u) =>
                u._id === selectedUserForModal._id
                  ? {
                      ...u,
                      role: type === "role" ? (targetValue as any) : u.role,
                      status: type === "status" ? (targetValue as any) : u.status,
                    }
                  : u
              )
            );
            Alert.alert("Thành công", "Cập nhật thành viên thành công!");
          } else {
            Alert.alert("Lỗi", response.message || "Không thể cập nhật");
          }
        } catch (err: any) {
          Alert.alert("Lỗi", err?.message || "Đã xảy ra lỗi khi cập nhật");
        } finally {
          setActionLoading(false);
          setSelectedUserForModal(null);
        }
      },
    });
    setShowConfirmModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Action loading overlay */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            <Text style={styles.headerTitle}>Quản lý người dùng</Text>
            <Text style={styles.headerSubtitle}>
              Xem thông tin, phân quyền và trạng thái hoạt động của thành viên.
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* List content with unified list view */}
      <FlatList
        key={isDesktop ? "desktop-list" : "mobile-list"}
        numColumns={numColumns}
        data={loading ? [] : filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UserCard user={item} onAction={handleUserAction} />}
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
            {/* Stats row - Three separate cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: "#F5F3FF" }]}>
                  <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{totalUsers}</Text>
                  <Text style={styles.statLabel}>Tổng người dùng</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: "#FEF3C7" }]}>
                  <MaterialCommunityIcons name="account-tie-outline" size={20} color="#D97706" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{organizerCount}</Text>
                  <Text style={styles.statLabel}>Organizer</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: "#FEE2E2" }]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={colors.error} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{blockedCount}</Text>
                  <Text style={styles.statLabel}>Bị khóa</Text>
                </View>
              </View>
            </View>

            {/* Search & Filter Section */}
            <View style={[styles.searchFilterRow, !isDesktop && styles.searchFilterRowMobile]}>
              {/* Search Input with Focus Ring */}
              <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={searchFocused ? colors.primary : colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên hoặc email..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContainer}
              >
                {FILTER_TABS.map((tab) => {
                  const isActive = filterTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.filterTab, isActive && styles.filterTabActive]}
                      onPress={() => setFilterTab(tab.key)}
                    >
                      <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
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
              <Text style={styles.loadingText}>Đang tải danh sách...</Text>
            </View>
          ) : (
            <View style={styles.centered}>
              <MaterialCommunityIcons name="account-off" size={60} color={colors.textLight} />
              <Text style={styles.emptyText}>Không có người dùng nào</Text>
            </View>
          )
        }
      />

      {/* ── Custom Action Modal (Sleek popup card) ── */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedUserForModal && (
            <View style={styles.popupCard}>
              {/* Header */}
              <View style={styles.popupHeader}>
                <View
                  style={[
                    styles.popupAvatar,
                    {
                      backgroundColor: getAvatarColors(selectedUserForModal.fullName).bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.popupAvatarText,
                      {
                        color: getAvatarColors(selectedUserForModal.fullName).text,
                      },
                    ]}
                  >
                    {selectedUserForModal.fullName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.popupTitle} numberOfLines={1}>
                  {selectedUserForModal.fullName}
                </Text>
                <Text style={styles.popupSubTitle} numberOfLines={1}>
                  {selectedUserForModal.email}
                </Text>
                <View style={styles.popupBadges}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          (ROLE_CONFIG[selectedUserForModal.role] || ROLE_CONFIG.user).bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: (ROLE_CONFIG[selectedUserForModal.role] || ROLE_CONFIG.user).color,
                        },
                      ]}
                    >
                      {(ROLE_CONFIG[selectedUserForModal.role] || ROLE_CONFIG.user).label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          (STATUS_CONFIG[selectedUserForModal.status] || STATUS_CONFIG.active).bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: (
                            STATUS_CONFIG[selectedUserForModal.status] || STATUS_CONFIG.active
                          ).color,
                        },
                      ]}
                    >
                      {(STATUS_CONFIG[selectedUserForModal.status] || STATUS_CONFIG.active).label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.popupSeparator} />

              {/* Action Buttons */}
              {selectedUserForModal.role !== "admin" ? (
                <TouchableOpacity
                  style={styles.popupActionBtn}
                  onPress={() =>
                    openConfirmChange(
                      "role",
                      "admin",
                      "Cấp quyền Admin",
                      `Bạn có chắc chắn muốn nâng quyền của ${selectedUserForModal.fullName} lên làm Quản trị viên không?`
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="shield-crown-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.popupActionBtnText, { color: colors.primary }]}>
                    Nâng lên Admin
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.popupActionBtn}
                  onPress={() =>
                    openConfirmChange(
                      "role",
                      "user",
                      "Hạ quyền xuống User",
                      `Bạn có chắc chắn muốn hạ quyền Quản trị viên của ${selectedUserForModal.fullName} xuống Người dùng thông thường?`
                    )
                  }
                >
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.teal} />
                  <Text style={[styles.popupActionBtnText, { color: colors.teal }]}>
                    Hạ xuống User
                  </Text>
                </TouchableOpacity>
              )}

              {selectedUserForModal.role !== "event_organizer" && (
                <TouchableOpacity
                  style={styles.popupActionBtn}
                  onPress={() =>
                    openConfirmChange(
                      "role",
                      "event_organizer",
                      "Cấp quyền Organizer",
                      `Bạn có chắc chắn muốn phân quyền cho ${selectedUserForModal.fullName} làm Ban tổ chức sự kiện không?`
                    )
                  }
                >
                  <MaterialCommunityIcons name="calendar-star" size={20} color="#D97706" />
                  <Text style={[styles.popupActionBtnText, { color: "#D97706" }]}>
                    Cấp quyền Organizer
                  </Text>
                </TouchableOpacity>
              )}

              {selectedUserForModal.status !== "blocked" ? (
                <TouchableOpacity
                  style={[styles.popupActionBtn, { borderColor: colors.error }]}
                  onPress={() =>
                    openConfirmChange(
                      "status",
                      "blocked",
                      "Khóa tài khoản",
                      `Bạn có chắc chắn muốn KHOÁ tài khoản của ${selectedUserForModal.fullName}? Người dùng này sẽ không thể đăng nhập hệ thống.`
                    )
                  }
                >
                  <MaterialCommunityIcons name="lock-outline" size={20} color={colors.error} />
                  <Text style={[styles.popupActionBtnText, { color: colors.error }]}>
                    Khóa tài khoản
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.popupActionBtn, { borderColor: colors.success }]}
                  onPress={() =>
                    openConfirmChange(
                      "status",
                      "active",
                      "Mở khóa tài khoản",
                      `Mở khoá tài khoản cho ${selectedUserForModal.fullName}? Người dùng sẽ hoạt động bình thường trở lại.`
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="lock-open-outline"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={[styles.popupActionBtnText, { color: colors.success }]}>
                    Mở khóa tài khoản
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.popupCancelBtn}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.popupCancelBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Custom Confirm Modal ── */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          {confirmConfig && (
            <View style={styles.popupCard}>
              <View
                style={[
                  styles.confirmIcon,
                  {
                    backgroundColor:
                      confirmConfig.targetValue === "blocked" ||
                      confirmConfig.targetValue === "user"
                        ? colors.errorBg
                        : colors.successBg,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    confirmConfig.targetValue === "blocked"
                      ? "alert-circle-outline"
                      : "help-circle-outline"
                  }
                  size={36}
                  color={
                    confirmConfig.targetValue === "blocked" ||
                    confirmConfig.targetValue === "user"
                      ? colors.error
                      : colors.success
                  }
                />
              </View>

              <Text style={styles.confirmTitle}>{confirmConfig.title}</Text>
              <Text style={styles.confirmMessage}>{confirmConfig.message}</Text>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmBtnLeft}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={[styles.confirmBtnText, { color: colors.textSecondary }]}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtnRight,
                    {
                      backgroundColor:
                        confirmConfig.targetValue === "blocked" ||
                        confirmConfig.targetValue === "user"
                          ? colors.error
                          : colors.primary,
                    },
                  ]}
                  onPress={confirmConfig.onConfirm}
                >
                  <Text style={[styles.confirmBtnText, { color: "#FFFFFF" }]}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Stylesheet ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
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
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 40,
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
  cardCell: {
    flex: 1,
    padding: 6,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 4px 16px rgba(15, 23, 42, 0.02)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: displayFont,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    fontFamily: webFont,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: webFont,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: webFont,
  },
  menuTrigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    fontFamily: webFont,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "600",
    fontFamily: webFont,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: "100%",
    maxWidth: 340,
    padding: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  popupHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  popupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  popupAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: displayFont,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
    fontFamily: displayFont,
  },
  popupSubTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: webFont,
  },
  popupBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  popupSeparator: {
    height: 1,
    backgroundColor: colors.border,
    width: "100%",
    marginBottom: 16,
  },
  popupActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    width: "100%",
    marginBottom: 10,
  },
  popupActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },
  popupCancelBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 6,
  },
  popupCancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    fontFamily: webFont,
  },
  confirmIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: displayFont,
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: "500",
    fontFamily: webFont,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmBtnLeft: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnRight: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },
});
