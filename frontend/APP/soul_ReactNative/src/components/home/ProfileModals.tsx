import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { useAuthStore } from "@/store";
import DateTimePicker from "@react-native-community/datetimepicker";

type ProfileModalsProps = {
  showMyProfile: boolean;
  onCloseMyProfile: () => void;
  showEditProfile: boolean;
  onCloseEditProfile: () => void;
  // Mở trực tiếp modal Edit Profile từ bên ngoài (dùng khi bấm bút chì trong My Profile)
  onOpenEditProfile: () => void;
};

export function ProfileModals({
  showMyProfile,
  onCloseMyProfile,
  showEditProfile,
  onCloseEditProfile,
  onOpenEditProfile,
}: ProfileModalsProps) {
  const { user } = useAuthStore();
  const updateProfile = useAuthStore((state) => state.updateProfile);

  // States phục vụ biểu mẫu Edit Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Chuyển string YYYY-MM-DD thành Date object để truyền vào DateTimePicker
  const getBirthDateObject = () => {
    if (dateOfBirth) {
      const parts = dateOfBirth.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    return new Date(2000, 0, 1); // Mặc định năm 2000 nếu chưa có ngày sinh
  };

  const handleToggleDatePicker = () => {
    setShowDatePicker((prev) => !prev);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setDateOfBirth(`${year}-${month}-${day}`);
    }
  };

  // Đồng bộ thông tin người dùng từ store khi mở biểu mẫu chỉnh sửa
  const syncFormFields = () => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setGender(user.gender || "");
      setDateOfBirth(
        user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""
      );
      setAvatarUrl(user.avatarUrl || "");
      setBio(user.bio || "");
    }
  };

  useEffect(() => {
    if (showEditProfile) {
      syncFormFields();
    }
  }, [showEditProfile, user]);

  // Chuyển từ xem thông tin sang chỉnh sửa thông tin
  // Đóng My Profile trước, sau đó mở Edit Profile sau 300ms để animation mượt mà
  const handleTransitionToEdit = () => {
    onCloseMyProfile();
    setTimeout(() => {
      onOpenEditProfile();
    }, 300);
  };

  // Xử lý lưu thông tin chỉnh sửa
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Thông báo", "Họ tên không được để trống.");
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      fullName,
      phone: phone || undefined,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
      avatarUrl: avatarUrl || undefined,
      bio: bio || undefined,
    });
    setSaving(false);

    if (result.success) {
      Alert.alert("Thành công", "Thông tin cá nhân của bạn đã được cập nhật.");
      onCloseEditProfile();
    } else {
      Alert.alert("Lỗi", result.message);
    }
  };

  return (
    <>
      {/* ================= MODAL: CHI TIẾT TÀI KHOẢN (MY PROFILE) ================= */}
      <Modal
        visible={showMyProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCloseMyProfile}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onCloseMyProfile} style={styles.headerIconBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#005F56" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hồ sơ của tôi</Text>
            {/* Click nút bút chì chuyển tiếp sang Edit */}
            <TouchableOpacity 
              onPress={handleTransitionToEdit} 
              style={styles.headerIconBtn}
            >
              <MaterialCommunityIcons name="pencil-outline" size={24} color="#005F56" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Phần Header cá nhân (Avatar bên trái, Text bên phải) */}
            <View style={styles.profileHeaderBox}>
              <Image
                source={{ uri: user?.avatarUrl || "https://i.pravatar.cc/150?img=47" }}
                style={styles.profileHeaderAvatar}
              />
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileHeaderName}>{user?.fullName || "nguyet"}</Text>
                <Text style={styles.profileHeaderBio}>{user?.bio || "à nhon"}</Text>
                {user?.isPremium && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                    <MaterialCommunityIcons name="crown" size={14} color="#F59E0B" />
                    <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700", marginLeft: 4 }}>SOUL PRO</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Thẻ thông tin cá nhân nền trắng */}
            <View style={styles.detailsCard}>
              
              {/* Email */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#006B5C" style={styles.detailIcon} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{user?.email || "Chưa cung cấp"}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* Họ và Tên */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="account-outline" size={22} color="#006B5C" style={styles.detailIcon} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Họ và Tên</Text>
                  <Text style={styles.detailValue}>{user?.fullName || "Chưa cung cấp"}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* Số điện thoại */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone-outline" size={22} color="#006B5C" style={styles.detailIcon} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Số điện thoại</Text>
                  <Text style={styles.detailValue}>{user?.phone || "Chưa cung cấp"}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* Giới tính */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="gender-male-female" size={22} color="#006B5C" style={styles.detailIcon} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Giới tính</Text>
                  <Text style={styles.detailValue}>
                    {user?.gender === "male"
                      ? "Nam"
                      : user?.gender === "female"
                      ? "Nữ"
                      : user?.gender === "other"
                      ? "Khác"
                      : "Chưa xác định"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* Ngày sinh */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar-outline" size={22} color="#006B5C" style={styles.detailIcon} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Ngày sinh</Text>
                  <Text style={styles.detailValue}>
                    {user?.dateOfBirth
                      ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
                      : "Chưa cung cấp"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* Gói tài khoản */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="crown-outline" size={22} color="#006B5C" style={styles.detailIcon} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Gói tài khoản</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {user?.isPremium ? (
                      <>
                        <MaterialCommunityIcons name="crown" size={16} color="#F59E0B" />
                        <Text style={[styles.detailValue, { color: "#F59E0B", fontWeight: "700" }]}>SOUL PRO</Text>
                      </>
                    ) : (
                      <Text style={styles.detailValue}>Miễn phí</Text>
                    )}
                  </View>
                </View>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ================= MODAL: CHỈNH SỬA HỒ SƠ (EDIT PROFILE) ================= */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCloseEditProfile}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onCloseEditProfile} style={styles.headerIconBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#005F56" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#006B5C" size="small" />
              ) : (
                <Text style={styles.headerSaveBtn}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              
              {/* Phần Avatar tròn lớn có Camera Badge */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarLargeWrapper}>
                  <Image
                    source={{ uri: avatarUrl || user?.avatarUrl || "https://i.pravatar.cc/150?img=47" }}
                    style={styles.avatarLarge}
                  />
                  <View style={styles.cameraBadge}>
                    <MaterialCommunityIcons name="camera-outline" size={18} color="#006B5C" />
                  </View>
                </View>
                <Text style={styles.avatarCaption}>
                  Thêm ảnh đại diện giúp bạn bè dễ nhận ra bạn hơn
                </Text>
              </View>

              {/* Họ tên */}
              <Text style={styles.inputLabel}>Họ và Tên *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ tên đầy đủ"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Bio */}
              <Text style={styles.inputLabel}>Bio</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Viết đôi dòng giới thiệu về bản thân..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Số điện thoại */}
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Giới tính */}
              <Text style={styles.inputLabel}>Giới tính</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    gender === "male" && styles.genderOptionActive,
                  ]}
                  onPress={() => setGender("male")}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === "male" && styles.genderTextActive,
                    ]}
                  >
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    gender === "female" && styles.genderOptionActive,
                  ]}
                  onPress={() => setGender("female")}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === "female" && styles.genderTextActive,
                    ]}
                  >
                    Nữ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    gender === "other" && styles.genderOptionActive,
                  ]}
                  onPress={() => setGender("other")}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === "other" && styles.genderTextActive,
                    ]}
                  >
                    Khác
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ngày sinh */}
              <Text style={styles.inputLabel}>Ngày sinh (YYYY-MM-DD)</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={handleToggleDatePicker}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: "#0F172A" }]}
                  value={dateOfBirth}
                  editable={false}
                  pointerEvents="none"
                  placeholder="Chọn ngày sinh"
                  placeholderTextColor="#94A3B8"
                />
              </TouchableOpacity>

              {showDatePicker && (
                <View style={Platform.OS === "ios" ? styles.iosPickerContainer : null}>
                  <DateTimePicker
                    value={getBirthDateObject()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.iosDoneButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.iosDoneButtonText}>Xong</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Link ảnh đại diện */}
              <Text style={styles.inputLabel}>Đường dẫn ảnh đại diện (URL)</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="link-variant"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  placeholder="Dán link ảnh tại đây (http://...)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </View>

              {/* Nút to dưới cùng: Lưu thay đổi */}
              <TouchableOpacity
                style={[styles.saveButtonLarge, saving && styles.saveButtonLargeDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="content-save-outline"
                      size={20}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.saveButtonLargeText}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#F2FFFB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2F2ED",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#004C43",
  },
  headerIconBtn: {
    padding: 6,
  },
  headerSaveBtn: {
    fontSize: 16,
    color: "#006B5C",
    fontWeight: "800",
    paddingHorizontal: 8,
  },
  modalScroll: {
    padding: 20,
  },
  
  // Giao diện Hồ sơ của tôi (My Profile)
  profileHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  profileHeaderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#E2F2ED",
    backgroundColor: "#E2F2ED",
  },
  profileHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  profileHeaderName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  profileHeaderBio: {
    fontSize: 15,
    color: "#64748B",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#006B5C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2F2ED",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  detailIcon: {
    marginRight: 16,
  },
  detailTextGroup: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#006B5C",
    fontWeight: "700",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  // Giao diện Chỉnh sửa hồ sơ (Edit Profile)
  formContainer: {
    width: "100%",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarLargeWrapper: {
    position: "relative",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E2F2ED",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCaption: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  genderOptionActive: {
    borderColor: "#006B5C",
    backgroundColor: "#E0F7EF",
  },
  genderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  genderTextActive: {
    color: "#006B5C",
    fontWeight: "800",
  },
  saveButtonLarge: {
    flexDirection: "row",
    backgroundColor: "#006B5C",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 40,
    shadowColor: "#006B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonLargeDisabled: {
    backgroundColor: "#94A3B8",
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  iosPickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },
  iosDoneButton: {
    marginTop: 8,
    backgroundColor: "#006B5C",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "stretch",
    alignItems: "center",
  },
  iosDoneButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
