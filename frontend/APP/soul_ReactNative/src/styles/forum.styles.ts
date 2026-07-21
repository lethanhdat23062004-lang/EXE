import { StyleSheet, Platform } from "react-native";
import { colors } from "@/constants/colors";

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const cardShadow = Platform.select({
  ios: { shadowColor: colors.primary, shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 5 } },
  android: { elevation: 3 },
  web: { boxShadow: "0 4px 20px rgba(124, 58, 237, 0.09)" },
  default: { elevation: 3 },
});

export const forumStyles = StyleSheet.create({
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
    paddingBottom: 14,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderColor: colors.borderPrimary,
    ...Platform.select({
      web: {
        maxWidth: 960,
        width: "90%",
        alignSelf: "center",
        marginTop: 22,
        paddingTop: 26,
        paddingHorizontal: 30,
        paddingBottom: 24,
        borderRadius: 32,
        boxShadow: "0 18px 48px rgba(124, 58, 237, 0.12)",
      },
    }),
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },

  headerTitleWrap: {
    flex: 1,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
    fontFamily: displayFont,
  },

  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: webFont,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  plusButton: {
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

  // ── Search ────────────────────────────────────────────────────────────────
  searchBox: {
    marginTop: 22,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
      default: { elevation: 2 },
    }),
  },

  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: webFont,
    // @ts-ignore
    // outlineStyle: "none",
  },

  // ── Filter Chips ──────────────────────────────────────────────────────────
  filterRow: {
    paddingTop: 16,
    paddingBottom: 2,
    gap: 10,
  },

  filterChip: {
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  // ── Post List ─────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 130,
    ...Platform.select({
      web: {
        maxWidth: 960,
        width: "90%",
        alignSelf: "center",
        paddingHorizontal: 0,
        paddingTop: 24,
      },
    }),
  },

  // ── Post Card ─────────────────────────────────────────────────────────────
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
    ...Platform.select({
      web: {
        borderRadius: 28,
        padding: 20,
        marginBottom: 18,
        borderColor: "#F1F5F9",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.07)",
      },
    }),
  },

  postCardFlagged: {
    borderColor: colors.accentLight,
    backgroundColor: colors.accentBg,
  },

  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  authorInfo: {
    flex: 1,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryBg,
    borderWidth: 2,
    borderColor: colors.borderPrimary,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },

  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  postMeta: {
    color: colors.textMuted,
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: webFont,
  },

  mineActions: {
    alignItems: "flex-end",
    gap: 8,
  },

  ownerActions: {
    flexDirection: "row",
    gap: 10,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusBadgeSuccess: {
    backgroundColor: colors.successBg,
  },

  statusBadgeWarning: {
    backgroundColor: colors.warningBg,
  },

  statusBadgeDanger: {
    backgroundColor: colors.errorBg,
  },

  statusText: {
    color: "#A16207",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "capitalize",
    fontFamily: webFont,
  },

  statusTextSuccess: {
    color: "#047857",
  },

  statusTextDanger: {
    color: "#DC2626",
  },

  // ── AI Review Box ──────────────────────────────────────────────────────────
  aiReviewBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.accentLight,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },

  aiReviewText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    fontFamily: webFont,
  },

  // ── Post Content ───────────────────────────────────────────────────────────
  postContent: {
    marginTop: 14,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: webFont,
  },

  tagRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    backgroundColor: colors.primaryBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  tagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  postImage: {
    marginTop: 16,
    height: 270,
    width: "100%",
    borderRadius: 18,
    backgroundColor: colors.primaryBg,
  },

  webPreview: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    marginTop: 12,
  },

  mediaPlaceholder: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  mediaPlaceholderText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: webFont,
  },

  // ── Action Row ────────────────────────────────────────────────────────────
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 48,
  },

  actionEmoji: {
    fontSize: 20,
  },

  actionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },

  anonymousBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  anonymousBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },

  iconButtonSoft: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Reaction Pills ────────────────────────────────────────────────────────
  reactionBar: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  reactionPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  commentPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: "center",
    paddingVertical: 70,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 52,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    fontFamily: displayFont,
  },

  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    fontFamily: webFont,
  },

  // ── Create Post Modal ──────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },

  createModal: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
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
    fontSize: 24,
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

  safeNotice: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: colors.primaryBg,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  safeNoticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    fontFamily: webFont,
  },

  bigInputWrap: {
    marginTop: 22,
    height: 150,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.surface,
  },

  bigInput: {
    flex: 1,
    textAlignVertical: "top",
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: webFont,
  },

  counter: {
    textAlign: "right",
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: webFont,
  },

  formInput: {
    marginTop: 14,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
  },

  formTextInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: webFont,
  },

  hashIcon: {
    fontSize: 26,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // ── Emotion Grid ──────────────────────────────────────────────────────────
  feelingLabel: {
    marginTop: 20,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: webFont,
  },

  emotionGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  emotionCard: {
    width: "31%",
    height: 78,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },

  emotionCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryBg,
  },

  emotionEmoji: {
    fontSize: 26,
  },

  emotionName: {
    marginTop: 5,
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: "700",
    fontFamily: webFont,
  },

  // ── Anonymous Toggle ──────────────────────────────────────────────────────
  anonymousRow: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  anonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  anonText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "700",
    fontFamily: webFont,
  },

  // ── Submit Button ─────────────────────────────────────────────────────────
  submitButton: {
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

  submitText: {
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

  // ── Bottom Switcher Nav ───────────────────────────────────────────────────
  bottomSwitcher: {
    position: "absolute",
    bottom: 22,
    height: 68,
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        left: 16,
        right: 16,
        shadowColor: colors.primary,
        shadowOpacity: 0.16,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        left: 16,
        right: 16,
        elevation: 12,
      },
      web: {
        maxWidth: 960,
        width: "90%",
        alignSelf: "center",
        left: "auto",
        right: "auto",
        boxShadow: "0 8px 32px rgba(124, 58, 237, 0.16)",
      },
      default: {
        left: 16,
        right: 16,
        elevation: 12,
      },
    }),
  },

  bottomTab: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  bottomTabActive: {
    backgroundColor: colors.primary,
  },

  bottomTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    fontFamily: webFont,
  },

  bottomTabTextActive: {
    color: "#FFFFFF",
  },

  // ── Inline Comments ───────────────────────────────────────────────────────
  inlineCommentBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  commentThread: {
    marginBottom: 10,
  },

  inlineCommentCard: {
    backgroundColor: colors.primaryBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  inlineCommentAuthor: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    flex: 1,
    fontFamily: displayFont,
  },

  inlineCommentMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    fontFamily: webFont,
  },

  inlineCommentText: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    fontFamily: webFont,
  },

  commentActionRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 8,
  },

  commentActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: webFont,
  },

  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  commentMenuButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  commentMenu: {
    marginTop: 10,
    alignSelf: "flex-end",
    width: 148,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
      web: { boxShadow: "0 8px 24px rgba(124, 58, 237, 0.12)" },
      default: { elevation: 8 },
    }),
  },

  commentMenuItem: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  commentMenuText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: webFont,
  },

  commentMenuDeleteText: {
    color: colors.error,
  },

  replyList: {
    marginLeft: 22,
    marginTop: 4,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderPrimary,
  },

  replyCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inlineCommentInputRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inlineCommentInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: webFont,
  },

  sendCommentButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
      web: { boxShadow: "0 3px 12px rgba(124, 58, 237, 0.4)" },
      default: { elevation: 4 },
    }),
  },

  replyInputRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  replyInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: webFont,
  },

  replySend: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  replySendCancel: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  inlineCommentSend: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  crisisReviewBox: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 12,
  },

  crisisReviewText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    fontFamily: webFont,
  },

  // ── Report Modal ──────────────────────────────────────────────────────────
  reportModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "75%",
    borderTopWidth: 1,
    borderColor: colors.border,
  },

  reportTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  reportOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },

  reportOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: webFont,
    flex: 1,
  },

  reportSelectedText: {
    color: colors.primary,
    fontWeight: "700",
  },

  reportBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  
  reportIconCircle: {
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  
  reportSub: {
    textAlign: "center",
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: webFont,
  },
  
  reasonList: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  reasonChipActive: {
    backgroundColor: "#00866B",
    borderColor: "#00866B",
  },
  
  reasonText: {
    fontSize: 14,
    color: "#064D3D",
    fontWeight: "600",
    fontFamily: webFont,
  },
  
  reasonTextActive: {
    color: "#FFFFFF",
  },
  
  reportInput: {
    marginTop: 20,
    minHeight: 100,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: webFont,
    textAlignVertical: "top",
  },

  myReportList: {
    marginTop: 16,
    gap: 12,
  },

  myReportCard: {
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },

  myReportReason: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  myReportMeta: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: webFont,
  },

  myReportDescription: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: webFont,
  },

  emptyReportText: {
    marginTop: 18,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: webFont,
  },

  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  confirmBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)" },
      android: { elevation: 10 },
    }),
  },

  confirmTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    fontFamily: displayFont,
  },

  confirmText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: webFont,
  },

  confirmActions: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: webFont,
  },

  deleteButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: webFont,
  },
});
