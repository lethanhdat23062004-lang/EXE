import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/store";
import { WebView } from "react-native-webview";
import { API_BASE_URL } from "@/api/config";
import { colors } from "@/constants/colors";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

// ── Stat card used on the brand panel ───────────────────────────────────────
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");

  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState("");

  const loginAction = useAuthStore((state) => state.login);
  const setSession = useAuthStore((state) => state.setSession);

  const validateEmail = (v: string) => {
    if (!v.trim()) setEmailError("Please enter your email");
    else if (!emailRegex.test(v)) setEmailError("Invalid email address");
    else setEmailError("");
  };

  const validatePassword = (v: string) => {
    if (!v) setPasswordError("Please enter your password");
    else setPasswordError("");
  };

  const handleEmailChange = (v: string) => { setEmail(v); setServerError(""); validateEmail(v); };
  const handlePasswordChange = (v: string) => { setPassword(v); setServerError(""); validatePassword(v); };

  const handleLogin = async () => {
    validateEmail(email);
    validatePassword(password);
    if (!email.trim() || !emailRegex.test(email) || !password) return;

    setServerError("");
    setLoading(true);
    const result = await loginAction(email, password);
    setLoading(false);

    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    } else {
      setServerError(result.message || "Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    const authUrl = `${API_BASE_URL}/auth/google`;
    setGoogleAuthUrl(authUrl);
    setShowGoogleAuth(true);
  };

  const handleGoogleNavigation = async (navState: any) => {
    const urlStr = navState.url;
    const hasToken = urlStr.includes("token=");
    if (hasToken) {
      setShowGoogleAuth(false);
      try {
        const tokenMatch = urlStr.match(/token=([^&]+)/);
        const userMatch = urlStr.match(/user=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const token = tokenMatch[1];
          const userJsonEncoded = userMatch ? userMatch[1] : "";
          if (userJsonEncoded) {
            const userObj = JSON.parse(decodeURIComponent(userJsonEncoded));
            setSession(token, userObj);
            router.replace(userObj.role === "admin" ? "/(admin)" : "/(tabs)");
          }
        }
      } catch (error: any) {
        Alert.alert("Login Error", error.message);
      }
    } else if (urlStr.includes("error=")) {
      setShowGoogleAuth(false);
      Alert.alert("Login Failed", "Google access was denied.");
    }
  };

  // ── Return ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.root}
    >
      <View style={[s.container, isWeb && s.containerWeb]}>
        
        {/* ── Brand Panel (left on web, top on mobile) ─────────────────── */}
        <LinearGradient
          colors={["#7C3AED", "#6D28D9", "#5B21B6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.brandPanel, isWeb ? s.brandPanelWeb : s.brandPanelMobile]}
        >
          {/* Decorative circles */}
          <View style={[s.blob, { top: -60, right: -60, width: 220, height: 220, borderRadius: 110 }]} />
          <View style={[s.blob, { bottom: -40, left: -40, width: 180, height: 180, borderRadius: 90 }]} />
          <View style={[s.blob, { top: "40%", right: -30, width: 120, height: 120, borderRadius: 60, opacity: 0.15 }]} />

          <View style={s.brandContent}>
            {/* Logo */}
            <View style={s.logoRow}>
              <MaterialCommunityIcons name="leaf" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={s.logoText}>SOUL</Text>
            </View>

            {/* Headline */}
            <Text style={[s.headline, isWeb ? s.headlineWeb : s.headlineMobile]}>
              Nurture your{"\n"}inner peace.
            </Text>

            <Text style={s.subHeadline}>
              Join over 2 million users finding balance and mental clarity through science-backed wellness practices.
            </Text>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatCard value="98%" label="STRESS REDUCTION" />
              <StatCard value="2M+" label="HAPPY SOULS" />
            </View>
          </View>
        </LinearGradient>

        {/* ── Form Panel (right on web, bottom on mobile) ─────────────────── */}
        <View style={[s.formPanel, isWeb ? s.formPanelWeb : s.formPanelMobile]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.formScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.formTitle}>Welcome Back</Text>
            <Text style={s.formSubtitle}>Sign in to continue your wellness journey.</Text>

            {/* Server Error */}
            {serverError ? (
              <View style={s.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={s.errorBoxText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={s.fieldLabel}>Email Address</Text>
            <View style={[s.inputWrap, emailError ? s.inputWrapError : null]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={emailError ? colors.error : "#94A3B8"} style={s.inputIcon} />
              <TextInput
                placeholder="name@example.com"
                placeholderTextColor="#B0BEC5"
                style={s.input}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? <Text style={s.fieldError}>{emailError}</Text> : null}

            {/* Password row header */}
            <View style={s.passwordHeader}>
              <Text style={s.fieldLabel}>Password</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/forgot")}>
                <Text style={s.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.inputWrap, passwordError ? s.inputWrapError : null]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={passwordError ? colors.error : "#94A3B8"} style={s.inputIcon} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#B0BEC5"
                secureTextEntry={secureText}
                style={s.input}
                value={password}
                onChangeText={handlePasswordChange}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={s.eyeBtn}>
                <MaterialCommunityIcons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={s.fieldError}>{passwordError}</Text> : null}

            {/* Remember me */}
            <TouchableOpacity style={s.checkRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
              <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                {rememberMe && <MaterialCommunityIcons name="check" size={13} color="#FFF" />}
              </View>
              <Text style={s.checkLabel}>Remember this device</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={s.signInBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={["#7C3AED", "#6D28D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.signInGradient}
              >
                {loading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={s.signInText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR CONTINUE WITH</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={handleGoogleLogin} activeOpacity={0.8}>
                <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                <Text style={s.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
                <MaterialCommunityIcons name="facebook" size={20} color="#1877F2" />
                <Text style={s.socialBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View style={s.bottomLink}>
              <Text style={s.bottomLinkText}>New to SOUL? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={s.bottomLinkAction}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Google WebView Modal */}
      {Platform.OS !== "web" && (
        <Modal
          visible={showGoogleAuth}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowGoogleAuth(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <View style={s.webviewHeader}>
              <Text style={s.webviewTitle}>Sign in with Google</Text>
              <TouchableOpacity onPress={() => setShowGoogleAuth(false)}>
                <Text style={s.webviewClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {googleAuthUrl ? (
              <WebView
                source={{ uri: googleAuthUrl }}
                userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                onNavigationStateChange={handleGoogleNavigation}
                startInLoadingState
                domStorageEnabled
                javaScriptEnabled
              />
            ) : null}
          </SafeAreaView>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F3FF",
  },
  container: {
    flex: 1,
    flexDirection: "column",
  },
  containerWeb: {
    flexDirection: "row",
    maxWidth: 1000,
    alignSelf: "center",
    width: "100%",
    flex: 1,
    marginVertical: "auto" as any,
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 32px 80px rgba(124, 58, 237, 0.2)",
        margin: 32,
        flex: undefined,
        alignSelf: "center",
      },
    }),
  },

  // Brand Panel
  brandPanel: {
    position: "relative",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  brandPanelWeb: {
    width: "50%",
    minHeight: 580,
  },
  brandPanelMobile: {
    minHeight: 240,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  blob: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  brandContent: {
    padding: 36,
    paddingBottom: 40,
    zIndex: 2,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  logoText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: displayFont,
  },
  headline: {
    color: "#FFF",
    fontWeight: "800",
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: 16,
    fontFamily: displayFont,
  },
  headlineWeb: {
    fontSize: 36,
  },
  headlineMobile: {
    fontSize: 26,
    lineHeight: 34,
  },
  subHeadline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: webFont,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statValue: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    fontFamily: displayFont,
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
    fontFamily: webFont,
  },

  // Form Panel
  formPanel: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  formPanelWeb: {
    flex: 1,
    minHeight: 580,
  },
  formPanelMobile: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  formScroll: {
    padding: 40,
    paddingTop: 44,
    flexGrow: 1,
    justifyContent: "center",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    fontFamily: displayFont,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 28,
    fontFamily: webFont,
  },

  // Error box
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    fontFamily: webFont,
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    fontFamily: webFont,
  },
  fieldError: {
    fontSize: 12,
    color: colors.error,
    marginTop: -4,
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: webFont,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderWidth: 1.5,
    borderColor: "#E9E2FF",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputWrapError: {
    borderColor: colors.error,
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    fontFamily: webFont,
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },

  // Password header row
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: webFont,
  },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkLabel: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: webFont,
  },

  // Sign in button
  signInBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: "0 6px 24px rgba(124, 58, 237, 0.4)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
      default: { elevation: 6 },
    }),
  },
  signInGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: webFont,
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9E2FF",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    fontFamily: webFont,
  },

  // Social
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }),
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    fontFamily: webFont,
  },

  // Bottom link
  bottomLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomLinkText: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: webFont,
  },
  bottomLinkAction: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
    fontFamily: webFont,
  },

  // WebView modal
  webviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    fontFamily: displayFont,
  },
  webviewClose: {
    fontSize: 15,
    color: colors.error,
    fontWeight: "700",
    fontFamily: webFont,
  },
});
