import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_INTERACTION_DURATION = 180; // 3 Minutes = 180 Seconds

const GUIDANCE_EXAMPLES = [
  'Suggest a topic everyone can answer comfortably.',
  'Invite someone quieter into the conversation naturally.',
  'Help the group decide something simple.',
  'Keep the discussion flowing for a few minutes when it becomes quiet.',
];

export default function LeadShortInteractionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Task Phase
  // 'compass' -> 'locked' -> 'cinematic'
  const [phase, setPhase] = useState<'compass' | 'locked' | 'cinematic'>('compass');
  const [timeLeft, setTimeLeft] = useState(TOTAL_INTERACTION_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [guidanceIndex, setGuidanceIndex] = useState(0);

  // Optional Reflection
  const [reflectionText, setReflectionText] = useState('');

  // Animation References
  const needleRotation = useRef(new Animated.Value(0)).current;
  const pulseWaveScale = useRef(new Animated.Value(1)).current;
  const pulseWaveOpacity = useRef(new Animated.Value(0.6)).current;
  const trueNorthLock = useRef(new Animated.Value(0)).current;
  const starGlowScale = useRef(new Animated.Value(0.5)).current;

  const badgeCardSlide = useRef(new Animated.Value(50)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------
  // 1. COMPASS ROTATION & GOLDEN PULSE ANIMATION
  // ----------------------------------------------------
  useEffect(() => {
    // Continuous Searching Compass Needle Rotation
    if (phase === 'compass') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(needleRotation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(needleRotation, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Ambient Golden Light Wave Pulses
      Animated.loop(
        Animated.parallel([
          Animated.timing(pulseWaveScale, {
            toValue: 1.6,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(pulseWaveOpacity, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseWaveOpacity, { toValue: 0.0, duration: 1000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }

    // Rotate guidance prompts every 6 seconds
    const interval = setInterval(() => {
      setGuidanceIndex((prev) => (prev + 1) % GUIDANCE_EXAMPLES.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [phase]);

  // ----------------------------------------------------
  // 2. 3-MINUTE INTERACTION TIMER
  // ----------------------------------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      triggerTrueNorthLock();
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const handleFastForward = () => {
    setTimeLeft(3);
  };

  // ----------------------------------------------------
  // 3. TRUE NORTH LOCK & STAR TRANSFORMATION
  // ----------------------------------------------------
  const triggerTrueNorthLock = () => {
    setPhase('locked');

    // Compass needle locks to True North (0 degrees)
    Animated.timing(trueNorthLock, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setPhase('cinematic');
      Animated.parallel([
        Animated.spring(starGlowScale, { toValue: 1.2, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(badgeCardSlide, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(badgeCardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 2000);
  };

  // ----------------------------------------------------
  // 4. FINAL COMPLETION SUBMISSION
  // ----------------------------------------------------
  const handleCompleteTask = async () => {
    let pointsAdded = '300';
    let totalPoints = '300';
    let streak = '1';

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const res = await apiFetch('/api/tasks/save-leadership-interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Lead a Short Interaction (2–3 Minutes)',
            duration_seconds: 180,
            optional_reflection: reflectionText.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '300';
        }

        const compRes = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Lead a Short Interaction (2–3 Minutes)' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Backend save error on leadership interaction', e);
    }

    // Auto navigate to shared task-success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsAdded,
        totalPoints: totalPoints,
        streak: streak,
        difficulty: 'hard',
        taskName: 'Lead a Short Interaction (2–3 Minutes)',
        badge: 'Guiding Presence',
        message: 'You stepped forward.',
      },
    } as any);
  };

  const needleRotateInterpolate = needleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '45deg'],
  });

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Dark Warm Obsidian Background */}
      <LinearGradient colors={['#0e0d17', '#181528', '#261e38']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>LEADERSHIP DOG • HARD</Text>
            <Text style={styles.headerTitle}>Lead a Short Interaction</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+600 Pts</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* THE COMPASS CINEMATIC CANVAS */}
          <View style={styles.compassCanvas}>
            <Text style={styles.compassHeadline}>
              {phase === 'locked' || phase === 'cinematic' ? '"You found your direction."' : '"Leadership begins with one small step."'}
            </Text>
            <Text style={styles.compassSubhead}>
              {phase === 'locked' || phase === 'cinematic' ? 'You stepped forward.' : 'A compass provides direction without controlling others.'}
            </Text>

            {/* Central Compass Assembly */}
            <View style={styles.compassAssembly}>
              {/* Outer Golden Wave Pulse Ring */}
              {phase === 'compass' && (
                <Animated.View
                  style={[
                    styles.pulseWaveRing,
                    {
                      transform: [{ scale: pulseWaveScale }],
                      opacity: pulseWaveOpacity,
                    },
                  ]}
                />
              )}

              {/* Compass Dial Outer Ring */}
              <View style={styles.compassDial}>
                <Text style={[styles.cardinalText, styles.cardinalN]}>N</Text>
                <Text style={[styles.cardinalText, styles.cardinalE]}>E</Text>
                <Text style={[styles.cardinalText, styles.cardinalS]}>S</Text>
                <Text style={[styles.cardinalText, styles.cardinalW]}>W</Text>

                {/* Compass Needle */}
                <Animated.View
                  style={[
                    styles.needleContainer,
                    {
                      transform: [
                        {
                          rotate: phase === 'locked' || phase === 'cinematic' ? '0deg' : needleRotateInterpolate,
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.needleNorth} />
                  <View style={styles.needleSouth} />
                </Animated.View>

                {/* Central Jewel Anchor */}
                <View style={styles.compassCenterJewel}>
                  <Ionicons name="sparkles" size={14} color="#f59e0b" />
                </View>
              </View>
            </View>

            {/* Rotating Guidance Prompt */}
            {phase === 'compass' && (
              <View style={styles.guidanceBox}>
                <Ionicons name="compass-outline" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                <Text style={styles.guidanceText}>{GUIDANCE_EXAMPLES[guidanceIndex]}</Text>
              </View>
            )}
          </View>

          {/* TIMER & FAST-FORWARD */}
          {phase === 'compass' && (
            <View style={styles.timerBlock}>
              <Text style={styles.timerText}>{formatTimer(timeLeft)}</Text>
              <Text style={styles.timerSub}>Continuous Interaction Progress</Text>

              <TouchableOpacity style={styles.fastForwardBtn} onPress={handleFastForward}>
                <Text style={styles.fastForwardText}>⚡ Fast-Forward Interaction (Demo)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FINAL CINEMATIC & ACHIEVEMENT UNLOCK */}
          {phase === 'cinematic' && (
            <View style={styles.cinematicBlock}>
              <Animated.View
                style={[
                  styles.badgeCard,
                  {
                    opacity: badgeCardOpacity,
                    transform: [{ translateY: badgeCardSlide }],
                  },
                ]}
              >
                <LinearGradient colors={['#f59e0b', '#ec4899']} style={styles.badgeCardGradient}>
                  <Text style={styles.badgeCardIcon}>🏅</Text>
                  <View style={styles.badgeCardTextGroup}>
                    <Text style={styles.badgeCardTag}>ACHIEVEMENT UNLOCKED</Text>
                    <Text style={styles.badgeCardTitle}>Guiding Presence</Text>
                    <Text style={styles.badgeCardQuote}>"Leadership isn't about being louder. It's about helping others move together."</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Optional Short Reflection Input */}
              <View style={styles.reflectionCard}>
                <Text style={styles.reflectionTitle}>Short Reflection (Optional)</Text>
                <Text style={styles.reflectionSub}>What felt different when you took the lead?</Text>

                <TextInput
                  style={styles.reflectionInput}
                  placeholder="Share a brief thought (max 100 chars)..."
                  placeholderTextColor="#94a3b8"
                  maxLength={100}
                  value={reflectionText}
                  onChangeText={setReflectionText}
                />

                <TouchableOpacity style={styles.submitBtn} activeOpacity={0.88} onPress={handleCompleteTask}>
                  <LinearGradient colors={['#f59e0b', '#ec4899']} style={styles.gradientBtn}>
                    <Text style={styles.primaryBtnText}>Complete Challenge</Text>
                    <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  contentScroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#f59e0b', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#fbbf24' },

  // Compass Canvas
  compassCanvas: { marginTop: 10, alignItems: 'center', padding: 20 },
  compassHeadline: { fontSize: 18, fontWeight: '800', color: '#fbbf24', textAlign: 'center', marginBottom: 4 },
  compassSubhead: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', fontStyle: 'italic', marginBottom: 28 },

  compassAssembly: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pulseWaveRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: '#f59e0b' },
  compassDial: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(15, 23, 42, 0.9)', borderWidth: 2, borderColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', elevation: 12 },

  cardinalText: { position: 'absolute', fontSize: 12, fontWeight: '900', color: '#f59e0b' },
  cardinalN: { top: 8 },
  cardinalS: { bottom: 8 },
  cardinalE: { right: 12 },
  cardinalW: { left: 12 },

  needleContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  needleNorth: { width: 6, height: 50, backgroundColor: '#ef4444', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  needleSouth: { width: 6, height: 50, backgroundColor: '#94a3b8', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },

  compassCenterJewel: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },

  guidanceBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', width: '100%' },
  guidanceText: { flex: 1, fontSize: 13, color: '#e2e8f0', fontWeight: '600', fontStyle: 'italic' },

  // Timer Block
  timerBlock: { marginTop: 10, alignItems: 'center', paddingHorizontal: 20 },
  timerText: { fontSize: 28, fontWeight: '800', color: '#fbbf24', letterSpacing: 1 },
  timerSub: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 },
  fastForwardBtn: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  fastForwardText: { fontSize: 11, fontWeight: '700', color: '#fbbf24' },

  // Cinematic Block & Achievement
  cinematicBlock: { marginTop: 16, gap: 16 },
  badgeCard: { width: '100%', borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },

  reflectionCard: { padding: 18, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.85)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  reflectionTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginBottom: 2 },
  reflectionSub: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  reflectionInput: { width: '100%', height: 48, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 14, color: '#fff', fontSize: 14, marginBottom: 16 },
  submitBtn: { borderRadius: 26, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
