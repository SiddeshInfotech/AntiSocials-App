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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TASK_DURATION_SECONDS = 300; // 5 minutes (300 seconds)

// Subtle celebratory confetti particles for Page 3
const CONFETTI_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#f43f5e', '#10b981', '#fb7185', '#3b82f6', '#f59e0b', '#ec4899'][i % 6],
  size: 6 + Math.random() * 7,
  delay: (i % 7) * 150,
  duration: 2200 + Math.random() * 800,
}));

// Cycling awareness prompts for Page 2
const AWARENESS_PROMPTS = [
  'Feel the rhythm.',
  'Notice each beat.',
  'Stay curious.',
  'Simply observe.',
  'Let your attention rest here.',
];

export default function HeartbeatTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 3 PAGES: 1 (intro), 2 (active experience), 3 (completion)
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Timer states for Page 2
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [showTapFeedback, setShowTapFeedback] = useState(false);

  // Backend submission states for Page 3
  const [isLoading, setIsLoading] = useState(false);
  const hasClaimedRef = useRef(false);

  // Accurate drift-free timer tracking refs
  const endTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  // Page cross-fade transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Background subtle warm breathing
  const breathAnim = useRef(new Animated.Value(1)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;

  // Realistic lub-dub Heartbeat pulse animation
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const heartGlowAnim = useRef(new Animated.Value(0.4)).current;

  // Expanding heartbeat ripple waves
  const rippleWaveAnim1 = useRef(new Animated.Value(0)).current;
  const rippleWaveAnim2 = useRef(new Animated.Value(0)).current;

  // Awareness prompt crossfade animation
  const promptFadeAnim = useRef(new Animated.Value(1)).current;

  // Tap micro-interaction animation
  const tapFeedbackOpacity = useRef(new Animated.Value(0)).current;

  // Page 3 celebration animations
  const trophyScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationAuraAnim = useRef(new Animated.Value(0)).current;
  const rewardCardSlideAnim = useRef(new Animated.Value(30)).current;
  const rewardCardOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiFallAnims = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;

  // Safe Haptics helper
  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'heartbeat' = 'light') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'heartbeat') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 180);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Ignore if unsupported
    }
  };

  // ----------------------------------------------------
  // AMBIENT BACKGROUND & REALISTIC HEARTBEAT ANIMATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Gentle background breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.03,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1.0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.timing(bgShiftAnim, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Realistic "lub-dub" Heartbeat rhythm loop
    // Expand (lub) -> Contract -> Expand (dub) -> Rest
    Animated.loop(
      Animated.sequence([
        // Lub (1st beat)
        Animated.parallel([
          Animated.timing(heartScaleAnim, {
            toValue: 1.14,
            duration: 160,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(heartGlowAnim, {
            toValue: 0.9,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(heartScaleAnim, {
          toValue: 0.98,
          duration: 140,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        // Dub (2nd beat)
        Animated.parallel([
          Animated.timing(heartScaleAnim, {
            toValue: 1.08,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(heartGlowAnim, {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Smooth return & resting interval
        Animated.parallel([
          Animated.timing(heartScaleAnim, {
            toValue: 1.0,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(heartGlowAnim, {
            toValue: 0.4,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600), // Calm rest between beats (~70 bpm)
      ])
    ).start();

    // 3. Expanding ripple wave loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleWaveAnim1, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleWaveAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rippleWaveAnim2, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rippleWaveAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1100);
  }, []);

  // ----------------------------------------------------
  // PROMPT ROTATION (PAGE 2)
  // Gently fades between awareness prompts
  // ----------------------------------------------------
  useEffect(() => {
    if (page !== 2 || isPaused) return;

    const promptInterval = setInterval(() => {
      Animated.timing(promptFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setActivePromptIndex((prev) => (prev + 1) % AWARENESS_PROMPTS.length);
        Animated.timing(promptFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 9000);

    return () => clearInterval(promptInterval);
  }, [page, isPaused]);

  // ----------------------------------------------------
  // APP STATE RESILIENCE: BACKGROUND / RESUME HANDLING
  // ----------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        page === 2 &&
        !isPaused
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
  }, [page, isPaused]);

  // ----------------------------------------------------
  // 5:00 TIMER COUNTDOWN LOOP (PAGE 2)
  // ----------------------------------------------------
  useEffect(() => {
    if (page === 2 && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;

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
  }, [page, isPaused]);

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
        toValue: -15,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(nextPage);
      pageSlideAnim.setValue(15);

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

  // PAGE 1 -> PAGE 2: User taps "START TASK"
  const handleStartTask = () => {
    transitionToPage(2);
  };

  // PAGE 2 -> PAGE 3: Timer hits 00:00 -> transition to completion
  const handleTimerComplete = useCallback(() => {
    triggerHaptic('success');
    transitionToPage(3);
  }, [transitionToPage]);

  // Optional Micro-Interaction: Tap Heart on Page 2
  const handleHeartTap = () => {
    triggerHaptic('heartbeat');
    setShowTapFeedback(true);

    Animated.sequence([
      Animated.timing(tapFeedbackOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(tapFeedbackOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowTapFeedback(false);
    });
  };

  // PAGE 3: Start celebratory animations
  useEffect(() => {
    if (page === 3) {
      Animated.spring(trophyScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();

      Animated.timing(celebrationAuraAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

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
    }
  }, [page]);

  // PAGE 3: Claim +100 Points via existing backend API
  const handleClaimPoints = async () => {
    if (isLoading || hasClaimedRef.current) return;
    hasClaimedRef.current = true;
    setIsLoading(true);
    triggerHaptic('medium');

    let pointsData = {
      pointsAdded: '100',
      totalPoints: '0',
      streak: '0',
    };

    try {
      const token = await SecureStore.getItemAsync('token');

      if (token) {
        // Authenticated task completion request
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Notice heartbeat',
          }),
        });

        const data = await response.json();

        if (response.ok || data.success) {
          triggerHaptic('success');
          const earned = data.pointsEarned ?? data.pointsAdded ?? data.points_earned ?? 100;
          const total = data.totalPoints ?? data.total_points ?? 0;
          const streakNum = data.currentStreak ?? data.current_streak ?? data.streak ?? 0;

          pointsData = {
            pointsAdded: earned.toString(),
            totalPoints: total.toString(),
            streak: streakNum.toString(),
          };
        } else {
          hasClaimedRef.current = false;
          Alert.alert('Error', data.error || 'Failed to submit task completion. Please try again.');
          setIsLoading(false);
          return;
        }
      } else {
        hasClaimedRef.current = false;
        Alert.alert('Authorization Error', 'No authorization token found. Please log in again.');
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error claiming points:', e);
      hasClaimedRef.current = false;
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }

    // Navigate to existing task-success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Notice heartbeat',
        task_name: 'Notice heartbeat',
        difficulty: 'Easy',
        message: 'You took a moment to notice what was already there.',
      },
    } as any);
  };

  // Developer skip helper (__DEV__ multi-tap)
  const devTapCount = useRef(0);
  const devLastTapTime = useRef(0);
  const handleDevFastForward = () => {
    if (!__DEV__) return;
    const now = Date.now();
    if (now - devLastTapTime.current < 400) {
      devTapCount.current += 1;
      if (devTapCount.current >= 4) {
        endTimeRef.current = Date.now() + 3 * 1000;
        setTimeLeft(3);
        triggerHaptic('heartbeat');
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress calculation for Page 2
  const progressRatio = Math.max(0, Math.min(1, (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS));
  const progressCircleRadius = 110;
  const progressCircumference = 2 * Math.PI * progressCircleRadius;
  const progressStrokeDashoffset = progressCircumference * (1 - progressRatio);

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" />

      {/* ---------------------------------------------------- */}
      {/* SOFT LIGHT WELLNESS BACKGROUND */}
      {/* ---------------------------------------------------- */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: breathAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#fffafa', '#fdf8f8']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: bgShiftAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['#fdfcf7', '#fef4f5', '#ffffff']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Subtle Warm Blush Glow Orbs */}
      <View style={styles.ambientBlushOrb} pointerEvents="none" />

      <SafeAreaView style={styles.safeAreaLayer} edges={['top', 'bottom']}>
        {/* Top Header Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleBackBtn}
            onPress={() => {
              if (page === 2) {
                Alert.alert(
                  'Exit Heartbeat Observation?',
                  'Your 5-minute session will stop and reset.',
                  [
                    { text: 'Keep Observing', style: 'cancel' },
                    {
                      text: 'Exit',
                      style: 'destructive',
                      onPress: () => {
                        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                        setTimeLeft(TASK_DURATION_SECONDS);
                        transitionToPage(1);
                      },
                    },
                  ]
                );
              } else if (page === 3) {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              } else {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={22} color="#1f2937" />
          </TouchableOpacity>

          <View style={styles.headerStateBadge}>
            <View style={styles.stateBadgeDot} />
            <Text style={styles.stateBadgeText}>
              {page === 1 ? 'PREPARATION' : page === 2 ? 'OBSERVATION' : 'COMPLETION'}
            </Text>
          </View>

          <View style={styles.pageStepTextWrapper}>
            <Text style={styles.pageStepText}>
              {page} <Text style={{ color: '#9ca3af' }}>/ 3</Text>
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* ANIMATED PAGE WRAPPER */}
        {/* ---------------------------------------------------- */}
        <Animated.View
          style={[
            styles.pageContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {/* ==================================================== */}
          {/* PAGE 1 — INTRO / PREPARATION                         */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Center: Large Animated Heart with Gentle Pulse & Ripples */}
              <View style={styles.mascotStage}>
                {/* Concentric Soft Pink Ripple 1 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: rippleWaveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: rippleWaveAnim1.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [0.55, 0.2, 0],
                      }),
                    },
                  ]}
                />

                {/* Concentric Soft Pink Ripple 2 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      borderColor: 'rgba(244, 63, 94, 0.35)',
                      transform: [
                        {
                          scale: rippleWaveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: rippleWaveAnim2.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [0.55, 0.2, 0],
                      }),
                    },
                  ]}
                />

                {/* Animated Pulsing Heart Icon */}
                <Animated.View
                  style={[
                    styles.heartPuckCard,
                    {
                      transform: [{ scale: heartScaleAnim }],
                      shadowOpacity: heartGlowAnim,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#fff1f2', '#ffe4e6']}
                    style={styles.heartPuckGradient}
                  >
                    <Text style={styles.heartEmojiBig}>❤️</Text>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Title & Subtitle */}
              <View style={styles.introContentSection}>
                <Text style={styles.taskTitle}>Notice your heartbeat</Text>
                <Text style={styles.taskSubtitle}>
                  Take a quiet moment to notice the rhythm that's already with you.
                </Text>

                {/* Task Information Pills: 5 min, Easy, +100 Points */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badgePill, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#2563eb" />
                    <Text style={[styles.badgeText, { color: '#2563eb' }]}>5 min</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="bar-chart-2" size={13} color="#16a34a" />
                    <Text style={[styles.badgeText, { color: '#16a34a' }]}>Easy</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#d97706" />
                    <Text style={[styles.badgeText, { color: '#d97706' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* Instruction Card (Exactly 5 Points) */}
                <View style={styles.instructionCard}>
                  <View style={styles.instructionPointRow}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>Sit comfortably and relax your body.</Text>
                  </View>
                  <View style={styles.instructionPointRow}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>Place your attention on your heartbeat.</Text>
                  </View>
                  <View style={styles.instructionPointRow}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>Notice the rhythm without trying to change it.</Text>
                  </View>
                  <View style={styles.instructionPointRow}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>If your attention wanders, gently bring it back.</Text>
                  </View>
                  <View style={styles.instructionPointRow}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>Simply observe and stay present.</Text>
                  </View>
                </View>
              </View>

              {/* Bottom: Large Rounded Green Button: "START TASK" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartTask}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>START TASK</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — ACTIVE HEARTBEAT EXPERIENCE                 */}
          {/* ==================================================== */}
          {page === 2 && (
            <ScrollView
              contentContainerStyle={styles.page2Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Top Awareness Prompts */}
              <View style={styles.activePromptHeader}>
                <Text style={styles.activeHeaderHeading}>Notice the rhythm</Text>
                <Animated.View style={{ opacity: promptFadeAnim, marginTop: 4 }}>
                  <Text style={styles.cyclingPromptText}>
                    "{AWARENESS_PROMPTS[activePromptIndex]}"
                  </Text>
                </Animated.View>
              </View>

              {/* Center Heart with Expanding Ripples & Circular Progress Ring */}
              <View style={styles.activeHeartStage}>
                {/* SVG Circular Progress Ring */}
                <Svg width={250} height={250} style={StyleSheet.absoluteFillObject}>
                  <Defs>
                    <SvgLinearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor="#10b981" />
                      <Stop offset="100%" stopColor="#059669" />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Background Track Ring */}
                  <Circle
                    cx="125"
                    cy="125"
                    r={progressCircleRadius}
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  {/* Active Progress Ring */}
                  <Circle
                    cx="125"
                    cy="125"
                    r={progressCircleRadius}
                    stroke="url(#progressGrad)"
                    strokeWidth="4.5"
                    strokeDasharray={`${progressCircumference}`}
                    strokeDashoffset={progressStrokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    transform="rotate(-90 125 125)"
                  />
                </Svg>

                {/* Soft Expanding Pulse Ripple on Beat */}
                <Animated.View
                  style={[
                    styles.activeRippleRing,
                    {
                      transform: [
                        {
                          scale: rippleWaveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.75, 1.8],
                          }),
                        },
                      ],
                      opacity: rippleWaveAnim1.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 0.15, 0],
                      }),
                    },
                  ]}
                />

                {/* Tap-able Heart Container with Lub-Dub Scale Pulse */}
                <Pressable onPress={handleHeartTap} style={styles.heartPressable}>
                  <Animated.View
                    style={[
                      styles.activeHeartPuck,
                      {
                        transform: [{ scale: heartScaleAnim }],
                        shadowOpacity: heartGlowAnim,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#fff1f2', '#ffe4e6']}
                      style={styles.activeHeartGradient}
                    >
                      <Text style={styles.activeHeartEmoji}>❤️</Text>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>

                {/* Optional Micro-Interaction Floating Badge: "You're here." */}
                {showTapFeedback && (
                  <Animated.View
                    style={[
                      styles.tapFeedbackBadge,
                      {
                        opacity: tapFeedbackOpacity,
                      },
                    ]}
                  >
                    <Text style={styles.tapFeedbackText}>You're here.</Text>
                  </Animated.View>
                )}
              </View>

              {/* Timer Display: 5:00 Counting Down */}
              <View style={styles.timerCenterGroup}>
                <Pressable onPress={handleDevFastForward}>
                  <Text style={styles.timerDigitText}>{formatTimer(timeLeft)}</Text>
                </Pressable>

                <Text style={styles.timerSubtitle}>
                  {isPaused ? 'Observation Paused' : 'Listening to your natural pulse'}
                </Text>

                {/* Pause / Resume Control */}
                <TouchableOpacity
                  style={[
                    styles.pauseToggleBtn,
                    isPaused ? styles.resumeToggleBtn : styles.pauseOutlineBtn,
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    setIsPaused(!isPaused);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isPaused ? 'play' : 'pause'}
                    size={16}
                    color={isPaused ? '#ffffff' : '#4b5563'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.pauseToggleText,
                      isPaused && { color: '#ffffff' },
                    ]}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gentle Helper Tip */}
              <View style={styles.activeObservationFooter}>
                <Feather name="info" size={14} color="#9ca3af" />
                <Text style={styles.activeFooterText}>
                  Rest your hand on your chest or wrist if it helps you feel the beat.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — COMPLETION / REWARD                         */}
          {/* ==================================================== */}
          {page === 3 && (
            <ScrollView
              contentContainerStyle={styles.page3Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Confetti Particles Overlay */}
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

              {/* Center: Large Animated Heart with Expanding Circles */}
              <View style={styles.celebrationStage}>
                <Animated.View
                  style={[
                    styles.celebrationAuraCircle,
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
                        outputRange: [0.35, 0.7, 0.25],
                      }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.celebrationHeartCard,
                    {
                      transform: [{ scale: trophyScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#fff1f2', '#ffe4e6']}
                    style={styles.celebrationHeartGradient}
                  >
                    <Text style={styles.celebrationHeartEmoji}>❤️</Text>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Heading: "Well done." & Subtitle */}
              <View style={styles.completionHeadingGroup}>
                <Text style={styles.completionTitle}>Well done.</Text>
                <Text style={styles.completionSubtitle}>
                  You took a moment to notice what was already there.
                </Text>
              </View>

              {/* Visually Prominent +100 Points Reward Card */}
              <Animated.View
                style={[
                  styles.rewardCardContainer,
                  {
                    opacity: rewardCardOpacityAnim,
                    transform: [{ translateY: rewardCardSlideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#ffffff', '#fdfcf7']}
                  style={styles.rewardCardGradient}
                >
                  <View style={styles.rewardHeaderPill}>
                    <Feather name="award" size={15} color="#d97706" />
                    <Text style={styles.rewardHeaderPillText}>SESSION REWARD</Text>
                  </View>

                  <Text style={styles.pointsGiantText}>+100 Points</Text>

                  <Text style={styles.rewardSubtext}>
                    Credited to your verified AntiSocials account
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Mindfulness Benefit Card */}
              <View style={styles.mindfulBenefitCard}>
                <Feather name="check-circle" size={16} color="#10b981" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.mindfulBenefitText}>
                  Tuning into your internal body sensations strengthens vagal tone and helps lower sympathetic nervous arousal.
                </Text>
              </View>

              {/* Completion Action Button: "Claim +100 Points" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.claimActionButton}
                  onPress={handleClaimPoints}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Claim +100 Points</Text>
                        <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                      </>
                    )}
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
// STYLESHEET (CLEAN LIGHT WELLNESS DESIGN SYSTEM)
// ----------------------------------------------------
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeAreaLayer: {
    flex: 1,
  },

  // Soft Ambient Blush Glow
  ambientBlushOrb: {
    position: 'absolute',
    top: height * 0.12,
    alignSelf: 'center',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: (width * 0.95) / 2,
    backgroundColor: 'rgba(254, 226, 226, 0.45)',
  },

  // Top Bar Navigation
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerStateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stateBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f43f5e',
    marginRight: 6,
  },
  stateBadgeText: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  pageStepTextWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pageStepText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '700',
  },

  pageContainer: {
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
    height: height * 0.32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  rippleCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.45)',
    backgroundColor: 'transparent',
  },
  heartPuckCard: {
    width: 124,
    height: 124,
    borderRadius: 62,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
    elevation: 8,
  },
  heartPuckGradient: {
    flex: 1,
    borderRadius: 62,
    borderWidth: 2,
    borderColor: 'rgba(254, 205, 211, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartEmojiBig: {
    fontSize: 58,
  },

  introContentSection: {
    width: '100%',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  taskSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  badgeDuration: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  badgeDifficulty: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  badgeReward: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // 5-Point Instruction Card
  instructionCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    gap: 8,
  },
  instructionPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointBullet: {
    fontSize: 14,
    color: '#f43f5e',
    fontWeight: '800',
    marginTop: 1,
  },
  pointText: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
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
    letterSpacing: 1.2,
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
  activePromptHeader: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  activeHeaderHeading: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cyclingPromptText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  activeHeartStage: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  activeRippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.45)',
    backgroundColor: 'rgba(254, 226, 226, 0.25)',
  },
  heartPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeHeartPuck: {
    width: 130,
    height: 130,
    borderRadius: 65,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 10,
  },
  activeHeartGradient: {
    flex: 1,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(254, 205, 211, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeHeartEmoji: {
    fontSize: 64,
  },
  tapFeedbackBadge: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tapFeedbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  timerCenterGroup: {
    alignItems: 'center',
    marginVertical: 8,
  },
  timerDigitText: {
    fontSize: 64,
    fontWeight: '300',
    color: '#1f2937',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  pauseToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
  },
  pauseOutlineBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resumeToggleBtn: {
    backgroundColor: '#10b981',
  },
  pauseToggleText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },

  activeObservationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  activeFooterText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
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
    height: height * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  celebrationAuraCircle: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
  },
  celebrationHeartCard: {
    width: 114,
    height: 114,
    borderRadius: 57,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 8,
  },
  celebrationHeartGradient: {
    flex: 1,
    borderRadius: 57,
    borderWidth: 2,
    borderColor: 'rgba(254, 205, 211, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationHeartEmoji: {
    fontSize: 56,
  },

  completionHeadingGroup: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  completionTitle: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  completionSubtitle: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  rewardCardContainer: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    marginVertical: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  rewardCardGradient: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rewardHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 6,
  },
  rewardHeaderPillText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pointsGiantText: {
    color: '#111827',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  rewardSubtext: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },

  mindfulBenefitCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  mindfulBenefitText: {
    flex: 1,
    color: '#4b5563',
    fontSize: 12.5,
    fontWeight: '400',
    lineHeight: 18,
  },

  claimActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
});
