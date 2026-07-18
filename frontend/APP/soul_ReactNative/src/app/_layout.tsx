import { useEffect } from "react";
import { Stack } from "expo-router";
import { registerAlertOverride, CustomAlert } from "@/components/ui/CustomAlert";

export default function RootLayout() {
  useEffect(() => {
    registerAlertOverride();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="user-events" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="diary/index" />
      </Stack>
      <CustomAlert />
    </>
  );
}
