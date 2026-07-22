import { StyleSheet, Platform } from "react-native";
import { colors } from "@/constants/colors";

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const cardShadow = Platform.select({
  ios: { shadowColor: colors.primary, shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 3 },
  web: { boxShadow: "0 4px 18px rgba(124, 58, 237, 0.09)" },
  default: { elevation: 3 },
});

export const diaryStyles = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    ...Platform.select({
      web: {
        backgroundColor: "#FAFAFC",
      },
    }),
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: colors.primaryBg,
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderColor: colors.borderPrimary,
    ...Platform.select({
      web: {
        width: "100%",
        maxWidth: 1180,
        alignSelf: "center",
        paddingTop: 26,
        paddingHorizontal: 34,
        paddingBottom: 24,
        borderRadius: 34,
        overflow: "hidden",
        boxShadow: "0 24px 70px rgba(124, 58, 237, 0.16)",
      },
    }),
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)" },
      default: { elevation: 6 },
    }),
  },

  title: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 32,
    fontWeight: "800",
    fontFamily: displayFont,
    ...Platform.select({
      web: {
        marginTop: 22,
        fontSize: 44,
        letterSpacing: -1.2,
      },
    }),
  },

  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: webFont,
    ...Platform.select({
      web: {
        maxWidth: 560,
        fontSize: 16,
        lineHeight: 25,
      },
    }),
  },

  // ── Today Card (header section) ───────────────────────────────────────────
  todayCard: {
    marginTop: 18,
    minHeight: 96,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
      web: {
        maxWidth: 520,
        minHeight: 112,
        padding: 22,
        boxShadow: "0 14px 36px rgba(49, 46, 129, 0.12)",
      },
      default: { elevation: 3 },
    }),
  },

  todayLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: webFont,
  },

  todayTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  todayEmoji: {
    fontSize: 42,
  },

  // ── Filter Row ────────────────────────────────────────────────────────────
  filterRow: {
    paddingTop: 16,
    gap: 10,
    ...Platform.select({
      web: {
        paddingTop: 22,
        paddingBottom: 2,
      },
    }),
  },

  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: webFont,
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 40,
  },

  webList: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 72,
  },

  webColumnWrapper: {
    gap: 18,
  },

  // ── Diary Card ────────────────────────────────────────────────────────────
  diaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
    ...Platform.select({
      web: {
        flex: 1,
        minHeight: 280,
        marginBottom: 18,
        borderRadius: 28,
        padding: 20,
        borderColor: "#F1F5F9",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.07)",
      },
    }),
  },

  diaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  moodCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderPrimary,
  },

  moodCircleText: {
    fontSize: 26,
  },

  diaryHeaderInfo: {
    flex: 1,
  },

  diaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  diaryMood: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  privateBadge: {
    borderRadius: 999,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  privateBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },

  diaryDate: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: webFont,
  },

  diaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  smallIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  deleteIconButton: {
    backgroundColor: colors.errorBg,
    borderColor: "#FCA5A5",
  },

  // ── Score Bar ─────────────────────────────────────────────────────────────
  scoreRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  scoreLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  scoreBar: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },

  scoreBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  scoreValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: webFont,
  },

  // ── Diary Note ────────────────────────────────────────────────────────────
  diaryNote: {
    marginTop: 14,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: webFont,
  },

  // ── AI Insight Box ────────────────────────────────────────────────────────
  aiInsightBox: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    padding: 13,
    ...Platform.select({
      web: {
        marginTop: 16,
        borderRadius: 20,
        padding: 15,
      },
    }),
  },

  aiInsightMedium: {
    backgroundColor: colors.warningBg,
    borderColor: colors.accentLight,
  },

  aiInsightHigh: {
    backgroundColor: colors.errorBg,
    borderColor: "#FCA5A5",
  },

  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  aiInsightTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    fontFamily: displayFont,
  },

  aiInsightTitleHigh: {
    color: colors.error,
  },

  riskBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.successBg,
  },

  riskBadgeMedium: {
    backgroundColor: colors.warningBg,
  },

  riskBadgeHigh: {
    backgroundColor: colors.errorBg,
  },

  riskBadgeText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },

  riskBadgeTextHigh: {
    color: colors.error,
  },

  insightMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  insightMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  insightText: {
    marginTop: 10,
    color: colors.textPrimary,
    lineHeight: 20,
    fontSize: 14,
    fontFamily: webFont,
  },

  suggestionText: {
    marginTop: 10,
    color: colors.primary,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
    ...Platform.select({
      web: {
        minHeight: 360,
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.06)",
      },
    }),
  },

  emptyIcon: {
    fontSize: 54,
  },

  emptyTitle: {
    marginTop: 14,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: webFont,
  },

  emptyButton: {
    marginTop: 20,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 6 },
      web: { boxShadow: "0 5px 20px rgba(124, 58, 237, 0.4)" },
      default: { elevation: 6 },
    }),
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: webFont,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },

  modalBox: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 12 },
      web: { boxShadow: "0 -8px 40px rgba(124, 58, 237, 0.12)" },
      default: { elevation: 12 },
    }),
  },

  modalHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.border,
    marginBottom: 20,
  },

  closeButton: {
    position: "absolute",
    right: 20,
    top: 28,
    zIndex: 5,
  },

  modalTitle: {
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  modalSub: {
    textAlign: "center",
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: webFont,
  },

  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  // ── Mood Grid ─────────────────────────────────────────────────────────────
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  moodOption: {
    width: "31%",
    height: 82,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  moodOptionActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryBg,
  },

  moodEmoji: {
    fontSize: 27,
  },

  moodText: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  // ── Score Picker ──────────────────────────────────────────────────────────
  scorePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  scoreDot: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  scoreDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  scoreDotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: webFont,
  },

  scoreDotTextActive: {
    color: "#FFFFFF",
  },

  // ── Note Input ────────────────────────────────────────────────────────────
  noteInputBox: {
    minHeight: 170,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.surface,
  },

  noteInput: {
    flex: 1,
    minHeight: 130,
    textAlignVertical: "top",
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: webFont,
  },

  counter: {
    textAlign: "right",
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: webFont,
  },

  // ── Privacy Toggle ────────────────────────────────────────────────────────
  privateRow: {
    marginTop: 16,
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  privateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  privateTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: webFont,
  },

  privateSub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: webFont,
  },

  // ── Save Button ───────────────────────────────────────────────────────────
  saveButton: {
    marginTop: 20,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
      web: { boxShadow: "0 6px 24px rgba(124, 58, 237, 0.45)" },
      default: { elevation: 6 },
    }),
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  cancelText: {
    marginTop: 16,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: webFont,
  },

  // ── Standardized Theme Classes ────────────────────────────────────────────
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
  heroCard: {
    minHeight: 200,
    borderRadius: 30,
    padding: 24,
    marginBottom: 18,
    backgroundColor: "#7C3AED",
    justifyContent: "space-between",
    overflow: "hidden",
    ...Platform.select({
      web: {
        minHeight: 240,
        padding: 32,
        boxShadow: "0 24px 60px rgba(124, 58, 237, 0.16)",
      },
      default: {},
    }),
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
    fontSize: 12,
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroText: {
    marginTop: 8,
    maxWidth: 560,
    color: "#E8FFFA",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
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
  stdFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  stdFilterButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "transparent",
  },
  stdActiveFilter: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
  },
  stdFilterText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  stdActiveFilterText: {
    color: colors.dark,
  },
});
