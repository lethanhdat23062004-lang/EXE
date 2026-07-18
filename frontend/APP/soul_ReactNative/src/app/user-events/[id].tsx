import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/colors";
import { eventUserService } from "@/services/eventApi";
import { RatingSummary } from "@/api/ratingApi";
import {
  EventRatingSection,
  EventRatingSectionHandle,
} from "@/components/ratings/EventRatingSection";
import {
  attendanceMeta,
  eventStatusMeta,
  EventRegistration,
  EventStatus,
  getComputedEventStatus,
  getFillRate,
  getRemainingSlots,
  isEventFull,
  normalizeEventRegistration,
  registrationMeta,
  RegistrationStatus,
  reviewMeta,
} from "@/utils/eventRegistration";

type CommunityEvent = {
  _id: string;
  title: string;
  description?: string | null;
  speakerName?: string | null;
  organizerName?: string | null;
  contactEmail?: string | null;
  eventType?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  capacity?: number | null;
  registeredCount?: number;
  status: EventStatus;
  ratingSummary?: RatingSummary;
};

type RegisteredEvent = CommunityEvent & {
  registration?: EventRegistration;
};

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const typeLabels: Record<string, string> = {
  workshop: "Workshop",
  talkshow: "Talkshow",
  webinar: "Webinar",
  community_event: "Community Event",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not updated";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function UserEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const desktop = width >= 960;
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<CommunityEvent[]>([]);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const optimisticRegistrationRef = useRef<EventRegistration | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ratingSectionRef = useRef<EventRatingSectionHandle>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const loadEvent = useCallback(
    async (showLoader = true) => {
      if (!id) return;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const [eventResponse, registeredResponse] = await Promise.allSettled([
          eventUserService.getEventById(id),
          eventUserService.getRegisteredEvents("all", 1, 100),
        ]);

        if (eventResponse.status === "fulfilled" && eventResponse.value.success) {
          const nextEvent = eventResponse.value.data;

          setEvent((current) => {
            if (!showLoader && optimisticRegistrationRef.current && current) {
              return {
                ...nextEvent,
                registeredCount: current.registeredCount,
              };
            }

            return nextEvent;
          });
        } else {
          throw new Error("Unable to load event detail");
        }

        if (
          registeredResponse.status === "fulfilled" &&
          registeredResponse.value.success
        ) {
          const matched = (registeredResponse.value.data || []).find(
            (item: RegisteredEvent) => item._id === id
          );
          const matchedRegistration = normalizeEventRegistration(matched?.registration);

          if (!showLoader && optimisticRegistrationRef.current) {
            if (
              matchedRegistration?.registrationStatus ===
              optimisticRegistrationRef.current.registrationStatus
            ) {
              optimisticRegistrationRef.current = null;
              setRegistration(matchedRegistration);
            }
          } else {
            setRegistration(matchedRegistration);
          }
        } else if (!optimisticRegistrationRef.current) {
          setRegistration(null);
        }
      } catch (error: any) {
        showToast(error.message || "Unable to load event detail", "error");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [id, showToast]
  );

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [loadEvent])
  );

  useEffect(() => {
    if (!event?._id) return;

    let active = true;
    eventUserService
      .getEvents({ eventType: event.eventType || undefined, status: "all", page: 1, limit: 4 })
      .then((response) => {
        if (!active) return;
        setRelatedEvents(
          (response.data || []).filter((item: CommunityEvent) => item._id !== event._id).slice(0, 3)
        );
      })
      .catch(() => {
        if (active) setRelatedEvents([]);
      });

    return () => {
      active = false;
    };
  }, [event?._id, event?.eventType]);

  const registeredCount = event?.registeredCount || 0;
  const remainingSlots = getRemainingSlots(event?.capacity, registeredCount);
  const computedStatus = event ? getComputedEventStatus(event) : "upcoming";
  const eventStatus = eventStatusMeta[computedStatus];
  const fillRate = getFillRate(event?.capacity, registeredCount);
  const full = isEventFull(event?.capacity, registeredCount);
  const registrationClosed = computedStatus === "completed" || computedStatus === "cancelled";
  const registrationStatus = registration?.registrationStatus
    ? registrationMeta[registration.registrationStatus]
    : null;
  const attendanceStatus = registration?.attendanceStatus
    ? attendanceMeta[registration.attendanceStatus]
    : null;
  const reviewStatus = registration?.reviewStatus
    ? reviewMeta[registration.reviewStatus]
    : null;

  const participantCountText = useMemo(() => {
    if (!event) return "";

    if (event.capacity === null || event.capacity === undefined) {
      return `${registeredCount} registered participants`;
    }

    return `${registeredCount}/${event.capacity} registered participants`;
  }, [event, registeredCount]);

  const canRegister =
    computedStatus === "upcoming" &&
    registration?.registrationStatus !== "registered" &&
    !full &&
    !registrationClosed;
  const canCancel =
    registration?.registrationStatus === "registered" &&
    computedStatus === "upcoming";

  const applyRegistrationState = (
    nextStatus: RegistrationStatus,
    nextRegisteredCount?: number
  ) => {
    const now = new Date().toISOString();
    const nextRegistration: EventRegistration = {
      registrationStatus: nextStatus,
      attendanceStatus: "not_checked_in",
      reviewStatus: registration?.reviewStatus || "not_reviewed",
      registeredAt:
        nextStatus === "registered" ? now : registration?.registeredAt || now,
      cancelledAt: nextStatus === "cancelled" ? now : null,
    };

    optimisticRegistrationRef.current = nextRegistration;
    setRegistration(nextRegistration);

    setEvent((current) => {
      if (!current) return current;

      return {
        ...current,
        registeredCount:
          nextRegisteredCount !== undefined
            ? nextRegisteredCount
            : Math.max((current.registeredCount || 0) + (nextStatus === "registered" ? 1 : -1), 0),
      };
    });
  };

  const syncAfterAction = () => {
    setTimeout(() => {
      loadEvent(false);
    }, 600);
  };

  const handleRegister = async () => {
    if (!event) return;

    setSubmitting(true);
    try {
      const response = await eventUserService.registerEvent(event._id);
      applyRegistrationState("registered", response.data?.registeredCount);
      showToast("Đăng ký sự kiện thành công", "success");
      syncAfterAction();
    } catch (error: any) {
      showToast(error.message || "Đăng ký sự kiện thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const performCancelRegistration = async () => {
    if (!event) return;

    setSubmitting(true);
    try {
      const response = await eventUserService.cancelRegistration(event._id);
      applyRegistrationState("cancelled", response.data?.registeredCount);
      showToast("Hủy đăng ký thành công", "success");
      syncAfterAction();
    } catch (error: any) {
      showToast(error.message || "Không thể hủy đăng ký", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!event) return;
    Alert.alert(
      "Hủy đăng ký",
      "Bạn có chắc muốn hủy đăng ký sự kiện này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          style: "destructive",
          onPress: performCancelRegistration,
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!event) return;

    const message = `${event.title}\n${formatDateTime(event.startDateTime)}\n${event.location || event.meetingLink || "SOUL Event"}`;

    try {
      await Share.share({ title: event.title, message });
    } catch {
      showToast("Không thể mở chức năng chia sẻ lúc này.", "error");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.safeArea}>
        <View style={screenStyles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={screenStyles.centerText}>Loading event detail...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={screenStyles.safeArea}>
        <View style={screenStyles.centerState}>
          <MaterialCommunityIcons name="calendar-remove" size={64} color="#B7C8C2" />
          <Text style={screenStyles.centerTitle}>Event not found</Text>
          <TouchableOpacity style={screenStyles.secondaryButton} onPress={() => router.back()}>
            <Text style={screenStyles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <View style={screenStyles.header}>
        <TouchableOpacity style={screenStyles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.dark} />
        </TouchableOpacity>
        <View style={screenStyles.headerTextWrap}>
          <Text style={screenStyles.headerTitle} numberOfLines={1}>
            Event Detail
          </Text>
          <Text style={screenStyles.headerSubtitle} numberOfLines={1}>
            {typeLabels[event.eventType || ""] || "SOUL Event"}
          </Text>
        </View>
        <TouchableOpacity
          style={screenStyles.headerIcon}
          onPress={() => router.push("/user-events/registered")}
        >
          <MaterialCommunityIcons name="bookmark-check-outline" size={23} color="#0F766E" />
        </TouchableOpacity>
      </View>

      {toast && (
        <View
          style={[
            screenStyles.toast,
            toast.type === "success" ? screenStyles.successToast : screenStyles.errorToast,
          ]}
        >
          <MaterialCommunityIcons
            name={toast.type === "success" ? "check-circle" : "alert-circle"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={screenStyles.toastText}>{toast.message}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={screenStyles.content}>
        <View style={screenStyles.heroCard}>
          <View style={screenStyles.heroTop}>
            <View style={[screenStyles.statusPill, { backgroundColor: eventStatus.bg }]}>
              <Text style={[screenStyles.statusText, { color: eventStatus.color }]}>
                {eventStatus.label}
              </Text>
            </View>

            {registrationStatus && (
              <View
                style={[
                  screenStyles.statusPill,
                  { backgroundColor: registrationStatus.bg },
                ]}
              >
                <Text
                  style={[
                    screenStyles.statusText,
                    { color: registrationStatus.color },
                  ]}
                >
                  {registrationStatus.label}
                </Text>
              </View>
            )}
            {attendanceStatus && (
              <View style={[screenStyles.statusPill, { backgroundColor: attendanceStatus.bg }]}>
                <Text style={[screenStyles.statusText, { color: attendanceStatus.color }]}>
                  {attendanceStatus.label}
                </Text>
              </View>
            )}
            {reviewStatus && (
              <View style={[screenStyles.statusPill, { backgroundColor: reviewStatus.bg }]}>
                <Text style={[screenStyles.statusText, { color: reviewStatus.color }]}>
                  {reviewStatus.label}
                </Text>
              </View>
            )}
          </View>

          <Text style={screenStyles.eventTitle}>{event.title}</Text>
          <Text style={screenStyles.eventDescription}>
            {event.description ||
              "SOUL emotional wellness event for reflection and safe community support."}
          </Text>
        </View>

        <View style={screenStyles.statsRow}>
          <StatCard label="Capacity" value={event.capacity ? `${event.capacity}` : "Open"} icon="seat-outline" />
          <StatCard label="Participants" value={`${registeredCount}`} icon="account-group-outline" />
          <StatCard
            label="Remaining"
            value={remainingSlots === null ? "Open" : `${remainingSlots}`}
            icon="ticket-confirmation-outline"
          />
        </View>

        <View style={screenStyles.progressCard}>
          <View style={screenStyles.progressHeader}>
            <Text style={screenStyles.progressTitle}>
              {registeredCount} / {event.capacity || "∞"} người tham gia
            </Text>
            <Text style={screenStyles.progressPercent}>{fillRate}%</Text>
          </View>
          <View style={screenStyles.progressTrack}>
            <View style={[screenStyles.progressFill, { width: `${fillRate}%` }]} />
          </View>
          <Text style={screenStyles.registrationNotice}>
            {full
              ? "Đã đủ số lượng"
              : registrationClosed
                ? "Đã đóng đăng ký"
                : `Status: ${registrationStatus?.label || "Not registered"}`}
          </Text>
        </View>

        <View style={[screenStyles.detailLayout, desktop && screenStyles.detailLayoutDesktop]}>
          <View style={screenStyles.mainColumn}>
            <View style={screenStyles.infoCard}>
              <Text style={screenStyles.sectionEyebrow}>THÔNG TIN SỰ KIỆN</Text>
              <View style={screenStyles.infoGrid}>
                <InfoCell icon="clock-outline" label="Bắt đầu" value={formatDateTime(event.startDateTime)} desktop={desktop} />
                <InfoCell icon="calendar-end-outline" label="Kết thúc" value={formatDateTime(event.endDateTime)} desktop={desktop} />
                <InfoCell icon="map-marker-outline" label="Địa điểm" value={event.location || event.meetingLink || "Chưa cập nhật"} desktop={desktop} />
                <InfoCell icon="account-tie-outline" label="Diễn giả" value={event.speakerName || event.organizerName || "SOUL Community"} desktop={desktop} />
                <InfoCell icon="email-outline" label="Liên hệ" value={event.contactEmail || "Chưa cập nhật"} desktop={desktop} />
                <InfoCell icon="account-group-outline" label="Đã đăng ký" value={participantCountText} desktop={desktop} />
              </View>
            </View>

            <EventRatingSection
              ref={ratingSectionRef}
              eventId={event._id}
              eventTitle={event.title}
              completed={computedStatus === "completed"}
              registrationStatus={registration?.registrationStatus}
              attendanceStatus={registration?.attendanceStatus}
              initialSummary={event.ratingSummary}
              hideActionCard
            />
          </View>

          <View style={[screenStyles.sidebar, desktop && screenStyles.sidebarDesktop]}>
            <View style={screenStyles.sidebarCard}>
              <Text style={screenStyles.sectionEyebrow}>THÔNG TIN ĐĂNG KÝ</Text>
              <InfoRow
                icon="bookmark-check-outline"
                label="Đăng ký"
                value={registrationStatus?.label || "Chưa đăng ký"}
              />
              <InfoRow
                icon="account-check-outline"
                label="Tham dự"
                value={attendanceStatus?.label || "Not checked in"}
              />
              <InfoRow
                icon="message-star-outline"
                label="Đánh giá"
                value={reviewStatus?.label || "Not reviewed"}
              />
              {registration?.registeredAt && (
                <InfoRow
                  icon="calendar-check-outline"
                  label="Đăng ký lúc"
                  value={formatDateTime(registration.registeredAt)}
                />
              )}
              {registration?.attendanceStatus === "attended" && (
                <View style={screenStyles.attendedNotice}>
                  <MaterialCommunityIcons name="check-decagram" size={18} color="#047857" />
                  <Text style={screenStyles.attendedNoticeText}>Bạn đã tham dự và có thể gửi đánh giá.</Text>
                </View>
              )}
            </View>

            <View style={screenStyles.sidebarCard}>
              <TouchableOpacity
                style={[
                  screenStyles.ratingButton,
                  !(computedStatus === "completed" && registration?.attendanceStatus === "attended") && screenStyles.outlineButtonDisabled,
                ]}
                onPress={() => ratingSectionRef.current?.openModal()}
                disabled={!(computedStatus === "completed" && registration?.attendanceStatus === "attended")}
              >
                <MaterialCommunityIcons name="star-outline" size={19} color={colors.primary} />
                <Text style={screenStyles.ratingButtonText}>Đánh giá sự kiện</Text>
              </TouchableOpacity>
              <TouchableOpacity style={screenStyles.shareButton} onPress={handleShare}>
                <MaterialCommunityIcons name="share-variant-outline" size={18} color="#475569" />
                <Text style={screenStyles.shareButtonText}>Chia sẻ sự kiện</Text>
              </TouchableOpacity>
            </View>

            <View style={screenStyles.sidebarCard}>
              <Text style={screenStyles.sectionEyebrow}>SỰ KIỆN CÙNG CHỦ ĐỀ</Text>
              {relatedEvents.length ? relatedEvents.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={screenStyles.relatedItem}
                  onPress={() => router.push(`/user-events/${item._id}`)}
                >
                  <View style={screenStyles.relatedIcon}>
                    <MaterialCommunityIcons name="calendar-heart" size={18} color={colors.primary} />
                  </View>
                  <View style={screenStyles.relatedCopy}>
                    <Text style={screenStyles.relatedTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={screenStyles.relatedDate}>{formatDate(item.startDateTime)}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )) : (
                <Text style={screenStyles.relatedEmpty}>Chưa có sự kiện liên quan.</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={screenStyles.actionBar}>
        {canCancel ? (
          <TouchableOpacity
            style={[screenStyles.primaryButton, screenStyles.cancelButton]}
            onPress={handleCancel}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="calendar-remove" size={20} color="#FFFFFF" />
            )}
            <Text style={screenStyles.primaryButtonText}>
              {submitting ? "Đang hủy..." : "Cancel Registration"}
            </Text>
          </TouchableOpacity>
        ) : canRegister ? (
          <TouchableOpacity
            style={screenStyles.primaryButton}
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#FFFFFF" />
            )}
            <Text style={screenStyles.primaryButtonText}>
              {submitting
                ? "Đang đăng ký..."
                : registration?.registrationStatus === "cancelled"
                  ? "Đăng ký lại"
                  : "Đăng ký sự kiện"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={screenStyles.closedFooter}>
            <View style={screenStyles.closedStatus}>
              <MaterialCommunityIcons
                name={full ? "account-lock" : "calendar-lock"}
                size={18}
                color="#64748B"
              />
              <Text style={screenStyles.closedStatusText}>
                {full ? "Đã đủ số lượng" : "Đã đóng đăng ký"}
              </Text>
            </View>
            <Text style={screenStyles.footerEndDate}>
              Sự kiện kết thúc · {formatDate(event.endDateTime || event.startDateTime)}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={screenStyles.infoRow}>
      <View style={screenStyles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color="#0F766E" />
      </View>
      <View style={screenStyles.infoTextWrap}>
        <Text style={screenStyles.infoLabel}>{label}</Text>
        <Text style={screenStyles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function InfoCell({
  icon,
  label,
  value,
  desktop,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  desktop: boolean;
}) {
  return (
    <View style={[screenStyles.infoCell, desktop && screenStyles.infoCellDesktop]}>
      <View style={screenStyles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color="#0F766E" />
      </View>
      <View style={screenStyles.infoTextWrap}>
        <Text style={screenStyles.infoLabel}>{label}</Text>
        <Text style={screenStyles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={screenStyles.statCard}>
      <MaterialCommunityIcons name={icon} size={20} color="#0F766E" />
      <Text style={screenStyles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={screenStyles.statLabel}>{label}</Text>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5F3EF",
    zIndex: 20,
    elevation: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F2FFFB",
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.dark,
    fontFamily: "Georgia",
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#70869E",
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E5FBF4",
  },
  toast: {
    position: "absolute",
    top: 72,
    left: 16,
    right: 16,
    zIndex: 10,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  successToast: {
    backgroundColor: "#0F766E",
  },
  errorToast: {
    backgroundColor: "#EF4444",
  },
  toastText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  content: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 120,
    ...Platform.select({
      web: {
        paddingHorizontal: 30,
        paddingTop: 24,
      },
      default: {},
    }),
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    backgroundColor: colors.primary,
    overflow: "hidden",
    ...Platform.select({
      web: {
        minHeight: 260,
        padding: 34,
        boxShadow: "0 24px 60px rgba(124, 58, 237, 0.16)",
      },
      default: {},
    }),
  },
  heroTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  eventTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
    ...Platform.select({
      web: {
        maxWidth: 860,
        fontSize: 42,
        lineHeight: 50,
        letterSpacing: -0.8,
      },
      default: { fontFamily: "Georgia" },
    }),
  },
  eventDescription: {
    marginTop: 12,
    color: "#E8FFFA",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    ...Platform.select({
      web: {
        maxWidth: 780,
        fontSize: 15,
        lineHeight: 25,
      },
      default: {},
    }),
  },
  statsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      web: {
        minHeight: 104,
        borderRadius: 22,
        padding: 16,
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
      },
      default: {},
    }),
  },
  statValue: {
    marginTop: 8,
    color: colors.dark,
    fontSize: 17,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 3,
    color: "#70869E",
    fontSize: 11,
    fontWeight: "800",
  },
  progressCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      web: {
        padding: 20,
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
      },
      default: {},
    }),
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressTitle: {
    flex: 1,
    color: colors.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  progressPercent: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  registrationNotice: {
    marginTop: 10,
    color: "#31576C",
    fontSize: 13,
    fontWeight: "800",
  },
  detailLayout: {
    marginTop: 18,
    gap: 18,
  },
  detailLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    gap: 14,
  },
  sidebar: {
    width: "100%",
    gap: 12,
  },
  sidebarDesktop: {
    width: 330,
    flexShrink: 0,
    alignSelf: "flex-start",
    position: "sticky" as any,
    top: 18,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 13,
    ...Platform.select({
      web: { boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)" },
      default: {},
    }),
  },
  sidebarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)" },
      default: {},
    }),
  },
  sectionEyebrow: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -7,
  },
  infoCell: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 7,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoCellDesktop: {
    width: "50%",
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "Georgia",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8FF",
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: "#70869E",
    fontSize: 12,
    fontWeight: "700",
  },
  infoValue: {
    marginTop: 3,
    color: "#26465A",
    fontSize: 14,
    fontWeight: "800",
  },
  attendedNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ECFDF5",
  },
  attendedNoticeText: {
    flex: 1,
    color: "#047857",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  ratingButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  ratingButtonText: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  outlineButtonDisabled: {
    opacity: 0.45,
  },
  shareButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  shareButtonText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 13,
  },
  relatedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  relatedIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8FF",
  },
  relatedCopy: { flex: 1, minWidth: 0 },
  relatedTitle: { color: colors.dark, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  relatedDate: { color: "#94A3B8", fontSize: 10, marginTop: 2 },
  relatedEmpty: { color: "#94A3B8", fontSize: 12, paddingVertical: 6 },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EDE9FE",
    ...Platform.select({
      web: {
        paddingHorizontal: 30,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(16px)",
      } as any,
      default: {},
    }),
  },
  closedFooter: {
    width: "100%",
    maxWidth: 1148,
    alignSelf: "center",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  closedStatus: { flexDirection: "row", alignItems: "center", gap: 7 },
  closedStatusText: { color: "#475569", fontSize: 13, fontWeight: "800" },
  footerEndDate: { color: "#64748B", fontSize: 12, textAlign: "right" },
  primaryButton: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    maxWidth: 1148,
    width: "100%",
    alignSelf: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 14px 34px rgba(124, 58, 237, 0.18)",
      },
      default: {},
    }),
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9FBEF",
  },
  secondaryButtonText: {
    color: colors.dark,
    fontWeight: "900",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  centerText: {
    marginTop: 12,
    color: "#70869E",
    fontWeight: "700",
  },
  centerTitle: {
    marginTop: 12,
    color: colors.dark,
    fontSize: 17,
    fontWeight: "900",
  },
});
