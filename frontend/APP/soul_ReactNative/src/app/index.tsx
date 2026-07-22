import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store";

// ── COLOR PALETTE TOKENS (Matching Project Theme) ──────────────────────────
const PRIMARY = colors.primary || "#7C3AED";
const PRIMARY_DARK = colors.primaryDark || "#5B21B6";
const PRIMARY_LIGHT = colors.primaryLight || "#A78BFA";
const PRIMARY_BG = colors.primaryBg || "#EDE9FE";

type NavItem = {
  label: string;
  y: number;
};

const navItems: NavItem[] = [
  { label: "SOUL AI", y: 700 },
  { label: "Nhật ký", y: 1500 },
  { label: "Bài test", y: 2200 },
  { label: "Sự kiện", y: 2900 },
  { label: "Cộng đồng", y: 3500 },
  { label: "An toàn", y: 4400 },
];

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const isTablet = Platform.OS === "web" && width >= 760 && width < 1024;
  const scrollRef = useRef<ScrollView>(null);

  const [activeTourTab, setActiveTourTab] = useState<number>(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token && user) {
      if (user.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, token]);

  const scrollTo = (y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        style={styles.page}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. STICKY HEADER */}
        <View style={styles.headerOuter}>
          <View style={styles.headerInner}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => scrollTo(0)}>
              <Text style={styles.headerLogo}>SOUL</Text>
            </TouchableOpacity>

            {isDesktop && (
              <View style={styles.headerNav}>
                {navItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={0.7}
                    onPress={() => scrollTo(item.y)}
                  >
                    <Text style={styles.headerNavLink}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.headerActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/(auth)/login" as never)}
              >
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(auth)/register" as never)}
                style={styles.ctaHeaderBtn}
              >
                <LinearGradient
                  colors={[PRIMARY, "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaHeaderGradient}
                >
                  <Text style={styles.ctaHeaderBtnText}>Bắt đầu miễn phí</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.mainContainer}>
          {/* 2. HERO SECTION */}
          <View style={[styles.section, styles.heroSection, isDesktop ? styles.row : styles.column]}>
            <View style={[styles.heroLeft, isDesktop ? { width: "45%" } : { width: "100%" }]}>
              <View style={styles.badgeCaps}>
                <Text style={styles.badgeCapsText}>NỀN TẢNG HỖ TRỢ SỨC KHỎE TINH THẦN</Text>
              </View>

              <Text style={styles.heroHeading}>
                Hiểu cảm xúc của bạn.{"\n"}
                <Text style={styles.highlightText}>Chăm sóc tâm trí</Text> mỗi ngày.
              </Text>

              <Text style={styles.heroSubtext}>
                SOUL kết hợp AI đồng hành, nhật ký cảm xúc, bài test tự đánh giá, sự kiện wellness và cộng đồng an toàn để giúp bạn duy trì trạng thái cân bằng.
              </Text>

              <View style={styles.heroBtnGroup}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.heroPrimaryBtn}
                  onPress={() => router.push("/(auth)/register" as never)}
                >
                  <Text style={styles.heroPrimaryBtnText}>Bắt đầu miễn phí</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.heroOutlineBtn}
                  onPress={() => scrollTo(700)}
                >
                  <Text style={styles.heroOutlineBtnText}>Khám phá SOUL</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.disclaimerText}>*Không thay thế tư vấn y tế chuyên nghiệp.</Text>
            </View>

            <View style={[styles.heroRight, isDesktop ? { width: "52%" } : { width: "100%", marginTop: 32 }]}>
              <View style={styles.browserWindow}>
                <View style={styles.browserHeader}>
                  <View style={[styles.browserDot, { backgroundColor: "#FF5F56" }]} />
                  <View style={[styles.browserDot, { backgroundColor: "#FFBD2E" }]} />
                  <View style={[styles.browserDot, { backgroundColor: "#27C93F" }]} />
                  <View style={styles.browserUrlBar}>
                    <Text style={styles.browserUrlText}>soul.vn/home</Text>
                  </View>
                </View>

                <View style={styles.browserBody}>
                  <View style={styles.mockSidebar}>
                    <View style={styles.mockLogoSquare} />
                    <View style={styles.mockLineFull} />
                    <View style={styles.mockLineHalf} />
                    <View style={styles.mockLineShort} />
                  </View>

                  <View style={styles.mockMainContent}>
                    <View style={styles.mockTopRow}>
                      <View style={{ width: 140, height: 16, backgroundColor: "#EDE2FE", borderRadius: 4 }} />
                      <View style={{ width: 32, height: 32, backgroundColor: "#EDE2FE", borderRadius: 16 }} />
                    </View>

                    <View style={styles.mockGrid}>
                      <View style={styles.mockCardLeft}>
                        <Text style={styles.mockCardTitle}>Mood Hôm Nay</Text>
                        <Text style={styles.mockCardStat}>85/100</Text>
                      </View>
                      <View style={styles.mockCardRight}>
                        <View style={styles.mockChartWave} />
                        <Text style={styles.mockChartLabel}>Cân bằng & Tích cực</Text>
                      </View>
                    </View>

                    <View style={styles.mockBanner}>
                      <MaterialCommunityIcons name="sparkles" size={18} color={PRIMARY} />
                      <Text style={styles.mockBannerText}>Bắt đầu một ngày mới với SOUL AI</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 3. PRODUCT VALUE BAR */}
          <View style={styles.valueBar}>
            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="brain" size={24} color={PRIMARY} />
              <Text style={styles.valueText}>AI đồng hành</Text>
            </View>

            <View style={styles.valueDivider} />

            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="square-edit-outline" size={24} color={PRIMARY} />
              <Text style={styles.valueText}>Nhật ký & Mood tracking</Text>
            </View>

            <View style={styles.valueDivider} />

            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color={PRIMARY} />
              <Text style={styles.valueText}>WHO-5 & PSS-10</Text>
            </View>

            <View style={styles.valueDivider} />

            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="account-group" size={24} color={PRIMARY} />
              <Text style={styles.valueText}>Cộng đồng moderated</Text>
            </View>
          </View>

          {/* 4. PRODUCT TOUR */}
          <View style={[styles.section, { paddingVertical: 48 }]}>
            <Text style={styles.sectionHeadingCenter}>Một không gian, nhiều cách chăm sóc bản thân.</Text>

            <View style={[isDesktop ? styles.row : styles.column, { marginTop: 32, gap: 24 }]}>
              {/* Left Selector List */}
              <View style={isDesktop ? { width: "35%" } : { width: "100%" }}>
                {[
                  {
                    title: "SOUL AI",
                    desc: "Trò chuyện bảo mật 24/7",
                    icon: "chat-processing-outline",
                  },
                  {
                    title: "Nhật ký cảm xúc",
                    desc: "Theo dõi hành trình nội tâm",
                    icon: "book-open-outline",
                  },
                  {
                    title: "Bài test khoa học",
                    desc: "Đo lường sức khỏe định kỳ",
                    icon: "clipboard-pulse-outline",
                  },
                  {
                    title: "Sự kiện Wellness",
                    desc: "Gặp gỡ và chia sẻ thực tế",
                    icon: "calendar-heart",
                  },
                ].map((tour, idx) => {
                  const isActive = activeTourTab === idx;
                  return (
                    <TouchableOpacity
                      key={tour.title}
                      activeOpacity={0.8}
                      onPress={() => setActiveTourTab(idx)}
                      style={[styles.tourTabCard, isActive && styles.tourTabCardActive]}
                    >
                      <MaterialCommunityIcons
                        name={tour.icon as any}
                        size={26}
                        color={isActive ? PRIMARY : "#94A3B8"}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.tourTabTitle, isActive && { color: PRIMARY }]}>
                          {tour.title}
                        </Text>
                        <Text style={styles.tourTabDesc}>{tour.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Right Tour Display Area */}
              <View style={isDesktop ? { width: "62%" } : { width: "100%" }}>
                <View style={styles.tourDisplayCard}>
                  <View style={styles.tourCardInner}>
                    <View style={styles.tourIconCircle}>
                      <MaterialCommunityIcons
                        name={
                          activeTourTab === 0
                            ? "robot"
                            : activeTourTab === 1
                            ? "book-open-page-variant"
                            : activeTourTab === 2
                            ? "shield-pulse"
                            : "account-heart"
                        }
                        size={36}
                        color={PRIMARY}
                      />
                    </View>
                    <Text style={styles.tourDisplayTitle}>
                      {activeTourTab === 0
                        ? "Trải nghiệm SOUL AI"
                        : activeTourTab === 1
                        ? "Ghi lại từng khoảnh khắc"
                        : activeTourTab === 2
                        ? "Đánh giá theo chuẩn Quốc tế"
                        : "Sự kiện gắn kết tâm hồn"}
                    </Text>
                    <Text style={styles.tourDisplayDesc}>
                      {activeTourTab === 0
                        ? "AI của chúng tôi được huấn luyện để lắng nghe mà không phán xét, giúp bạn gọi tên cảm xúc và tìm ra những góc nhìn mới."
                        : activeTourTab === 1
                        ? "Bản đồ cảm xúc cá nhân giúp bạn nhận ra những quy luật tâm lý và chủ động điều chỉnh phong cách sống."
                        : activeTourTab === 2
                        ? "Hệ thống bài test WHO-5 và PSS-10 giúp bạn định hình mức độ lo âu, căng thẳng một cách trực quan."
                        : "Cùng tham gia các buổi Workshop & Webinar trực tiếp với sự dẫn dắt từ các chuyên gia trị liệu kinh nghiệm."}
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.tourActionBtn}
                      onPress={() => router.push("/(auth)/register" as never)}
                    >
                      <Text style={styles.tourActionBtnText}>Khám phá ngay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 5. SOUL AI SECTION */}
          <View style={[styles.section, styles.aiSection]}>
            <View style={[isDesktop ? styles.row : styles.column, { alignItems: "center", gap: 32 }]}>
              {/* Chat UI Mockup */}
              <View style={isDesktop ? { width: "50%" } : { width: "100%" }}>
                <View style={styles.chatBox}>
                  <View style={styles.chatMessageRow}>
                    <View style={styles.avatarAI}>
                      <Text style={styles.avatarText}>S</Text>
                    </View>
                    <View style={styles.chatBubbleAI}>
                      <Text style={styles.chatTextAI}>
                        Chào bạn, hôm nay bạn cảm thấy thế nào? Tôi ở đây để lắng nghe.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.chatMessageRow, { justifyContent: "flex-end" }]}>
                    <View style={styles.chatBubbleUser}>
                      <Text style={styles.chatTextUser}>
                        Mình cảm thấy hơi áp lực vì công việc dạo này quá nhiều...
                      </Text>
                    </View>
                    <View style={styles.avatarUser}>
                      <Text style={styles.avatarText}>U</Text>
                    </View>
                  </View>

                  <View style={styles.chatMessageRow}>
                    <View style={styles.avatarAI}>
                      <Text style={styles.avatarText}>S</Text>
                    </View>
                    <View style={styles.chatBubbleAI}>
                      <Text style={styles.chatTextAI}>
                        Tôi hiểu cảm giác đó. Áp lực công việc thường làm chúng ta kiệt sức. Bạn có muốn thử bài tập thở ngắn 2 phút không?
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chatInputBar}>
                    <Text style={styles.chatInputPlaceholder}>Viết tin nhắn của bạn...</Text>
                    <MaterialCommunityIcons name="send" size={20} color={PRIMARY} />
                  </View>
                </View>
              </View>

              {/* Text Info */}
              <View style={isDesktop ? { width: "45%" } : { width: "100%" }}>
                <View style={styles.tagCaps}>
                  <Text style={styles.tagCapsText}>SOUL AI</Text>
                </View>

                <Text style={styles.sectionHeadingLeft}>
                  Một khoảng không để bạn bắt đầu nói ra.
                </Text>

                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <View style={styles.checkIconBox}>
                      <MaterialCommunityIcons name="check-all" size={20} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureItemTitle}>Phản hồi 100% bằng Tiếng Việt</Text>
                      <Text style={styles.featureItemDesc}>
                        Ngôn ngữ tự nhiên, gần gũi và hiểu sâu sắc ngữ cảnh văn hóa Việt Nam.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.checkIconBox}>
                      <MaterialCommunityIcons name="heart-cog" size={20} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureItemTitle}>Khơi gợi sự tự thấu hiểu</Text>
                      <Text style={styles.featureItemDesc}>
                        Không chỉ trả lời, SOUL AI đặt những câu hỏi giúp bạn nhìn sâu vào vấn đề của chính mình.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.checkIconBox}>
                      <MaterialCommunityIcons name="shield-check" size={20} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureItemTitle}>Bảo mật & Ẩn danh</Text>
                      <Text style={styles.featureItemDesc}>
                        Cuộc hội thoại của bạn được mã hóa và bảo vệ quyền riêng tư tuyệt đối.
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.chatStartBtn}
                  onPress={() => router.push("/(auth)/login" as never)}
                >
                  <Text style={styles.chatStartBtnText}>Trò chuyện ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 6. DIARY SECTION */}
          <View style={[styles.section, { paddingVertical: 48 }]}>
            <View style={styles.diaryCard}>
              <View style={[isDesktop ? styles.row : styles.column, { alignItems: "center", gap: 32 }]}>
                {/* Left Dashboard Mockup */}
                <View style={isDesktop ? { width: "55%" } : { width: "100%" }}>
                  <View style={styles.diaryDashboard}>
                    <View style={styles.diaryDashboardHeader}>
                      <Text style={styles.diaryDashboardTitle}>Nhật ký cảm xúc của bạn</Text>
                      <View style={styles.timeTag}>
                        <Text style={styles.timeTagText}>7 ngày qua</Text>
                      </View>
                    </View>

                    {/* Bar Chart Mockup */}
                    <View style={styles.barChartRow}>
                      {[
                        { day: "T2", h: 48 },
                        { day: "T3", h: 64 },
                        { day: "T4", h: 32 },
                        { day: "T5", h: 80 },
                        { day: "T6", h: 72 },
                        { day: "T7", h: 56 },
                        { day: "CN", h: 40 },
                      ].map((item) => (
                        <View key={item.day} style={styles.chartCol}>
                          <View style={[styles.chartBarFill, { height: item.h }]} />
                          <Text style={styles.chartDayText}>{item.day}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.diaryStatsGrid}>
                      <View style={styles.diaryStatBox}>
                        <Text style={styles.diaryStatSub}>Chỉ số Mood hôm nay</Text>
                        <Text style={styles.diaryStatVal}>72/100</Text>
                      </View>
                      <View style={styles.diaryStatBox}>
                        <Text style={styles.diaryStatSub}>Chuỗi viết nhật ký</Text>
                        <Text style={styles.diaryStatVal}>5 ngày</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Content */}
                <View style={isDesktop ? { width: "42%" } : { width: "100%" }}>
                  <Text style={styles.sectionHeadingLeft}>
                    Lắng nghe chính mình qua những dòng chữ.
                  </Text>
                  <Text style={styles.sectionSubtextLeft}>
                    Ghi lại cảm xúc giúp bạn giải tỏa áp lực và nhận ra những quy luật trong đời sống tinh thần của mình.
                  </Text>

                  <View style={styles.aiInsightBox}>
                    <Text style={styles.aiInsightTag}>AI Insight</Text>
                    <Text style={styles.aiInsightText}>
                      "Bạn thường cảm thấy lo lắng vào chiều Thứ Năm. Có vẻ như các cuộc họp định kỳ đang gây áp lực cho bạn. Hãy thử dành 5 phút thiền trước khi bắt đầu nhé."
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.heroPrimaryBtn}
                    onPress={() => router.push("/(auth)/login" as never)}
                  >
                    <Text style={styles.heroPrimaryBtnText}>Bắt đầu viết nhật ký</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* 7. ASSESSMENT SECTION */}
          <View style={[styles.section, styles.assessmentSection]}>
            <Text style={styles.sectionHeadingCenter}>
              Hiểu mình rõ hơn qua những bài tự đánh giá ngắn.
            </Text>
            <Text style={styles.sectionSubtextCenter}>
              Các bài kiểm tra tiêu chuẩn quốc tế giúp bạn nhận diện sớm các vấn đề sức khỏe tinh thần.
            </Text>

            <View style={[isDesktop ? styles.row : styles.column, { marginTop: 32, gap: 24 }]}>
              {/* WHO-5 Card */}
              <View style={[styles.assessmentCard, isDesktop ? { flex: 1 } : { width: "100%" }]}>
                <View style={styles.assessmentHeader}>
                  <View style={styles.assessmentIconBox}>
                    <MaterialCommunityIcons name="emoticon-happy-outline" size={28} color={PRIMARY} />
                  </View>
                  <Text style={styles.assessmentCategory}>Y TẾ THẾ GIỚI (WHO)</Text>
                </View>

                <Text style={styles.assessmentTitle}>WHO-5 Wellbeing Index</Text>
                <Text style={styles.assessmentDesc}>
                  Thang đo chỉ số hạnh phúc và chất lượng cuộc sống trong 2 tuần qua. Phổ biến nhất trong nghiên cứu lâm sàng.
                </Text>

                <View style={styles.assessmentMetaRow}>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#64748B" />
                    <Text style={styles.metaBadgeText}>3 phút</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#64748B" />
                    <Text style={styles.metaBadgeText}>5 câu hỏi</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.heroPrimaryBtn}
                  onPress={() => router.push("/(auth)/login" as never)}
                >
                  <Text style={styles.heroPrimaryBtnText}>Làm bài test</Text>
                </TouchableOpacity>

                <Text style={styles.assessmentNotice}>*Đây không phải là công cụ chẩn đoán y khoa.</Text>
              </View>

              {/* PSS-10 Card */}
              <View style={[styles.assessmentCard, isDesktop ? { flex: 1 } : { width: "100%" }]}>
                <View style={styles.assessmentHeader}>
                  <View style={styles.assessmentIconBox}>
                    <MaterialCommunityIcons name="brain" size={28} color={PRIMARY} />
                  </View>
                  <Text style={styles.assessmentCategory}>TIÊU CHUẨN QUỐC TẾ</Text>
                </View>

                <Text style={styles.assessmentTitle}>PSS-10 Stress Scale</Text>
                <Text style={styles.assessmentDesc}>
                  Đánh giá mức độ áp lực bạn đang cảm nhận. Giúp bạn xác định xem mình có đang quá tải hay không.
                </Text>

                <View style={styles.assessmentMetaRow}>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#64748B" />
                    <Text style={styles.metaBadgeText}>5 phút</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#64748B" />
                    <Text style={styles.metaBadgeText}>10 câu hỏi</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.heroPrimaryBtn}
                  onPress={() => router.push("/(auth)/login" as never)}
                >
                  <Text style={styles.heroPrimaryBtnText}>Làm bài test</Text>
                </TouchableOpacity>

                <Text style={styles.assessmentNotice}>*Kết quả chỉ mang tính chất tham khảo cá nhân.</Text>
              </View>
            </View>
          </View>

          {/* 8. EVENT SECTION */}
          <View style={[styles.section, { paddingVertical: 48 }]}>
            <Text style={styles.sectionHeadingCenter}>Kết nối qua những sự kiện wellness.</Text>

            <View style={[isDesktop ? styles.row : styles.column, { marginTop: 32, gap: 24 }]}>
              {/* Event 1 */}
              <View style={[styles.eventCard, isDesktop ? { flex: 1 } : { width: "100%" }]}>
                <View style={styles.eventCover}>
                  <Image
                    source={require("../../assets/images/event_workshop.png")}
                    style={styles.eventCoverImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.eventBadge, { backgroundColor: "rgba(124, 58, 237, 0.85)" }]}>
                    <Text style={styles.eventBadgeText}>WORKSHOP</Text>
                  </View>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>Mindfulness trong môi trường công sở</Text>

                  <View style={styles.eventInfoList}>
                    <Text style={styles.eventInfoText}>⏰ 09:00 - 20/12/2024</Text>
                    <Text style={styles.eventInfoText}>📍 Quận 1, TP. HCM</Text>
                    <Text style={[styles.eventInfoText, { color: PRIMARY, fontWeight: "600" }]}>
                      👥 Còn 5 chỗ trống
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.eventActionBtn}
                    onPress={() => router.push("/(auth)/login" as never)}
                  >
                    <Text style={styles.eventActionBtnText}>Đăng nhập để đăng ký</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Event 2 */}
              <View style={[styles.eventCard, isDesktop ? { flex: 1 } : { width: "100%" }]}>
                <View style={styles.eventCover}>
                  <Image
                    source={require("../../assets/images/event_webinar.png")}
                    style={styles.eventCoverImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.eventBadge, { backgroundColor: "rgba(2, 132, 199, 0.85)" }]}>
                    <Text style={styles.eventBadgeText}>WEBINAR ONLINE</Text>
                  </View>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>Hiểu về lo âu và cách đối mặt</Text>

                  <View style={styles.eventInfoList}>
                    <Text style={styles.eventInfoText}>⏰ 19:30 - 22/12/2024</Text>
                    <Text style={styles.eventInfoText}>📍 Qua Google Meet</Text>
                    <Text style={[styles.eventInfoText, { color: PRIMARY, fontWeight: "600" }]}>
                      👥 Không giới hạn
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.eventActionBtn}
                    onPress={() => router.push("/(auth)/login" as never)}
                  >
                    <Text style={styles.eventActionBtnText}>Đăng nhập để đăng ký</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Event 3 */}
              <View style={[styles.eventCard, isDesktop ? { flex: 1 } : { width: "100%" }]}>
                <View style={styles.eventCover}>
                  <Image
                    source={require("../../assets/images/event_community.png")}
                    style={styles.eventCoverImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.eventBadge, { backgroundColor: "rgba(217, 119, 6, 0.85)" }]}>
                    <Text style={styles.eventBadgeText}>GẶP GỠ CỘNG ĐỒNG</Text>
                  </View>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>SOUL Circle: Chia sẻ không phán xét</Text>

                  <View style={styles.eventInfoList}>
                    <Text style={styles.eventInfoText}>⏰ 14:00 - 28/12/2024</Text>
                    <Text style={styles.eventInfoText}>📍 Thảo Điền, TP. Thủ Đức</Text>
                    <Text style={[styles.eventInfoText, { color: "#94A3B8" }]}>👥 Hết chỗ</Text>
                  </View>

                  <TouchableOpacity style={styles.eventDisabledBtn} disabled>
                    <Text style={styles.eventDisabledBtnText}>Đã hết chỗ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* 9. SAFE COMMUNITY SECTION */}
          <View style={[styles.section, styles.aiSection]}>
            <View style={[isDesktop ? styles.row : styles.column, { alignItems: "center", gap: 32 }]}>
              {/* Left Info */}
              <View style={isDesktop ? { width: "45%" } : { width: "100%" }}>
                <Text style={styles.sectionHeadingLeft}>
                  Chia sẻ trong một cộng đồng được thiết kế để an toàn.
                </Text>
                <Text style={styles.sectionSubtextLeft}>
                  Chúng tôi hiểu rằng chia sẻ là bước đầu của chữa lành. SOUL xây dựng không gian nơi mỗi tiếng nói đều được tôn trọng.
                </Text>

                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="auto-fix" size={22} color={PRIMARY} />
                    <Text style={styles.featureItemText}>AI tự động lọc nội dung tiêu cực/xúc phạm</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="security" size={22} color={PRIMARY} />
                    <Text style={styles.featureItemText}>Admin duyệt bài 24/7 để đảm bảo sự tích cực</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="eye-off-outline" size={22} color={PRIMARY} />
                    <Text style={styles.featureItemText}>Tùy chọn ẩn danh hoàn toàn khi chia sẻ</Text>
                  </View>
                </View>
              </View>

              {/* Right Feed Card */}
              <View style={isDesktop ? { width: "50%" } : { width: "100%" }}>
                <View style={styles.feedCard}>
                  <View style={styles.feedCardHeader}>
                    <View style={styles.feedTagsRow}>
                      <View style={styles.feedTagPrimary}>
                        <Text style={styles.feedTagPrimaryText}>#LoÂu</Text>
                      </View>
                      <View style={styles.feedTagSecondary}>
                        <Text style={styles.feedTagSecondaryText}>#ẨnDanh</Text>
                      </View>
                    </View>
                    <Text style={styles.feedTime}>12 phút trước</Text>
                  </View>

                  <Text style={styles.feedContentText}>
                    Mình vừa vượt qua một đợt khủng hoảng hiện sinh nhờ việc viết nhật ký mỗi ngày trên SOUL. Có ai đang cảm thấy giống mình không?
                  </Text>

                  <View style={styles.feedCardFooter}>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <Text style={styles.feedStatText}>❤️ 24</Text>
                      <Text style={styles.feedStatText}>💬 8</Text>
                    </View>
                    <Text style={styles.feedReportText}>🚩 Báo cáo</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 10. HOW IT WORKS SECTION */}
          <View style={[styles.section, { paddingVertical: 48 }]}>
            <View style={[isDesktop ? styles.row : styles.column, { gap: 24, textAlign: "center" }]}>
              <View style={styles.stepBox}>
                <Text style={styles.stepBigNum}>01</Text>
                <Text style={styles.stepHeading}>Lắng nghe bản thân</Text>
                <Text style={styles.stepDesc}>
                  Bắt đầu bằng việc chia sẻ với SOUL AI hoặc ghi lại cảm nhận trong nhật ký.
                </Text>
              </View>

              <View style={styles.stepBox}>
                <Text style={styles.stepBigNum}>02</Text>
                <Text style={styles.stepHeading}>Đánh giá khoa học</Text>
                <Text style={styles.stepDesc}>
                  Thực hiện các bài test định kỳ để có cái nhìn khách quan về sức khỏe tâm trí.
                </Text>
              </View>

              <View style={styles.stepBox}>
                <Text style={styles.stepBigNum}>03</Text>
                <Text style={styles.stepHeading}>Kết nối & Cân bằng</Text>
                <Text style={styles.stepDesc}>
                  Tham gia cộng đồng và các sự kiện để tìm thấy sự đồng cảm và học cách tự chăm sóc.
                </Text>
              </View>
            </View>
          </View>

          {/* 11. TRUST & SAFETY SECTION (Dark Navy) */}
          <View style={styles.trustSection}>
            <Text style={styles.trustTitle}>Công nghệ hỗ trợ bạn, không thay thế con người.</Text>
            <Text style={styles.trustSubtitle}>
              Chúng tôi cam kết xây dựng một nền tảng đạo đức, minh bạch và an toàn tuyệt đối cho người dùng Việt.
            </Text>

            <View style={[isDesktop ? styles.row : styles.column, { marginTop: 32, gap: 16 }]}>
              {[
                {
                  icon: "medical-bag",
                  title: "Không chẩn đoán y tế",
                  desc: "SOUL AI cung cấp hỗ trợ tinh thần ban đầu, không thay thế bác sĩ tâm thần.",
                },
                {
                  icon: "chart-box-outline",
                  title: "Chỉ số đánh giá",
                  desc: "Các bài test chỉ mang tính chất sàng lọc và tự thấu hiểu cá nhân.",
                },
                {
                  icon: "lock-outline",
                  title: "Bảo mật dữ liệu",
                  desc: "Dữ liệu cá nhân được mã hóa. Admin không có quyền truy cập nhật ký của bạn.",
                },
                {
                  icon: "forum-outline",
                  title: "Kiểm duyệt tích cực",
                  desc: "Cộng đồng được giám sát chặt chẽ để luôn là nơi an toàn cho tất cả.",
                },
              ].map((item) => (
                <View key={item.title} style={styles.trustCard}>
                  <MaterialCommunityIcons name={item.icon as any} size={28} color={PRIMARY_LIGHT} />
                  <Text style={styles.trustCardTitle}>{item.title}</Text>
                  <Text style={styles.trustCardDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 12. FAQ SECTION */}
          <View style={[styles.section, { paddingVertical: 48, maxWidth: 800, alignSelf: "center" }]}>
            <Text style={styles.sectionHeadingCenter}>Câu hỏi thường gặp</Text>

            <View style={{ marginTop: 32, gap: 12, width: "100%" }}>
              {[
                {
                  q: "SOUL AI có phải là một chuyên gia tâm lý không?",
                  a: "Không, SOUL AI là một trợ lý ảo được huấn luyện để lắng nghe và hỗ trợ tinh thần. Nó không có bằng cấp y khoa và không thể thực hiện các liệu pháp chuyên sâu hay kê đơn thuốc.",
                },
                {
                  q: "Dữ liệu nhật ký của tôi có được bảo mật không?",
                  a: "Có, tất cả dữ liệu nhật ký của bạn đều được mã hóa đầu cuối. Chúng tôi cam kết không chia sẻ dữ liệu này với bất kỳ bên thứ ba nào và đội ngũ quản trị cũng không thể đọc được nội dung riêng tư của bạn.",
                },
                {
                  q: "Tôi có thể sử dụng SOUL miễn phí không?",
                  a: "SOUL cung cấp gói miễn phí với đầy đủ các tính năng cơ bản như trò chuyện với AI (giới hạn lượt), viết nhật ký và tham gia cộng đồng. Các tính năng chuyên sâu và sự kiện đặc biệt sẽ có trong gói Premium.",
                },
              ].map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <View key={faq.q} style={styles.faqCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.faqHeader}
                      onPress={() => setActiveFaq(isOpen ? null : idx)}
                    >
                      <Text style={styles.faqQuestionText}>{faq.q}</Text>
                      <MaterialCommunityIcons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={22}
                        color={PRIMARY}
                      />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={styles.faqAnswerBox}>
                        <Text style={styles.faqAnswerText}>{faq.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* 13. FINAL CTA */}
          <View style={[styles.section, { paddingVertical: 32 }]}>
            <LinearGradient
              colors={[PRIMARY, PRIMARY_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finalCtaCard}
            >
              <View style={{ maxWidth: 500 }}>
                <Text style={styles.finalCtaTitle}>Bắt đầu chăm sóc tâm trí của bạn ngay hôm nay.</Text>
                <Text style={styles.finalCtaSub}>
                  Gia nhập cùng hàng ngàn người Việt đang tìm thấy sự bình yên mỗi ngày cùng SOUL.
                </Text>
              </View>

              <View style={[styles.row, { gap: 12, flexWrap: "wrap" }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.finalCtaWhiteBtn}
                  onPress={() => router.push("/(auth)/register" as never)}
                >
                  <Text style={styles.finalCtaWhiteBtnText}>Tạo tài khoản miễn phí</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.finalCtaOutlineBtn}
                  onPress={() => router.push("/(auth)/login" as never)}
                >
                  <Text style={styles.finalCtaOutlineBtnText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* 14. FOOTER */}
          <View style={styles.footer}>
            <View style={[isDesktop ? styles.row : styles.column, { gap: 32, paddingBottom: 32 }]}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.footerLogo}>SOUL</Text>
                <Text style={styles.footerDesc}>
                  Nền tảng sức khỏe tinh thần hàng đầu cho người Việt, kết hợp giữa công nghệ AI và sự thấu cảm con người.
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.footerColTitle}>Khám phá</Text>
                <Text style={styles.footerColLink}>Về chúng tôi</Text>
                <Text style={styles.footerColLink}>Hướng dẫn</Text>
                <Text style={styles.footerColLink}>Cộng đồng</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.footerColTitle}>Pháp lý</Text>
                <Text style={styles.footerColLink}>Chính sách bảo mật</Text>
                <Text style={styles.footerColLink}>Điều khoản sử dụng</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.footerColTitle}>Liên hệ</Text>
                <Text style={styles.footerColLink}>Email: hello@soul.vn</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <View style={styles.socialIconCircle}>
                    <MaterialCommunityIcons name="facebook" size={18} color={PRIMARY} />
                  </View>
                  <View style={styles.socialIconCircle}>
                    <MaterialCommunityIcons name="email-outline" size={18} color={PRIMARY} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.copyrightRow}>
              <Text style={styles.copyrightText}>
                © 2026 SOUL Mental Wellness Platform. All rights reserved.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9FC",
  },
  page: {
    flex: 1,
    backgroundColor: "#FAF9FC",
  },
  scrollContent: {
    paddingBottom: 0,
  },
  mainContainer: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  // 1. Header
  headerOuter: {
    width: "100%",
    backgroundColor: "rgba(250, 249, 252, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    zIndex: 50,
  },
  headerInner: {
    maxWidth: 1200,
    height: 72,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo: {
    fontSize: 26,
    fontWeight: "900",
    color: PRIMARY,
    letterSpacing: -0.5,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  headerNavLink: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  ctaHeaderBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  ctaHeaderGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // Layout Helpers
  row: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
  },
  section: {
    paddingVertical: 40,
  },

  // 2. Hero
  heroSection: {
    paddingTop: 48,
    paddingBottom: 48,
  },
  heroLeft: {
    justifyContent: "center",
  },
  badgeCaps: {
    backgroundColor: "#EDE9FE",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 16,
  },
  badgeCapsText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroHeading: {
    fontSize: 38,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 48,
    marginBottom: 16,
  },
  highlightText: {
    color: PRIMARY,
  },
  heroSubtext: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 26,
    marginBottom: 24,
  },
  heroBtnGroup: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
  },
  heroPrimaryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  heroPrimaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  heroOutlineBtn: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  heroOutlineBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  heroRight: {
    justifyContent: "center",
  },
  browserWindow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  browserHeader: {
    height: 40,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 6,
  },
  browserDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  browserUrlBar: {
    marginLeft: 12,
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  browserUrlText: {
    fontSize: 11,
    color: "#64748B",
  },
  browserBody: {
    flexDirection: "row",
    height: 260,
    padding: 16,
    gap: 16,
  },
  mockSidebar: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
    gap: 12,
    paddingRight: 10,
  },
  mockLogoSquare: {
    width: 32,
    height: 32,
    backgroundColor: PRIMARY_BG,
    borderRadius: 8,
  },
  mockLineFull: {
    width: "100%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  mockLineHalf: {
    width: "70%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  mockLineShort: {
    width: "40%",
    height: 6,
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 3,
  },
  mockMainContent: {
    flex: 1,
    gap: 14,
  },
  mockTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mockGrid: {
    flexDirection: "row",
    gap: 12,
  },
  mockCardLeft: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    padding: 12,
    borderRadius: 12,
  },
  mockCardTitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  mockCardStat: {
    fontSize: 22,
    fontWeight: "800",
    color: PRIMARY,
    marginTop: 4,
  },
  mockCardRight: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  mockChartWave: {
    height: 24,
    backgroundColor: "#EDE9FE",
    borderRadius: 6,
    marginBottom: 6,
  },
  mockChartLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  mockBanner: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mockBannerText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },

  // 3. Product Value Bar
  valueBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  valueDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },

  // Headings
  sectionHeadingCenter: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  sectionSubtextCenter: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  sectionHeadingLeft: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 36,
    marginBottom: 12,
  },
  sectionSubtextLeft: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 24,
    marginBottom: 20,
  },

  // 4. Product Tour
  tourTabCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tourTabCardActive: {
    borderColor: PRIMARY,
    borderLeftWidth: 4,
  },
  tourTabTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  tourTabDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  tourDisplayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 32,
    minHeight: 300,
    justifyContent: "center",
  },
  tourCardInner: {
    alignItems: "center",
    textAlign: "center",
  },
  tourIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PRIMARY_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  tourDisplayTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 10,
  },
  tourDisplayDesc: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 440,
    marginBottom: 24,
  },
  tourActionBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tourActionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // 5. AI Section
  aiSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chatBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  chatMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  avatarAI: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  chatBubbleAI: {
    backgroundColor: "#EDE9FE",
    padding: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: "80%",
  },
  chatTextAI: {
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 20,
  },
  chatBubbleUser: {
    backgroundColor: PRIMARY,
    padding: 14,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: "80%",
  },
  chatTextUser: {
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  chatInputBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  chatInputPlaceholder: {
    fontSize: 13,
    color: "#94A3B8",
  },
  tagCaps: {
    backgroundColor: "#EDE9FE",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 12,
  },
  tagCapsText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 11,
  },
  featureList: {
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkIconBox: {
    backgroundColor: PRIMARY_BG,
    padding: 6,
    borderRadius: 8,
  },
  featureItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  featureItemDesc: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  featureItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  chatStartBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  chatStartBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  // 6. Diary Section
  diaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  diaryDashboard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  diaryDashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  diaryDashboardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  timeTag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeTagText: {
    fontSize: 11,
    color: "#64748B",
  },
  barChartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  chartCol: {
    alignItems: "center",
    flex: 1,
  },
  chartBarFill: {
    width: "50%",
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartDayText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 6,
  },
  diaryStatsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  diaryStatBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  diaryStatSub: {
    fontSize: 11,
    color: "#64748B",
  },
  diaryStatVal: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
    marginTop: 2,
  },
  aiInsightBox: {
    backgroundColor: "#F5F3FF",
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  aiInsightTag: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 4,
  },
  aiInsightText: {
    fontSize: 13,
    color: "#334155",
    fontStyle: "italic",
    lineHeight: 20,
  },

  // 7. Assessment Section
  assessmentSection: {
    paddingVertical: 48,
  },
  assessmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  assessmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  assessmentIconBox: {
    backgroundColor: PRIMARY_BG,
    padding: 10,
    borderRadius: 14,
  },
  assessmentCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  assessmentDesc: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 16,
  },
  assessmentMetaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaBadgeText: {
    fontSize: 13,
    color: "#64748B",
  },
  assessmentNotice: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
  },

  // 8. Event Section
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  eventCover: {
    height: 180,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  eventCoverImage: {
    width: "100%",
    height: "100%",
  },
  eventBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  eventBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  eventContent: {
    padding: 20,
  },
  eventType: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY,
    letterSpacing: 1,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  eventInfoList: {
    gap: 6,
    marginBottom: 16,
  },
  eventInfoText: {
    fontSize: 13,
    color: "#64748B",
  },
  eventActionBtn: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  eventActionBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 13,
  },
  eventDisabledBtn: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  eventDisabledBtnText: {
    color: "#94A3B8",
    fontWeight: "700",
    fontSize: 13,
  },

  // 9. Community Section
  feedCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  feedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  feedTagsRow: {
    flexDirection: "row",
    gap: 8,
  },
  feedTagPrimary: {
    backgroundColor: PRIMARY_BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  feedTagPrimaryText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: "700",
  },
  feedTagSecondary: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  feedTagSecondaryText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
  },
  feedTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  feedContentText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 22,
    marginBottom: 16,
  },
  feedCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  feedStatText: {
    fontSize: 12,
    color: "#64748B",
  },
  feedReportText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "700",
  },

  // 10. How It Works
  stepBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    textAlign: "center",
  },
  stepBigNum: {
    fontSize: 36,
    fontWeight: "900",
    color: PRIMARY_LIGHT,
    marginBottom: 8,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  // 11. Trust & Safety Section (Navy)
  trustSection: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 36,
    marginVertical: 24,
  },
  trustTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  trustSubtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 600,
    alignSelf: "center",
  },
  trustCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 20,
    borderRadius: 16,
  },
  trustCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 6,
  },
  trustCardDesc: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
  },

  // 12. FAQ
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  faqHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerBox: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
  },

  // 13. Final CTA
  finalCtaCard: {
    borderRadius: 24,
    padding: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 20,
  },
  finalCtaTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 38,
    marginBottom: 8,
  },
  finalCtaSub: {
    fontSize: 15,
    color: PRIMARY_BG,
    lineHeight: 22,
  },
  finalCtaWhiteBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finalCtaWhiteBtnText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 15,
  },
  finalCtaOutlineBtn: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finalCtaOutlineBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  // 14. Footer
  footer: {
    backgroundColor: "#E2E8F0",
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginTop: 32,
    borderRadius: 20,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: "900",
    color: PRIMARY,
    marginBottom: 8,
  },
  footerDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  footerColTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  footerColLink: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  socialIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  copyrightRow: {
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
    paddingTop: 20,
    alignItems: "center",
  },
  copyrightText: {
    fontSize: 12,
    color: "#64748B",
  },
});
