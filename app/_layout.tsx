import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      // Verificar se o usuário está logado e redirecionar adequadamente
      if (!isAuthenticated) {
        router.replace("/LoginScreen");
      }
    }
  }, [loaded, isAuthenticated]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { paddingTop: 30, backgroundColor: "#fff" }, // Add padding to avoid content overlapping with the status bar
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
