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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 900; // 15 minutes = 900 seconds

// Sand Grain Particles dropping continuously
const SAND_GRAINS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  delay: i * 200,
  speed: 2500 + (i % 3) * 500,
  xOffset: (i % 5 - 2) * 3,
}));

export default function Stay15mTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState("You don't need to leave immediately.");
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Hourglass Sand Level & Flip Animations
  const topSandLevel = useRef(new Animated.Value(1)).current; // 1 = full, 0 = empty
  const bottomSandLevel = useRef(new Animated.Value(0)).current; // 0 = empty, 1 = full
  const hourglassFlipAnim = useRef(new Animated.Value(0)).current; // 0deg to 180deg flip
  const ambientSunlightAnim = useRef(new Animated.Value(0.2)).current;
  const sandParticleStreamAnim = useRef(new Animated.Value(0)).current;

  // Final Cinematic Golden Particles & Dissolve
  const pureLightScaleAnim = useRef(new Animated.Value(1)).current;
  const pureLightOpacityAnim = useRef(new Animated.Value(0)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Continuous Sand Stream & Ambient Light Shift Loops
  useEffect(() => {
    // Sand Grain Stream Movement
    Animated.loop(
      Animated.timing(sandParticleStreamAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Ambient Lighting Shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientSunlightAnim, {
          toValue: 0.6,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientSunlightAnim, {
          toValue: 0.2,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 15:00 / 900s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    // Smoothly update sand levels in top and bottom bulbs
    const progressFraction = Math.min(1, elapsedTime / TOTAL_DURATION);
    Animated.parallel([
      Animated.timing(topSandLevel, {
        toValue: 1 - progressFraction,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(bottomSandLevel, {
        toValue: progressFraction,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start();

    // Pacing Text Events
    if (elapsedTime === 0) {
      setDisplayText("You don't need to leave immediately.");
      setSubDisplayText(null);
    } else if (elapsedTime === 180) {
      // 3:00
      setDisplayText('Presence creates confidence.');
      setSubDisplayText(null);
    } else if (elapsedTime === 360) {
      // 6:00
      setDisplayText('Comfort grows when you stay.');
      setSubDisplayText(null);
    } else if (elapsedTime === 540) {
      // 9:00
      setDisplayText("You're becoming more comfortable.");
      setSubDisplayText(null);
    } else if (elapsedTime === 720) {
      // 12:00
      setDisplayText('Every minute builds your presence.');
      setSubDisplayText(null);
    } else if (elapsedTime >= 900) {
      // 15:00 - Hourglass flips automatically, sand transforms into glowing golden particles
      setDisplayText('You stayed longer than your fear.');
      setSubDisplayText(null);

      // Trigger Hourglass Flip Animation
      Animated.timing(hourglassFlipAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();

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
  // FINAL CINEMATIC (Hourglass Dissolves -> Present Moment)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(pureLightOpacityAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(pureLightScaleAnim, {
        toValue: 2.2,
        duration: 3500,
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
        await apiFetch('/api/tasks/stay-15m/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Stay for at Least 15 Minutes',
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

    let pointsData = { pointsAdded: '200', totalPoints: '0', streak: '0' };
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
            task_name: 'Stay for at Least 15 Minutes',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '200',
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
        message: 'You stayed present.',
        difficulty: 'medium',
        taskName: 'Stay for at Least 15 Minutes',
        badge: 'Present Moment',
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

  const hourglassRotate = hourglassFlipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const sandStreamY = sandParticleStreamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 40],
  });

  // Height interpolation for sand levels (0 to 65px)
  const topBulbHeight = topSandLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 65],
  });

  const bottomBulbHeight = bottomSandLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 65],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* The Hourglass Glassmorphic Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Walnut Brown & Sand Gold Gradient */}
        <LinearGradient
          colors={['#1c1917', '#292524', '#451a03', '#1c1917']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Warm Ambient Sunlight Shift */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: ambientSunlightAnim,
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
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
            <Feather name="chevron-left" size={24} color="#f59e0b" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE HOURGLASS' : 'SOCIAL PRESENCE'}
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
          {/* Top Hero: Animated Glass Hourglass */}
          <View style={styles.heroHourglassContainer}>
            <View style={styles.heroHourglassFrame}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.35)', 'rgba(69, 26, 3, 0.9)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Ionicons name="hourglass-outline" size={48} color="#fbbf24" />
              <Text style={styles.heroHourglassLabel}>THE HOURGLASS</Text>
            </View>
          </View>

          {/* Central Glass Card */}
          <View style={styles.glassCard}>
            <Text style={styles.taskTitle}>Stay for at Least</Text>
            <Text style={styles.taskSubTitle}>15 Minutes</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <Feather name="clock" size={13} color="#f59e0b" />
                <Text style={styles.badgeText}>15 Minutes</Text>
              </View>
              <View style={[styles.badgePill, styles.badgeMedium]}>
                <Ionicons name="flame" size={13} color="#f59e0b" />
                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                  ⭐⭐ Medium
                </Text>
              </View>
              <View style={[styles.badgePill, styles.badgePoints]}>
                <Ionicons name="trophy" size={13} color="#f59e0b" />
                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                  200 Points
                </Text>
              </View>
            </View>

            {/* Description Text */}
            <Text style={styles.descriptionText}>
              Sometimes growth doesn't come from doing more. It comes from leaving less.{'\n\n'}
              Today, remain comfortably present in a social environment for at least 15 minutes—stay in a café, stay at a gathering, or stay in a park.{'\n'}
              You don't have to impress anyone. Your only goal is to stay.
            </Text>

            {/* Quote Box */}
            <View style={styles.quoteBox}>
              <Feather name="clock" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={styles.quoteText}>
                "Sometimes growth doesn't come from doing more. It comes from leaving less."
              </Text>
            </View>

            {/* Present Moment Achievement Banner */}
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerEmoji}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeBannerTitle}>Present Moment</Text>
                <Text style={styles.badgeBannerSub}>
                  Unlock achievement by discovering that staying is the bravest choice
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
                colors={['#d97706', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>ENTER THE HOURGLASS</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN HOURGLASS SCENE & GOLDEN LIGHT CINEMATIC   */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Hourglass Stage */}
          <View style={styles.hourglassStage}>
            {phase !== 'cinematic' ? (
              <Animated.View
                style={[
                  styles.hourglassFrameContainer,
                  { transform: [{ rotate: hourglassRotate }] },
                ]}
              >
                {/* Top Glass Bulb */}
                <View style={styles.hourglassBulbTop}>
                  <Animated.View
                    style={[
                      styles.sandFillTop,
                      { height: topBulbHeight },
                    ]}
                  >
                    <LinearGradient
                      colors={['#fef08a', '#fbbf24', '#d97706']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>
                </View>

                {/* Center Neck Stream */}
                <View style={styles.hourglassNeck}>
                  {SAND_GRAINS.map((g) => (
                    <Animated.View
                      key={g.id}
                      style={[
                        styles.sandParticleDot,
                        {
                          transform: [
                            { translateY: sandStreamY },
                            { translateX: g.xOffset },
                          ],
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Bottom Glass Bulb */}
                <View style={styles.hourglassBulbBottom}>
                  <Animated.View
                    style={[
                      styles.sandFillBottom,
                      { height: bottomBulbHeight },
                    ]}
                  >
                    <LinearGradient
                      colors={['#fbbf24', '#f59e0b', '#b45309']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>
                </View>
              </Animated.View>
            ) : (
              /* FINAL CINEMATIC: Hourglass dissolves into Pure Golden Light */
              <View style={styles.pureLightStage}>
                <Animated.View
                  style={[
                    styles.pureLightCircle,
                    {
                      transform: [{ scale: pureLightScaleAnim }],
                      opacity: pureLightOpacityAnim,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#ffffff', '#fbbf24', '#d97706']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>

                <Animated.View
                  style={[
                    styles.cinematicShieldIcon,
                    {
                      transform: [{ scale: shieldScaleAnim }],
                      opacity: shieldOpacityAnim,
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={64} color="#ffffff" />
                </Animated.View>
              </View>
            )}
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
                    Present Moment
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "You discovered that staying is sometimes the bravest choice."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#d97706', '#f59e0b']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+300 PTS)'}
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
    backgroundColor: '#1c1917',
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
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  headerTagText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding Details Page
  detailsWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHourglassContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroHourglassFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(69, 26, 3, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroHourglassLabel: {
    color: '#fef08a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(41, 37, 36, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#fbbf24',
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
    color: '#fbbf24',
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgePoints: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  descriptionText: {
    color: '#e7e5e4',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    color: '#fef3c7',
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
    color: '#fbbf24',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
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
  hourglassStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  hourglassFrameContainer: {
    width: 140,
    height: 230,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hourglassBulbTop: {
    width: 110,
    height: 90,
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(28, 25, 23, 0.85)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sandFillTop: {
    width: '100%',
    overflow: 'hidden',
  },
  hourglassNeck: {
    width: 12,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sandParticleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#fef08a',
  },
  hourglassBulbBottom: {
    width: 110,
    height: 90,
    borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(28, 25, 23, 0.85)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sandFillBottom: {
    width: '100%',
    overflow: 'hidden',
  },

  // Final Cinematic Pure Light
  pureLightStage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pureLightCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#fbbf24',
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  cinematicShieldIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#fbbf24',
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
    color: '#fbbf24',
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
    backgroundColor: 'rgba(41, 37, 36, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
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
    color: '#fbbf24',
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
    color: '#e7e5e4',
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
