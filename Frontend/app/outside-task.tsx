import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  AppState,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TASK_DURATION_SECONDS = 120; // 2 minutes (120 seconds)

// Rotating Mindfulness Prompts for Page 2
const MINDFULNESS_PROMPTS = [
  'Notice the sky.',
  'Look at something far away.',
  'Let your eyes relax.',
  'Notice the movement around you.',
  'Take a slow breath.',
  'Simply observe.',
];

// Celebratory Floating Light Particles for Page 3
const CELEBRATION_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#38bdf8', '#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#a78bfa'][i % 6],
  size: 5 + Math.random() * 7,
  delay: (i % 7) * 140,
  duration: 2200 + Math.random() * 800,
}));

// Procedural Fluffy Cloud Component using layered puffs with soft shadows
const ProceduralCloud = ({
  scale = 1,
  opacity = 0.9,
  style,
}: {
  scale?: number;
  opacity?: number;
  style?: any;
}) => (
  <View
    style={[
      {
        width: 170 * scale,
        height: 70 * scale,
        opacity,
        position: 'relative',
      },
      style,
    ]}
  >
    {/* Base pill */}
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 15 * scale,
        width: 140 * scale,
        height: 42 * scale,
        borderRadius: 21 * scale,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
      }}
    />
    {/* Center large puff */}
    <View
      style={{
        position: 'absolute',
        bottom: 14 * scale,
        left: 45 * scale,
        width: 66 * scale,
        height: 66 * scale,
        borderRadius: 33 * scale,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
      }}
    />
    {/* Right medium puff */}
    <View
      style={{
        position: 'absolute',
        bottom: 8 * scale,
        left: 92 * scale,
        width: 52 * scale,
        height: 52 * scale,
        borderRadius: 26 * scale,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
      }}
    />
    {/* Left small puff */}
    <View
      style={{
        position: 'absolute',
        bottom: 6 * scale,
        left: 12 * scale,
        width: 44 * scale,
        height: 44 * scale,
        borderRadius: 22 * scale,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
      }}
    />
  </View>
);

export default function OutsideTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 3 PAGES:
  // 1: Sky & Cloud Introduction
  // 2: 2-Minute Looking Outside Timer
  // 3: Completion + 100 Points
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Timer states for Page 2
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  // Completion / Backend submission states for Page 3
  const [isClaiming, setIsClaiming] = useState(false);
  const hasClaimedRef = useRef(false);

  // Accurate drift-free wall-clock timer refs
  const endTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Safe Haptics
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
    } catch {}
  };

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  // Page Transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Sky Ambience & Sunlight Glow
  const skyFadeAnim = useRef(new Animated.Value(0)).current;
  const sunlightGlowAnim = useRef(new Animated.Value(0.6)).current;
  const sunlightScaleAnim = useRef(new Animated.Value(1)).current;

  // Cloud Drift Animations (Parallax Horizontal + Gentle Vertical Wave)
  const cloudsOpacityAnim = useRef(new Animated.Value(0)).current;
  const cloud1XAnim = useRef(new Animated.Value(-160)).current; // Foreground slow cloud
  const cloud1YAnim = useRef(new Animated.Value(height * 0.18)).current;

  const cloud2XAnim = useRef(new Animated.Value(width + 80)).current; // Midground cloud
  const cloud2YAnim = useRef(new Animated.Value(height * 0.42)).current;

  const cloud3XAnim = useRef(new Animated.Value(-120)).current; // High background cloud
  const cloud3YAnim = useRef(new Animated.Value(height * 0.08)).current;

  // Page 1 Content & Button Entrance Animations
  const contentSlideAnim = useRef(new Animated.Value(24)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const startButtonSpringAnim = useRef(new Animated.Value(0)).current;
  const buttonBreathAnim = useRef(new Animated.Value(1)).current;

  // Page 2 Prompt Fade Animation
  const promptFadeAnim = useRef(new Animated.Value(1)).current;

  // Page 3 Celebration Animations
  const trophyScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationAuraAnim = useRef(new Animated.Value(0)).current;
  const rewardCardSlideAnim = useRef(new Animated.Value(30)).current;
  const rewardCardOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiFallAnims = useRef(CELEBRATION_PARTICLES.map(() => new Animated.Value(0))).current;

  // ----------------------------------------------------
  // INITIAL PAGE 1 ANIMATIONS & CONTINUOUS CLOUD DRIFT
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Sky & Cloud Entrance Sequence
    Animated.timing(skyFadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 2. Clouds slowly appear
    Animated.timing(cloudsOpacityAnim, {
      toValue: 1,
      duration: 1200,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // 3. Main content smoothly fades and slides upward
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 4. Start button appears with soft spring
      Animated.spring(startButtonSpringAnim, {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      }).start();
    });

    // Ambient Sunlight Glow Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunlightGlowAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunlightGlowAnim, {
          toValue: 0.6,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sunlightScaleAnim, {
          toValue: 1.08,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunlightScaleAnim, {
          toValue: 1,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button Subtle Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonBreathAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonBreathAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous Gentle Cloud Movements (Horizontal Drifting)
    Animated.loop(
      Animated.timing(cloud1XAnim, {
        toValue: width + 200,
        duration: 38000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud2XAnim, {
        toValue: -240,
        duration: 52000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(cloud3XAnim, {
        toValue: width + 180,
        duration: 75000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle Vertical Floating Waves for Clouds
    const verticalWave = (val: Animated.Value, base: number, delta = 12) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: base - delta,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: base + delta,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    verticalWave(cloud1YAnim, height * 0.18, 10);
    verticalWave(cloud2YAnim, height * 0.42, 14);
    verticalWave(cloud3YAnim, height * 0.08, 8);
  }, []);

  // ----------------------------------------------------
  // APP STATE BACKGROUNDING RESILIENCE
  // ----------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        page === 2 &&
        !isPaused
      ) {
        // App returned to foreground: sync wall-clock time
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          handleTimerComplete();
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [page, isPaused]);

  // ----------------------------------------------------
  // PAGE TRANSITION HELPER
  // ----------------------------------------------------
  const transitionToPage = useCallback((nextPage: 1 | 2 | 3) => {
    triggerHaptic('light');
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -12,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(nextPage);
      pageSlideAnim.setValue(12);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // ----------------------------------------------------
  // PAGE 1 -> PAGE 2
  // ----------------------------------------------------
  const handleStartBreak = () => {
    transitionToPage(2);
  };

  // ----------------------------------------------------
  // PAGE 2: 2-MINUTE ACCURATE TIMER LOOP
  // ----------------------------------------------------
  const handleTimerComplete = useCallback(() => {
    triggerHaptic('success');
    transitionToPage(3);
  }, [transitionToPage]);

  useEffect(() => {
    if (page === 2 && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;

      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleTimerComplete();
        }
      }, 500);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [page, isPaused, handleTimerComplete]);

  // Rotate mindfulness prompts every 10 seconds smoothly on Page 2
  useEffect(() => {
    if (page !== 2 || isPaused) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(promptFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(promptFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setPromptIndex((prev) => (prev + 1) % MINDFULNESS_PROMPTS.length);
      }, 400);
    }, 10000);

    return () => clearInterval(interval);
  }, [page, isPaused]);

  // Dev fast-forward helper (__DEV__ multi-tap)
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
        triggerHaptic('success');
        devTapCount.current = 0;
      }
    } else {
      devTapCount.current = 1;
    }
    devLastTapTime.current = now;
  };

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Circular Progress Calculation
  const progressRatio = Math.max(0, Math.min(1, (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS));
  const RING_SIZE = 220;
  const STROKE_WIDTH = 8;
  const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  // ----------------------------------------------------
  // PAGE 3: CELEBRATION & AUTHENTICATED POINTS CLAIM
  // ----------------------------------------------------
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
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rewardCardSlideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti cascade
      confettiFallAnims.forEach((anim, i) => {
        anim.setValue(0);
        Animated.sequence([
          Animated.delay(CELEBRATION_PARTICLES[i].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: CELEBRATION_PARTICLES[i].duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [page]);

  const handleClaimPoints = async () => {
    if (isClaiming || hasClaimedRef.current) return;
    hasClaimedRef.current = true;
    setIsClaiming(true);
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
            task_name: 'Look outside for 2 minutes',
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
          setIsClaiming(false);
          return;
        }
      } else {
        hasClaimedRef.current = false;
        Alert.alert('Authorization Error', 'No authorization token found. Please log in again.');
        setIsClaiming(false);
        return;
      }
    } catch (e) {
      console.error('Error claiming points:', e);
      hasClaimedRef.current = false;
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaiming(false);
      return;
    } finally {
      setIsClaiming(false);
    }

    // Navigate to existing task-success route
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Look outside',
        task_name: 'Look outside',
        difficulty: 'Easy',
        message: 'You gave yourself two quiet minutes away from the screen.',
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Atmospheric Full-Screen Blue Sky Environment */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: skyFadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Subtle Glowing Sunlight / Lens Flare Aura in top-right */}
      <Animated.View
        style={[
          styles.sunlightAura,
          {
            opacity: sunlightGlowAnim,
            transform: [{ scale: sunlightScaleAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(254, 240, 138, 0.65)', 'rgba(254, 240, 138, 0.25)', 'rgba(255, 255, 255, 0)']}
          style={styles.sunlightGradient}
        />
      </Animated.View>

      {/* Parallax Drifting Procedural Clouds */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: cloudsOpacityAnim,
          },
        ]}
        pointerEvents="none"
      >
        {/* Cloud 3 - High background slow cloud */}
        <Animated.View
          style={{
            position: 'absolute',
            transform: [{ translateX: cloud3XAnim }, { translateY: cloud3YAnim }],
          }}
        >
          <ProceduralCloud scale={0.75} opacity={0.65} />
        </Animated.View>

        {/* Cloud 2 - Midground cloud */}
        <Animated.View
          style={{
            position: 'absolute',
            transform: [{ translateX: cloud2XAnim }, { translateY: cloud2YAnim }],
          }}
        >
          <ProceduralCloud scale={0.9} opacity={0.8} />
        </Animated.View>

        {/* Cloud 1 - Foreground fluffy cloud */}
        <Animated.View
          style={{
            position: 'absolute',
            transform: [{ translateX: cloud1XAnim }, { translateY: cloud1YAnim }],
          }}
        >
          <ProceduralCloud scale={1.15} opacity={0.95} />
        </Animated.View>
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              if (page === 2) {
                // Return to Page 1
                setIsPaused(true);
                transitionToPage(1);
              } else if (page === 3) {
                transitionToPage(2);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)');
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>

          {/* Step Pill */}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Page {page} of 3</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Dynamic Animated Content Container */}
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
          {/* PAGE 1 — SKY & CLOUD INTRODUCTION */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View
                style={[
                  styles.page1ContentWrapper,
                  {
                    opacity: contentFadeAnim,
                    transform: [{ translateY: contentSlideAnim }],
                  },
                ]}
              >
                {/* Small category label */}
                <View style={styles.categoryPill}>
                  <Feather name="sun" size={13} color="#0284c7" />
                  <Text style={styles.categoryPillText}>Mindful Break</Text>
                </View>

                {/* Main Title & Subtitle */}
                <Text style={styles.mainTitle}>Look Outside</Text>
                <Text style={styles.subtitle}>
                  Take a moment to step away from your screen and simply look outside.
                </Text>

                {/* Cloud & Horizon Decorative Card */}
                <View style={styles.heroSkyGraphicCard}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.5)']}
                    style={styles.heroGraphicGradient}
                  >
                    <Ionicons name="cloudy-outline" size={56} color="#0284c7" />
                    <Text style={styles.heroGraphicTip}>
                      Resting your eyes in natural daylight helps relieve screen fatigue and resets your focus.
                    </Text>
                  </LinearGradient>
                </View>

                {/* Short Description Card */}
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>
                    Find a comfortable spot near a window or outside. Let your eyes rest on the sky, surroundings, or anything peaceful in front of you.
                  </Text>
                </View>

                {/* Badges: 2 min, Easy, +100 Points */}
                <View style={styles.badgeRow}>
                  <View style={[styles.badgePill, styles.badgeTime]}>
                    <Feather name="clock" size={13} color="#0284c7" />
                    <Text style={[styles.badgeText, { color: '#0284c7' }]}>2 min</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="feather" size={13} color="#059669" />
                    <Text style={[styles.badgeText, { color: '#059669' }]}>Easy</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Ionicons name="sparkles" size={13} color="#d97706" />
                    <Text style={[styles.badgeText, { color: '#d97706' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* Small Animated Visual Cue */}
                <View style={styles.promptCueRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.promptCueText}>Ready to pause and look around?</Text>
                </View>
              </Animated.View>

              {/* Primary Action Button */}
              <Animated.View
                style={[
                  styles.ctaContainer,
                  {
                    transform: [{ scale: startButtonSpringAnim }, { scale: buttonBreathAnim }],
                    opacity: startButtonSpringAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartBreak}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Start 2-Minute Break</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — 2-MINUTE LOOKING OUTSIDE TIMER */}
          {/* ==================================================== */}
          {page === 2 && (
            <View style={styles.page2Container}>
              {/* Header area with pause/resume */}
              <View style={styles.page2HeaderArea}>
                <Text style={styles.page2Title}>Look Outside</Text>
                <Text style={styles.page2Subtitle}>
                  Look outside and let your eyes rest.
                </Text>
              </View>

              {/* Large Circular Progress & Timer Visualization */}
              <View style={styles.timerCenterWrapper}>
                <Pressable onPress={handleDevFastForward}>
                  <View style={styles.circularSvgWrapper}>
                    <Svg width={RING_SIZE} height={RING_SIZE}>
                      <Defs>
                        <SvgLinearGradient id="timerRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#10b981" />
                          <Stop offset="100%" stopColor="#0284c7" />
                        </SvgLinearGradient>
                      </Defs>

                      {/* Background track circle */}
                      <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RADIUS}
                        stroke="rgba(255, 255, 255, 0.45)"
                        strokeWidth={STROKE_WIDTH}
                        fill="rgba(255, 255, 255, 0.55)"
                      />

                      {/* Animated Progress Ring */}
                      <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RADIUS}
                        stroke="url(#timerRingGradient)"
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                      />
                    </Svg>

                    {/* Centered Timer Content */}
                    <View style={styles.timerDigitsOverlay}>
                      <Ionicons name="eye-outline" size={28} color="#0284c7" style={{ marginBottom: 4 }} />
                      <Text style={styles.timerDigitsText}>{formatTime(timeLeft)}</Text>
                      <Text style={styles.timerSubLabel}>2 min rest</Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Rotating Mindfulness Prompt Card */}
              <Animated.View
                style={[
                  styles.promptCardContainer,
                  {
                    opacity: promptFadeAnim,
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.92)', 'rgba(255, 255, 255, 0.8)']}
                  style={styles.promptCardGradient}
                >
                  <Ionicons name="sparkles-outline" size={18} color="#0284c7" />
                  <Text style={styles.promptText}>
                    {MINDFULNESS_PROMPTS[promptIndex]}
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Timer Controls: Pause & Resume */}
              <View style={styles.timerControlsRow}>
                <TouchableOpacity
                  style={styles.timerControlBtn}
                  onPress={() => {
                    triggerHaptic('light');
                    setIsPaused((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isPaused ? 'play' : 'pause'}
                    size={20}
                    color="#0369a1"
                  />
                  <Text style={styles.timerControlText}>
                    {isPaused ? 'Resume Timer' : 'Pause Timer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — COMPLETION & 100 POINTS CLAIM */}
          {/* ==================================================== */}
          {page === 3 && (
            <ScrollView
              contentContainerStyle={styles.page3Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Falling Celebration Particles */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CELEBRATION_PARTICLES.map((particle, i) => (
                  <Animated.View
                    key={particle.id}
                    style={{
                      position: 'absolute',
                      left: particle.x,
                      top: -20,
                      width: particle.size,
                      height: particle.size * 1.4,
                      borderRadius: particle.size / 2,
                      backgroundColor: particle.color,
                      transform: [
                        {
                          translateY: confettiFallAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, height * 0.75],
                          }),
                        },
                        {
                          rotate: confettiFallAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                      opacity: confettiFallAnims[i].interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [1, 0.9, 0],
                      }),
                    }}
                  />
                ))}
              </View>

              {/* Spring Medallion Visual */}
              <View style={styles.celebrationCenter}>
                <Animated.View
                  style={[
                    styles.celebrationAuraRing,
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
                        outputRange: [0.4, 0.7, 0.2],
                      }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.celebrationMedallion,
                    {
                      transform: [{ scale: trophyScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.medallionGradient}
                  >
                    <Ionicons name="sunny" size={48} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Completion Headlines */}
              <View style={styles.completionHeaders}>
                <Text style={styles.completionTitle}>Well Done</Text>
                <Text style={styles.completionSubtitle}>
                  You gave yourself two quiet minutes away from the screen.
                </Text>

                <View style={styles.calmMessagePill}>
                  <Feather name="heart" size={13} color="#059669" />
                  <Text style={styles.calmMessageText}>Take this calm feeling with you.</Text>
                </View>
              </View>

              {/* Prominent +100 Points Reward Card */}
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
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rewardCardGradient}
                >
                  <View style={styles.rewardTrophyCircle}>
                    <Ionicons name="trophy" size={28} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.rewardLabel}>AUTHENTIC REWARD</Text>
                    <Text style={styles.rewardPointsAmount}>+100 Points</Text>
                  </View>
                  <View style={styles.rewardVerifiedPill}>
                    <Feather name="shield" size={13} color="#10b981" />
                    <Text style={styles.rewardVerifiedText}>Backend Verified</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Accomplishment Highlights */}
              <View style={styles.accomplishmentSummaryCard}>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Stepped away from screen for 2 full minutes</Text>
                </View>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Rested visual focus on natural surroundings</Text>
                </View>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Practiced mindful observation & breathing</Text>
                </View>
              </View>

              {/* Authenticated Claim Button */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    isClaiming && styles.disabledActionButton,
                  ]}
                  onPress={handleClaimPoints}
                  activeOpacity={0.88}
                  disabled={isClaiming}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    {isClaiming ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={[styles.primaryButtonText, { marginLeft: 10 }]}>
                          Verifying with Backend...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Claim +100 Points</Text>
                        <Ionicons name="sparkles" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#38bdf8',
  },
  safeArea: {
    flex: 1,
  },
  sunlightAura: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
  },
  sunlightGradient: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  pageContainer: {
    flex: 1,
  },

  // PAGE 1 STYLES
  page1Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  page1ContentWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
    marginLeft: 5,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  heroSkyGraphicCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroGraphicGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGraphicTip: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
  },
  descriptionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  descriptionText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 22,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeTime: {
    backgroundColor: 'rgba(240, 249, 255, 0.9)',
    borderColor: '#bae6fd',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    borderColor: '#bbf7d0',
  },
  badgeReward: {
    backgroundColor: 'rgba(255, 251, 235, 0.9)',
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  promptCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
    marginRight: 7,
  },
  promptCueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  ctaContainer: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  primaryActionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledActionButton: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // PAGE 2 STYLES
  page2Container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  page2HeaderArea: {
    alignItems: 'center',
    marginTop: 10,
  },
  page2Title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  page2Subtitle: {
    fontSize: 15,
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
  },
  timerCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  circularSvgWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerDigitsOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigitsText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  timerSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  promptCardContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promptCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369a1',
    marginLeft: 8,
    textAlign: 'center',
  },
  timerControlsRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timerControlText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 8,
  },

  // PAGE 3 STYLES
  page3Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  celebrationCenter: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    position: 'relative',
  },
  celebrationAuraRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  celebrationMedallion: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  medallionGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionHeaders: {
    alignItems: 'center',
    marginTop: 18,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 15,
    color: '#334155',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  calmMessagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  calmMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  rewardCardContainer: {
    width: '100%',
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardTrophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    letterSpacing: 0.8,
  },
  rewardPointsAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  rewardVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  rewardVerifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  accomplishmentSummaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  accomplishmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  accomplishmentText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 10,
  },
});
