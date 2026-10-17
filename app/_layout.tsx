import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded && !isAuthenticated) {
      router.replace("/LoginScreen");
    }
  }, [loaded, isAuthenticated]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          {/* Authentication */}
          <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />

          {/* Main App */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Problem Related Screens */}
          <Stack.Screen
            name="ProblemDetailsScreen"
            options={{ headerShown: false }}
          />

          {/* Profile Action Screens */}
          <Stack.Screen name="HistoryScreen" options={{ headerShown: false }} />
          <Stack.Screen name="RankingScreen" options={{ headerShown: false }} />
          <Stack.Screen
            name="PointsGuideScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SettingsScreen"
            options={{ headerShown: false }}
          />

          {/* Error Handling */}
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
