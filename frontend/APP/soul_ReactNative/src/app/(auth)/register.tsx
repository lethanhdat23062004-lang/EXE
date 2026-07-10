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

// ── Feature item on the brand panel ─────────────────────────────────────────
function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={r.featureItem}>
      <View style={r.featureIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={r.featureText}>{text}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [agreeError, setAgreeError] = useState("");
  const [serverError, setServerError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState("");

  const registerAction = useAuthStore((state) => state.register);
  const setSession = useAuthStore((state) => state.setSession);

  const validateName = (v: string) => {
    if (!v.trim()) setNameError("Please enter your full name");
    else setNameError("");
  };
  const validateEmail = (v: string) => {
    if (!v.trim()) setEmailError("Please enter your email");
    else if (!emailRegex.test(v)) setEmailError("Invalid email address");
    else setEmailError("");
  };
  const validatePassword = (v: string) => {
    if (!v) setPasswordError("Please enter a password");
    else if (v.length < 6) setPasswordError("At least 6 characters required");
    else setPasswordError("");
  };
  const validateConfirm = (v: string, pw = password) => {
    if (!v) setConfirmError("Please confirm your password");
    else if (v !== pw) setConfirmError("Passwords do not match");
    else setConfirmError("");
  };

  const handleNameChange = (v: string) => { setFullName(v); setServerError(""); validateName(v); };
  const handleEmailChange = (v: string) => { setEmail(v); setServerError(""); validateEmail(v); };
  const handlePasswordChange = (v: string) => {
    setPassword(v); setServerError(""); validatePassword(v);
    if (confirmPassword) validateConfirm(confirmPassword, v);
  };
  const handleConfirmChange = (v: string) => { setConfirmPassword(v); validateConfirm(v); };

  const handleGoogleSignUp = () => {
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
          const userObj = JSON.parse(decodeURIComponent(userMatch ? userMatch[1] : ""));
          setSession(tokenMatch[1], userObj);
          router.replace("/(tabs)");
        }
      } catch (error: any) {
        Alert.alert("Sign Up Error", error.message);
      }
    } else if (urlStr.includes("error=")) {
      setShowGoogleAuth(false);
      Alert.alert("Sign Up Failed", "Google access was denied.");
    }
  };

  const handleRegister = async () => {
    validateName(fullName);
    validateEmail(email);
    validatePassword(password);
    validateConfirm(confirmPassword);
    if (!agreed) setAgreeError("You must agree to the Terms and Privacy Policy");
    else setAgreeError("");

    if (
      !fullName.trim() ||
      !emailRegex.test(email) ||
      password.length < 6 ||
      password !== confirmPassword ||
      !agreed
    ) return;

    setServerError("");
    setLoading(true);
    const result = await registerAction({ fullName, email, password });
    setLoading(false);

    if (result.success) {
      setShowSuccessModal(true);
    } else {
      setServerError(result.message || "Registration failed. Please try again.");
    }
  };

  // ── Return ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={r.root}
    >
      <View style={[r.container, isWeb && r.containerWeb]}>

        {/* ── Form Panel (left on web, top on mobile) ─────────────────── */}
        <View style={[r.formPanel, isWeb ? r.formPanelWeb : r.formPanelMobile]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={r.formScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <Text style={r.logoText}>SOUL</Text>
            <Text style={r.formTitle}>Begin your journey</Text>
            <Text style={r.formSubtitle}>Create your personalized wellness sanctuary.</Text>

            {/* Server Error */}
            {serverError ? (
              <View style={r.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={r.errorBoxText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <Text style={r.fieldLabel}>Full Name</Text>
            <View style={[r.inputWrap, nameError ? r.inputWrapError : null]}>
              <MaterialCommunityIcons name="account-outline" size={20} color={nameError ? colors.error : "#94A3B8"} style={r.inputIcon} />
              <TextInput
                placeholder="Julian Rivers"
                placeholderTextColor="#B0BEC5"
                style={r.input}
                value={fullName}
                onChangeText={handleNameChange}
                autoCapitalize="words"
              />
            </View>
            {nameError ? <Text style={r.fieldError}>{nameError}</Text> : null}

            {/* Email */}
            <Text style={r.fieldLabel}>Email Address</Text>
            <View style={[r.inputWrap, emailError ? r.inputWrapError : null]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={emailError ? colors.error : "#94A3B8"} style={r.inputIcon} />
              <TextInput
                placeholder="julian@wellness.com"
                placeholderTextColor="#B0BEC5"
                style={r.input}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? <Text style={r.fieldError}>{emailError}</Text> : null}

            {/* Password + Confirm row */}
            <View style={[r.twoColRow, !isWeb && r.twoColRowMobile]}>
              {/* Password */}
              <View style={r.halfCol}>
                <Text style={r.fieldLabel}>Password</Text>
                <View style={[r.inputWrap, passwordError ? r.inputWrapError : null]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={passwordError ? colors.error : "#94A3B8"} style={r.inputIcon} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#B0BEC5"
                    secureTextEntry={secureText}
                    style={r.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    <MaterialCommunityIcons name={secureText ? "eye-off-outline" : "eye-outline"} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={r.fieldError}>{passwordError}</Text> : null}
              </View>

              {/* Confirm */}
              <View style={r.halfCol}>
                <Text style={r.fieldLabel}>Confirm</Text>
                <View style={[r.inputWrap, confirmError ? r.inputWrapError : null]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color={confirmError ? colors.error : "#94A3B8"} style={r.inputIcon} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#B0BEC5"
                    secureTextEntry={secureConfirm}
                    style={r.input}
                    value={confirmPassword}
                    onChangeText={handleConfirmChange}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
                    <MaterialCommunityIcons name={secureConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                {confirmError ? <Text style={r.fieldError}>{confirmError}</Text> : null}
              </View>
            </View>

            {/* Terms */}
            <TouchableOpacity style={r.checkRow} onPress={() => { setAgreed(!agreed); setAgreeError(""); }} activeOpacity={0.7}>
              <View style={[r.checkbox, agreed && r.checkboxChecked]}>
                {agreed && <MaterialCommunityIcons name="check" size={13} color="#FFF" />}
              </View>
              <Text style={r.checkLabel}>
                I agree to the{" "}
                <Text style={r.termsLink}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={r.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {agreeError ? <Text style={r.fieldError}>{agreeError}</Text> : null}

            {/* Create Account button */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={r.createBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={["#7C3AED", "#6D28D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={r.createGradient}
              >
                {loading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={r.createBtnText}>Create Account</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign in link */}
            <View style={r.bottomLink}>
              <Text style={r.bottomLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={r.bottomLinkAction}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ── Brand Panel (right on web, bottom on mobile) ─────────────── */}
        <View style={[r.brandPanel, isWeb ? r.brandPanelWeb : r.brandPanelMobile]}>
          <LinearGradient colors={["#F5F3FF", "#EDE9FE"]} style={StyleSheet.absoluteFill} />
          <View style={[r.blob, { top: -50, right: -50, width: 200, height: 200, borderRadius: 100 }]} />
          <View style={[r.blob, { bottom: -30, left: -30, width: 150, height: 150, borderRadius: 75, opacity: 0.6 }]} />

          <View style={r.brandContent}>
            <View style={r.lotusWrap}>
              <MaterialCommunityIcons name="leaf" size={32} color={colors.primary} />
            </View>

            <View style={r.quoteCard}>
              <Text style={r.quoteText}>
                {'"Wellness is not a luxury, it\'s a foundation."'}
              </Text>
              <View style={r.featureList}>
                <FeatureItem icon="creation-outline" text="AI-guided meditation tailored to your mood." />
                <FeatureItem icon="chart-line" text="Scientific tracking of your emotional baseline." />
                <FeatureItem icon="account-group-outline" text="Global community of mindfulness advocates." />
              </View>
            </View>

            <View style={r.securityBadge}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.primary} />
              <Text style={r.securityText}>SECURE WELLNESS ECOSYSTEM</Text>
            </View>
          </View>
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
            <View style={r.webviewHeader}>
              <Text style={r.webviewTitle}>Sign up with Google</Text>
              <TouchableOpacity onPress={() => setShowGoogleAuth(false)}>
                <Text style={r.webviewClose}>Cancel</Text>
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

      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={r.modalOverlay}>
          <View style={r.modalCard}>
            <View style={r.successIcon}>
              <MaterialCommunityIcons name="party-popper" size={44} color={colors.primary} />
            </View>
            <Text style={r.modalTitle}>Account Created! 🎉</Text>
            <Text style={r.modalDesc}>
              Welcome to SOUL. Your wellness journey starts now. Please sign in to continue.
            </Text>
            <TouchableOpacity
              style={r.modalBtn}
              onPress={() => { setShowSuccessModal(false); router.push("/(auth)/login"); }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#7C3AED", "#6D28D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={r.modalBtnGradient}
              >
                <Text style={r.modalBtnText}>SIGN IN NOW →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
const r = StyleSheet.create({
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

  // Form Panel (LEFT on web)
  formPanel: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  formPanelWeb: {
    width: "50%",
    minHeight: 620,
  },
  formPanelMobile: {
    flex: 1,
  },
  formScroll: {
    padding: 40,
    paddingTop: 48,
    flexGrow: 1,
    justifyContent: "center",
  },
  logoText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 2,
    fontFamily: displayFont,
    marginBottom: 12,
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
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: webFont,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderWidth: 1.5,
    borderColor: "#E9E2FF",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputWrapError: {
    borderColor: colors.error,
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontFamily: webFont,
    height: "100%",
  },

  // Two-column password row
  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },
  twoColRowMobile: {
    flexDirection: "column",
    gap: 0,
  },
  halfCol: {
    flex: 1,
  },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
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
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkLabel: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: webFont,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "700",
  },

  // Create Account button
  createBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: "0 6px 24px rgba(124, 58, 237, 0.4)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
      default: { elevation: 6 },
    }),
  },
  createGradient: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: webFont,
    letterSpacing: 0.3,
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

  // Brand Panel (RIGHT on web)
  brandPanel: {
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
  },
  brandPanelWeb: {
    width: "50%",
    minHeight: 620,
  },
  brandPanelMobile: {
    minHeight: 320,
    padding: 8,
  },
  blob: {
    position: "absolute",
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  brandContent: {
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    zIndex: 2,
  },
  lotusWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
  },
  quoteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    ...Platform.select({
      web: { boxShadow: "0 8px 32px rgba(124, 58, 237, 0.12)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
      default: { elevation: 4 },
    }),
  },
  quoteText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    fontStyle: "italic",
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: displayFont,
  },
  featureList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    color: "#475569",
    fontFamily: webFont,
    flex: 1,
    lineHeight: 20,
    marginTop: 6,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
    opacity: 0.6,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
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

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 32,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 20px 60px rgba(124, 58, 237, 0.2)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 28, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 12 },
      default: { elevation: 12 },
    }),
    borderWidth: 1,
    borderColor: "#C4B5FD",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: displayFont,
  },
  modalDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    fontFamily: webFont,
  },
  modalBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  modalBtnGradient: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: webFont,
    letterSpacing: 0.5,
  },
});
