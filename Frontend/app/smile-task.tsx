import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SmileTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#fafafa" />

      <View style={styles.content}>
        {/* Emoji */}
        <Text style={styles.heroEmoji}>😊</Text>

        {/* Day Pill */}
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>Day</Text>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.mainTitle}>Smile intentionally</Text>
        <Text style={styles.subtitle}>Self-confirm button</Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why this matters:</Text>
          <View style={styles.rewardRow}>
            <Feather name="check-circle" size={18} color="#a855f7" />
            <Text style={styles.rewardText}>Earn 100 points after completion</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Start Task Button */}
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.85}
          onPress={() => router.push('/smile-confirm' as any)}
        >
          <LinearGradient
            colors={['#a855f7', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.startText}>Start Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 100,
    marginBottom: 16,
  },
  dayPill: {
    backgroundColor: '#f3e8ff',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 28,
  },
  dayPillText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 36,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  infoTitle: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 14,
    fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    marginLeft: 10,
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
