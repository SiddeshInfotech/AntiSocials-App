import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { apiFetch } from '../constants/Api';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          try {
            const res = await apiFetch('/api/life-score', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              const isCompleted = Boolean(
                data.quiz_completed ||
                data.quizCompleted ||
                data.data?.quiz_completed ||
                data.data?.quizCompleted
              );
              if (!isCompleted) {
                router.replace('/life-experience-quiz' as any);
                return;
              }
            }
          } catch (scoreErr) {
            console.warn('Index quiz status check error:', scoreErr);
          }
          router.replace('/(tabs)' as any);
        } else {
          router.replace('/welcome' as any);
        }
      } catch (err) {
        console.error('Check auth error:', err);
        router.replace('/welcome' as any);
      }
    }
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8B00FF' }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}
