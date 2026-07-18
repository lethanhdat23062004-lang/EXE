import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  createDiary,
  deleteDiary,
  getMyDiaries,
  updateDiary,
  DiaryMood,
} from "@/api/diaryApi";

import { diaryStyles as s } from "@/styles/diary.styles";

type MoodOption = {
  value: DiaryMood;
  emoji: string;
  label: string;
  color: string;
};

const moodOptions: MoodOption[] = [
  { value: "happy", emoji: "😊", label: "Happy", color: "#16A34A" },
  { value: "neutral", emoji: "🌱", label: "Neutral", color: "#00866B" },
  { value: "stress", emoji: "😵", label: "Stress", color: "#F59E0B" },
  { value: "anxious", emoji: "😟", label: "Anxious", color: "#7C3AED" },
  { value: "sad", emoji: "😔", label: "Sad", color: "#2563EB" },
  { value: "angry", emoji: "😤", label: "Angry", color: "#DC2626" },
];

const filters = ["all", "happy", "neutral", "stress", "anxious", "sad", "angry"];

function normalizeList(res: any) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.diaries)) return res.diaries;
  return [];
}

function getMoodInfo(mood?: string) {
  return (
    moodOptions.find((item) => item.value === mood) || {
      value: "neutral",
      emoji: "🌱",
      label: "Neutral",
      color: "#00866B",
    }
  );
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskLabel(risk?: string | null) {
  if (risk === "high") return "High risk";
  if (risk === "medium") return "Medium risk";
  if (risk === "low") return "Low risk";
  return "Not analyzed";
}

function getSentimentText(sentiment?: string | null) {
  if (sentiment === "positive") return "Positive";
  if (sentiment === "negative") return "Negative";
  if (sentiment === "neutral") return "Neutral";
  return "Waiting";
}

export default function DiaryScreen() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === "web" && width >= 900;

  const [token, setToken] = useState<string | null>(null);

  const [diaries, setDiaries] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDiary, setEditingDiary] = useState<any | null>(null);

  const [mood, setMood] = useState<DiaryMood>("neutral");
  const [moodScore, setMoodScore] = useState(5);
  const [note, setNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const requireLogin = () => {
    if (!token) {
      Alert.alert("Bạn cần đăng nhập", "Vui lòng đăng nhập để dùng nhật ký.");
      return false;
    }

    return true;
  };

  const loadDiaries = async (currentToken: string | null = token) => {
    if (!currentToken) return;

    const res = await getMyDiaries(currentToken, {
      page: 1,
      limit: 30,
      mood: filter === "all" ? undefined : filter,
    });

    setDiaries(normalizeList(res));
  };

  const init = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      setToken(savedToken);

      if (savedToken) {
        const res = await getMyDiaries(savedToken, {
          page: 1,
          limit: 30,
        });

        setDiaries(normalizeList(res));
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không tải được nhật ký.");
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (token) {
      loadDiaries(token).catch(() => {});
    }
  }, [filter]);

  const visibleDiaries = useMemo(() => diaries, [diaries]);

  const resetForm = () => {
    setEditingDiary(null);
    setMood("neutral");
    setMoodScore(5);
    setNote("");
    setIsPrivate(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (diary: any) => {
    setEditingDiary(diary);
    setMood(diary?.mood || "neutral");
    setMoodScore(Number(diary?.moodScore) || 5);
    setNote(diary?.note || "");
    setIsPrivate(diary?.isPrivate !== false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSaveDiary = async () => {
    if (!requireLogin()) return;

    if (!note.trim()) {
      Alert.alert("Thiếu nội dung", "Bạn hãy viết vài dòng nhật ký trước nha.");
      return;
    }

    try {
      const body = {
        mood,
        moodScore,
        note: note.trim(),
        isPrivate,
      };

      const res = editingDiary
        ? await updateDiary(token as string, editingDiary._id, body)
        : await createDiary(token as string, body);

      const analysisWarning = res?.analysisWarning;

      await loadDiaries(token);

      closeModal();

      Alert.alert(
        editingDiary ? "Đã cập nhật nhật ký" : "Đã lưu nhật ký 🌿",
        analysisWarning
          ? "Nhật ký đã được lưu. AI insight chưa phân tích được, hệ thống sẽ dùng lại sau."
          : "SOUL đã lưu nhật ký và phân tích cảm xúc cho bạn."
      );
    } catch (error: any) {
      Alert.alert("Không thể lưu nhật ký", error?.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleDeleteDiary = async (diaryId: string) => {
    if (!requireLogin()) return;

    const deleteNow = async () => {
      try {
        await deleteDiary(token as string, diaryId);

        setDiaries((prev) =>
          prev.filter((item) => {
            const id = item?._id?.toString?.() || item?._id;
            return id !== diaryId;
          })
        );

        Alert.alert("Đã xóa", "Nhật ký đã được xóa thành công.");
      } catch (error: any) {
        Alert.alert("Không thể xóa", error?.message || "Đã có lỗi xảy ra.");
      }
    };

    Alert.alert("Xóa nhật ký", "Bạn có chắc muốn xóa nhật ký này không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: deleteNow,
      },
    ]);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDiaries(token);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể làm mới dữ liệu.");
    } finally {
      setRefreshing(false);
    }
  };

  const renderDiary = ({ item }: { item: any }) => {
    const moodInfo = getMoodInfo(item?.mood);
    const insight = item?.aiInsight || {};
    const risk = insight?.riskLevel;

    return (
      <View style={s.diaryCard}>
        <View style={s.diaryTop}>
          <View style={s.moodCircle}>
            <Text style={s.moodCircleText}>{moodInfo.emoji}</Text>
          </View>

          <View style={s.diaryHeaderInfo}>
            <View style={s.diaryTitleRow}>
              <Text style={s.diaryMood}>{moodInfo.label}</Text>

              <View style={s.privateBadge}>
                <MaterialCommunityIcons
                  name={item?.isPrivate ? "lock-outline" : "earth"}
                  size={13}
                  color="#00866B"
                />
                <Text style={s.privateBadgeText}>
                  {item?.isPrivate ? "Private" : "Public"}
                </Text>
              </View>
            </View>

            <Text style={s.diaryDate}>
              {formatDate(item?.createdAt)} • {formatTime(item?.createdAt)}
            </Text>
          </View>

          <View style={s.diaryActions}>
            <Pressable style={s.smallIconButton} onPress={() => openEditModal(item)}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color="#00866B"
              />
            </Pressable>

            <Pressable
              style={[s.smallIconButton, s.deleteIconButton]}
              onPress={() => handleDeleteDiary(item?._id)}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color="#EF4444"
              />
            </Pressable>
          </View>
        </View>

        <View style={s.scoreRow}>
          <Text style={s.scoreLabel}>Mood score</Text>

          <View style={s.scoreBar}>
            <View
              style={[
                s.scoreBarFill,
                {
                  width: `${Math.min(Math.max(item?.moodScore || 1, 1), 10) * 10}%`,
                  backgroundColor: moodInfo.color,
                },
              ]}
            />
          </View>

          <Text style={s.scoreValue}>{item?.moodScore || 0}/10</Text>
        </View>

        {item?.note ? <Text style={s.diaryNote}>{item.note}</Text> : null}

        <View
          style={[
            s.aiInsightBox,
            risk === "high" && s.aiInsightHigh,
            risk === "medium" && s.aiInsightMedium,
          ]}
        >
          <View style={s.aiInsightHeader}>
            <MaterialCommunityIcons
              name={
                risk === "high"
                  ? ("alert-circle-outline" as any)
                  : ("sparkles" as any)
              }
              size={18}
              color={risk === "high" ? "#DC2626" : "#00866B"}
            />

            <Text
              style={[
                s.aiInsightTitle,
                risk === "high" && s.aiInsightTitleHigh,
              ]}
            >
              AI Emotional Insight
            </Text>

            <View
              style={[
                s.riskBadge,
                risk === "high" && s.riskBadgeHigh,
                risk === "medium" && s.riskBadgeMedium,
              ]}
            >
              <Text
                style={[
                  s.riskBadgeText,
                  risk === "high" && s.riskBadgeTextHigh,
                ]}
              >
                {getRiskLabel(risk)}
              </Text>
            </View>
          </View>

          <View style={s.insightMetaRow}>
            <Text style={s.insightMeta}>
              Sentiment: {getSentimentText(insight?.sentiment)}
            </Text>

            {typeof insight?.emotionScore === "number" ? (
              <Text style={s.insightMeta}>Score: {insight.emotionScore}/100</Text>
            ) : null}
          </View>

          {insight?.summary ? (
            <Text style={s.insightText}>{insight.summary}</Text>
          ) : (
            <Text style={s.insightText}>
              AI insight is waiting for analysis.
            </Text>
          )}

          {insight?.suggestion ? (
            <Text style={s.suggestionText}>💡 {insight.suggestion}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={s.page}>
    <LinearGradient
        colors={["#7C3AED", "#6366F1", "#14B8A6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header]}
      >
        <View style={s.headerTop}>
          <Pressable style={[s.backButton, { backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }]} onPress={() => router.replace("/(tabs)" as any)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable style={s.addButton} onPress={openCreateModal}>
            <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={[s.title, { color: "#FFFFFF" }]}>Emotional Diary</Text>
        <Text style={[s.subtitle, { color: "rgba(255,255,255,0.85)" }]}>
          Write your feelings privately and let SOUL help you understand your mood.
        </Text>

        <View style={[s.todayCard, { borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <View>
            <Text style={[s.todayLabel, { color: "rgba(255,255,255,0.75)" }]}>Today check-in</Text>
            <Text style={[s.todayTitle, { color: "#FFFFFF" }]}>How is your heart feeling?</Text>
          </View>

          <Text style={s.todayEmoji}>🌿</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {filters.map((item) => {
            const active = item === filter;
            const info = getMoodInfo(item);

            return (
              <Pressable
                key={item}
                style={[
                  s.filterChip,
                  {
                    backgroundColor: active ? "#FFFFFF" : "rgba(255,255,255,0.18)",
                    borderColor: active ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                  },
                ]}
                onPress={() => setFilter(item)}
              >
                <Text style={[s.filterText, { color: active ? "#7C3AED" : "rgba(255,255,255,0.9)" }]}>
                  {item === "all" ? "✦ All" : `${info.emoji} ${info.label}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      <FlatList
        key={isWebDesktop ? "diary-web-grid" : "diary-list"}
        data={visibleDiaries}
        keyExtractor={(item) => item._id}
        renderItem={renderDiary}
        numColumns={isWebDesktop ? 2 : 1}
        columnWrapperStyle={isWebDesktop ? s.webColumnWrapper : undefined}
        contentContainerStyle={[s.list, isWebDesktop && s.webList]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📔</Text>
            <Text style={s.emptyTitle}>No diary yet</Text>
            <Text style={s.emptyText}>
              Start with one small sentence about how you feel today.
            </Text>

            <Pressable style={s.emptyButton} onPress={openCreateModal}>
              <Text style={s.emptyButtonText}>Write Diary</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.modalBox}>
            <View style={s.modalHandle} />

            <Pressable style={s.closeButton} onPress={closeModal}>
              <MaterialCommunityIcons name="close" size={28} color="#1F332F" />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>
                {editingDiary ? "Edit Diary" : "New Diary"}
              </Text>

              <Text style={s.modalSub}>
                Your diary is private by default. Write honestly and gently.
              </Text>

              <Text style={s.sectionLabel}>Choose your mood</Text>

              <View style={s.moodGrid}>
                {moodOptions.map((item) => {
                  const active = mood === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      style={[
                        s.moodOption,
                        active && {
                          borderColor: item.color,
                          backgroundColor: "#F0FBF7",
                        },
                      ]}
                      onPress={() => setMood(item.value)}
                    >
                      <Text style={s.moodEmoji}>{item.emoji}</Text>
                      <Text style={s.moodText}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.sectionLabel}>Mood score: {moodScore}/10</Text>

              <View style={s.scorePicker}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const active = moodScore === num;

                  return (
                    <Pressable
                      key={num}
                      style={[s.scoreDot, active && s.scoreDotActive]}
                      onPress={() => setMoodScore(num)}
                    >
                      <Text
                        style={[
                          s.scoreDotText,
                          active && s.scoreDotTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.sectionLabel}>Your note</Text>

              <View style={s.noteInputBox}>
                <TextInput
                  style={s.noteInput}
                  multiline
                  placeholder="Write what happened, how you felt, or what you need today..."
                  placeholderTextColor="#8A9996"
                  value={note}
                  onChangeText={setNote}
                  maxLength={2000}
                />

                <Text style={s.counter}>{note.length}/2000</Text>
              </View>

              <View style={s.privateRow}>
                <View style={s.privateLeft}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={22}
                    color="#00866B"
                  />

                  <View>
                    <Text style={s.privateTitle}>Private diary</Text>
                    <Text style={s.privateSub}>
                      Only you can view this diary entry.
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ false: "#CBD5E1", true: "#7C3AED" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Gradient Save button */}
              <Pressable style={{ borderRadius: 18, overflow: "hidden", marginTop: 20 }} onPress={handleSaveDiary}>
                <LinearGradient
                  colors={["#7C3AED", "#14B8A6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.saveButton, { marginTop: 0 }]}
                >
                  <MaterialCommunityIcons
                    name={editingDiary ? "content-save-outline" : "book-plus-outline"}
                    size={23}
                    color="#FFFFFF"
                  />
                  <Text style={s.saveButtonText}>
                    {editingDiary ? "Save Changes" : "Save Diary ✨"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={closeModal}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
