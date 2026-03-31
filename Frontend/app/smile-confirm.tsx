import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SmileConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const btnScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      router.replace({ pathname: '/task-success', params: { points: '100' } } as any);
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />

      <View style={styles.content}>
        <Text style={styles.instruction}>After completing this task, confirm below.</Text>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={handlePress}>
            <Text style={styles.confirmText}>I completed this</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 36,
    fontWeight: '400',
  },
  confirmBtn: {
    backgroundColor: '#8b22f6',
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 40,
    shadowColor: '#8b22f6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
