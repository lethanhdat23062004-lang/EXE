import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getUnreadCount } from "@/api/notificationApi";
import { useAuthStore } from "@/store";
import { styles } from "@/styles/home.styles";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileModals } from "./ProfileModals";
import UpgradeModal from "@/components/upgrade/UpgradeModal";

type Props = {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  webMode?: boolean;
  onRatingPress?: () => void;
};

const POLL_INTERVAL = 30_000;

const webNavItems = [
  { label: "SOUL AI", route: "/ai-chat" },
  { label: "Nhật ký", route: "/diary" },
  { label: "Bài test", route: "/emotional-test" },
  { label: "Sự kiện", route: "/user-events" },
  { label: "Cộng đồng", route: "/(tabs)/forum" },
];

export function HomeHeader({ showSidebar, onToggleSidebar, webMode = false, onRatingPress }: Props) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user, logout } = useAuthStore();
  const isPremium = user?.isPremium ?? false;

  const fetchUnread = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Notification count is non-blocking for the home experience.
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    fetchUnread();
  };

  const handleActionPress = (text: string) => {
    if (text === "Log out") {
      logout();
      router.replace("/(auth)/login");
    } else if (text === "My Profile") {
      setShowMyProfile(true);
    } else if (text === "Edit Profile") {
      setShowEditProfile(true);
    } else if (text === "App Rating") {
      onRatingPress?.();
    } else if (text === "Nâng cấp tài khoản" || text === "SOUL PRO ✓") {
      if (!isPremium) setShowUpgradeModal(true);
    }
    setShowProfileMenu(false);
  };

  // Menu items — upgrade entry changes based on isPremium
  const menuItems: [string, string][] = [
    ["account-outline", "My Profile"],
    ["pencil-outline", "Edit Profile"],
    ["star-outline", "App Rating"],
    ["bell-outline", "Reminders"],
    isPremium
      ? ["crown", "SOUL PRO ✓"]
      : ["crown-outline", "Nâng cấp tài khoản"],
    ["logout", "Log out"],
  ];

  return (
    <View style={styles.header}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {!webMode && (
          <TouchableOpacity onPress={onToggleSidebar} activeOpacity={0.8}>
            {showSidebar ? (
              <MaterialCommunityIcons name="close" size={28} color="#1E293B" />
            ) : (
              <MaterialCommunityIcons name="menu" size={28} color="#1E293B" />
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.logoText}>SOUL</Text>
      </View>

      {webMode && (
        <View style={styles.webHeaderNav}>
          {webNavItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.78}
              onPress={() => router.push(item.route as any)}
              style={[
                styles.webHeaderNavItem,
                index === 0 && styles.webHeaderNavItemActive,
              ]}
            >
              <Text
                style={[
                  styles.webHeaderNavText,
                  index === 0 && styles.webHeaderNavTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.bellWrap}
          onPress={() => setShowNotifications(!showNotifications)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name={showNotifications ? "bell" : "bell-outline"}
            size={22}
            color={showNotifications ? "#7C3AED" : "#475569"}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Pressable
          style={styles.profileWrapper}
          onPress={() => setShowProfileMenu(!showProfileMenu)}
        >
          <Image
            source={{ uri: user?.avatarUrl || "https://i.pravatar.cc/150?img=47" }}
            style={styles.avatar}
          />

          {/* Premium crown badge on avatar */}
          {isPremium && (
            <View style={{
              position: "absolute", top: -4, right: -4,
              backgroundColor: "#F59E0B", borderRadius: 999,
              width: 16, height: 16, justifyContent: "center", alignItems: "center",
            }}>
              <MaterialCommunityIcons name="crown" size={9} color="#fff" />
            </View>
          )}

          {showProfileMenu && (
            <View style={styles.profileMenu}>
              <View style={styles.profileTop}>
                <Image
                  source={{ uri: user?.avatarUrl || "https://i.pravatar.cc/150?img=47" }}
                  style={styles.profileImg}
                />
                <View>
                  <Text style={styles.profileName}>{user?.fullName || "SOUL user"}</Text>
                  <Text style={styles.profileSub}>
                    {user?.bio || "Take care of your mind 🌱"}
                  </Text>
                  {isPremium && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MaterialCommunityIcons name="crown" size={12} color="#F59E0B" />
                      <Text style={{ fontSize: 11, color: "#F59E0B", fontWeight: "700" }}>SOUL PRO</Text>
                    </View>
                  )}
                </View>
              </View>

              {menuItems.map(([icon, text], index) => {
                const isLogout = text === "Log out";
                const isUpgrade = text === "Nâng cấp tài khoản";
                const isPro = text === "SOUL PRO ✓";
                return (
                  <TouchableOpacity
                    key={text}
                    onPress={() => handleActionPress(text)}
                    style={[
                      styles.profileAction,
                      isLogout && styles.profileLogout,
                    ]}
                    disabled={isPro}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={22}
                      color={
                        isLogout ? "#EF4444"
                        : isUpgrade ? "#7C3AED"
                        : isPro ? "#F59E0B"
                        : "#7C3AED"
                      }
                    />
                    <Text style={[
                      styles.profileActionText,
                      isUpgrade && { color: "#7C3AED", fontWeight: "700" },
                      isPro && { color: "#F59E0B", fontWeight: "700" },
                    ]}>
                      {text}
                    </Text>
                    {isUpgrade && (
                      <View style={{
                        marginLeft: "auto" as any,
                        backgroundColor: "#7C3AED",
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>149K</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Pressable>
      </View>

      <NotificationDropdown
        visible={showNotifications}
        onClose={handleCloseNotifications}
      />

      <ProfileModals
        showMyProfile={showMyProfile}
        onCloseMyProfile={() => setShowMyProfile(false)}
        showEditProfile={showEditProfile}
        onCloseEditProfile={() => setShowEditProfile(false)}
        onOpenEditProfile={() => setShowEditProfile(true)}
      />

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false);
          setTimeout(() => {
            Alert.alert("🎉 SOUL PRO", "Tài khoản của bạn đã được nâng cấp lên Premium!\nChúc bạn trải nghiệm chat AI không giới hạn.");
          }, 300);
        }}
      />
    </View>
  );
}
