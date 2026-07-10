import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles, webStyles } from "@/styles/home.styles";

import { BottomNav } from "@/components/home/BottomNav";
import { CommunityPreview } from "@/components/home/CommunityPreview";
import { CtaFooter } from "@/components/home/CtaFooter";
import { DailyMotivation } from "@/components/home/DailyMotivation";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { EventCard } from "@/components/home/EventCard";
import { FloatingChat } from "@/components/home/FloatingChat";
import { HealingSection } from "@/components/home/HealingSection";
import { HeroCard } from "@/components/home/HeroCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MiniArticle } from "@/components/home/MiniArticle";
import { Pricing } from "@/components/home/Pricing";
import { RatingModal } from "@/components/home/RatingModal";
import { StatsSection } from "@/components/home/StatsSection";
import { Testimonials } from "@/components/home/Testimonials";
import { useAuthStore } from "@/store";

const isWeb = Platform.OS === "web";

const quickActions = [
  {
    title: "SOUL AI",
    desc: "AI Emotional Companion lắng nghe và phản hồi cảm xúc bằng tiếng Việt.",
    cta: "Khám phá ngay",
    route: "/ai-chat",
    icon: "chat-processing-outline",
    color: "#7C3AED",
    bg: "#F3E8FF",
  },
  {
    title: "Nhật ký cảm xúc",
    desc: "Ghi lại mood, điểm cảm xúc, ghi chú riêng tư và AI insight.",
    cta: "Ghi chép",
    route: "/diary",
    icon: "book-heart-outline",
    color: "#A855F7",
    bg: "#F5E8FF",
  },
  {
    title: "Theo dõi tâm trạng",
    desc: "Nhìn lại xu hướng cảm xúc từ các nhật ký đã lưu.",
    cta: "Xem thống kê",
    route: "/diary",
    icon: "chart-timeline-variant-shimmer",
    color: "#0F766E",
    bg: "#CCFBF1",
  },
  {
    title: "Bài test cảm xúc",
    desc: "Tự đánh giá bằng WHO-5 Well-being Check và PSS-10 Student Stress Check.",
    cta: "Làm bài test",
    route: "/emotional-test",
    icon: "clipboard-pulse-outline",
    color: "#EF4444",
    bg: "#FEE2E2",
  },
  {
    title: "Sự kiện & workshop",
    desc: "Đăng ký workshop, talkshow, webinar và gửi rating sau khi được xác nhận tham dự.",
    cta: "Lịch sự kiện",
    route: "/user-events",
    icon: "calendar-heart",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    title: "Cộng đồng an toàn",
    desc: "Chia sẻ ẩn danh tùy chọn, reaction, bình luận, report và AI/admin moderation.",
    cta: "Tham gia",
    route: "/(tabs)/forum",
    icon: "account-group-outline",
    color: "#64748B",
    bg: "#F1F5F9",
  },
];
const assessmentCards = [
  { title: "WHO-5 Well-being", desc: "Bài tự đánh giá mức độ well-being trong 2 tuần gần đây.", progress: "5 câu", color: "#7C3AED", icon: "lightning-bolt-outline" },
  { title: "PSS-10 Stress", desc: "Bài tự đánh giá mức độ căng thẳng trong 1 tháng gần đây.", progress: "10 câu", color: "#A855F7", icon: "head-question-outline" },
  { title: "Mood tracking", desc: "Theo dõi thay đổi cảm xúc từ nhật ký cá nhân.", progress: "Diary", color: "#0F766E", icon: "emoticon-outline" },
  { title: "AI insight", desc: "Gợi ý phản tư dựa trên nội dung bạn chủ động ghi lại.", progress: "Support", color: "#64748B", icon: "meditation" },
];
const eventCards = [
  { title: "Workshop wellness", status: "Có đăng ký", meta: "Online hoặc offline", rating: "Rating sau tham dự" },
  { title: "Talkshow sức khỏe tinh thần", status: "Có điểm danh", meta: "Theo lịch sự kiện", rating: "1-5 sao" },
  { title: "Community event", status: "Có đánh giá", meta: "Sau khi attended", rating: "Bình luận tùy chọn" },
];
const moodBars = [42, 58, 70, 45, 82, 64, 76];
const weekDays = ["Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "CN"];

export default function HomeScreen() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(" ")?.slice(-1)?.[0] || "bạn";
  const scrollRef = useRef<ScrollView>(null);
  const ratingOffsetRef = useRef<number>(0);

  const handleRatingPress = () => {
    // Scroll to rating section then open modal
    scrollRef.current?.scrollTo({ y: ratingOffsetRef.current, animated: true });
    setTimeout(() => setShowRating(true), 400);
  };

  if (isWeb) {
    return (
      <View style={webStyles.root}>
        <ScrollView
          ref={scrollRef}
          style={webStyles.contentArea}
          contentContainerStyle={webLanding.content}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader showSidebar={false} onToggleSidebar={() => {}} webMode onRatingPress={handleRatingPress} />

          <View style={webLanding.page}>
            <LoggedInHero firstName={firstName} onStartChat={() => setChatOpen(true)} />
            <QuickLauncher />
            <AiCompanionSection onStartChat={() => setChatOpen(true)} />
            <DiaryMoodSection />
            <AssessmentSection />
            <View
              onLayout={(e) => { ratingOffsetRef.current = e.nativeEvent.layout.y + 800; }}
            >
              <EventsAndRatingSection onOpenRating={() => { setShowRating(true); }} />
            </View>
            <CommunitySection />
            <FinalCta onStartChat={() => setChatOpen(true)} />
          </View>
        </ScrollView>

        <FloatingChat
          defaultOpen={chatOpen}
          onOpenChange={(open) => {
            if (!open) setChatOpen(false);
          }}
        />

        <RatingModal
          forceVisible={showRating}
          onForceClose={() => setShowRating(false)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <HomeHeader
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onRatingPress={() => setShowRating(true)}
      />

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <HeroCard />
        <StatsSection />
        <DailyMotivation />
        <MiniArticle />
        <HealingSection />
        <DashboardPreview />
        <CommunityPreview />
        <EventCard />
        <Testimonials />
        <Pricing />
        <CtaFooter />
        <BottomNav onRatingPress={() => setShowRating(true)} />
      </ScrollView>

      <FloatingChat
        defaultOpen={chatOpen}
        onOpenChange={(open) => {
          if (!open) setChatOpen(false);
        }}
      />

      <RatingModal
        forceVisible={showRating}
        onForceClose={() => setShowRating(false)}
      />
    </SafeAreaView>
  );
}

function LoggedInHero({ firstName, onStartChat }: { firstName: string; onStartChat: () => void }) {
  return (
    <View style={webLanding.hero}>
      <View style={webLanding.heroCopy}>
        <View style={webLanding.badge}>
          <Text style={webLanding.badgeText}>✦ Chào mừng trở lại, {firstName}</Text>
        </View>
        <Text style={webLanding.heroTitle}>
          Hôm nay bạn muốn chăm sóc <Text style={webLanding.heroAccent}>tâm trí</Text>{"\n"}
          theo cách nào?
        </Text>
        <Text style={webLanding.heroDesc}>
          SOUL luôn sẵn sàng lắng nghe, ghi lại cảm xúc và đồng hành cùng bạn trên hành trình tìm lại sự cân bằng.
        </Text>
        <Text style={webLanding.moodLabel}>Bạn đang cảm thấy thế nào?</Text>
        <View style={webLanding.moodRow}>
          {["😊", "😌", "🙂", "🙏", "🌈"].map((mood) => (
            <TouchableOpacity key={mood} style={webLanding.moodChip} activeOpacity={0.75}>
              <Text style={webLanding.moodEmoji}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={webLanding.heroActions}>
          <TouchableOpacity activeOpacity={0.85} onPress={onStartChat}>
            <LinearGradient colors={["#7C3AED", "#A855F7"]} style={webLanding.primaryButton}>
              <MaterialCommunityIcons name="message-outline" size={18} color="#FFFFFF" />
              <Text style={webLanding.primaryButtonText}>Trò chuyện với SOUL AI</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={webLanding.secondaryButton} onPress={() => router.push("/diary")}>
            <Text style={webLanding.secondaryButtonText}>Viết nhật ký hôm nay</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={webLanding.heroVisual}>
        <LinearGradient colors={["rgba(124,58,237,0.08)", "rgba(20,184,166,0.14)"]} style={webLanding.visualGlow}>
          <View style={webLanding.miniChartCard}>
            <View style={webLanding.tipBubble}>
              <View style={webLanding.aiDot} />
              <View>
                <Text style={webLanding.tipTitle}>SOUL AI</Text>
                <Text style={webLanding.tipText}>“Hãy bắt đầu bằng một hơi thở chậm.”</Text>
              </View>
            </View>
            <Text style={webLanding.chartTitle}>Tâm trạng tuần này</Text>
            <View style={webLanding.chartBars}>
              {moodBars.map((height, index) => (
                <View key={weekDays[index]} style={webLanding.heroChartItem}>
                  <View style={[webLanding.heroChartBar, { height }]} />
                  <Text style={webLanding.heroChartDay}>{weekDays[index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
function SectionHeading({ eyebrow, title, desc, action }: { eyebrow?: string; title: string; desc?: string; action?: string }) {
  return (
    <View style={webLanding.sectionHeading}>
      <View>
        {eyebrow ? <Text style={webLanding.eyebrow}>{eyebrow}</Text> : null}
        <Text style={webLanding.sectionTitle}>{title}</Text>
        {desc ? <Text style={webLanding.sectionDesc}>{desc}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity activeOpacity={0.75}>
          <Text style={webLanding.headingAction}>{action} →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function QuickLauncher() {
  return (
    <View style={webLanding.section}>
      <SectionHeading
        eyebrow="Một nhịp cân cho tâm trí"
        title="Khám phá các công cụ hỗ trợ sức khỏe tinh thần"
        desc="Tất cả chức năng chính của SOUL được sắp xếp như những điểm chạm nhẹ nhàng trong ngày."
      />
      <View style={webLanding.actionGrid}>
        {quickActions.map((item) => (
          <TouchableOpacity key={item.title} activeOpacity={0.82} style={webLanding.actionCard} onPress={() => router.push(item.route as any)}>
            <View style={[webLanding.actionIcon, { backgroundColor: item.bg }]}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={webLanding.actionTitle}>{item.title}</Text>
            <Text style={webLanding.actionDesc}>{item.desc}</Text>
            <Text style={[webLanding.actionCta, { color: item.color }]}>{item.cta} →</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
function AiCompanionSection({ onStartChat }: { onStartChat: () => void }) {
  return (
    <View style={[webLanding.band, webLanding.aiBand]}>
      <View style={webLanding.chatMockup}>
        <View style={webLanding.chatBubbleUser}>
          <Text style={webLanding.chatBubbleText}>Hôm nay mình thấy hơi lo lắng vì công việc mới.</Text>
        </View>
        <View style={webLanding.chatBubbleAi}>
          <Text style={webLanding.chatBubbleAiText}>Mình ở đây để lắng nghe. Bạn muốn chia sẻ cụ thể điều gì đang làm bạn nặng lòng không?</Text>
        </View>
        <View style={webLanding.typingRow}>
          <View style={webLanding.typingDot} />
          <View style={webLanding.typingDot} />
          <View style={webLanding.typingDot} />
          <Text style={webLanding.typingText}>SOUL đang phản hồi...</Text>
        </View>
      </View>
      <View style={webLanding.bandCopy}>
        <Text style={webLanding.eyebrow}>Trợ lý tâm trí AI</Text>
        <Text style={webLanding.bandTitle}>Một không gian riêng để bạn được lắng nghe</Text>
        <Text style={webLanding.bandDesc}>SOUL AI giúp bạn gọi tên cảm xúc, gợi ý thở chậm, phản tư và kết nối tới nhật ký hoặc bài test khi cần.</Text>
        <View style={webLanding.benefitList}>
          {["Dữ liệu cá nhân được bảo vệ trong tài khoản", "Đồng cảm, không phán xét", "Gợi ý bước tiếp theo phù hợp"].map((item) => (
            <View key={item} style={webLanding.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#7C3AED" />
              <Text style={webLanding.benefitText}>{item}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={onStartChat}>
          <LinearGradient colors={["#7C3AED", "#5B21B6"]} style={webLanding.ctaButton}>
            <Text style={webLanding.ctaButtonText}>Bắt đầu trò chuyện</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
function DiaryMoodSection() {
  return (
    <View style={webLanding.section}>
      <SectionHeading title="Tần suất cảm xúc cá nhân" desc="Hệ thống theo dõi thông minh giúp bạn nhận ra các mẫu hình cảm xúc và cải thiện thói quen hằng ngày." action="Xem báo cáo chi tiết" />
      <View style={webLanding.diaryGrid}>
        <View style={webLanding.moodCard}>
          <Text style={webLanding.cardTitle}>Tần suất cảm xúc 7 ngày qua</Text>
          <View style={webLanding.bigChart}>
            {moodBars.map((height, index) => (
              <View key={weekDays[index]} style={webLanding.bigChartItem}>
                <View style={[webLanding.bigChartBar, { height: height * 1.45 }]} />
                <Text style={[webLanding.bigChartDay, index === 2 && { color: "#7C3AED", fontWeight: "900" }]}>{weekDays[index]}</Text>
              </View>
            ))}
          </View>
          <View style={webLanding.insightBox}>
            <MaterialCommunityIcons name="star-four-points" size={22} color="#7C3AED" />
            <Text style={webLanding.insightText}>Tuần này bạn có nhiều ghi chú tích cực hơn cuối tuần. Hãy duy trì thói quen viết nhật ký vào buổi sáng.</Text>
          </View>
        </View>
        <View style={webLanding.latestDiary}>
          <View style={webLanding.cardTopRow}>
            <Text style={webLanding.cardTitle}>Nhật ký gần đây</Text>
            <TouchableOpacity onPress={() => router.push("/diary")}><Text style={webLanding.headingAction}>Tất cả</Text></TouchableOpacity>
          </View>
          {["Một buổi sáng thật dịu...", "Công việc dồn dập khiến mình..."].map((entry, index) => (
            <View key={entry} style={webLanding.diaryItem}>
              <Text style={webLanding.diaryTime}>{index === 0 ? "Hôm nay, 10:45" : "Hôm qua, 21:30"}</Text>
              <Text style={webLanding.diaryText}>{entry}</Text>
              <Text style={webLanding.diaryMood}>{index === 0 ? "🙂" : "😌"}</Text>
            </View>
          ))}
          <TouchableOpacity style={webLanding.diaryButton} onPress={() => router.push("/diary")}><Text style={webLanding.diaryButtonText}>Tiếp tục hành trình</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/diary")}>
            <LinearGradient colors={["#7C3AED", "#6D28D9"]} style={webLanding.widePurpleButton}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={webLanding.primaryButtonText}>Viết nhật ký mới</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
function AssessmentSection() {
  return (
    <View style={webLanding.section}>
      <SectionHeading eyebrow="Bài test tự đánh giá" title="Đo lường sức khỏe tinh thần" desc="WHO-5 và PSS-10 giúp bạn tự quan sát trạng thái hiện tại. Kết quả chỉ mang tính tham khảo, không phải chẩn đoán y khoa." />
      <View style={webLanding.assessmentGrid}>
        {assessmentCards.map((item, index) => (
          <TouchableOpacity key={item.title} activeOpacity={0.82} style={[webLanding.assessmentCard, index === 1 && webLanding.assessmentCardFeatured]} onPress={() => router.push("/emotional-test")}>
            <View style={[webLanding.actionIcon, { backgroundColor: index === 1 ? "#F3E8FF" : "#F8FAFC" }]}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={webLanding.actionTitle}>{item.title}</Text>
            <Text style={webLanding.actionDesc}>{item.desc}</Text>
            <View style={webLanding.progressTrack}><View style={[webLanding.progressFill, { width: item.progress as any, backgroundColor: item.color }]} /></View>
            <Text style={webLanding.assessmentMeta}>5–10 phút</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={webLanding.centerPill} onPress={() => router.push("/emotional-test")}><Text style={webLanding.centerPillText}>Tất cả bài test →</Text></TouchableOpacity>
    </View>
  );
}
function EventsAndRatingSection({ onOpenRating }: { onOpenRating: () => void }) {
  return (
    <View style={webLanding.eventsGrid}>
      <View>
        <SectionHeading title="Sự kiện trong SOUL" action="Xem lịch toàn bộ" />
        <View style={webLanding.eventList}>
          {eventCards.map((event) => (
            <TouchableOpacity key={event.title} style={webLanding.eventCard} activeOpacity={0.82} onPress={() => router.push("/user-events")}>
              <LinearGradient colors={["#EDE9FE", "#CCFBF1"]} style={webLanding.eventThumb}><MaterialCommunityIcons name="calendar-heart" size={26} color="#0F766E" /></LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={webLanding.eventMetaRow}><Text style={webLanding.eventStatus}>{event.status}</Text><Text style={webLanding.eventMeta}>{event.meta}</Text></View>
                <Text style={webLanding.eventTitle}>{event.title}</Text>
                <Text style={webLanding.eventRating}>{event.rating}</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#7C3AED" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <LinearGradient colors={["#F3E8FF", "#FFFFFF"]} style={webLanding.ratingCard}>
        <Text style={webLanding.cardTitle}>Đánh giá sự kiện</Text>
        <Text style={webLanding.ratingDesc}>Người dùng đã được xác nhận tham dự có thể gửi rating 1–5 sao và bình luận sau khi sự kiện kết thúc.</Text>
        <View style={webLanding.starRow}>{[1, 2, 3, 4].map((star) => (<MaterialCommunityIcons key={star} name="star" size={38} color="#7C3AED" />))}<MaterialCommunityIcons name="star-outline" size={38} color="#A78BFA" /></View>
        <View style={webLanding.commentBox}><Text style={webLanding.commentPlaceholder}>Bình luận tùy chọn sau khi tham dự...</Text></View>
        <TouchableOpacity activeOpacity={0.85} onPress={onOpenRating}><LinearGradient colors={["#7C3AED", "#6D28D9"]} style={webLanding.widePurpleButton}><Text style={webLanding.primaryButtonText}>Gửi đánh giá sự kiện</Text></LinearGradient></TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
function CommunitySection() {
  return (
    <View style={[webLanding.band, webLanding.communityBand]}>
      <View style={webLanding.bandCopy}>
        <Text style={webLanding.eyebrow}>Cộng đồng an toàn</Text>
        <Text style={webLanding.bandTitle}>Chia sẻ khi bạn cần một nơi tử tế để được nghe</Text>
        <Text style={webLanding.bandDesc}>Forum của SOUL hỗ trợ chia sẻ ẩn danh, bình luận, reaction, báo cáo nội dung và nhắc nhở quy tắc an toàn.</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/(tabs)/forum")}>
          <LinearGradient colors={["#7C3AED", "#A855F7"]} style={webLanding.ctaButton}>
            <Text style={webLanding.ctaButtonText}>Vào cộng đồng</Text>
            <MaterialCommunityIcons name="account-group-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={webLanding.forumMockup}>
        {[["Sarah J.", "Hôm nay mình bắt đầu lại thói quen thiền 5 phút.", "Hopeful"], ["Anonymous", "Có ai từng lo lắng trước deadline không?", "Seeking advice"]].map(([name, text, tag]) => (
          <View key={text} style={webLanding.postCard}>
            <View style={webLanding.postTop}><Text style={webLanding.postAuthor}>{name}</Text><Text style={webLanding.postTag}>{tag}</Text></View>
            <Text style={webLanding.postText}>{text}</Text>
            <Text style={webLanding.postActions}>♡ Support · 💬 Comment · ↗ Share</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
function FinalCta({ onStartChat }: { onStartChat: () => void }) {
  return (
    <LinearGradient colors={["#7C3AED", "#A855F7", "#14B8A6"]} style={webLanding.finalCta}>
      <Text style={webLanding.finalTitle}>Chỉ cần một bước nhỏ hôm nay</Text>
      <Text style={webLanding.finalDesc}>Dù là trò chuyện, viết nhật ký hay tham gia cộng đồng, SOUL luôn ở đây để đồng hành cùng bạn.</Text>
      <View style={webLanding.finalActions}>
        <TouchableOpacity style={webLanding.finalPrimary} onPress={onStartChat}><Text style={webLanding.finalPrimaryText}>Trò chuyện với SOUL AI</Text></TouchableOpacity>
        <TouchableOpacity style={webLanding.finalSecondary} onPress={() => router.push("/diary")}><Text style={webLanding.finalSecondaryText}>Viết nhật ký hôm nay</Text></TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
const webLanding = StyleSheet.create({
  content: {
    paddingBottom: 72,
  },
  page: {
    width: "100%",
    maxWidth: 1360,
    alignSelf: "center",
    paddingHorizontal: 44,
    paddingTop: 24,
    gap: 88,
  },
  hero: {
    minHeight: 620,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 64,
  },
  heroCopy: {
    flex: 1,
    maxWidth: 650,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  badgeText: {
    color: "#7C3AED",
    fontSize: 13,
    fontWeight: "800",
  },
  heroTitle: {
    fontSize: 62,
    lineHeight: 70,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -2,
    marginBottom: 24,
  },
  heroAccent: {
    color: "#7C3AED",
  },
  heroDesc: {
    color: "#64748B",
    fontSize: 17,
    lineHeight: 29,
    maxWidth: 560,
    marginBottom: 26,
  },
  moodLabel: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  moodChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  moodEmoji: {
    fontSize: 20,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  secondaryButton: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  secondaryButtonText: {
    color: "#7C3AED",
    fontWeight: "900",
    fontSize: 14,
  },
  heroVisual: {
    flex: 1,
    minHeight: 380,
    justifyContent: "center",
  },
  visualGlow: {
    minHeight: 360,
    borderRadius: 36,
    padding: 28,
    justifyContent: "center",
  },
  miniChartCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 28,
    padding: 28,
    minHeight: 300,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
  },
  tipBubble: {
    position: "absolute",
    top: 32,
    right: -24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    width: 260,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  aiDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#7C3AED",
    marginTop: 2,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
  },
  tipText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  chartTitle: {
    marginTop: 108,
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
  },
  chartBars: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 22,
    marginTop: 26,
  },
  heroChartItem: {
    alignItems: "center",
    gap: 10,
  },
  heroChartBar: {
    width: 34,
    borderRadius: 17,
    backgroundColor: "#C4B5FD",
  },
  heroChartDay: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },
  section: {
    gap: 28,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 24,
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 14,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  sectionDesc: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 620,
  },
  headingAction: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "900",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
  },
  actionCard: {
    width: "31.8%",
    minHeight: 250,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.035,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 22,
  },
  actionDesc: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
  },
  actionCta: {
    marginTop: 22,
    fontSize: 14,
    fontWeight: "900",
  },
  band: {
    flexDirection: "row",
    alignItems: "center",
    gap: 72,
    borderRadius: 0,
    paddingVertical: 88,
  },
  aiBand: {
    backgroundColor: "#F7F2FF",
    marginHorizontal: -44,
    paddingHorizontal: 44,
  },
  chatMockup: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    minHeight: 270,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
  },
  chatBubbleUser: {
    alignSelf: "flex-start",
    backgroundColor: "#EDE9FE",
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    padding: 16,
    maxWidth: "78%",
    marginBottom: 16,
  },
  chatBubbleText: {
    color: "#4C1D95",
    fontSize: 14,
    lineHeight: 22,
  },
  chatBubbleAi: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    padding: 16,
    maxWidth: "86%",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  chatBubbleAiText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A78BFA",
  },
  typingText: {
    marginLeft: 8,
    color: "#94A3B8",
    fontSize: 13,
  },
  bandCopy: {
    flex: 1,
  },
  bandTitle: {
    color: "#111827",
    fontSize: 34,
    lineHeight: 43,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  bandDesc: {
    color: "#64748B",
    fontSize: 16,
    lineHeight: 27,
    marginTop: 16,
  },
  benefitList: {
    gap: 14,
    marginTop: 24,
    marginBottom: 28,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
  ctaButton: {
    alignSelf: "flex-start",
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  diaryGrid: {
    flexDirection: "row",
    gap: 28,
    alignItems: "stretch",
  },
  moodCard: {
    flex: 1.65,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardTitle: {
    color: "#1E293B",
    fontSize: 17,
    fontWeight: "900",
  },
  bigChart: {
    height: 210,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 30,
    marginTop: 24,
  },
  bigChartItem: {
    alignItems: "center",
    gap: 12,
  },
  bigChartBar: {
    width: 46,
    borderRadius: 22,
    backgroundColor: "#C4B5FD",
  },
  bigChartDay: {
    color: "#94A3B8",
    fontSize: 13,
  },
  insightBox: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    padding: 18,
    marginTop: 24,
  },
  insightText: {
    flex: 1,
    color: "#6D28D9",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  latestDiary: {
    flex: 0.85,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 26,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diaryItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 14,
    position: "relative",
  },
  diaryTime: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  diaryText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    paddingRight: 30,
  },
  diaryMood: {
    position: "absolute",
    top: 18,
    right: 0,
    fontSize: 17,
  },
  diaryButton: {
    backgroundColor: "#EDE9FE",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  diaryButtonText: {
    color: "#7C3AED",
    fontWeight: "900",
  },
  widePurpleButton: {
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  assessmentGrid: {
    flexDirection: "row",
    gap: 22,
  },
  assessmentCard: {
    flex: 1,
    minHeight: 250,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  assessmentCardFeatured: {
    borderColor: "#C4B5FD",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    marginTop: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  assessmentMeta: {
    marginTop: 14,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  centerPill: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 4,
  },
  centerPillText: {
    color: "#7C3AED",
    fontWeight: "900",
  },
  eventsGrid: {
    flexDirection: "row",
    gap: 36,
    alignItems: "stretch",
  },
  eventList: {
    width: 620,
    gap: 18,
    marginTop: 20,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  eventThumb: {
    width: 120,
    height: 86,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  eventMetaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  eventStatus: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#CCFBF1",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventMeta: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  eventTitle: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
  eventRating: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
  },
  ratingCard: {
    flex: 1,
    borderRadius: 30,
    padding: 34,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    justifyContent: "center",
  },
  ratingDesc: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
    marginBottom: 24,
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  commentBox: {
    minHeight: 112,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 18,
    marginBottom: 20,
  },
  commentPlaceholder: {
    color: "#94A3B8",
    fontSize: 14,
  },
  communityBand: {
    backgroundColor: "#FAFAFC",
  },
  forumMockup: {
    flex: 1,
    gap: 16,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  postTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  postAuthor: {
    color: "#1E293B",
    fontWeight: "900",
  },
  postTag: {
    color: "#7C3AED",
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "900",
  },
  postText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 23,
  },
  postActions: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
  },
  finalCta: {
    borderRadius: 36,
    padding: 48,
    alignItems: "center",
    marginBottom: 20,
  },
  finalTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "900",
    textAlign: "center",
  },
  finalDesc: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 620,
    marginTop: 14,
  },
  finalActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 28,
  },
  finalPrimary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  finalPrimaryText: {
    color: "#7C3AED",
    fontWeight: "900",
  },
  finalSecondary: {
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  finalSecondaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});

