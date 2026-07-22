import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/constants/colors";
import { TestType } from "../../api/emotionalTestApi";
import TestOptionCard from "../../components/emotional-test/TestOptionCard";

type Props = {
  navigation?: any;
};

const moodOptions = [
  { icon: "😄", label: "Great" },
  { icon: "🙂", label: "Good" },
  { icon: "😐", label: "Okay" },
  { icon: "😟", label: "Bad" },
  { icon: "😣", label: "Awful" },
];

export default function EmotionalTestMainScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === "web" && width >= 900;

  const goToAssessment = (testType: TestType) => {
    router.push({
      pathname: "/emotional-test/assessment" as any,
      params: { testType },
    });
  };

  return (
    <LinearGradient colors={["#F8F5FF", "#FFFFFF", "#F0FDFA"]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <LinearGradient
          colors={["#7C3AED", "#6366F1", "#14B8A6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerShell}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.replace("/(tabs)" as any)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Mental Clarity Center</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Bài test ngắn giúp bạn hiểu rõ hơn trạng thái cảm xúc hiện tại.
              </Text>
            </View>

            <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
              <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.heroGrid, !isWebDesktop && styles.heroGridMobile]}>
            {/* Restyled as a solid purple hero card */}
            <View style={styles.heroCopy}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>KHOA HỌC TÂM LÝ</Text>
              </View>
              
              <Text style={[styles.heroTitle, { color: "#FFFFFF" }]}>
                Hiểu cảm xúc của bạn bằng các bài test chuẩn hóa.
              </Text>
              
              <Text style={[styles.heroDescription, { color: "#E8FFFA" }]}>
                Làm bài nhanh, xem kết quả trực quan và nhận gợi ý phù hợp từ SOUL AI.
              </Text>

              <TouchableOpacity
                style={[styles.heroButton, { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 8 }]}
                onPress={() => goToAssessment("WHO5")}
                activeOpacity={0.88}
              >
                <Text style={[styles.heroButtonText, { color: colors.dark }]}>Bắt đầu bài gợi ý</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.checkInCard}>
              <View>
                <Text style={styles.checkTitle}>Daily check-in</Text>
                <Text style={styles.checkSub}>Bạn đang cảm thấy thế nào?</Text>
              </View>

              <View style={styles.moodRow}>
                {moodOptions.map((item) => (
                  <View key={item.label} style={styles.moodItem}>
                    <Text style={styles.moodIcon}>{item.icon}</Text>
                    <Text style={styles.moodLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.resultPreview}>
                <Text style={styles.resultLabel}>Latest Result</Text>
                <Text style={styles.resultScore}>12</Text>
                <Text style={styles.resultText}>Moderate Risk</Text>
                <View style={styles.resultBar}>
                  <View style={styles.resultBarFill} />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.featureCard, !isWebDesktop && styles.featureCardMobile]}>
            <View style={styles.featureLeft}>
              <Text style={styles.featureKicker}>Recommended for You</Text>
              <Text style={styles.featureTitle}>WHO-5 Well-being Check</Text>
              <Text style={styles.featureDescription}>
                Đánh giá nhanh mức độ well-being và trạng thái cảm xúc gần đây.
              </Text>

              <View style={styles.featureInfoRow}>
                <Text style={styles.featureInfo}>⏱ 5–7 phút</Text>
                <Text style={styles.featureInfo}>✓ 5 câu hỏi</Text>
              </View>
            </View>

            <View style={styles.featureRight}>
              <Text style={styles.featureIllustration}>💜</Text>
              <TouchableOpacity
                style={[styles.featureButton, { backgroundColor: "#7C3AED" }]}
                onPress={() => goToAssessment("WHO5")}
                activeOpacity={0.85}
              >
                <Text style={styles.featureButtonText}>Start Test</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Assessments</Text>

            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" style={{ marginRight: 6 }} />
              <TextInput
                placeholder="Search test, topic, keyword..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
              <MaterialCommunityIcons name="filter-variant" size={22} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <View style={styles.testGrid}>
            <View style={[styles.testCardWrap, isWebDesktop && styles.testCardWrapWeb]}>
              <TestOptionCard
                icon="🌿"
                title="WHO-5 Well-being Check"
                description="Đánh giá nhanh mức độ well-being và trạng thái cảm xúc gần đây."
                duration="5-7m"
                onPress={() => goToAssessment("WHO5")}
              />
            </View>

            <View style={[styles.testCardWrap, isWebDesktop && styles.testCardWrapWeb]}>
              <TestOptionCard
                icon="📘"
                title="PSS-10 Student Stress Check"
                description="Tự nhìn lại mức độ căng thẳng trong học tập và cuộc sống."
                duration="5-10m"
                onPress={() => goToAssessment("PSS10")}
              />
            </View>

            <View style={[styles.testCardWrap, isWebDesktop && styles.testCardWrapWeb]}>
              <TestOptionCard
                icon="☁️"
                title="Anxiety Reflection"
                description="Tự nhìn lại các dấu hiệu lo lắng và căng thẳng cảm xúc."
                duration="3-4m"
                disabled
              />
            </View>

            <View style={[styles.testCardWrap, isWebDesktop && styles.testCardWrapWeb]}>
              <TestOptionCard
                icon="🔥"
                title="Burnout Reflection"
                description="Nhận diện dấu hiệu kiệt sức học tập và mệt mỏi kéo dài."
                duration="5-10m"
                disabled
              />
            </View>
          </View>

          <View style={{ height: 72 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const webShadow = Platform.select({
  web: { boxShadow: "0 18px 48px rgba(88, 28, 135, 0.10)" },
  ios: { shadowColor: "#7C3AED", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerShell: {
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: "Georgia",
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  heroGrid: {
    minHeight: 286,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 28,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 24,
    ...webShadow,
  },
  heroGridMobile: {
    flexDirection: "column",
    padding: 20,
    borderRadius: 28,
  },
  heroCopy: {
    flex: 1.35,
    backgroundColor: "#7C3AED",
    borderRadius: 24,
    padding: 24,
    justifyContent: "space-between",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 10,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "web" ? 36 : 24,
    lineHeight: Platform.OS === "web" ? 44 : 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 12,
    maxWidth: 620,
  },
  heroDescription: {
    color: "#E8FFFA",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 560,
  },
  heroButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "900",
  },
  checkInCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  checkTitle: {
    fontWeight: "900",
    color: "#1D1B38",
    fontSize: 16,
  },
  checkSub: {
    fontSize: 13,
    color: "#7C3AED",
    marginTop: 4,
    fontWeight: "700",
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 18,
  },
  moodItem: {
    alignItems: "center",
    backgroundColor: "#F8F5FF",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  moodIcon: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
    fontWeight: "700",
  },
  resultPreview: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
  },
  resultLabel: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "900",
  },
  resultScore: {
    color: "#7C3AED",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },
  resultText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "800",
  },
  resultBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    marginTop: 12,
    overflow: "hidden",
  },
  resultBarFill: {
    width: "62%",
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 999,
  },
  featureCard: {
    marginTop: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    flexDirection: "row",
    minHeight: 156,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...webShadow,
  },
  featureCardMobile: {
    flexDirection: "column",
    gap: 18,
  },
  featureLeft: {
    flex: 1,
  },
  featureKicker: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 10,
  },
  featureTitle: {
    color: "#1D1B38",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  featureDescription: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 560,
  },
  featureInfoRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    flexWrap: "wrap",
  },
  featureInfo: {
    color: "#1D1B38",
    fontSize: 13,
    fontWeight: "800",
    backgroundColor: "#F8F5FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  featureRight: {
    width: Platform.OS === "web" ? 180 : "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  featureIllustration: {
    fontSize: 58,
  },
  featureButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 22,
    paddingHorizontal: 28,
    paddingVertical: 11,
  },
  featureButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#262346",
    marginRight: "auto",
  },
  searchBox: {
    minWidth: Platform.OS === "web" ? 320 : 0,
    flex: Platform.OS === "web" ? 0 : 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  searchInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 13,
    outlineStyle: "none" as any,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  filterText: {
    color: "#7C3AED",
    fontSize: 18,
  },
  testGrid: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    flexWrap: "wrap",
    gap: 16,
  },
  testCardWrap: {
    width: "100%",
  },
  testCardWrapWeb: {
    flexBasis: "48%",
    flexGrow: 1,
  },
});
