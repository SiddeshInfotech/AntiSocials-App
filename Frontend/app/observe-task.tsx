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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Rect, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TASK_DURATION_SECONDS = 300; // Exact 5 minutes (300 seconds)

// Confetti particles for completion page
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 6],
  size: 6 + Math.random() * 8,
  delay: (i % 8) * 150,
  duration: 2200 + Math.random() * 800,
}));

// Drifting thought impulses for Page 1 & Page 2 animations
const IMPULSE_WORDS = [
  'Quick check?',
  'New alert?',
  'Just 10 seconds...',
  'Did someone reply?',
  'Boredom urge',
];

export default function ObserveTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // PRIMARY SCREEN / PAGE STATE
  // EXACTLY 3 PAGES: 1 (intro), 2 (observation), 3 (completion)
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Timer States for Page 2
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [activeGuidanceIndex, setActiveGuidanceIndex] = useState(0);

  // Backend & Reward States for Page 3
  const [isAwarding, setIsAwarding] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<'pending' | 'success' | 'already_claimed' | 'error'>('pending');
  const [userTotalPoints, setUserTotalPoints] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);

  // Guard ref to ensure backend points are awarded STRICTLY ONCE
  const hasAwardedRef = useRef(false);

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

  // Ambient breathing background aura
  const ambientBreathAnim = useRef(new Animated.Value(1)).current;
  const ambientGlowAnim = useRef(new Animated.Value(0.4)).current;

  // Page 1 Floating Phone Hologram & Ripple Waves
  const phoneFloatAnim = useRef(new Animated.Value(0)).current;
  const rippleWaveAnim1 = useRef(new Animated.Value(0)).current;
  const rippleWaveAnim2 = useRef(new Animated.Value(0)).current;
  const impulseWordIndex = useRef(0);
  const [currentImpulseText, setCurrentImpulseText] = useState(IMPULSE_WORDS[0]);
  const impulseOpacityAnim = useRef(new Animated.Value(0)).current;
  const impulseYAnim = useRef(new Animated.Value(10)).current;

  // Page 2 Zen Circle & Breathing Aura
  const zenBreathScaleAnim = useRef(new Animated.Value(1)).current;
  const zenBreathTextAnim = useRef(new Animated.Value(0.7)).current;
  const timerGlowPulse = useRef(new Animated.Value(0.7)).current;

  // Page 3 Trophy / Confetti Animations
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
      // Haptics unavailable on some platforms/devices
    }
  };

  // ----------------------------------------------------
  // AMBIENT BACKGROUND & FLOATING ANIMATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Ambient background breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBreathAnim, {
          toValue: 1.08,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientBreathAnim, {
          toValue: 1.0,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Ambient glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlowAnim, {
          toValue: 0.85,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientGlowAnim, {
          toValue: 0.35,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Floating Phone movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(phoneFloatAnim, {
          toValue: -14,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(phoneFloatAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Concentric Ripple waves
    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleWaveAnim1, {
          toValue: 1,
          duration: 3000,
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
            duration: 3000,
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
    }, 1500);

    // 5. Zen breath cycle for Page 2
    Animated.loop(
      Animated.sequence([
        Animated.timing(zenBreathScaleAnim, {
          toValue: 1.18,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(zenBreathScaleAnim, {
          toValue: 0.96,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 6. Timer glow pulsation
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

  // Impulse thoughts loop on Page 1
  useEffect(() => {
    if (page !== 1) return;

    const impulseInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(impulseOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(impulseYAnim, {
          toValue: 15,
          duration: 10,
          useNativeDriver: true,
        }),
      ]).start(() => {
        impulseWordIndex.current = (impulseWordIndex.current + 1) % IMPULSE_WORDS.length;
        setCurrentImpulseText(IMPULSE_WORDS[impulseWordIndex.current]);

        Animated.parallel([
          Animated.timing(impulseOpacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(impulseYAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3200);

    // Initial show
    Animated.parallel([
      Animated.timing(impulseOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(impulseYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearInterval(impulseInterval);
  }, [page]);

  // Guidance points rotation on Page 2 during 5-minute observation
  useEffect(() => {
    if (page !== 2 || !isTimerRunning) return;

    // Rotate guidance highlight gently every 25 seconds
    const guidanceInterval = setInterval(() => {
      setActiveGuidanceIndex((prev) => (prev + 1) % 3);
    }, 25000);

    return () => clearInterval(guidanceInterval);
  }, [page, isTimerRunning]);

  // ----------------------------------------------------
  // APP STATE RESILIENCE: BACKGROUND / RESUME HANDLING
  // Ensures countdown does not drift or pause when user minimizes/locks screen
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
  // TIMER TICK LOOP (EXACT 5:00 COUNTDOWN)
  // Starts ONLY after "Begin Now" is tapped
  // ----------------------------------------------------
  useEffect(() => {
    if (page === 2 && isTimerRunning && timeLeft > 0) {
      // Clear any prior timer instance to prevent duplicate intervals
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
  // NAVIGATION & PAGE TRANSITIONS
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

  // PAGE 1 -> PAGE 2: User taps "Start Observation"
  const handleStartObservation = () => {
    transitionToPage(2);
  };

  // PAGE 2: User taps "Begin Now" to start the exact 5-minute countdown
  const handleBeginNow = () => {
    triggerHaptic('success');
    setTimeLeft(TASK_DURATION_SECONDS);
    endTimeRef.current = Date.now() + TASK_DURATION_SECONDS * 1000;
    setIsTimerRunning(true);
  };

  // PAGE 2 -> PAGE 3: Timer hits exactly 00:00 -> automatically navigate to Page 3
  const handleTimerComplete = useCallback(() => {
    setIsTimerRunning(false);
    triggerHaptic('success');

    // Automatically navigate to Page 3
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
        console.warn('⚠️ No auth token available for task reward');
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
          task_name: 'Observe urge to check phone',
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

      // 2. Refresh user summary to ensure backend synchronization
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
    // Trophy spring pop
    Animated.spring(trophyScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Celebration aura expanding
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

    // Confetti falling particles
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
        // Fast forward to 3 seconds remaining
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
          colors={['#040711', '#080e22', '#03050a']}
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
          styles.ambientOrbIndigo,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />

      <SafeAreaView style={styles.safeAreaLayer} edges={['top', 'bottom']}>
        {/* Top Navigation Bar */}
        <View style={styles.navHeader}>
          {page !== 3 ? (
            <TouchableOpacity
              style={styles.circleNavButton}
              onPress={() => {
                if (page === 2 && isTimerRunning) {
                  Alert.alert(
                    'Cancel Observation?',
                    'Are you sure you want to stop now? Your 5-minute session will reset.',
                    [
                      { text: 'Keep Observing', style: 'cancel' },
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
              {page === 1 ? 'TASK INTRO' : page === 2 ? '5 MIN MINDFULNESS' : 'COMPLETE'}
            </Text>
          </View>

          <View style={styles.pageIndicatorContainer}>
            <Text style={styles.pageIndicatorText}>
              {page} <Text style={{ color: '#64748b' }}>/ 3</Text>
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* ANIMATED PAGE WRAPPER */}
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
          {/* PAGE 1 — INTRO / START OBSERVATION                   */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Full-Screen Resisting/Checking Phone Hologram Animation */}
              <View style={styles.hologramStage}>
                {/* Concentric Awareness Ripple 1 */}
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
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.25, 0],
                      }),
                    },
                  ]}
                />

                {/* Concentric Awareness Ripple 2 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      borderColor: 'rgba(99, 102, 241, 0.45)',
                      transform: [
                        {
                          scale: rippleWaveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: rippleWaveAnim2.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.25, 0],
                      }),
                    },
                  ]}
                />

                {/* Floating Thought Impulse Bubble */}
                <Animated.View
                  style={[
                    styles.floatingImpulseBadge,
                    {
                      opacity: impulseOpacityAnim,
                      transform: [{ translateY: impulseYAnim }],
                    },
                  ]}
                >
                  <View style={styles.impulseDot} />
                  <Text style={styles.impulseText}>{currentImpulseText}</Text>
                  <Feather name="bell-off" size={13} color="#f87171" style={{ marginLeft: 5 }} />
                </Animated.View>

                {/* Floating Holographic Smartphone Device */}
                <Animated.View
                  style={[
                    styles.phoneHologramContainer,
                    {
                      transform: [{ translateY: phoneFloatAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']}
                    style={styles.phoneChassis}
                  >
                    {/* Phone speaker / camera notch */}
                    <View style={styles.phoneNotch} />

                    {/* Phone screen display */}
                    <View style={styles.phoneDisplay}>
                      {/* Radiating Mindfulness Wave Graphic */}
                      <Svg width={120} height={120} viewBox="0 0 120 120">
                        <Defs>
                          <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                            <Stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                          </SvgLinearGradient>
                        </Defs>
                        {/* Mindful Eye & Concentric Radar */}
                        <Circle cx="60" cy="60" r="46" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.5" />
                        <Circle cx="60" cy="60" r="32" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.5" />
                        <Circle cx="60" cy="60" r="18" fill="url(#waveGrad)" opacity="0.35" />
                        <Circle cx="60" cy="60" r="8" fill="#38bdf8" />
                        <Path
                          d="M40 60 Q 60 40 80 60 Q 60 80 40 60 Z"
                          stroke="#ffffff"
                          strokeWidth="2.2"
                          fill="none"
                        />
                        <Circle cx="60" cy="60" r="4" fill="#ffffff" />
                      </Svg>
                      <Text style={styles.phoneScreenLabel}>OBSERVING URGE</Text>
                      <Text style={styles.phoneScreenSub}>Stillness Shield Active</Text>
                    </View>

                    {/* Home indicator bar */}
                    <View style={styles.phoneHomeBar} />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Title & Metadata Badges */}
              <View style={styles.introContentSection}>
                <Text style={styles.taskTitle}>Observe Urge to Check Phone</Text>

                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badgePill, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#38bdf8" />
                    <Text style={[styles.badgeText, { color: '#38bdf8' }]}>5 Min</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="shield" size={13} color="#34d399" />
                    <Text style={[styles.badgeText, { color: '#34d399' }]}>Mindfulness</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#fbbf24" />
                    <Text style={[styles.badgeText, { color: '#fbbf24' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* Short explanation of the task in EXACTLY 2 LINES */}
                <View style={styles.twoLineCard}>
                  <Text style={styles.explanationLine1} numberOfLines={1}>
                    Notice the automatic reflex to reach for your device in stillness.
                  </Text>
                  <Text style={styles.explanationLine2} numberOfLines={1}>
                    Pause, observe the sensation, and reclaim your undivided focus.
                  </Text>
                </View>

                {/* Subtle Interactive Mindfulness Preview Note */}
                <View style={styles.mindfulNoteContainer}>
                  <Feather name="info" size={14} color="#94a3b8" />
                  <Text style={styles.mindfulNoteText}>
                    A 5-minute dedicated window to observe cravings without reacting.
                  </Text>
                </View>
              </View>

              {/* Primary Action Button: "Start Observation" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartObservation}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#06b6d4', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Start Observation</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — 5 MINUTE OBSERVATION (THE ACTUAL TASK)      */}
          {/* ==================================================== */}
          {page === 2 && (
            <ScrollView
              contentContainerStyle={styles.page2Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Full-Screen Zen Urge-Observing Animation */}
              <View style={styles.page2AnimationStage}>
                {/* Expanding Mindful Awareness Breathing Circle */}
                <Animated.View
                  style={[
                    styles.zenBreathRingOuter,
                    {
                      transform: [{ scale: zenBreathScaleAnim }],
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.zenBreathRingInner,
                    {
                      transform: [{ scale: zenBreathScaleAnim }],
                    },
                  ]}
                />

                {/* Central Mindful Phone Silhouette */}
                <View style={styles.zenPhoneCenterContainer}>
                  <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={styles.zenPhonePuck}
                  >
                    <MaterialCommunityIcons
                      name="cellphone-sound"
                      size={44}
                      color={isTimerRunning ? '#38bdf8' : '#94a3b8'}
                    />
                    <Text style={styles.zenPuckStatus}>
                      {isTimerRunning ? 'STILLNESS' : 'READY'}
                    </Text>
                  </LinearGradient>
                </View>

                {/* Gentle Breathing Prompt */}
                <Animated.Text
                  style={[
                    styles.zenBreathPrompt,
                    {
                      opacity: zenBreathTextAnim,
                    },
                  ]}
                >
                  {isTimerRunning
                    ? 'Breathe deeply. Notice the craving rise and dissolve.'
                    : 'Get into a comfortable posture and prepare to observe.'}
                </Animated.Text>
              </View>

              {/* 5-Minute Visible Countdown Timer */}
              <View style={styles.timerSection}>
                <Pressable onPress={handleDevFastForward}>
                  <Animated.Text
                    style={[
                      styles.countdownTimerText,
                      {
                        opacity: timerGlowPulse,
                        color: isTimerRunning ? '#38bdf8' : '#f8fafc',
                      },
                    ]}
                  >
                    {formatTimer(timeLeft)}
                  </Animated.Text>
                </Pressable>

                <Text style={styles.timerSubCaption}>
                  {isTimerRunning
                    ? '5:00 Observation in Progress'
                    : '5-Minute Mindful Window'}
                </Text>
              </View>

              {/* BEFORE TIMER STARTS: Show "Begin Now" Button */}
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
                    Tap to start the exact 5:00 countdown
                  </Text>
                </View>
              )}

              {/* DURING THE 5 MINUTES: Show the 3 Simple Guidance Points */}
              <View style={styles.guidanceCard}>
                <View style={styles.guidanceHeaderRow}>
                  <Feather name="compass" size={16} color="#38bdf8" />
                  <Text style={styles.guidanceCardTitle}>3 Observation Rules</Text>
                </View>

                {/* Point 1 */}
                <View
                  style={[
                    styles.guidanceItemRow,
                    isTimerRunning && activeGuidanceIndex === 0 && styles.guidanceItemActive,
                  ]}
                >
                  <View style={styles.guidanceNumberBadge}>
                    <Text style={styles.guidanceNumberText}>1</Text>
                  </View>
                  <Text style={styles.guidanceText}>
                    Notice the urge without immediately reacting.
                  </Text>
                </View>

                {/* Point 2 */}
                <View
                  style={[
                    styles.guidanceItemRow,
                    isTimerRunning && activeGuidanceIndex === 1 && styles.guidanceItemActive,
                  ]}
                >
                  <View style={styles.guidanceNumberBadge}>
                    <Text style={styles.guidanceNumberText}>2</Text>
                  </View>
                  <Text style={styles.guidanceText}>
                    Observe what triggered the urge to check your phone.
                  </Text>
                </View>

                {/* Point 3 */}
                <View
                  style={[
                    styles.guidanceItemRow,
                    isTimerRunning && activeGuidanceIndex === 2 && styles.guidanceItemActive,
                  ]}
                >
                  <View style={styles.guidanceNumberBadge}>
                    <Text style={styles.guidanceNumberText}>3</Text>
                  </View>
                  <Text style={styles.guidanceText}>
                    Take a breath and let the urge pass.
                  </Text>
                </View>
              </View>

              {/* Cancel session link if needed */}
              {isTimerRunning && (
                <TouchableOpacity
                  style={styles.abortTaskLink}
                  onPress={() => {
                    Alert.alert(
                      'Stop Observation?',
                      'If you abort now, your 5-minute session will not be saved.',
                      [
                        { text: 'Keep Going', style: 'cancel' },
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
          {/* PAGE 3 — COMPLETION / REWARD                         */}
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

              {/* Satisfying Celebration Centerpiece */}
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

                {/* Pop-in Medallion / Trophy Icon */}
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

              {/* Completion Heading */}
              <View style={styles.completionTextGroup}>
                <Text style={styles.completionHeading}>Observation Complete</Text>
                <Text style={styles.completionSubHeading}>
                  You stayed still, noticed your reflexes, and chose intention over automatic habit.
                </Text>
              </View>

              {/* Prominent +100 Points Reward Card */}
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

                  {/* Live Backend Sync Status Indicator */}
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
                <Feather name="award" size={18} color="#06b6d4" style={{ marginBottom: 6 }} />
                <Text style={styles.reflectionTitle}>Focus Muscle Strengthened</Text>
                <Text style={styles.reflectionBody}>
                  Every time you resist the urge to unlock without intent, you train your brain to reclaim deep focus.
                </Text>
              </View>

              {/* Primary Action Button: "Done" -> Return to App */}
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
    backgroundColor: '#03050a',
  },
  safeAreaLayer: {
    flex: 1,
  },

  // Ambient Glowing Orbs
  ambientOrbCyan: {
    position: 'absolute',
    top: height * 0.12,
    left: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  ambientOrbIndigo: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },

  // Navigation Header
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
    backgroundColor: '#06b6d4',
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
  hologramStage: {
    width: width * 0.85,
    height: height * 0.38,
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
  floatingImpulseBadge: {
    position: 'absolute',
    top: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    zIndex: 5,
  },
  impulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f87171',
    marginRight: 6,
  },
  impulseText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '600',
  },
  phoneHologramContainer: {
    width: 150,
    height: 240,
    borderRadius: 28,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 10,
  },
  phoneChassis: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneNotch: {
    width: 44,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    marginTop: 2,
  },
  phoneDisplay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  phoneScreenLabel: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  phoneScreenSub: {
    color: '#06b6d4',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  phoneHomeBar: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    marginBottom: 4,
  },

  introContentSection: {
    width: '100%',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 26,
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

  // EXACT 2-LINE EXPLANATION CARD
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
    shadowColor: '#06b6d4',
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
  zenBreathRingOuter: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    backgroundColor: 'rgba(56, 189, 248, 0.03)',
  },
  zenBreathRingInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  zenPhoneCenterContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  zenPhonePuck: {
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
  zenBreathPrompt: {
    position: 'absolute',
    bottom: -8,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
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
    textShadowColor: 'rgba(6, 182, 212, 0.35)',
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

  guidanceCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  guidanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guidanceCardTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  guidanceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  guidanceItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  guidanceNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceNumberText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  guidanceText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
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