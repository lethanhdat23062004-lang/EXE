import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { colors } from "@/constants/colors";
import { eventUserService } from "@/services/eventApi";
import { RatingSummary } from "@/api/ratingApi";
import {
  buildRegistrationMap,
  eventStatusMeta,
  EventRegistrationMap,
  EventStatus,
  getComputedEventStatus,
  getFillRate,
  getRemainingSlots,
  registrationMeta,
} from "@/utils/eventRegistration";

type EventFilter = "all" | EventStatus;

type CommunityEvent = {
  _id: string;
  title: string;
  description?: string | null;
  speakerName?: string | null;
  organizerName?: string | null;
  eventType?: string | null;
  startDateTime: string;
  location?: string | null;
  meetingLink?: string | null;
  capacity?: number | null;
  registeredCount?: number;
  status: EventStatus;
  ratingSummary?: RatingSummary;
};

const filters: { label: string; value: EventFilter }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
];

const typeLabels: Record<string, string> = {
  workshop: "Workshop",
  talkshow: "Talkshow",
  webinar: "Webinar",
  community_event: "Community Event",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function UserEventListScreen() {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 980;
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [registrationMap, setRegistrationMap] = useState<EventRegistrationMap>({});
  const [filter, setFilter] = useState<EventFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [eventResponse, registeredResponse] = await Promise.allSettled([
        eventUserService.getEvents({ status: "all", page: 1, limit: 100 }),
        eventUserService.getRegisteredEvents("all", 1, 100),
      ]);

      if (eventResponse.status === "fulfilled" && eventResponse.value.success) {
        setEvents(eventResponse.value.data || []);
      }

      if (
        registeredResponse.status === "fulfilled" &&
        registeredResponse.value.success
      ) {
        setRegistrationMap(buildRegistrationMap(registeredResponse.value.data || []));
      } else {
        setRegistrationMap({});
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Unable to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const counts = useMemo(() => {
    return {
      all: events.length,
      upcoming: events.filter((event) => getComputedEventStatus(event) === "upcoming").length,
      ongoing: events.filter((event) => getComputedEventStatus(event) === "ongoing").length,
      completed: events.filter((event) => getComputedEventStatus(event) === "completed").length,
      cancelled: events.filter((event) => getComputedEventStatus(event) === "cancelled").length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return events.filter((event) => {
      const searchableText = [
        event.title,
        event.description,
        event.location,
        event.speakerName,
        event.organizerName,
        event.eventType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const computedStatus = getComputedEventStatus(event);

      return (
        (filter === "all" || computedStatus === filter) &&
        (!keyword || searchableText.includes(keyword))
      );
    });
  }, [events, filter, searchText]);

  const renderEvent = ({ item }: { item: CommunityEvent }) => {
    const computedStatus = getComputedEventStatus(item);
    const eventStatus = eventStatusMeta[computedStatus] || eventStatusMeta.upcoming;
    const registration = registrationMap[item._id];
    const registrationStatus = registration?.registrationStatus
      ? registrationMeta[registration.registrationStatus]
      : null;
    const remainingSlots = getRemainingSlots(item.capacity, item.registeredCount || 0);
    const fillRate = getFillRate(item.capacity, item.registeredCount || 0);
    const capacityText =
      remainingSlots === null
        ? `${item.registeredCount || 0} registered`
        : `${item.registeredCount || 0}/${item.capacity} registered · ${remainingSlots} left`;

    return (
      <TouchableOpacity
        style={screenStyles.eventCard}
        activeOpacity={0.86}
        onPress={() =>
          router.push({
            pathname: "/user-events/[id]",
            params: { id: item._id },
          })
        }
      >
        <View style={screenStyles.cardTop}>
          <View style={screenStyles.typeIcon}>
            <MaterialCommunityIcons name="calendar-heart" size={24} color="#FF7A00" />
          </View>

          <View style={screenStyles.cardTitleWrap}>
            <Text style={screenStyles.eventTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={screenStyles.eventType}>
              {typeLabels[item.eventType || ""] || "Event"}
            </Text>
          </View>

          <View style={screenStyles.badgeColumn}>
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
          </View>
        </View>

        <Text style={screenStyles.eventDescription} numberOfLines={3}>
          {item.description ||
            "SOUL emotional wellness event for reflection and safe community support."}
        </Text>

        <View style={screenStyles.ratingRow}>
          <MaterialCommunityIcons name="star" size={17} color="#F59E0B" />
          <Text style={screenStyles.ratingValue}>
            {(item.ratingSummary?.average || 0).toFixed(1)}
          </Text>
          <Text style={screenStyles.ratingCount}>
            ({item.ratingSummary?.total || 0} đánh giá)
          </Text>
        </View>

        <View style={screenStyles.infoGrid}>
          <InfoRow icon="clock-outline" text={formatDateTime(item.startDateTime)} />
          <InfoRow
            icon="map-marker-outline"
            text={item.location || item.meetingLink || "Location not updated"}
          />
          <InfoRow icon="account-group-outline" text={capacityText} />
          <InfoRow
            icon="account-tie-outline"
            text={item.speakerName || item.organizerName || "SOUL Community"}
          />
        </View>

        {item.capacity ? (
          <View style={screenStyles.progressBlock}>
            <View style={screenStyles.progressHeader}>
              <Text style={screenStyles.progressText}>
                {item.registeredCount || 0} / {item.capacity} người tham gia
              </Text>
              <Text style={screenStyles.progressPercent}>{fillRate}%</Text>
            </View>
            <View style={screenStyles.progressTrack}>
              <View style={[screenStyles.progressFill, { width: `${fillRate}%` }]} />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <LinearGradient
        colors={["#7C3AED", "#6366F1", "#14B8A6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={screenStyles.headerShell}
      >
        <View style={screenStyles.headerContent}>
          <TouchableOpacity
            style={screenStyles.iconButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={screenStyles.headerTextWrap}>
            <Text style={screenStyles.headerTitle}>Events</Text>
            <Text style={screenStyles.headerSubtitle}>
              Emotional wellness activities
            </Text>
          </View>

          <TouchableOpacity
            style={screenStyles.iconButton}
            onPress={() => router.push("/user-events/registered")}
          >
            <MaterialCommunityIcons name="bookmark-check-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredEvents}
        key={desktop ? "desktop-events" : "mobile-events"}
        numColumns={desktop ? 2 : 1}
        columnWrapperStyle={desktop ? screenStyles.webColumnWrapper : undefined}
        keyExtractor={(item) => item._id}
        renderItem={renderEvent}
        refreshing={loading}
        onRefresh={fetchEvents}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[screenStyles.listContent, desktop && screenStyles.webListContent]}
        ListHeaderComponent={
          <View>
            <View style={screenStyles.heroCard}>
              <View style={screenStyles.heroBadge}>
                <MaterialCommunityIcons name="star-four-points" size={15} color="#FFFFFF" />
                <Text style={screenStyles.heroBadgeText}>SOUL Events</Text>
              </View>
              <Text style={screenStyles.heroTitle}>Find healing activities</Text>
              <Text style={screenStyles.heroText}>
                Explore workshops, talkshows, and community activities created for
                emotional wellness.
              </Text>
              <TouchableOpacity
                style={screenStyles.heroButton}
                onPress={() => router.push("/user-events/registered")}
              >
                <Text style={screenStyles.heroButtonText}>My registered events</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <View style={screenStyles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Tìm tên sự kiện, địa điểm, diễn giả, loại sự kiện"
                placeholderTextColor="#94A3B8"
                style={screenStyles.searchInput}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <View style={screenStyles.filterRow}>
              {filters.map((item) => {
                const active = filter === item.value;
                const count = counts[item.value];

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[screenStyles.filterButton, active && screenStyles.activeFilter]}
                    onPress={() => setFilter(item.value)}
                  >
                    <Text
                      style={[
                        screenStyles.filterText,
                        active && screenStyles.activeFilterText,
                      ]}
                    >
                      {item.label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={screenStyles.loader} />
          ) : (
            <View style={screenStyles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={62} color="#B7C8C2" />
              <Text style={screenStyles.emptyTitle}>Hiện chưa có sự kiện nào</Text>
              <Text style={screenStyles.emptyText}>
                Hãy quay lại sau khi SOUL cập nhật lịch hoạt động mới.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={screenStyles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#0F766E" />
      <Text style={screenStyles.infoText}>{text}</Text>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  ratingValue: {
    color: "#92400E",
    fontWeight: "800",
  },
  ratingCount: {
    color: "#64748B",
    fontSize: 12,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
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
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  webListContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 64,
  },
  webColumnWrapper: {
    gap: 18,
  },
  heroCard: {
    minHeight: 210,
    borderRadius: 30,
    padding: 26,
    marginBottom: 18,
    backgroundColor: "#7C3AED",
    justifyContent: "space-between",
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
    marginTop: 22,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroText: {
    marginTop: 10,
    maxWidth: 560,
    color: "#E8FFFA",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
  },
  heroButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    marginTop: 18,
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
  searchBox: {
    minHeight: 46,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  filterButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeFilter: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  activeFilterText: {
    color: colors.dark,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      web: {
        flex: 1,
        minHeight: 310,
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
      },
      default: {},
    }),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  typeIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#F3E8FF",
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  badgeColumn: {
    alignItems: "flex-end",
    gap: 6,
  },
  eventTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: colors.dark,
  },
  eventType: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  eventDescription: {
    marginTop: 13,
    color: "#466986",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  progressBlock: {
    marginTop: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  progressText: {
    color: "#31576C",
    fontSize: 12,
    fontWeight: "800",
  },
  progressPercent: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  infoGrid: {
    marginTop: 14,
    gap: 9,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: "#31576C",
    fontSize: 13,
    fontWeight: "700",
  },
  loader: {
    marginTop: 42,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "900",
    color: colors.dark,
  },
  emptyText: {
    marginTop: 7,
    maxWidth: 320,
    textAlign: "center",
    color: "#70869E",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
});
