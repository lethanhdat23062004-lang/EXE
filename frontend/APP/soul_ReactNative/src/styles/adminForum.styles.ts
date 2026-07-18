import { Platform, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const cardShadow = Platform.select({
  web: { boxShadow: "0 8px 30px rgba(124, 58, 237, 0.04)" },
  ios: { shadowColor: colors.primary, shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 3 },
  default: { elevation: 3 },
});

export const adminForumStyles = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: displayFont,
    letterSpacing: 0.5,
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
    fontFamily: webFont,
    fontWeight: "500",
  },

  // ── Stats Row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
    fontFamily: webFont,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchBox: {
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
      ios: { shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }),
  },

  searchBoxFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
    paddingHorizontal: 8,
    fontFamily: webFont,
  },

  // ── Filter Chips ──────────────────────────────────────────────────────────
  filterRow: {
    gap: 8,
    paddingRight: 20,
    alignItems: "center",
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },

  filterChipActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: webFont,
  },

  filterTextActive: {
    color: colors.primary,
  },

  // ── Post List ─────────────────────────────────────────────────────────────
  list: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Post Card ─────────────────────────────────────────────────────────────
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },

  postTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  authorBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
  },

  authorInfo: {
    flex: 1,
  },

  authorName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  postDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 1,
    fontFamily: webFont,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
    fontFamily: displayFont,
  },

  postContent: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    fontFamily: webFont,
    fontWeight: "500",
  },

  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    fontFamily: webFont,
  },

  // ── Action Buttons ────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    fontFamily: webFont,
    fontWeight: "500",
  },
});