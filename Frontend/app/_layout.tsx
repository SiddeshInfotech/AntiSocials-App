import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="your-interests" options={{ headerShown: false }} />
            <Stack.Screen name="privacy-settings" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="create-activity" options={{ headerShown: false }} />
            <Stack.Screen name="write-task" options={{ headerShown: false }} />
            <Stack.Screen name="share-thoughts" options={{ headerShown: false }} />
            <Stack.Screen name="task-success" options={{ headerShown: false }} />
            <Stack.Screen name="smile-task" options={{ headerShown: false }} />
            <Stack.Screen name="smile-confirm" options={{ headerShown: false }} />
            <Stack.Screen name="offline-time" options={{ headerShown: false }} />
            <Stack.Screen name="call-friend" options={{ headerShown: false }} />
            <Stack.Screen name="meet-task" options={{ headerShown: false }} />
            <Stack.Screen name="outside-task" options={{ headerShown: false }} />
            <Stack.Screen name="drink-task" options={{ headerShown: false }} />
            <Stack.Screen name="start-task" options={{ headerShown: false }} />
            <Stack.Screen name="start-exercise" options={{ headerShown: false }} />
            <Stack.Screen name="task-detail" options={{ headerShown: false }} />
            <Stack.Screen name="task-complete" options={{ headerShown: false }} />
            <Stack.Screen name="exercise-complete" options={{ headerShown: false }} />
            <Stack.Screen name="exercise-detail" options={{ headerShown: false }} />
            <Stack.Screen name="drink-active" options={{ headerShown: false }} />
            <Stack.Screen name="help-intro" options={{ headerShown: false }} />
            <Stack.Screen name="help-task" options={{ headerShown: false }} />
            <Stack.Screen name="help-complete" options={{ headerShown: false }} />
            <Stack.Screen name="volunteer-interest" options={{ headerShown: false }} />
            <Stack.Screen name="volunteer-task" options={{ headerShown: false }} />
            <Stack.Screen name="breath-task" options={{ headerShown: false }} />
            <Stack.Screen name="cleanup-task" options={{ headerShown: false }} />
            <Stack.Screen name="group-trip" options={{ headerShown: false }} />
            <Stack.Screen name="eye-rest-task" options={{ headerShown: false }} />
            <Stack.Screen name="uncomfortable-task" options={{ headerShown: false }} />
            <Stack.Screen name="discomfort-task" options={{ headerShown: false }} />
            <Stack.Screen name="fear-task" options={{ headerShown: false }} />
            <Stack.Screen name="self-talk-task" options={{ headerShown: false }} />
            <Stack.Screen name="courage-task" options={{ headerShown: false }} />
            <Stack.Screen name="say-hello-task" options={{ headerShown: false }} />
            <Stack.Screen name="say-hello-to-3-people-task" options={{ headerShown: false }} />
            <Stack.Screen name="thoughtful-message-task" options={{ headerShown: false }} />
            <Stack.Screen name="ask-question-task" options={{ headerShown: false }} />
            <Stack.Screen name="initiate-conversations-task" options={{ headerShown: false }} />
            <Stack.Screen name="stay-in-social-space-task" options={{ headerShown: false }} />
            <Stack.Screen name="presence-task" options={{ headerShown: false }} />
            <Stack.Screen name="walk-outside-task" options={{ headerShown: false }} />
            <Stack.Screen name="eye-contact-task" options={{ headerShown: false }} />
            <Stack.Screen name="eat-meal-task" options={{ headerShown: false }} />
            <Stack.Screen name="message-task" options={{ headerShown: false }} />
            <Stack.Screen name="sit-near-people-task" options={{ headerShown: false }} />
            <Stack.Screen name="reflection-feel-task" options={{ headerShown: false }} />
            <Stack.Screen name="ask-about-day-task" options={{ headerShown: false }} />
            <Stack.Screen name="observe-fear-task" options={{ headerShown: false }} />
            <Stack.Screen name="share-personal-task" options={{ headerShown: false }} />
            <Stack.Screen name="handle-silence-task" options={{ headerShown: false }} />
            <Stack.Screen name="no-escape-task" options={{ headerShown: false }} />
            <Stack.Screen name="initiate-naturally-task" options={{ headerShown: false }} />
            <Stack.Screen name="curiosity-task" options={{ headerShown: false }} />
            <Stack.Screen name="authenticity-task" options={{ headerShown: false }} />
            <Stack.Screen name="stage2-final-task" options={{ headerShown: false }} />
            <Stack.Screen name="emotion-tide-task" options={{ headerShown: false }} />
            <Stack.Screen name="join-group-task" options={{ headerShown: false }} />
            <Stack.Screen name="stay-15m-task" options={{ headerShown: false }} />
            <Stack.Screen name="name-badge-task" options={{ headerShown: false }} />
            <Stack.Screen name="social-observer-task" options={{ headerShown: false }} />
            <Stack.Screen name="location-checkin-task" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
