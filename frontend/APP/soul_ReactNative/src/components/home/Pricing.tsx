import { useState } from "react";
import { Text, TouchableOpacity, View, Alert } from "react-native";
import { styles } from "@/styles/home.styles";
import UpgradeModal from "@/components/upgrade/UpgradeModal";
import { useAuthStore } from "@/store";

export function Pricing() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isPremium = user?.isPremium ?? false;

  return (
    <View>
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Bắt đầu với các tính năng đang có</Text>
      <Text style={styles.sectionSub}>
        SOUL hiện tập trung vào trải nghiệm miễn phí trong dự án: AI, nhật ký, bài test, sự kiện và cộng đồng.
      </Text>

      <View style={styles.pricingRow}>
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Tài khoản SOUL</Text>
          <Text style={styles.priceAmount}>0đ</Text>
          <Text style={styles.priceSub}>trong phạm vi dự án</Text>
          <TouchableOpacity style={styles.priceBtn}>
            <Text style={styles.priceBtnText}>{isPremium ? "Đã dùng" : "Bắt đầu miễn phí"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceCardPro}>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>MODULE HIỆN CÓ</Text>
          </View>
          <Text style={styles.priceTitlePro}>SOUL PRO</Text>
          <Text style={styles.priceAmountPro}>149K</Text>
          <Text style={styles.priceSub}>/tháng</Text>
          <TouchableOpacity
            style={[styles.priceBtnPro, isPremium && { opacity: 0.7 }]}
            onPress={() => !isPremium && setShowUpgrade(true)}
            disabled={isPremium}
          >
            <Text style={styles.priceBtnTextPro}>
              {isPremium ? "✓ Đang sử dụng" : "Nâng cấp ngay"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={{ alignSelf: "center", marginBottom: 32 }}>
        <Text style={{ fontSize: 14, color: "#64748B", textDecorationLine: "underline" }}>
          Phiên bản hiện tại chưa triển khai gói trả phí
        </Text>
      </TouchableOpacity>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onSuccess={() => {
          setShowUpgrade(false);
          Alert.alert("🎉 Thành công", "Bạn đã nâng cấp lên SOUL PRO thành công!");
        }}
      />
    </View>
  );
}
