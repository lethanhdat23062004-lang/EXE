import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/store";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpgradeModal({ visible, onClose, onSuccess }: UpgradeModalProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [upgrading, setUpgrading] = useState(false);
  const upgradeAccount = useAuthStore((state) => state.upgradeAccount);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (visible) {
      setTimeLeft(60);
      setUpgrading(false);
      isProcessingRef.current = false;

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            triggerUpgrade();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const triggerUpgrade = async () => {
    // Prevent double-call from timer + button press
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setUpgrading(true);
    const res = await upgradeAccount();
    setUpgrading(false);

    if (res.success) {
      onSuccess();
    } else {
      isProcessingRef.current = false;
      Alert.alert("Lỗi", "Không thể nâng cấp tài khoản: " + res.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={upgrading}>
            <MaterialCommunityIcons name="close" size={24} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.title}>Nâng cấp SOUL Premium</Text>
          <Text style={styles.subtitle}>
            Trải nghiệm không giới hạn số lượt chat cùng AI. Thanh toán 1 lần duy nhất!
          </Text>
          <Text style={styles.price}>149,000 VND</Text>

          <View style={styles.qrContainer}>
            <Image
              source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" }}
              style={styles.qrImage}
            />
            <View style={styles.qrOverlay}>
              <MaterialCommunityIcons name="line-scan" size={40} color="rgba(124, 58, 237, 0.3)" />
            </View>
          </View>

          <View style={styles.timerContainer}>
            {upgrading ? (
              <ActivityIndicator color="#7C3AED" size="small" />
            ) : (
              <Text style={styles.timerText}>
                Tự động xác nhận thành công sau <Text style={styles.timerHighlight}>{timeLeft}s</Text>
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.simulateBtn}
            onPress={triggerUpgrade}
            disabled={upgrading}
          >
            <Text style={styles.simulateText}>
              {upgrading ? "Đang nâng cấp..." : "Tôi đã thanh toán xong"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
    }),
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7C3AED",
    marginBottom: 20,
  },
  qrContainer: {
    width: 200,
    height: 200,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    position: "relative",
  },
  qrImage: {
    width: 180,
    height: 180,
    opacity: 0.9,
  },
  qrOverlay: {
    position: "absolute",
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    height: 24,
  },
  timerText: {
    fontSize: 14,
    color: "#475569",
  },
  timerHighlight: {
    fontWeight: "bold",
    color: "#EF4444",
  },
  simulateBtn: {
    width: "100%",
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  simulateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
