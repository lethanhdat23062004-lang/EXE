import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { EventSchedulePicker } from "@/components/ui/EventSchedulePicker";
import { colors } from "@/constants/colors";
import { eventAdminService } from "@/services/eventApi";
import { styles } from "@/styles/admin-events.styles";

const eventTypes = [
  { label: "Workshop", value: "workshop", icon: "tag-outline" },
  { label: "Talkshow", value: "talkshow", icon: "microphone-outline" },
  { label: "Webinar", value: "webinar", icon: "video-outline" },
  { label: "Community Event", value: "community_event", icon: "account-group-outline" },
] as const;

const toTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

const hasStartTimeChanged = (current: string, original: string) => {
  const currentTime = toTime(current);
  const originalTime = toTime(original);
  if (currentTime === null) return false;
  if (originalTime === null) return true;
  return currentTime !== originalTime;
};

export default function AdminEditEvent() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archived, setArchived] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [originalStartDateTime, setOriginalStartDateTime] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "workshop",
    location: "",
    startDateTime: "",
    endDateTime: "",
    capacity: "",
  });

  const selectedType = eventTypes.find((type) => type.value === formData.eventType) || eventTypes[0];
  const showAlert = useCallback((title: string, message: string, onOk?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
  }, []);
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventAdminService.getEventById(id as string);
        if (response.success && response.data) {
          const ev = response.data;
          setArchived(Boolean(ev.isArchived));
          setFormData({
            title: ev.title || "",
            description: ev.description || "",
            eventType: ev.eventType || "workshop",
            location: ev.location || "",
            startDateTime: ev.startDateTime || "",
            endDateTime: ev.endDateTime || "",
            capacity: ev.capacity ? ev.capacity.toString() : "",
          });
          setOriginalStartDateTime(ev.startDateTime || "");
        } else {
          showAlert("Lỗi", "Không tìm thấy sự kiện", () => router.back());
        }
      } catch (error: any) {
        showAlert("Lỗi", error.message || "Không thể tải thông tin sự kiện", () => router.back());
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, showAlert]);

  const handleScheduleChange = useCallback(
    (schedule: { startDateTime: string; endDateTime: string }) => {
      setFormData((current) => ({
        ...current,
        startDateTime: schedule.startDateTime,
        endDateTime: schedule.endDateTime,
      }));
    },
    []
  );

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.startDateTime.trim()) {
      showAlert("Lỗi", "Vui lòng nhập tiêu đề và chọn lịch diễn ra");
      return;
    }

    const startTime = toTime(formData.startDateTime);
    if (
      startTime !== null &&
      startTime < Date.now() &&
      hasStartTimeChanged(formData.startDateTime, originalStartDateTime)
    ) {
      showAlert("Lỗi", "Giờ bắt đầu đã qua so với thời điểm hiện tại, vui lòng chọn thời gian khác");
      return;
    }

    setSaving(true);
    try {
      const response = await eventAdminService.updateEvent(id as string, formData);
      if (response.success) {
        showAlert("Thành công", "Đã cập nhật sự kiện", () => router.back());
      } else {
        showAlert("Lỗi", response.message || "Không thể cập nhật sự kiện");
      }
    } catch (error: any) {
      showAlert("Lỗi", error.message || "Đã xảy ra lỗi khi cập nhật sự kiện");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.eventShell}>
        <View style={styles.managementLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.managementEmptyText}>Đang tải thông tin sự kiện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (archived) {
    return (
      <SafeAreaView style={styles.eventShell}>
        <View style={styles.managementLoading}>
          <MaterialCommunityIcons name="archive-lock-outline" size={46} color={colors.primary} />
          <Text style={styles.managementEmptyTitle}>Sự kiện đã được lưu trữ</Text>
          <Text style={styles.managementEmptyText}>
            Hãy khôi phục sự kiện trong trang chi tiết trước khi chỉnh sửa.
          </Text>
          <TouchableOpacity style={styles.eventPrimaryButton} onPress={() => router.back()}>
            <Text style={styles.eventPrimaryButtonText}>Quay lại chi tiết</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.eventShell}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.eventFormPage} showsVerticalScrollIndicator={false}>
          <View style={styles.eventSimpleHeader}>
            <TouchableOpacity style={styles.eventBackLink} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.eventSimpleTitle}>Chỉnh sửa sự kiện</Text>
          </View>

          <View style={styles.eventFormCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề sự kiện <Text style={styles.requiredMark}>*</Text></Text>
              <TextInput
                style={styles.eventCleanInput}
                placeholder="VD: Workshop Vượt Qua Lo Âu"
                placeholderTextColor={colors.textMuted}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loại sự kiện</Text>
              <TouchableOpacity
                style={styles.eventSelectButton}
                disabled={saving}
                onPress={() => setTypeOpen((current) => !current)}
              >
                <MaterialCommunityIcons name={selectedType.icon} size={18} color={colors.textSecondary} />
                <Text style={styles.eventSelectText}>{selectedType.label}</Text>
                <MaterialCommunityIcons name={typeOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.dark} />
              </TouchableOpacity>
              {typeOpen ? (
                <View style={styles.eventTypeMenu}>
                  {eventTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.eventTypeOption,
                        formData.eventType === type.value && styles.eventTypeOptionActive,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, eventType: type.value });
                        setTypeOpen(false);
                      }}
                    >
                      <MaterialCommunityIcons name={type.icon} size={17} color={colors.primary} />
                      <Text style={styles.eventTypeOptionText}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lịch diễn ra <Text style={styles.requiredMark}>*</Text></Text>
              <EventSchedulePicker
                disabled={saving}
                initialStartDateTime={formData.startDateTime}
                initialEndDateTime={formData.endDateTime}
                onChange={handleScheduleChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa điểm / Link online</Text>
              <View style={styles.eventIconInput}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.eventIconTextInput}
                  placeholder="Phòng A1, ĐH FPT / Zoom link"
                  placeholderTextColor={colors.textMuted}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sức chứa (số người tối đa)</Text>
              <View style={styles.eventIconInput}>
                <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.eventIconTextInput}
                  placeholder="50"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={formData.capacity}
                  onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <View style={[styles.eventIconInput, styles.eventDescriptionInput]}>
                <MaterialCommunityIcons name="format-align-left" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.eventIconTextInput, styles.eventDescriptionText]}
                  placeholder="Thông tin chi tiết về sự kiện..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  editable={!saving}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.eventPrimaryButton, saving && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.eventPrimaryButtonText}>
                {saving ? "Đang lưu..." : "Cập nhật sự kiện"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
