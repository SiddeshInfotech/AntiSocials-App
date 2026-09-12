import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 300; // 5 minutes = 300 seconds

// Birds flying across horizon (at 4:00)
const BIRDS_DATA = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  startX: -40 - i * 30,
  startY: 40 + i * 15,
  delay: i * 300,
}));

export default function EmotionTideTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState("Notice what you're feeling.");
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Wave & Ocean Tide Animations
  const waveHeightAnim = useRef(new Animated.Value(1)).current; // Wave scale/amplitude
  const waveCycleAnim = useRef(new Animated.Value(0)).current; // Oscillating water wave
  const sunriseGlowAnim = useRef(new Animated.Value(0.15)).current;
  const stillWaterAnim = useRef(new Animated.Value(0)).current; // 1 = perfectly still
  const birdsFlyAnim = useRef(new Animated.Value(0)).current; // Bird flight across screen

  // Final Cinematic Glowing Ripple
  const rippleScaleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacityAnim = useRef(new Animated.Value(0)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Continuous Wave Cycle Oscillations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveCycleAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveCycleAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 5:00 / 300s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Calm ocean, tiny waves moving gently
      setDisplayText("Notice what you're feeling.");
      setSubDisplayText(null);
    } else if (elapsedTime === 60) {
      // 1:00 - Waves become slightly stronger (more active)
      setDisplayText("You don't have to stop the wave.");
      setSubDisplayText(null);

      Animated.timing(waveHeightAnim, {
        toValue: 1.5,
        duration: 4000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 120) {
      // 2:00 - Water slowly settles again, soft sunlight reflects on surface
      setDisplayText('Observe before reacting.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(waveHeightAnim, {
          toValue: 0.9,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunriseGlowAnim, {
          toValue: 0.45,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 180) {
      // 3:00 - Single larger wave approaches, losing energy smoothly without crashing
      setDisplayText('Every emotion changes.');
      setSubDisplayText(null);

      Animated.sequence([
        Animated.timing(waveHeightAnim, {
          toValue: 1.9,
          duration: 3000,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveHeightAnim, {
          toValue: 0.5,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 240) {
      // 4:00 - Ocean becomes calm again, birds fly overhead
      setDisplayText('You stayed with the feeling.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(waveHeightAnim, {
          toValue: 0.3,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(birdsFlyAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime >= 300) {
      // 5:00 - Sunrise fills horizon, water becomes perfectly still
      setDisplayText('You chose awareness over reaction.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(stillWaterAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(sunriseGlowAnim, {
          toValue: 0.85,
          duration: 3500,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        startFinalCinematic();
      }, 3500);
    }
  }, [elapsedTime, phase, isPaused]);

  // Main Timer Decrement Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'active' && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, isPaused, timeLeft]);

  // Start Challenge
  const startChallenge = () => {
    saveProgressBackend({ session_started: true });
    setPhase('active');

    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sceneFadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // FINAL CINEMATIC (Glowing Ripple -> Emotional Anchor)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(rippleOpacityAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(rippleScaleAnim, {
        toValue: 2.2,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(shieldScaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(shieldOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // BACKEND INTEGRATION & COMPLETION
  // ----------------------------------------------------
  const saveProgressBackend = async (dataPayload: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/emotion-tide/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Observe and Regulate Emotions',
            ...dataPayload,
          }),
        });
      }
    } catch (e) {
      console.log('saveProgressBackend error:', e);
    }
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);

    let pointsData = { pointsAdded: '600', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Observe and Regulate Emotions',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '600',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }

    // MANDATORY: Navigate to shared Well Done completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You stayed aware.',
        difficulty: 'hard',
        taskName: 'Observe and Regulate Emotions',
        badge: 'Emotional Anchor',
      },
    } as any);
  };

  // Developer Fast-Forward Helper
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__ || true) {
      const time = Date.now();
      if (time - lastPress.current < 350) {
        setTimeLeft(5); // Jump to 5s remaining
        Alert.alert('Dev Skip Triggered', 'Skipped to final phase (5s remaining)');
      }
      lastPress.current = time;
    }
  };

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const waveTranslateY = waveCycleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 15],
  });

  const birdFlyX = birdsFlyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, width + 60],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* The Emotional Tide Background Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Ocean Blue & Deep Navy Gradient */}
        <LinearGradient
          colors={['#0f172a', '#0369a1', '#0284c7', '#0f172a']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Sunrise Warm Horizon Glow Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: sunriseGlowAnim,
              backgroundColor: 'rgba(253, 224, 71, 0.18)',
            },
          ]}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'active' && timeLeft > 0) {
                Alert.alert(
                  'Abort Challenge?',
                  'Are you sure you want to stop? Your progress will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Abort',
                      style: 'destructive',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE EMOTIONAL TIDE' : 'EMOTIONAL AWARENESS'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ============================================================ */}
        {/* PHASE 1: TASK DETAIL PAGE (Onboarding & Visual Identity)     */}
        {/* ============================================================ */}
        <Animated.View
          style={[styles.detailsWrapper, { opacity: uiFadeAnim }]}
          pointerEvents={phase === 'details' ? 'auto' : 'none'}
        >
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Hero: Ocean Horizon & Waves Preview */}
            <View style={styles.heroOceanContainer}>
              <View style={styles.heroOceanFrame}>
                <LinearGradient
                  colors={['rgba(56, 189, 248, 0.4)', 'rgba(3, 105, 161, 0.9)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="water" size={48} color="#e0f2fe" />
                <Text style={styles.heroOceanLabel}>THE EMOTIONAL TIDE</Text>
              </View>
            </View>

            {/* Central Glass Card */}
            <View style={styles.glassCard}>
              <Text style={styles.taskTitle}>Observe and Regulate</Text>
              <Text style={styles.taskSubTitle}>Emotions</Text>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.badgePill}>
                  <Feather name="clock" size={13} color="#38bdf8" />
                  <Text style={styles.badgeText}>5 Minutes</Text>
                </View>
                <View style={[styles.badgePill, styles.badgeHard]}>
                  <Ionicons name="flame" size={13} color="#ef4444" />
                  <Text style={[styles.badgeText, { color: '#ef4444' }]}>
                    ⭐⭐⭐ Hard
                  </Text>
                </View>
                <View style={[styles.badgePill, styles.badgePoints]}>
                  <Ionicons name="trophy" size={13} color="#f59e0b" />
                  <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                    600 Points
                  </Text>
                </View>
              </View>

              {/* Description Text */}
              <Text style={styles.descriptionText}>
                Emotions are not enemies. They are temporary visitors.{'\n\n'}
                You don't need to stop them. You only need to notice them before responding.{'\n\n'}
                Today's challenge is to remain aware until the emotional wave naturally settles.
              </Text>

              {/* Quote Box */}
              <View style={styles.quoteBox}>
                <Feather name="anchor" size={18} color="#38bdf8" style={{ marginRight: 8 }} />
                <Text style={styles.quoteText}>
                  "You cannot stop every wave, but you can learn to stay steady as it passes."
                </Text>
              </View>

              {/* Emotional Anchor Achievement Banner */}
              <View style={styles.badgeBanner}>
                <Text style={styles.badgeBannerEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeBannerTitle}>Emotional Anchor</Text>
                  <Text style={styles.badgeBannerSub}>
                    Unlock achievement by discovering that awareness creates calm
                  </Text>
                </View>
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={startChallenge}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#0284c7', '#38bdf8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>ENTER THE EMOTIONAL TIDE</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN OCEAN TIDE SCENE & RIPPLE CINEMATIC        */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Shoreline Arena */}
          <View style={styles.oceanStage}>
            {/* Birds Flying across horizon (at 4:00) */}
            {BIRDS_DATA.map((b) => (
              <Animated.View
                key={b.id}
                style={[
                  styles.birdIcon,
                  {
                    top: b.startY,
                    transform: [{ translateX: birdFlyX }],
                  },
                ]}
              >
                <MaterialCommunityIcons name="feather" size={16} color="rgba(240, 249, 255, 0.7)" />
              </Animated.View>
            ))}

            {/* Shoreline Water Container */}
            <View style={styles.oceanWaveCircleFrame}>
              {/* Dynamic Wave Simulation Layer */}
              <Animated.View
                style={[
                  styles.waveSimLayer,
                  {
                    transform: [
                      { translateY: waveTranslateY },
                      { scaleY: waveHeightAnim },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#38bdf8', '#0284c7', '#0f172a']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Crest light reflection */}
                <View style={styles.waveCrestReflect} />
              </Animated.View>

              {/* Still Water Calm Reflection Overlay (at 5:00) */}
              <Animated.View
                style={[
                  styles.stillWaterOverlay,
                  { opacity: stillWaterAnim },
                ]}
              >
                <LinearGradient
                  colors={['rgba(253, 224, 71, 0.3)', 'rgba(56, 189, 248, 0.2)']}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>

              {/* FINAL CINEMATIC: Glowing Expanding Ripple */}
              {phase === 'cinematic' && (
                <Animated.View
                  style={[
                    styles.glowingRippleCircle,
                    {
                      transform: [{ scale: rippleScaleAnim }],
                      opacity: rippleOpacityAnim,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#ffffff', '#38bdf8', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              )}
            </View>
          </View>

          {/* Central Display Text */}
          <View style={styles.displayTextContainer}>
            <Text style={styles.mainDisplayText}>{displayText}</Text>
            {subDisplayText && (
              <Text style={styles.subDisplayText}>{subDisplayText}</Text>
            )}
          </View>

          {/* Footer Controls (No Timer Rings or Progress Bars, pure aesthetic digits) */}
          {phase === 'active' && (
            <View style={styles.footerControls}>
              <Pressable onPress={handleDevSkip}>
                <Text style={styles.timerText}>
                  {formatTimerDigits(timeLeft)}
                </Text>
              </Pressable>

              <View style={styles.footerBtnRow}>
                <TouchableOpacity
                  style={styles.pauseBtn}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseBtnText}>
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.abortBtn}
                  onPress={() => {
                    Alert.alert(
                      'Abort Challenge?',
                      'Are you sure you want to stop? Your progress will be lost.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Abort',
                          style: 'destructive',
                          onPress: () => router.back(),
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.abortBtnText}>ABORT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Final Achievement Banner (Phase 3) */}
          {phase === 'cinematic' && (
            <Animated.View
              style={[
                styles.achievementBox,
                { opacity: shieldOpacityAnim },
              ]}
            >
              <View style={styles.achievementBadgeRow}>
                <Text style={styles.achievementBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={styles.achievementBadgeTag}>
                    ACHIEVEMENT UNLOCKED
                  </Text>
                  <Text style={styles.achievementBadgeTitle}>
                    Emotional Anchor
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "You discovered that awareness creates calm."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0284c7', '#38bdf8']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+600 PTS)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  headerTagText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding Details
  detailsWrapper: {
    flex: 1,
    width: '100%',
  },
  detailsScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  heroOceanContainer: {
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'center',
  },
  heroOceanFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(3, 105, 161, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroOceanLabel: {
    color: '#e0f2fe',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  taskSubTitle: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '600',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeHard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  badgePoints: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    color: '#f0f9ff',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    width: '100%',
  },
  badgeBannerEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  badgeBannerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeBannerSub: {
    color: '#38bdf8',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Phase 2 & 3: Main Scene
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  oceanStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  birdIcon: {
    position: 'absolute',
    left: 0,
    zIndex: 5,
  },
  oceanWaveCircleFrame: {
    width: width * 0.82,
    height: height * 0.42,
    borderRadius: width * 0.41,
    borderWidth: 3,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: 'rgba(3, 105, 161, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#0284c7',
    shadowOpacity: 0.45,
    shadowRadius: 30,
  },
  waveSimLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
  },
  waveCrestReflect: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    width: '100%',
  },
  stillWaterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Final Cinematic Glowing Ripple
  glowingRippleCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    shadowColor: '#ffffff',
    shadowOpacity: 1,
    shadowRadius: 35,
    elevation: 15,
  },

  // Display Text
  displayTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 15,
  },
  mainDisplayText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subDisplayText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },

  // Footer Controls
  footerControls: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  timerText: {
    color: '#38bdf8',
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pauseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pauseBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  abortBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  abortBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Achievement Unlock Box (Phase 3)
  achievementBox: {
    width: '90%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginBottom: 10,
  },
  achievementBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  achievementBadgeEmoji: {
    fontSize: 36,
  },
  achievementBadgeTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  achievementBadgeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  achievementDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
  },
  claimButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  claimBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
