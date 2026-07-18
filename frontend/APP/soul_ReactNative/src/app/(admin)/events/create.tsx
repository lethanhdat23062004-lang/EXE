import React, { useCallback, useState } from "react";
import {
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
import { router } from "expo-router";
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

const isStartTimeInPast = (value: string) => {
  const startTime = new Date(value).getTime();
  return Number.isFinite(startTime) && startTime < Date.now();
};

export default function AdminCreateEvent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "workshop",
    location: "",
    startDateTime: "",
    endDateTime: "",
    capacity: "",
  });
  const [typeOpen, setTypeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedType = eventTypes.find((type) => type.value === formData.eventType) || eventTypes[0];
  const showAlert = (title: string, message: string, onOk?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
  };
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
    if (submitting) return;

    if (!formData.title.trim()) {
      showAlert("Lỗi", "Vui lòng nhập tiêu đề sự kiện");
      return;
    }

    if (!formData.startDateTime.trim()) {
      showAlert("Lỗi", "Vui lòng chọn ngày và giờ bắt đầu");
      return;
    }

    if (isStartTimeInPast(formData.startDateTime)) {
      showAlert("Lỗi", "Giờ bắt đầu đã qua so với thời điểm hiện tại, vui lòng chọn thời gian khác");
      return;
    }

    setSubmitting(true);
    try {
      const response = await eventAdminService.createEvent(formData);

      if (response.success) {
        router.replace("/(admin)/events");
        if (Platform.OS !== "web") {
          Alert.alert("Thành công", "Đã tạo sự kiện mới thành công!");
        }
      } else {
        showAlert("Lỗi", response.message || "Không thể tạo sự kiện");
      }
    } catch (error: any) {
      showAlert("Lỗi tạo sự kiện", error?.message || "Đã xảy ra lỗi khi tạo sự kiện");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.eventShell}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.eventFormPage} showsVerticalScrollIndicator={false}>
          <View style={styles.eventSimpleHeader}>
            <TouchableOpacity style={styles.eventBackLink} onPress={() => router.replace("/(admin)/events")}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.eventSimpleTitle}>Tạo sự kiện mới</Text>
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
                editable={!submitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loại sự kiện</Text>
              <TouchableOpacity
                style={styles.eventSelectButton}
                disabled={submitting}
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
              <EventSchedulePicker emptyByDefault disabled={submitting} onChange={handleScheduleChange} />
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
                  editable={!submitting}
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
                  editable={!submitting}
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
                  editable={!submitting}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.eventPrimaryButton, submitting && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.eventPrimaryButtonText}>
                {submitting ? "Đang lưu..." : "Lưu sự kiện"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
