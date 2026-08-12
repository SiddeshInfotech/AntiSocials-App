import { Tabs, useRouter, usePathname, useSegments } from "expo-router";
import React, { useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { HapticTab } from "@/components/haptic-tab";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TAB_CONFIG = [
  { name: "index", route: "/(tabs)" },
  { name: "activities", route: "/(tabs)/activities" },
  { name: "people", route: "/(tabs)/people" },
  { name: "stories", route: "/(tabs)/stories" },
  { name: "profile", route: "/(tabs)/profile" },
] as const;

function getActiveTabIndex(segments: string[], pathname: string): number {
  if (segments && segments.length > 1 && segments[0] === "(tabs)") {
    const tabName = segments[1];
    const idx = TAB_CONFIG.findIndex((t) => t.name === tabName);
    if (idx !== -1) return idx;
  }
  const clean = pathname.replace(/^\/\(tabs\)/, "").replace(/^\//, "").split("/")[0];
  const idx = TAB_CONFIG.findIndex((t) => t.name === (clean || "index"));
  if (idx !== -1) return idx;
  return 0;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const currentTabIndex = getActiveTabIndex(segments, pathname);
  const currentIndexRef = useRef(currentTabIndex);
  currentIndexRef.current = currentTabIndex;

  const isNavigatingRef = useRef(false);

  const navigateToTab = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= TAB_CONFIG.length) return;
      if (isNavigatingRef.current) return;

      isNavigatingRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.navigate(TAB_CONFIG[targetIndex].route as any);

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 350);
    },
    [router]
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-18, 18])
    .runOnJS(true)
    .onEnd((event) => {
      const { translationX, translationY, velocityX } = event;

      // Ensure the swipe is predominantly horizontal
      if (Math.abs(translationX) < Math.abs(translationY) * 1.3) {
        return;
      }

      // Check distance threshold or velocity flick
      const isSwipeLeft = translationX < -45 || velocityX < -350;  // Right-to-Left swipe -> forward
      const isSwipeRight = translationX > 45 || velocityX > 350; // Left-to-Right swipe -> backward

      const currentIdx = currentIndexRef.current;

      if (isSwipeLeft) {
        // Move Forward: Home -> Community -> Connect -> Stories -> Profile
        if (currentIdx < TAB_CONFIG.length - 1) {
          navigateToTab(currentIdx + 1);
        }
      } else if (isSwipeRight) {
        // Move Backward: Profile -> Stories -> Connect -> Community -> Home
        if (currentIdx > 0) {
          navigateToTab(currentIdx - 1);
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            animation: "shift",
            tabBarActiveTintColor: "#9333EA", // Purple active color as in design
            tabBarInactiveTintColor: "#6B7280",
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              borderTopWidth: 1,
              borderTopColor: "#E5E7EB",
              height: 60 + insets.bottom,
              paddingBottom: 8 + insets.bottom,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "500",
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <Feather size={24} name="home" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="activities"
            options={{
              title: "Community",
              tabBarIcon: ({ color }) => (
                <Feather size={24} name="globe" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="people"
            options={{
              title: "Connect",
              tabBarIcon: ({ color }) => (
                <Feather size={24} name="users" color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="stories"
            options={{
              title: "Stories",
              tabBarIcon: ({ color }) => (
                <Feather size={24} name="book" color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) => (
                <Feather size={24} name="user" color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

