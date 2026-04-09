import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

/**
 * Start Task Screen
 * This component introduces the task to the user and displays instructions.
 * Path: Frontend/app/start-task.tsx
 */
export default function StartTaskScreen() {
  const router = useRouter();

  // --- Animation Hooks ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // Run screen entrance animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Interactive Button animations
  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleStart = () => {
    router.push('/task-detail');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Main Animated Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Playful Floating Graphic */}
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>🤫</Text>
        </View>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>Daily Task</Text>
        </View>

        <Text style={styles.title}>Sit without phone</Text>
        <Text style={styles.duration}>1 Hour</Text>
        <Text style={styles.subtitle}>Lock-screen observation mode</Text>

        {/* Premium Information Card */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why this matters:</Text>

          <View style={styles.pointsRow}>
            <Feather name="check-circle" size={18} color="#8b5cf6" />
            <Text style={styles.pointsText}>Earn 200 points after completion</Text>
          </View>

          <View style={[styles.pointsRow, { marginTop: 15 }]}>
            <Feather name="shield" size={18} color="#10b981" />
            <Text style={styles.pointsText}>Builds mental resilience & focus</Text>
          </View>
        </View>

      </Animated.View>

      {/* Bottom Floating Action Area */}
      <View style={styles.bottomArea}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={styles.startBtn}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleStart}
            activeOpacity={0.9}
          >
            <Text style={styles.startBtnText}>Start 1-Hour Timer</Text>
            <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, color: '#1f2937', marginLeft: 8, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 25 },
  emojiCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ea580c', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, elevation: 4,
  },
  emoji: { fontSize: 60 },
  dayPill: {
    backgroundColor: '#f3e8ff', paddingHorizontal: 20, paddingVertical: 6,
    borderRadius: 20, marginTop: -15, borderWidth: 3, borderColor: '#ffffff',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  dayPillText: { color: '#9333ea', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f2937', marginTop: 30, textAlign: 'center' },
  duration: { fontSize: 18, fontWeight: '700', color: '#8b5cf6', marginTop: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 8, fontWeight: '500' },
  infoBox: {
    backgroundColor: '#faf5ff', width: '100%', borderRadius: 20,
    padding: 24, marginTop: 45, borderWidth: 1, borderColor: '#ede9fe',
  },
  infoTitle: { color: '#1f2937', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  pointsRow: { flexDirection: 'row', alignItems: 'center' },
  pointsText: { color: '#4b5563', fontSize: 15, marginLeft: 12, fontWeight: '500' },
  bottomArea: { padding: 25, paddingBottom: 40 },
  startBtn: {
    backgroundColor: '#6A61FF', width: '100%', paddingVertical: 18, flexDirection: 'row', justifyContent: 'center',
    borderRadius: 20, alignItems: 'center', shadowColor: '#6A61FF', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6
  },
  startBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700' }
});
