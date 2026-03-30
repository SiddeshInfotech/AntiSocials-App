import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

/**
 * Task Complete Screen
 * Displays a beautiful success pop-in animation rewarding the user upon 5-minute task finish.
 * Path: Frontend/app/task-complete.tsx
 */
export default function TaskCompleteScreen() {
  const router = useRouter();
  
  // Animation Sequence Handles
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Beautiful Staggered Celebration Animation execution on component mount
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/tasks')} style={styles.backBtn} activeOpacity={0.6}>
          <Feather name="x" size={24} color="#1f2937" />
          <Text style={styles.backText}>Close Validation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* Playful Success Icon Expanding In Animation */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Feather name="check" size={50} color="#ffffff" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>Superb focus!</Text>
          <Text style={styles.subtitle}>You completed 5 minutes of silence.</Text>

          {/* Elevated Points Celebration Card */}
          <View style={styles.rewardBox}>
            <Text style={styles.rewardEmoji}>🎉</Text>
            <Text style={styles.pointsText}>
                <Text style={{ color: '#8b5cf6', fontWeight: '900', fontSize: 20 }}>+200</Text> points earned
            </Text>
            <View style={styles.divider} />
            <Text style={styles.dayComplete}>Daily Task Milestone Complete.</Text>
          </View>
        </Animated.View>

      </View>

      {/* Bottom Completion Action Footer */}
      <Animated.View style={[styles.bottomArea, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.continueBtn} onPress={() => router.replace('/(tabs)/tasks')} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>Continue to Journey</Text>
          <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, color: '#1f2937', marginLeft: 8, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 25 },
  successCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 25,
    shadowColor: '#10b981', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 8 }, shadowRadius: 15, elevation: 6
  },
  title: { fontSize: 32, fontWeight: '800', color: '#1f2937' },
  subtitle: { fontSize: 17, color: '#6b7280', marginTop: 8, fontWeight: '500' },
  rewardBox: {
    backgroundColor: '#faf5ff', width: '100%', borderRadius: 24,
    paddingVertical: 40, paddingHorizontal: 20, marginTop: 45, alignItems: 'center',
    borderWidth: 1, borderColor: '#ede9fe',
    shadowColor: '#8b5cf6', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, elevation: 3
  },
  rewardEmoji: { fontSize: 48, marginBottom: 15 },
  pointsText: { color: '#374151', fontSize: 17, marginBottom: 15, fontWeight: '600' },
  divider: { height: 1, width: '60%', backgroundColor: '#e5e7eb', marginBottom: 15 },
  dayComplete: { color: '#9ca3af', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  bottomArea: { padding: 25, paddingBottom: 40 },
  continueBtn: {
    backgroundColor: '#6A61FF', width: '100%', paddingVertical: 18, flexDirection: 'row', justifyContent: 'center',
    borderRadius: 20, alignItems: 'center', shadowColor: '#6A61FF', shadowOpacity: 0.35, shadowOffset: {width: 0, height: 6}, shadowRadius: 12, elevation: 6
  },
  continueBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700' }
});