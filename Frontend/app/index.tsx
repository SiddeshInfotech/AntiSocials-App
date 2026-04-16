import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        router.replace('/(tabs)' as any);
      } else {
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
