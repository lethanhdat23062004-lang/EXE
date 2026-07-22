import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/colors";

type Props = {
  onCreatePress: () => void;
  onReportsPress?: () => void;
  onBackPress?: () => void;
};

export function ForumHeader({
  onCreatePress,
  onReportsPress,
  onBackPress,
}: Props) {
  return (
    <LinearGradient
      colors={["#7C3AED", "#6366F1", "#14B8A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerShell}
    >
      <View style={styles.headerContent}>
        {onBackPress ? (
          <Pressable
            style={styles.iconButton}
            onPress={onBackPress}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
        ) : null}

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Healing Forum</Text>
          <Text style={styles.headerSubtitle}>
            A safe space to share, support and grow together 🌿
          </Text>
        </View>

        <View style={styles.headerActions}>
          {onReportsPress && (
            <Pressable
              style={styles.iconButton}
              onPress={onReportsPress}
            >
              <MaterialCommunityIcons name="flag-outline" size={20} color="#FFFFFF" />
            </Pressable>
          )}

          <Pressable
            style={styles.iconButton}
            onPress={onCreatePress}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});