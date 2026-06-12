import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

const { width } = Dimensions.get('window');
const TOTAL_SECONDS = 1200; // 20 minutes

type TipCategory = 'connect' | 'listen' | 'share';

const TIPS: Record<TipCategory, { icon: string; title: string; text: string; color: string }[]> = {
  connect: [
    { icon: 'eye-off', title: 'No Screens', text: 'Place your phone face down or in another room entirely.', color: '#6366f1' },
    { icon: 'smile', title: 'Eye Contact', text: 'Look at them, not past them. Presence is the greatest gift.', color: '#8b5cf6' },
  ],
  listen: [
    { icon: 'headphones', title: 'Active Listen', text: 'Nod, ask follow-ups, and never interrupt—let them finish.', color: '#06b6d4' },
    { icon: 'mic-off', title: 'No Interruptions', text: 'Silence notifications. Let this moment be uninterrupted.', color: '#0ea5e9' },
  ],
  share: [
    { icon: 'message-circle', title: 'Open Questions', text: 'Ask "What\'s something good that happened this week?"', color: '#10b981' },
    { icon: 'coffee', title: 'Shared Moment', text: 'Suggest a shared activity: tea, a walk, or a meal together.', color: '#14b8a6' },
  ],
};

const TIP_CATEGORIES: { key: TipCategory; label: string }[] = [
  { key: 'connect', label: '🔗 Connect' },
  { key: 'listen', label: '👂 Listen' },
  { key: 'share', label: '💬 Share' },
];

export default function OfflineTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [category, setCategory] = useState<TipCategory>('connect');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(0.95)).current;

  // Pulse rings for the orb
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(bgScale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, []);

  // Timer + progress animation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      // Animate progress bar continuously
      Animated.timing(progressAnim, {
        toValue: (TOTAL_SECONDS - timeLeft + 1) / TOTAL_SECONDS,
        duration: 1000,
        useNativeDriver: false,
      }).start();

    } else if (isActive && timeLeft <= 0) {
      handleComplete();
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  // Pulse rings when active
  useEffect(() => {
    if (!isActive) {
      ring1.setValue(0);
      ring2.setValue(0);
      ring3.setValue(0);
      return;
    }
    const createRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 3500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    createRing(ring1, 0);
    createRing(ring2, 1100);
    createRing(ring3, 2200);
  }, [isActive]);

  const handleComplete = async () => {
    let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Spend 20 minutes offline with someone' })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.pointsAdded?.toString() || "0", 
            totalPoints: data.totalPoints?.toString() || "0",
            streak: data.streak?.toString() || "0"
          };
        }
      }
    } catch(e) { console.error(e); }

    router.replace({ 
      pathname: '/task-success', 
      params: { points: pointsData.pointsAdded, totalPoints: pointsData.totalPoints, streak: pointsData.streak } 
    } as any);
  };

  const handleStart = () => setIsActive(true);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  const progress = ((TOTAL_SECONDS - timeLeft) / TOTAL_SECONDS);
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderRing = (anim: Animated.Value) => (
    <Animated.View style={[styles.ring, {
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
      opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.3, 0] }),
    }]} />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style={isActive ? 'light' : 'dark'} backgroundColor={isActive ? '#0f172a' : '#fafafa'} />

      {/* Dynamic background */}
      {isActive ? (
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#172554']}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={['#fafafa', '#f0f9ff']}
          style={StyleSheet.absoluteFill}
        />
      )}


      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, isActive && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <Feather name="arrow-left" size={22} color={isActive ? '#ffffff' : '#111111'} />
        </TouchableOpacity>

        {isActive && (
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Session</Text>
          </View>
        )}

        <View style={{ width: 38 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: bgScale }] }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ORB / Icon area */}
          <View style={styles.orbContainer}>
            {isActive && (
              <>
                {renderRing(ring1)}
                {renderRing(ring2)}
                {renderRing(ring3)}
              </>
            )}
            <LinearGradient
              colors={isActive ? ['#4f46e5', '#7c3aed'] : ['#e0f2fe', '#ddd6fe']}
              style={styles.orb}
            >
              <Text style={styles.orbEmoji}>🤝</Text>
            </LinearGradient>
          </View>

          {/* Timer / Label */}
          {isActive ? (
            <View style={styles.timerBlock}>
              <Text style={styles.timerBig}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>remaining • stay present</Text>
            </View>
          ) : (
            <>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Light Reconnection · +500 pts</Text>
              </View>
              <Text style={styles.title}>Spend 20 mins{'\n'}offline together</Text>
              <Text style={styles.subtitle}>Put your screens away and give someone your full, undivided attention.</Text>
            </>
          )}

          {/* ACTIVE: Progress + Tips */}
          {isActive ? (
            <View style={styles.activeSection}>
              {/* Progress Bar */}
              <View style={styles.progressBg}>
                <Animated.View style={[styles.progressFill, { width: progressBarWidth }]} />
              </View>
              <Text style={styles.progressLabel}>{Math.round(progress * 100)}% complete</Text>

              {/* Tip category pills */}
              <View style={styles.catRow}>
                {TIP_CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catPill, category === c.key && styles.catPillActive]}
                    onPress={() => setCategory(c.key)}
                  >
                    <Text style={[styles.catPillText, category === c.key && styles.catPillTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tip Cards */}
              {TIPS[category].map((tip, i) => (
                <LinearGradient
                  key={i}
                  colors={[`${tip.color}22`, `${tip.color}0a`]}
                  style={styles.tipCard}
                >
                  <View style={[styles.tipIconBox, { backgroundColor: `${tip.color}30` }]}>
                    <Feather name={tip.icon as any} size={20} color={tip.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.tipTitle, { color: tip.color }]}>{tip.title}</Text>
                    <Text style={styles.tipText}>{tip.text}</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>
          ) : (
            /* Pre-start info cards */
            <View style={styles.preStartCards}>
              {[
                { icon: 'wifi-off', label: 'Phone away', desc: 'No screens during this time' },
                { icon: 'users', label: 'Be present', desc: 'Full attention, full connection' },
                { icon: 'clock', label: '20 minutes', desc: 'That\'s all it takes' },
              ].map((item, i) => (
                <View key={i} style={styles.preCard}>
                  <View style={styles.preCardIcon}>
                    <Feather name={item.icon as any} size={20} color="#7c3aed" />
                  </View>
                  <View>
                    <Text style={styles.preCardLabel}>{item.label}</Text>
                    <Text style={styles.preCardDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer Buttons */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!isActive ? (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <MaterialCommunityIcons name="timer-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.startBtnText}>Start 20-Minute Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeFooter}>
            <TouchableOpacity
              style={styles.completeEarlyBtn}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#7c3aed" style={{ marginRight: 8 }} />
              <Text style={styles.completeEarlyText}>Complete Early</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const ORB_SIZE = 130;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 7 },
  liveText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  scroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },

  orbContainer: {
    width: ORB_SIZE * 3,
    height: ORB_SIZE * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ring: {
    position: 'absolute',
    width: ORB_SIZE, height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: '#7c3aed',
  },
  orb: {
    width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7c3aed', shadowOpacity: 0.35,
    shadowRadius: 25, shadowOffset: { width: 0, height: 10 },
    elevation: 10, zIndex: 5,
  },
  orbEmoji: { fontSize: 52 },

  timerBlock: { alignItems: 'center', marginBottom: 30 },
  timerBig: { fontSize: 58, fontWeight: '200', color: '#f1f5f9', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  timerLabel: { color: '#94a3b8', fontSize: 13, marginTop: 4 },

  pill: {
    backgroundColor: '#ede9fe', paddingVertical: 6, paddingHorizontal: 18,
    borderRadius: 20, marginBottom: 18,
  },
  pillText: { color: '#7c3aed', fontWeight: '600', fontSize: 13 },

  title: {
    fontSize: 30, fontWeight: '700', color: '#0f172a',
    textAlign: 'center', lineHeight: 38, marginBottom: 14,
  },
  subtitle: {
    fontSize: 15, color: '#64748b', textAlign: 'center',
    lineHeight: 22, paddingHorizontal: 8, marginBottom: 32,
  },

  preStartCards: { width: '100%', gap: 12 },
  preCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#ede9fe',
    shadowColor: '#7c3aed', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  preCardIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f5f3ff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  preCardLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  preCardDesc: { fontSize: 12, color: '#94a3b8' },

  activeSection: { width: '100%' },

  progressBg: {
    width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4, marginBottom: 8,
  },
  progressFill: {
    height: '100%', backgroundColor: '#22c55e', borderRadius: 4,
  },
  progressLabel: { color: '#94a3b8', fontSize: 12, textAlign: 'right', marginBottom: 20 },

  catRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  catPill: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  catPillActive: { backgroundColor: '#6366f1' },
  catPillText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  catPillTextActive: { color: '#fff' },

  tipCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tipIconBox: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tipText: { color: '#cbd5e1', fontSize: 13, lineHeight: 19 },

  footer: { paddingHorizontal: 24, paddingTop: 8 },

  startBtn: {
    width: '100%', height: 60, borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  startBtnGradient: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  activeFooter: { alignItems: 'center' },
  completeEarlyBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#7c3aed',
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 30,
  },
  completeEarlyText: { color: '#7c3aed', fontWeight: '700', fontSize: 15 },
});
