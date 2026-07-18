import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { Alert as RNAlert, AlertButton } from "react-native";

type AlertConfig = {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
};

let alertListener: ((config: AlertConfig) => void) | null = null;
// Override Alert.alert globally
export const registerAlertOverride = () => {
  RNAlert.alert = (title, message, buttons) => {
    if (alertListener) {
      alertListener({
        visible: true,
        title: title || "",
        message: message || "",
        buttons: buttons || [],
      });
    } else {
      console.warn("CustomAlert listener not set. Falling back to console.");
      console.log(`Alert: ${title} - ${message}`);
    }
  };

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert = (message?: any) => {
      const str = String(message || "");
      const colonIndex = str.indexOf(":");
      if (colonIndex !== -1 && colonIndex < 25) {
        const title = str.slice(0, colonIndex).trim();
        const msg = str.slice(colonIndex + 1).trim();
        RNAlert.alert(title, msg);
      } else {
        RNAlert.alert("", str);
      }
    };
  }
};
export function CustomAlert() {
  const [config, setConfig] = useState<AlertConfig>({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    alertListener = (newConfig) => {
      setConfig(newConfig);
    };
    return () => {
      alertListener = null;
    };
  }, []);

  if (!config.visible) return null;

  const handlePress = (onPress?: () => void) => {
    setConfig((prev) => ({ ...prev, visible: false }));
    onPress?.();
  };

  const { title, message, buttons } = config;

  // Detect type of alert from title/message contents
  const isSuccess = /thành công|thành công!|success|ok/i.test(title) || /thành công|thành công!|success/i.test(message);
  const isError = /lỗi|thất bại|cảnh báo|error/i.test(title) || /lỗi|thất bại|cảnh báo|error/i.test(message);

  let iconStyle: {
    name: any;
    color: string;
    bg: string;
  } = {
    name: "information-outline",
    color: colors.primary,
    bg: colors.primaryBg,
  };

  if (isSuccess) {
    iconStyle = {
      name: "check",
      color: colors.success,
      bg: "#ECFDF5", // Light emerald/green
    };
  } else if (isError) {
    iconStyle = {
      name: "alert-circle-outline",
      color: colors.error,
      bg: colors.errorBg,
    };
  }

  // If no buttons are provided, default to a single "Đã hiểu" button
  const alertButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: "Đã hiểu", onPress: () => {} }];

  return (
    <Modal
      transparent
      visible={config.visible}
      animationType="fade"
      onRequestClose={() => handlePress()}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => handlePress()} />
        <View style={styles.card}>
          {/* Icon Circle */}
          <View style={[styles.iconContainer, { backgroundColor: iconStyle.bg }]}>
            <MaterialCommunityIcons name={iconStyle.name} size={22} color={iconStyle.color} />
          </View>

          {/* Title */}
          {!!title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          {!!message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons Row / Column */}
          <View style={[
            styles.buttonContainer,
            alertButtons.length === 2 ? styles.buttonRow : styles.buttonCol
          ]}>
            {alertButtons.map((btn, index) => {
              const isCancel = btn.style === "cancel" || (alertButtons.length === 2 && index === 0);
              const isDestructive = btn.style === "destructive";

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel
                      ? styles.cancelButton
                      : isDestructive
                      ? styles.destructiveButton
                      : styles.primaryButton,
                    alertButtons.length === 2 && { flex: 1 }
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel
                      ? styles.cancelButtonText
                      : styles.primaryButtonText
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "flex-start",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    fontFamily: Platform.select({ web: "'Lexend', system-ui", default: undefined }),
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: Platform.select({ web: "'Inter', system-ui", default: undefined }),
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  buttonRow: {
    flexDirection: "row",
  },
  buttonCol: {
    flexDirection: "column",
  },
  button: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Platform.select({ web: "'Lexend', system-ui", default: undefined }),
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
});
