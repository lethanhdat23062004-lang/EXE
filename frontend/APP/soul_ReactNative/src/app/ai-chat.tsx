import {
  ChatMessage,
  ChatSession,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  sendMessageToSession,
} from "@/services/aiApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import UpgradeModal from "@/components/upgrade/UpgradeModal";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type UIMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  riskLevel?: string;
  emotion?: string;
};

const welcomeMessage: UIMessage = {
  id: "welcome",
  role: "ai",
  text: "Take a deep breath. You don't have to carry everything alone.",
};

export default function AIChatScreen() {
  const { width } = useWindowDimensions();
  const isWebWide = width >= 900;

  const chatCardWidth = isWebWide
    ? Math.min(width - (historyOpenWidthPlaceholder(width) ? 520 : 180), 1180)
    : "100%";

  const listRef = useRef<FlatList<UIMessage>>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([welcomeMessage]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const finalChatCardWidth = isWebWide
    ? Math.min(width - (historyOpen ? 520 : 180), 1180)
    : "100%";

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const convertMessage = (msg: ChatMessage): UIMessage => ({
    id: msg._id,
    role: msg.role === "assistant" ? "ai" : "user",
    text: msg.content,
    riskLevel: msg.riskLevel,
    emotion: msg.emotion,
  });

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);

      const data = await getChatSessions();
      setSessions(data);

      if (data.length > 0) {
        await openSession(data[0]);
      }
    } catch (error) {
      console.log("Load sessions error:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const openSession = async (session: ChatSession) => {
    try {
      setCurrentSession(session);

      const data = await getChatMessages(session._id);

      if (data.length === 0) {
        setMessages([welcomeMessage]);
      } else {
        setMessages(data.map(convertMessage));
      }

      if (!isWebWide) {
        setHistoryOpen(false);
      }
    } catch (error) {
      console.log("Open session error:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      const session = await createChatSession();

      setSessions((prev) => [session, ...prev]);
      setCurrentSession(session);
      setMessages([welcomeMessage]);

      if (!isWebWide) {
        setHistoryOpen(false);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo đoạn chat mới.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert("Xóa đoạn chat", "Bạn có chắc muốn xóa đoạn chat này không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteChatSession(sessionId);

            const newSessions = sessions.filter((item) => item._id !== sessionId);
            setSessions(newSessions);

            if (currentSession?._id === sessionId) {
              if (newSessions.length > 0) {
                await openSession(newSessions[0]);
              } else {
                setCurrentSession(null);
                setMessages([welcomeMessage]);
              }
            }
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa đoạn chat.");
          }
        },
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    let session = currentSession;

    try {
      if (!session) {
        session = await createChatSession();
        setCurrentSession(session);
        setSessions((prev) => [session!, ...prev]);
      }

      const userMessage: UIMessage = {
        id: Date.now().toString(),
        role: "user",
        text: userText,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      const result = await sendMessageToSession(session._id, userText);

      const aiMessage: UIMessage = {
        id: result.assistantMessage._id,
        role: "ai",
        text: result.assistantMessage.content,
        riskLevel: result.assistantMessage.riskLevel,
        emotion: result.assistantMessage.emotion,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setCurrentSession(result.session);

      setSessions((prev) => {
        const filtered = prev.filter((item) => item._id !== result.session._id);
        return [result.session, ...filtered];
      });
    } catch (error: any) {
      if (error.message === "UPGRADE_REQUIRED") {
        // Hoàn tác tin nhắn của user vì không gửi được
        setMessages((prev) => prev.slice(0, -1));
        setShowUpgradeModal(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-error",
            role: "ai",
            text: "Mình chưa kết nối được với AI server. Bạn kiểm tra lại backend, token đăng nhập hoặc API URL nhé.",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryPanel = () => (
    <View style={[styles.historyPanel, !isWebWide && styles.historyPanelMobile]}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Chat History</Text>

        <TouchableOpacity
          style={styles.closeHistoryButton}
          onPress={() => setHistoryOpen(false)}
        >
          <MaterialCommunityIcons name="close" size={22} color="#5B4B8A" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      {loadingSessions ? (
        <ActivityIndicator color="#8E77F8" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {sessions.map((item) => {
            const active = currentSession?._id === item._id;

            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.sessionItem, active && styles.sessionItemActive]}
                onPress={() => openSession(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.sessionTitle, active && styles.sessionTitleActive]}
                  >
                    {item.title || "New Chat"}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.sessionLastMessage,
                      active && styles.sessionLastMessageActive,
                    ]}
                  >
                    {item.lastMessage || "Chưa có tin nhắn"}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => handleDeleteSession(item._id)}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={active ? "#FFFFFF" : "#8A79B8"}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderMessage = ({ item }: { item: UIMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userText]}>
          {item.text}
        </Text>

        {!isUser && item.riskLevel && item.riskLevel !== "low" && (
          <Text style={styles.riskText}>
            Risk: {item.riskLevel} · Emotion: {item.emotion}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#EEF4FF", "#EFE6FF", "#F8ECFF"]}
      style={styles.root}
    >
      <View style={styles.webShell}>
        <View style={styles.leftRail}>
          <TouchableOpacity style={styles.railButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#4E3D86" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.railButton}
            onPress={() => setHistoryOpen((prev) => !prev)}
          >
            <MaterialCommunityIcons name="menu" size={30} color="#4E3D86" />
          </TouchableOpacity>
        </View>

        {historyOpen && renderHistoryPanel()}

        {!isWebWide && historyOpen && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.overlay}
            onPress={() => setHistoryOpen(false)}
          />
        )}

        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.chatCard, { width: finalChatCardWidth }]}>
            <Text style={styles.screenTitle}>Chatbot</Text>

            <View style={styles.heroCard}>
              <View style={styles.glowLeft} />
              <View style={styles.glowRight} />

              <View style={styles.robotWrap}>
                <LinearGradient
                  colors={["#F7F2FF", "#D9CCFF"]}
                  style={styles.robotCircle}
                >
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    size={94}
                    color="#4D408C"
                  />
                </LinearGradient>

                <View style={styles.phoneIcon}>
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={34}
                    color="#8874FF"
                  />

                  <View style={styles.heartDot}>
                    <MaterialCommunityIcons
                      name="heart"
                      size={10}
                      color="#EC6EA6"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.voiceRow}>
                <View style={styles.micCircle}>
                  <MaterialCommunityIcons
                    name="microphone"
                    size={28}
                    color="#29218B"
                  />
                </View>

                <View style={styles.waveWrap}>
                  {Array.from({ length: 34 }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.waveBar,
                        {
                          height: 7 + ((index * 9) % 22),
                          opacity: index % 3 === 0 ? 0.55 : 1,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                loading ? (
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <View style={styles.loadingInsideBubble}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loadingText}>SOUL AI đang trả lời...</Text>
                    </View>
                  </View>
                ) : null
              }
            />

            <View style={styles.inputBar}>
              <TouchableOpacity style={styles.smallIconButton} onPress={handleNewChat}>
                <MaterialCommunityIcons name="plus" size={20} color="#B48BFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.smallIconButton}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={18}
                  color="#B48BFF"
                />
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Enter your message"
                placeholderTextColor="#B9AEE3"
                style={styles.input}
                multiline
                onSubmitEditing={handleSend}
              />

              <TouchableOpacity
                style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="send-outline"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false);
          Alert.alert("Thành công", "Bạn đã nâng cấp Premium! Hãy tiếp tục cuộc trò chuyện.");
        }}
      />
    </LinearGradient>
  );
}

function historyOpenWidthPlaceholder(width: number) {
  return width < 0;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  webShell: {
    flex: 1,
    flexDirection: "row",
  },

  leftRail: {
    width: 88,
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRightWidth: 1,
    borderRightColor: "rgba(170,145,255,0.35)",
    alignItems: "center",
    paddingTop: 36,
    gap: 20,
    zIndex: 70,
  },

  railButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7A65CC",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },

  historyPanel: {
    width: 340,
    backgroundColor: "#F8F5FF",
    borderRightWidth: 1,
    borderRightColor: "#E0D5FF",
    paddingTop: 36,
    paddingHorizontal: 18,
    zIndex: 80,
    shadowColor: "#7A65CC",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },

  historyPanelMobile: {
    position: "absolute",
    left: 88,
    top: 0,
    bottom: 0,
  },

  overlay: {
    position: "absolute",
    left: 88,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(38, 27, 75, 0.25)",
    zIndex: 75,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  historyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#443473",
  },

  closeHistoryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
  },

  newChatButton: {
    height: 48,
    borderRadius: 18,
    backgroundColor: "#8E77F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },

  newChatText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8FF",
  },

  sessionItemActive: {
    backgroundColor: "#9A82FF",
    borderColor: "#9A82FF",
  },

  sessionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3D315E",
  },

  sessionTitleActive: {
    color: "#FFFFFF",
  },

  sessionLastMessage: {
    fontSize: 12,
    color: "#8A79B8",
    marginTop: 4,
  },

  sessionLastMessageActive: {
    color: "#EFEAFF",
  },

  chatArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingVertical: 24,
  },

  chatCard: {
    height: "100%",
    maxHeight: 900,
    minHeight: 680,
    backgroundColor: "#EFE8FF",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#7A65CC",
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 10,
  },

  screenTitle: {
    position: "absolute",
    top: 14,
    left: 24,
    zIndex: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#1B1833",
    opacity: 0.85,
  },

  heroCard: {
    height: 285,
    backgroundColor: "#F7F5FF",
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingTop: 24,
  },

  glowLeft: {
    position: "absolute",
    top: 42,
    left: 46,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    opacity: 0.75,
    shadowColor: "#FFFFFF",
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },

  glowRight: {
    position: "absolute",
    top: 38,
    right: 46,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    opacity: 0.75,
    shadowColor: "#FFFFFF",
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },

  robotWrap: {
    width: 180,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },

  robotCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8A72FF",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },

  phoneIcon: {
    position: "absolute",
    right: 0,
    top: 34,
    width: 44,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-22deg" }],
    shadowColor: "#8A72FF",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },

  heartDot: {
    position: "absolute",
    bottom: 8,
    right: 9,
  },

  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  micCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: "#29218B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  waveWrap: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  waveBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: "#29218B",
  },

  chatContent: {
    flexGrow: 1,
    paddingTop: 34,
    paddingHorizontal: 56,
    paddingBottom: 28,
    gap: 14,
  },

  messageBubble: {
    maxWidth: "68%",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },

  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#927CFF",
    borderBottomLeftRadius: 6,
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#E877AA",
    borderBottomRightRadius: 6,
    marginVertical: 12,
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  userText: {
    color: "#FFFFFF",
    textAlign: "right",
  },

  riskText: {
    marginTop: 8,
    fontSize: 10,
    color: "#FFF4C7",
    fontWeight: "700",
  },

  loadingInsideBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  inputBar: {
    minHeight: 66,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  smallIconButton: {
    width: 26,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3,
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    borderRadius: 24,
    backgroundColor: "#F1EBFF",
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 11 : 8,
    color: "#4A3F72",
    fontSize: 14,
    marginHorizontal: 10,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#C7A0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    opacity: 0.55,
  },
});