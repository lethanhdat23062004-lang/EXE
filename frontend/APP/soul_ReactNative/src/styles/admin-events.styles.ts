import { StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";

const webFont = Platform.select({ web: "'Inter', system-ui, sans-serif", default: undefined });
const displayFont = Platform.select({ web: "'Lexend', 'Inter', system-ui", default: undefined });

const cardShadow = Platform.select({
  web: { boxShadow: "0 4px 20px rgba(124, 58, 237, 0.09)" },
  ios: { shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 3 },
  default: { elevation: 3 },
});

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 1px 8px rgba(124, 58, 237, 0.06)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }),
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(124, 58, 237, 0.38)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.38, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
      default: { elevation: 5 },
    }),
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: webFont,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // ── Event Card ─────────────────────────────────────────────────────────────
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },

  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
    fontFamily: displayFont,
  },

  // ── Status Badges ──────────────────────────────────────────────────────────
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  statusUpcoming: {
    backgroundColor: colors.warningBg,
    color: "#D97706",
  },

  statusOngoing: {
    backgroundColor: colors.successBg,
    color: "#059669",
  },

  statusCompleted: {
    backgroundColor: colors.border,
    color: colors.textSecondary,
  },

  statusCancelled: {
    backgroundColor: colors.errorBg,
    color: colors.error,
  },

  // ── Event Info ─────────────────────────────────────────────────────────────
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  eventInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    fontFamily: webFont,
  },

  // ── Stats Grid ─────────────────────────────────────────────────────────────
  eventStatsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  eventStatBox: {
    flex: 1,
    minHeight: 66,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  eventStatValue: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  eventStatLabel: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: webFont,
  },

  // ── Progress Bar ───────────────────────────────────────────────────────────
  eventProgressBlock: {
    marginTop: 12,
  },

  eventProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  eventProgressText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  eventProgressPercent: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: webFont,
  },

  eventProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },

  eventProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
    fontFamily: webFont,
  },

  // ── Form ────────────────────────────────────────────────────────────────────
  formContainer: {
    padding: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    fontFamily: webFont,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: webFont,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
    ...Platform.select({
      web: { boxShadow: "0 6px 22px rgba(124, 58, 237, 0.42)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.42, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 7 },
      default: { elevation: 7 },
    }),
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: webFont,
  },

  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: webFont,
  },

  // ── Detail Styles ──────────────────────────────────────────────────────────
  detailSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },

  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 16,
    fontFamily: displayFont,
  },

  descText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    fontFamily: webFont,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.primaryBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  statBox: {
    alignItems: "center",
    flex: 1,
  },

  statNum: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    fontFamily: displayFont,
  },

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: webFont,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  editBtn: {
    flex: 1,
    backgroundColor: colors.info,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)" },
      ios: { shadowColor: colors.info, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
      default: { elevation: 5 },
    }),
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)" },
      ios: { shadowColor: colors.error, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
      default: { elevation: 5 },
    }),
  },

  registrationManageBtn: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...cardShadow,
  },

  registrationManageIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  registrationManageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: displayFont,
  },

  registrationManageSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    fontFamily: webFont,
  },

  schedulePicker: {
    gap: 14,
  },

  scheduleCompactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  scheduleCompactField: {
    flex: 1,
    minWidth: 220,
  },

  schedulePickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-start",
  },

  schedulePickerField: {
    flex: 1,
    minWidth: 240,
    position: "relative",
    zIndex: 20,
  },

  schedulePickerLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    fontFamily: webFont,
  },

  scheduleFieldButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderPrimary,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(124, 58, 237, 0.08)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }),
  },

  scheduleFieldText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: webFont,
  },

  scheduleFieldPlaceholder: {
    color: colors.textMuted,
    fontWeight: "600",
  },

  calendarPopover: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    backgroundColor: colors.surface,
    padding: 14,
    zIndex: 50,
    ...Platform.select({
      web: { boxShadow: "0 22px 54px rgba(76, 29, 149, 0.16)" },
      ios: { shadowColor: colors.primaryDark, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
      android: { elevation: 8 },
      default: { elevation: 8 },
    }),
  },

  calendarPopoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  scheduleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  calendarMonthTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: displayFont,
  },

  calendarPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  calendarPickerWeekday: {
    width: "13.1%",
    minWidth: 34,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: webFont,
  },

  calendarPickerDay: {
    width: "13.1%",
    minWidth: 34,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },

  calendarPickerDayMuted: {
    opacity: 0.42,
  },

  calendarPickerToday: {
    borderColor: colors.borderPrimary,
    backgroundColor: colors.primaryBg,
  },

  calendarPickerPastDay: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.45,
  },

  calendarPickerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  calendarPickerDayText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: webFont,
  },

  calendarPickerMutedText: {
    color: colors.textMuted,
  },

  calendarPickerPastText: {
    color: colors.textLight,
  },

  calendarPickerSelectedText: {
    color: "#FFFFFF",
  },

  timePopover: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    backgroundColor: colors.surface,
    padding: 8,
    zIndex: 60,
    ...Platform.select({
      web: { boxShadow: "0 22px 54px rgba(76, 29, 149, 0.16)" },
      ios: { shadowColor: colors.primaryDark, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
      android: { elevation: 8 },
      default: { elevation: 8 },
    }),
  },

  timePopoverScroll: {
    maxHeight: 240,
  },

  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  timeOptionActive: {
    backgroundColor: colors.primaryBg,
  },

  timeOptionDisabled: {
    opacity: 0.42,
  },

  timeOptionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },

  timeOptionTextActive: {
    color: colors.primary,
    fontWeight: "900",
  },

  timeOptionTextDisabled: {
    color: colors.textMuted,
  },

  durationBlock: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: 14,
    gap: 10,
  },

  durationChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  durationChip: {
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  durationChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  durationChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: webFont,
  },

  durationChipTextActive: {
    color: "#FFFFFF",
  },

  customDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  customDurationInput: {
    width: 82,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: webFont,
  },

  customDurationSeparator: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: webFont,
  },

  endTimePreview: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    backgroundColor: colors.primaryBg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  endTimeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  endTimeLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: webFont,
  },

  endTimeText: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: displayFont,
  },

  eventShell: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  eventFormPage: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 42,
  },

  eventSimpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },

  eventBackLink: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },

  eventSimpleTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: displayFont,
  },

  eventFormCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    padding: 24,
    ...Platform.select({
      web: { boxShadow: "0 14px 38px rgba(15, 23, 42, 0.04)" },
      ios: { shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }),
  },

  requiredMark: {
    color: colors.error,
  },

  eventCleanInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: webFont,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },

  eventSelectButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  eventSelectText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: webFont,
  },

  eventTypeMenu: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    backgroundColor: colors.surface,
    padding: 6,
    gap: 4,
  },

  eventTypeOption: {
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  eventTypeOptionActive: {
    backgroundColor: colors.primaryBg,
  },

  eventTypeOptionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: webFont,
  },

  eventIconInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  eventIconTextInput: {
    flex: 1,
    minHeight: 42,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: webFont,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },

  eventDescriptionInput: {
    minHeight: 84,
    alignItems: "flex-start",
    paddingTop: 12,
  },

  eventDescriptionText: {
    minHeight: 70,
    textAlignVertical: "top",
  },

  eventPrimaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  eventPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: webFont,
  },

  managementPage: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 42,
  },

  managementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  managementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  managementCreateButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)" },
      ios: { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
      default: { elevation: 3 },
    }),
  },

  managementCreateText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: webFont,
  },

  managementControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  managementSearchBox: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  managementSearchBoxFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  managementSearchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: webFont,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },

  managementFilterRow: {
    gap: 8,
  },

  managementFilterChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  managementFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  managementFilterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: webFont,
  },

  managementFilterTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  managementList: {
    gap: 12,
  },

  managementEventCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...cardShadow,
  },

  managementEventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  managementEventTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: displayFont,
  },

  managementStatusPill: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  managementStatusText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: webFont,
  },

  managementMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },

  managementMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },

  managementMetaText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: webFont,
  },

  managementStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  managementStatBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  managementStatValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: displayFont,
  },

  managementStatLabel: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: webFont,
  },

  managementProgressCaption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 5,
  },

  managementProgressText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: webFont,
  },

  managementProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.bgAlt,
    overflow: "hidden",
  },

  managementProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#635BFF",
  },

  managementLoading: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  managementEmptyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    fontFamily: displayFont,
  },

  managementEmptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    fontFamily: webFont,
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: webFont,
  },
});
