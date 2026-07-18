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
            <Stack.Screen name="groundingBreath" options={{ headerShown: false }} />
            <Stack.Screen name="groupEnergy" options={{ headerShown: false }} />
            <Stack.Screen name="fear" options={{ headerShown: false }} />
            <Stack.Screen name="release" options={{ headerShown: false }} />
            <Stack.Screen name="hardest" options={{ headerShown: false }} />
            <Stack.Screen name="deep" options={{ headerShown: false }} />
             <Stack.Screen name="observe-emotion" options={{ headerShown: false }} />
            <Stack.Screen name="cleanup-task" options={{ headerShown: false }} />
            <Stack.Screen name="group-trip" options={{ headerShown: false }} />
            <Stack.Screen name="gratitude" options={{ headerShown: false }} />
            <Stack.Screen name="learning2" options={{ headerShown: false }} />
            <Stack.Screen name="ask" options={{ headerShown: false }} />
            <Stack.Screen name="negativeThought" options={{ headerShown: false }} />
            <Stack.Screen name="positiveThought" options={{ headerShown: false }} />
            <Stack.Screen name="silent" options={{ headerShown: false }} />
            <Stack.Screen name="stillness" options={{ headerShown: false }} />
            <Stack.Screen name="reflect" options={{ headerShown: false }} />
            <Stack.Screen name="recurringThought" options={{ headerShown: false }} />
            <Stack.Screen name="note" options={{ headerShown: false }} />
            <Stack.Screen name="label" options={{ headerShown: false }} />
            <Stack.Screen name="imagnimation" options={{ headerShown: false }} />
            <Stack.Screen name="resume" options={{ headerShown: false }} />
            <Stack.Screen name="surround" options={{ headerShown: false }} />
            <Stack.Screen name="social" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
