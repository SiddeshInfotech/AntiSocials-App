import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AppState,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TASK_DURATION_SECONDS = 120; // 2 minutes (120 seconds)

// Confetti particle configuration for completion screen
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 6],
  size: 6 + Math.random() * 8,
  delay: (i % 8) * 140,
  duration: 2200 + Math.random() * 800,
}));

export default function EyeRestTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 3 PAGES: 1 (intro), 2 (eye rest activity), 3 (completion)
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Timer states for Page 2
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);

  // Backend points & completion states for Page 3
  const [isAwarding, setIsAwarding] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<'pending' | 'success' | 'already_claimed' | 'error'>('pending');
  const [userTotalPoints, setUserTotalPoints] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);

  // Guard ref ensuring backend reward is sent strictly once per completed session
  const hasAwardedRef = useRef(false);

  // Drift-free timer and AppState tracking refs
  const endTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  // Page cross-fade transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Ambient breathing background aura
  const ambientBreathAnim = useRef(new Animated.Value(1)).current;
  const ambientGlowAnim = useRef(new Animated.Value(0.4)).current;

  // Page 1 Eye Rest Mascot & Radiant Eye Waves
  const eyeFloatAnim = useRef(new Animated.Value(0)).current;
  const eyePulseScale = useRef(new Animated.Value(1)).current;
  const eyeWaveAnim1 = useRef(new Animated.Value(0)).current;
  const eyeWaveAnim2 = useRef(new Animated.Value(0)).current;

  // Page 2 Zen Eye Relaxation & Horizon Breathing
  const irisBreathAnim = useRef(new Animated.Value(1)).current;
  const horizonRingAnim = useRef(new Animated.Value(0)).current;
  const timerGlowPulse = useRef(new Animated.Value(0.7)).current;

  // Page 3 Trophy / Confetti Celebration Animations
  const trophyScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationAuraAnim = useRef(new Animated.Value(0)).current;
  const rewardCardSlideAnim = useRef(new Animated.Value(30)).current;
  const rewardCardOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiFallAnims = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;

  // Safe Haptics helper
  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Haptics not supported on some platforms
    }
  };

  // ----------------------------------------------------
  // AMBIENT & CONTINUOUS ANIMATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Ambient Background Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBreathAnim, {
          toValue: 1.08,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientBreathAnim, {
          toValue: 1.0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Ambient Glow Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlowAnim, {
          toValue: 0.85,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientGlowAnim, {
          toValue: 0.35,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Eye Mascot Floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(eyeFloatAnim, {
          toValue: -12,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(eyeFloatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Soft Eye Scale Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(eyePulseScale, {
          toValue: 1.06,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(eyePulseScale, {
          toValue: 0.96,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. Radiating Relaxation Waves
    Animated.loop(
      Animated.sequence([
        Animated.timing(eyeWaveAnim1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(eyeWaveAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(eyeWaveAnim2, {
            toValue: 1,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(eyeWaveAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1500);

    // 6. Page 2 Iris Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(irisBreathAnim, {
          toValue: 1.18,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(irisBreathAnim, {
          toValue: 0.94,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 7. Page 2 Expanding Horizon Wave
    Animated.loop(
      Animated.sequence([
        Animated.timing(horizonRingAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(horizonRingAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 8. Timer Glow Pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(timerGlowPulse, {
          toValue: 0.65,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // APP STATE RESILIENCE: BACKGROUND / RESUME HANDLING
  // Ensures 2:00 countdown maintains real-world accuracy across app switching
  // ----------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        page === 2 &&
        isTimerRunning
      ) {
        if (endTimeRef.current > 0) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleTimerComplete();
          }
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [page, isTimerRunning]);

  // ----------------------------------------------------
  // 2:00 COUNTDOWN TIMER LOOP
  // Starts ONLY after user presses "Begin Now"
  // ----------------------------------------------------
  useEffect(() => {
    if (page === 2 && isTimerRunning && timeLeft > 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          handleTimerComplete();
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [page, isTimerRunning]);

  // ----------------------------------------------------
  // PAGE TRANSITIONS
  // ----------------------------------------------------
  const transitionToPage = useCallback((nextPage: 1 | 2 | 3) => {
    triggerHaptic('medium');

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -20,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(nextPage);
      pageSlideAnim.setValue(20);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // PAGE 1 -> PAGE 2: User taps "Start Task"
  const handleStartTask = () => {
    transitionToPage(2);
  };

  // PAGE 2: User taps "Begin Now" to start 2:00 countdown
  const handleBeginNow = () => {
    triggerHaptic('success');
    setTimeLeft(TASK_DURATION_SECONDS);
    endTimeRef.current = Date.now() + TASK_DURATION_SECONDS * 1000;
    setIsTimerRunning(true);
  };

  // PAGE 2 -> PAGE 3: Timer reaches 00:00 -> automatically navigate to Page 3
  const handleTimerComplete = useCallback(() => {
    setIsTimerRunning(false);
    triggerHaptic('success');
    transitionToPage(3);
  }, [transitionToPage]);

  // ----------------------------------------------------
  // PAGE 3: AWARD 100 POINTS VIA EXISTING BACKEND SYSTEM
  // Strictly awarded once per completed session
  // ----------------------------------------------------
  useEffect(() => {
    if (page === 3 && !hasAwardedRef.current) {
      hasAwardedRef.current = true;
      awardPointsBackend();
      startCelebrationAnimation();
    }
  }, [page]);

  const awardPointsBackend = async () => {
    setIsAwarding(true);
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        console.warn('⚠️ No auth token available for Eye Rest reward');
        setRewardStatus('error');
        setIsAwarding(false);
        return;
      }

      // 1. Post task completion to existing backend endpoint
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Eye Rest',
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        if (data.rewardClaimed === false || data.message === 'Reward already claimed') {
          setRewardStatus('already_claimed');
        } else {
          setRewardStatus('success');
          triggerHaptic('success');
        }

        const totalPts = data.totalPoints ?? data.total_points ?? null;
        const streakNum = data.currentStreak ?? data.current_streak ?? data.streak ?? null;
        if (totalPts !== null) setUserTotalPoints(Number(totalPts));
        if (streakNum !== null) setCurrentStreak(Number(streakNum));
      } else {
        console.error('Task completion error response:', data);
        setRewardStatus('error');
      }

      // 2. Sync refreshed user summary from backend
      try {
        const summaryRes = await apiFetch('/api/user/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          if (summaryData.points !== undefined || summaryData.totalPoints !== undefined) {
            setUserTotalPoints(Number(summaryData.points ?? summaryData.totalPoints ?? 0));
          }
          if (summaryData.streak !== undefined || summaryData.currentStreak !== undefined) {
            setCurrentStreak(Number(summaryData.streak ?? summaryData.currentStreak ?? 0));
          }
        }
      } catch (sumErr) {
        console.log('Summary sync optional refresh:', sumErr);
      }
    } catch (e) {
      console.error('Failed to award points via backend:', e);
      setRewardStatus('error');
    } finally {
      setIsAwarding(false);
    }
  };

  const startCelebrationAnimation = () => {
    // Pop-in medallion
    Animated.spring(trophyScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Expanding celebration aura
    Animated.timing(celebrationAuraAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Reward card entrance
    Animated.parallel([
      Animated.timing(rewardCardOpacityAnim, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rewardCardSlideAnim, {
        toValue: 0,
        duration: 700,
        delay: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Falling confetti
    confettiFallAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(CONFETTI_PARTICLES[i].delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: CONFETTI_PARTICLES[i].duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Developer testing speed-up (Active only in __DEV__ via multi-tap)
  const devTapCount = useRef(0);
  const devLastTapTime = useRef(0);
  const handleDevFastForward = () => {
    if (!__DEV__ || !isTimerRunning) return;
    const now = Date.now();
    if (now - devLastTapTime.current < 400) {
      devTapCount.current += 1;
      if (devTapCount.current >= 4) {
        endTimeRef.current = Date.now() + 3 * 1000;
        setTimeLeft(3);
        triggerHaptic('warning');
        devTapCount.current = 0;
      }
    } else {
      devTapCount.current = 1;
    }
    devLastTapTime.current = now;
  };

  // Format MM:SS with leading zeroes
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="light" />

      {/* ---------------------------------------------------- */}
      {/* AMBIENT BACKGROUND SYSTEM */}
      {/* ---------------------------------------------------- */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: ambientBreathAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#030712', '#051923', '#02050a']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Radiant Glowing Nebula Backdrop */}
      <Animated.View
        style={[
          styles.ambientOrbCyan,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrbEmerald,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />

      <SafeAreaView style={styles.safeAreaLayer} edges={['top', 'bottom']}>
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          {page !== 3 ? (
            <TouchableOpacity
              style={styles.circleNavButton}
              onPress={() => {
                if (page === 2 && isTimerRunning) {
                  Alert.alert(
                    'Cancel Eye Rest?',
                    'Are you sure you want to exit? Your 2-minute eye break will reset.',
                    [
                      { text: 'Keep Relaxing', style: 'cancel' },
                      {
                        text: 'Exit',
                        style: 'destructive',
                        onPress: () => {
                          setIsTimerRunning(false);
                          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                          transitionToPage(1);
                        },
                      },
                    ]
                  );
                } else if (page === 2) {
                  transitionToPage(1);
                } else {
                  if (router.canGoBack()) router.back();
                  else router.replace('/(tabs)');
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="arrow-left" size={20} color="#e2e8f0" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <View style={styles.headerPill}>
            <View style={styles.headerPillDot} />
            <Text style={styles.headerPillText}>
              {page === 1 ? 'TASK INTRO' : page === 2 ? '2 MIN REST' : 'COMPLETE'}
            </Text>
          </View>

          <View style={styles.pageIndicatorContainer}>
            <Text style={styles.pageIndicatorText}>
              {page} <Text style={{ color: '#64748b' }}>/ 3</Text>
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* ANIMATED PAGE CONTAINER */}
        {/* ---------------------------------------------------- */}
        <Animated.View
          style={[
            styles.pageAnimatedContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {/* ==================================================== */}
          {/* PAGE 1 — TASK INTRODUCTION                          */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Premium Calming Eye Mascot Stage */}
              <View style={styles.mascotStage}>
                {/* Concentric Eye Rest Ripple 1 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: eyeWaveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: eyeWaveAnim1.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.25, 0],
                      }),
                    },
                  ]}
                />

                {/* Concentric Eye Rest Ripple 2 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      borderColor: 'rgba(52, 211, 153, 0.45)',
                      transform: [
                        {
                          scale: eyeWaveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: eyeWaveAnim2.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.25, 0],
                      }),
                    },
                  ]}
                />

                {/* Floating Eye Visual Center */}
                <Animated.View
                  style={[
                    styles.eyeMascotCard,
                    {
                      transform: [
                        { translateY: eyeFloatAnim },
                        { scale: eyePulseScale },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(6, 78, 99, 0.7)', 'rgba(4, 47, 46, 0.85)']}
                    style={styles.eyeMascotGradient}
                  >
                    <Svg width={100} height={70} viewBox="0 0 100 70">
                      <Defs>
                        <SvgLinearGradient id="eyeGrad" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                          <Stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
                        </SvgLinearGradient>
                      </Defs>
                      {/* Eyelid Contour */}
                      <Path
                        d="M 10 35 Q 50 5 90 35 Q 50 65 10 35 Z"
                        stroke="url(#eyeGrad)"
                        strokeWidth="3"
                        fill="rgba(15, 23, 42, 0.6)"
                      />
                      {/* Iris */}
                      <Circle cx="50" cy="35" r="16" fill="#0284c7" />
                      <Circle cx="50" cy="35" r="10" fill="#0f172a" />
                      {/* Glimmer */}
                      <Circle cx="46" cy="31" r="3.5" fill="#ffffff" />
                      <Circle cx="54" cy="38" r="1.5" fill="#ffffff" opacity="0.8" />
                    </Svg>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Task Title & Metadata */}
              <View style={styles.introContentSection}>
                <Text style={styles.taskTitle}>Eye Rest</Text>

                {/* Task Information Pills */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badgePill, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#38bdf8" />
                    <Text style={[styles.badgeText, { color: '#38bdf8' }]}>2 min</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="bar-chart-2" size={13} color="#34d399" />
                    <Text style={[styles.badgeText, { color: '#34d399' }]}>Easy</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#fbbf24" />
                    <Text style={[styles.badgeText, { color: '#fbbf24' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* EXACTLY 2-LINE INTRODUCTION PARAGRAPH */}
                <View style={styles.twoLineCard}>
                  <Text style={styles.explanationLine1} numberOfLines={1}>
                    Give your eyes a short break from screens and let them relax.
                  </Text>
                  <Text style={styles.explanationLine2} numberOfLines={1}>
                    Look away, soften your focus, and enjoy a moment of visual rest.
                  </Text>
                </View>

                {/* Subtle Health Benefit Note */}
                <View style={styles.mindfulNoteContainer}>
                  <Feather name="eye" size={14} color="#94a3b8" />
                  <Text style={styles.mindfulNoteText}>
                    Reduces digital eye strain and resets visual focus.
                  </Text>
                </View>
              </View>

              {/* Clear Primary Button: "Start Task" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartTask}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#06b6d4', '#10b981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Start Task</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — 2 MINUTE EYE REST (THE ACTUAL ACTIVITY)     */}
          {/* ==================================================== */}
          {page === 2 && (
            <ScrollView
              contentContainerStyle={styles.page2Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Calming, Visually Engaging Eye-Rest Animation */}
              <View style={styles.page2AnimationStage}>
                {/* Expanding Horizon Relaxation Wave */}
                <Animated.View
                  style={[
                    styles.horizonRipple,
                    {
                      transform: [
                        {
                          scale: horizonRingAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.3],
                          }),
                        },
                      ],
                      opacity: horizonRingAnim.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [0.5, 0.2, 0],
                      }),
                    },
                  ]}
                />

                {/* Concentric Softening Iris Rings */}
                <Animated.View
                  style={[
                    styles.irisBreathRingOuter,
                    {
                      transform: [{ scale: irisBreathAnim }],
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.irisBreathRingInner,
                    {
                      transform: [{ scale: irisBreathAnim }],
                    },
                  ]}
                />

                {/* Central Soft Visual Center */}
                <View style={styles.zenEyeCenterContainer}>
                  <LinearGradient
                    colors={['#064e3b', '#022c22']}
                    style={styles.zenEyePuck}
                  >
                    <MaterialCommunityIcons
                      name="eye-outline"
                      size={46}
                      color={isTimerRunning ? '#34d399' : '#94a3b8'}
                    />
                    <Text style={styles.zenPuckStatus}>
                      {isTimerRunning ? 'RESTING' : 'READY'}
                    </Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Simple Instruction Telling User to Look Away & Relax */}
              <View style={styles.instructionBanner}>
                <Feather name="compass" size={18} color="#38bdf8" style={{ marginBottom: 4 }} />
                <Text style={styles.instructionTitle}>Look Away from the Screen</Text>
                <Text style={styles.instructionBody}>
                  Direct your gaze toward a distant object or close your eyes gently. Allow your eye muscles to soften and release tension.
                </Text>
              </View>

              {/* Clear 2:00 Countdown Timer Display */}
              <View style={styles.timerSection}>
                <Pressable onPress={handleDevFastForward}>
                  <Animated.Text
                    style={[
                      styles.countdownTimerText,
                      {
                        opacity: timerGlowPulse,
                        color: isTimerRunning ? '#34d399' : '#f8fafc',
                      },
                    ]}
                  >
                    {formatTimer(timeLeft)}
                  </Animated.Text>
                </Pressable>

                <Text style={styles.timerSubCaption}>
                  {isTimerRunning
                    ? '2:00 Eye Rest in Progress'
                    : '2-Minute Visual Relaxation'}
                </Text>
              </View>

              {/* BEFORE TIMER BEGINS: "Begin Now" Button */}
              {!isTimerRunning && (
                <View style={styles.beginNowWrapper}>
                  <TouchableOpacity
                    style={styles.beginNowButton}
                    onPress={handleBeginNow}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.beginNowGradient}
                    >
                      <Feather name="play" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.beginNowText}>Begin Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.beginHint}>
                    Press to start the exact 2:00 relaxation timer
                  </Text>
                </View>
              )}

              {/* Cancel session link if needed */}
              {isTimerRunning && (
                <TouchableOpacity
                  style={styles.abortTaskLink}
                  onPress={() => {
                    Alert.alert(
                      'Stop Eye Rest?',
                      'If you leave early, your 2-minute progress will not be saved.',
                      [
                        { text: 'Keep Relaxing', style: 'cancel' },
                        {
                          text: 'Stop Session',
                          style: 'destructive',
                          onPress: () => {
                            setIsTimerRunning(false);
                            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                            setTimeLeft(TASK_DURATION_SECONDS);
                            transitionToPage(1);
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.abortTaskText}>Abort Session</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — COMPLETION                                 */}
          {/* ==================================================== */}
          {page === 3 && (
            <ScrollView
              contentContainerStyle={styles.page3Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Confetti Particle Overlay */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CONFETTI_PARTICLES.map((particle, idx) => {
                  const anim = confettiFallAnims[idx];
                  const translateY = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, height * 0.75],
                  });
                  const opacity = anim.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 1, 0.9, 0],
                  });
                  const rotate = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(idx % 2 === 0 ? 1 : -1) * 720}deg`],
                  });

                  return (
                    <Animated.View
                      key={particle.id}
                      style={{
                        position: 'absolute',
                        left: particle.x,
                        top: 0,
                        width: particle.size,
                        height: particle.size * 1.3,
                        backgroundColor: particle.color,
                        borderRadius: 3,
                        opacity,
                        transform: [{ translateY }, { rotate }],
                      }}
                    />
                  );
                })}
              </View>

              {/* Premium Success Medallion Centerpiece */}
              <View style={styles.celebrationStage}>
                {/* Expanding Glowing Aura Ring */}
                <Animated.View
                  style={[
                    styles.celebrationAura,
                    {
                      transform: [
                        {
                          scale: celebrationAuraAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.6, 1.4],
                          }),
                        },
                      ],
                      opacity: celebrationAuraAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.8, 0.4],
                      }),
                    },
                  ]}
                />

                {/* Pop-in Trophy / Check Medallion */}
                <Animated.View
                  style={[
                    styles.medallionWrapper,
                    {
                      transform: [{ scale: trophyScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#047857']}
                    style={styles.medallionCircle}
                  >
                    <Feather name="check" size={54} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Completion Headline */}
              <View style={styles.completionTextGroup}>
                <Text style={styles.completionHeading}>Eye Rest Complete</Text>
                <Text style={styles.completionSubHeading}>
                  Your eye muscles are refreshed and your visual focus is reset.
                </Text>
              </View>

              {/* Visually Prominent +100 Points Reward Card */}
              <Animated.View
                style={[
                  styles.prominentRewardCard,
                  {
                    opacity: rewardCardOpacityAnim,
                    transform: [{ translateY: rewardCardSlideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.16)', 'rgba(5, 150, 105, 0.08)']}
                  style={styles.rewardCardGradient}
                >
                  <View style={styles.rewardSparkleRow}>
                    <Feather name="star" size={18} color="#fbbf24" />
                    <Text style={styles.rewardLabel}>OFFICIAL REWARD</Text>
                    <Feather name="star" size={18} color="#fbbf24" />
                  </View>

                  <Text style={styles.giantPointsText}>+100 Points</Text>

                  {/* Backend Synchronization Status Badge */}
                  <View style={styles.backendStatusBadge}>
                    <Ionicons
                      name={
                        isAwarding
                          ? 'sync-outline'
                          : rewardStatus === 'error'
                          ? 'alert-circle'
                          : 'shield-checkmark'
                      }
                      size={15}
                      color={
                        rewardStatus === 'error'
                          ? '#f87171'
                          : rewardStatus === 'already_claimed'
                          ? '#fbbf24'
                          : '#34d399'
                      }
                    />
                    <Text style={styles.backendStatusText}>
                      {isAwarding
                        ? 'Updating backend balance...'
                        : rewardStatus === 'already_claimed'
                        ? 'Session reward already claimed (+100 banked)'
                        : rewardStatus === 'error'
                        ? 'Completed (Check network)'
                        : 'Added to your backend points'}
                    </Text>
                  </View>

                  {userTotalPoints !== null && (
                    <View style={styles.userSummaryRow}>
                      <Text style={styles.totalBalanceText}>
                        Total Balance: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{userTotalPoints}</Text> pts
                      </Text>
                      {currentStreak !== null && currentStreak > 0 && (
                        <Text style={styles.streakText}>
                          🔥 {currentStreak} day streak
                        </Text>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* Reflection Card */}
              <View style={styles.reflectionCard}>
                <Feather name="smile" size={18} color="#06b6d4" style={{ marginBottom: 6 }} />
                <Text style={styles.reflectionTitle}>Vision Protected</Text>
                <Text style={styles.reflectionBody}>
                  Consistent 2-minute visual pauses prevent ocular fatigue and keep your deep work sharp throughout the day.
                </Text>
              </View>

              {/* Primary Action Button: "Return to Home" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.doneActionButton}
                  onPress={() => {
                    triggerHaptic('medium');
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(tabs)');
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Return to Home</Text>
                    <Feather name="check" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ----------------------------------------------------
// STYLESHEET (PREMIUM ANTISOCIALS OBSIDIAN DESIGN SYSTEM)
// ----------------------------------------------------
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#02050a',
  },
  safeAreaLayer: {
    flex: 1,
  },

  // Ambient Nebula Glow Orbs
  ambientOrbCyan: {
    position: 'absolute',
    top: height * 0.12,
    left: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  ambientOrbEmerald: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(16, 185, 129, 0.13)',
  },

  // Top Navigation Bar
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    zIndex: 10,
  },
  circleNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  headerPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  pageIndicatorContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pageIndicatorText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },

  pageAnimatedContainer: {
    flex: 1,
  },

  // ==========================================
  // PAGE 1 STYLES
  // ==========================================
  page1Scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mascotStage: {
    width: width * 0.85,
    height: height * 0.36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  rippleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'transparent',
  },
  eyeMascotCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 10,
  },
  eyeMascotGradient: {
    flex: 1,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  introContentSection: {
    width: '100%',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  badgeDuration: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  badgeReward: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // EXACTLY 2-LINE INTRODUCTION CARD
  twoLineCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  explanationLine1: {
    color: '#f1f5f9',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  explanationLine2: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 2,
  },

  mindfulNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  mindfulNoteText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  bottomCtaContainer: {
    width: '100%',
    paddingTop: 16,
  },
  primaryActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // ==========================================
  // PAGE 2 STYLES
  // ==========================================
  page2Scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  page2AnimationStage: {
    width: width * 0.85,
    height: height * 0.32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  horizonRipple: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    backgroundColor: 'transparent',
  },
  irisBreathRingOuter: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  irisBreathRingInner: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderRadius: 77.5,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  zenEyeCenterContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  zenEyePuck: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zenPuckStatus: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
  },

  instructionBanner: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginVertical: 8,
  },
  instructionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  instructionBody: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },

  timerSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  countdownTimerText: {
    fontSize: 68,
    fontWeight: '200',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(16, 185, 129, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  timerSubCaption: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },

  beginNowWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 6,
  },
  beginNowButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  beginNowGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginNowText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  beginHint: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },

  abortTaskLink: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  abortTaskText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ==========================================
  // PAGE 3 STYLES
  // ==========================================
  page3Scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  celebrationStage: {
    width: width * 0.85,
    height: height * 0.26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  celebrationAura: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  medallionWrapper: {
    width: 106,
    height: 106,
    borderRadius: 53,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 12,
  },
  medallionCircle: {
    flex: 1,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completionTextGroup: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  completionHeading: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  completionSubHeading: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  prominentRewardCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    marginVertical: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  rewardCardGradient: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rewardSparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rewardLabel: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  giantPointsText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginVertical: 4,
    textShadowColor: 'rgba(16, 185, 129, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  backendStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    marginTop: 6,
  },
  backendStatusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  userSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  totalBalanceText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  streakText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },

  reflectionCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    marginBottom: 12,
  },
  reflectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  reflectionBody: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },

  doneActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
});
