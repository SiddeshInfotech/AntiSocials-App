import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Image,
  AppState,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TASK_DURATION_SECONDS = 300; // 5 minutes (300 seconds)

// Local Image Assets
const INTRO_BG_IMAGE = require('../assets/images/reflect_intro_bg.png');
const MEDITATION_IMAGE = require('../assets/images/stillness_meditation.jpg');

// Peaceful Rotating Mindfulness Prompts for Page 2
const MEDITATION_PROMPTS = [
  'Be still.',
  'Notice your breathing.',
  'Let your thoughts pass.',
  'Stay present.',
  'Simply be.',
];

// Floating Ambient Light Particles for Page 1 & Page 3
const AMBIENT_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  size: 4 + Math.random() * 6,
  duration: 4500 + Math.random() * 3500,
  delay: (i % 6) * 350,
}));

export default function StillnessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 3 Pages: 1 (Intro), 2 (Timer), 3 (Completion)
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Timer & Session state
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  // Claiming state
  const [isClaiming, setIsClaiming] = useState(false);

  // Wall-clock synchronization for background resilience
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Animations
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const breathingScaleAnim = useRef(new Animated.Value(1)).current;
  const auraGlowAnim = useRef(new Animated.Value(0.6)).current;
  const promptFadeAnim = useRef(new Animated.Value(1)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;

  // Particle float loop
  const particleAnims = useRef(AMBIENT_PARTICLES.map(() => new Animated.Value(0))).current;

  // Continuous subtle breathing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScaleAnim, {
          toValue: 1.05,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathingScaleAnim, {
          toValue: 0.97,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(auraGlowAnim, {
          toValue: 0.95,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraGlowAnim, {
          toValue: 0.45,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating particles loop
    particleAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(AMBIENT_PARTICLES[idx].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: AMBIENT_PARTICLES[idx].duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Background resilience via AppState
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isTimerActive && page === 2) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleTimerComplete();
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isTimerActive, page]);

  // Page 2: Timer run loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (page === 2 && isTimerActive && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [page, isTimerActive, timeLeft]);

  // Page 2: Rotating peaceful prompts (every 6 seconds)
  useEffect(() => {
    if (page !== 2) return;

    const interval = setInterval(() => {
      Animated.timing(promptFadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setPromptIndex((prev) => (prev + 1) % MEDITATION_PROMPTS.length);
        Animated.timing(promptFadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [page]);

  // Transition to Page 3 upon 00:00
  const handleTimerComplete = useCallback(() => {
    setIsTimerActive(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    Animated.timing(pageFadeAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setPage(3);
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.spring(checkmarkScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Page Transition Helper
  const navigateToPage = (newPage: 1 | 2 | 3) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    Animated.timing(pageFadeAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setPage(newPage);
      if (newPage === 2) {
        setIsTimerActive(true);
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  // Format time MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Developer testing quick-skip (double tap timer in __DEV__)
  const lastTapRef = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setTimeLeft(3);
        endTimeRef.current = Date.now() + 3000;
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (_) {}
      }
      lastTapRef.current = now;
    }
  };

  // Early exit confirmation on Page 2
  const handleExitTimer = () => {
    Alert.alert(
      'Leave Silent Sitting?',
      'Your meditation progress will reset if you exit before the timer finishes.',
      [
        { text: 'Stay in Silence', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // SVG Progress Ring calculations
  const ringSize = Math.min(width * 0.72, 270);
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Backend Point Completion (Page 3)
  const handleClaimPoints = async () => {
    if (isClaiming) return;
    setIsClaiming(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}

    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to claim your points.');
        setIsClaiming(false);
        return;
      }

      // Exact backend payload for Silent Sitting task (id 26, difficulty Medium => 300 points)
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 26,
          task_name: 'Silent sitting',
          reflection_text: 'Completed 5 minutes of mindful silent sitting',
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        pointsData = {
          pointsAdded: (data.pointsEarned ?? data.pointsAdded ?? data.points_earned ?? 300).toString(),
          totalPoints: (data.totalPoints ?? data.total_points ?? 0).toString(),
          streak: (data.currentStreak ?? data.streak ?? data.current_streak ?? 0).toString(),
        };

        router.replace({
          pathname: '/task-success',
          params: {
            points: pointsData.pointsAdded,
            totalPoints: pointsData.totalPoints,
            streak: pointsData.streak,
            taskName: 'Silent Sitting',
            difficulty: 'Medium',
            message: 'Stillness deepened.',
          },
        } as any);
      } else {
        Alert.alert('Unable to Claim Points', data.error || data.message || 'Please try again.');
        setIsClaiming(false);
      }
    } catch (err) {
      console.error('Silent sitting completion error:', err);
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaiming(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Main Peaceful Background Image */}
      <ImageBackground
        source={INTRO_BG_IMAGE}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        {/* Soft Ambient Overlay */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.72)', 'rgba(240, 253, 250, 0.78)', 'rgba(255, 255, 255, 0.88)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {/* Subtle Floating Ambient Particles */}
      <View style={styles.particleContainer} pointerEvents="none">
        {AMBIENT_PARTICLES.map((p, idx) => (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                opacity: particleAnims[idx].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.7, 0],
                }),
                transform: [
                  {
                    translateY: particleAnims[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.8, height * 0.15],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View style={[styles.pageWrapper, { opacity: pageFadeAnim }]}>
          {/* ====================================================== */}
          {/* PAGE 1 — INTRODUCTION                                  */}
          {/* ====================================================== */}
          {page === 1 && (
            <View style={styles.pageContent}>
              {/* Top Navigation Header */}
              <View style={styles.topHeaderRow}>
                <TouchableOpacity
                  style={styles.backIconButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather name="arrow-left" size={20} color="#1e293b" />
                </TouchableOpacity>

                <View style={styles.headerTag}>
                  <Feather name="moon" size={13} color="#0d9488" />
                  <Text style={styles.headerTagText}>Silent Sitting</Text>
                </View>

                <View style={{ width: 40 }} />
              </View>

              {/* Central Meditation Visual Element */}
              <View style={styles.meditationHeroSection}>
                {/* Breathing Aura Behind Image */}
                <Animated.View
                  style={[
                    styles.meditationAura,
                    {
                      transform: [{ scale: breathingScaleAnim }],
                      opacity: auraGlowAnim,
                    },
                  ]}
                />

                {/* Secondary Meditation Image Card (Tasteful & Non-distorted) */}
                <View style={styles.meditationImageFrame}>
                  <Image
                    source={MEDITATION_IMAGE}
                    style={styles.meditationHeroImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.3)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
              </View>

              {/* Typography & Information Card */}
              <View style={styles.introCard}>
                <Text style={styles.heroTitle}>Find Your Inner Peace</Text>

                {/* Exactly 2 Short Lines of Explanation */}
                <Text style={styles.heroDescriptionLine1}>
                  Take a quiet moment to slow down and reconnect with yourself.
                </Text>
                <Text style={styles.heroDescriptionLine2}>
                  Let your thoughts settle while you simply sit, breathe, and be present.
                </Text>

                {/* Badges: 5 min, Medium, +300 Points */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#0284c7" />
                    <Text style={[styles.badgeText, styles.textDuration]}>5 min</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDifficulty]}>
                    <Feather name="bar-chart-2" size={13} color="#d97706" />
                    <Text style={[styles.badgeText, styles.textDifficulty]}>Medium</Text>
                  </View>
                  <View style={[styles.badge, styles.badgePoints]}>
                    <Feather name="award" size={13} color="#059669" />
                    <Text style={[styles.badgeText, styles.textPoints]}>+300 Points</Text>
                  </View>
                </View>
              </View>

              {/* Start Now Button */}
              <View style={styles.bottomActionWrapper}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigateToPage(2)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0d9488', '#0f766e', '#115e59']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Start Now</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 2 — SILENT SITTING TIMER                          */}
          {/* ====================================================== */}
          {page === 2 && (
            <View style={styles.pageContent}>
              {/* Minimal Top Header */}
              <View style={styles.topHeaderRow}>
                <TouchableOpacity
                  style={styles.quitButton}
                  onPress={handleExitTimer}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color="#64748b" />
                  <Text style={styles.quitButtonText}>Quit</Text>
                </TouchableOpacity>

                <View style={styles.sessionStatusBadge}>
                  <View style={styles.activePulseDot} />
                  <Text style={styles.sessionStatusText}>Silence in Progress</Text>
                </View>

                <View style={{ width: 44 }} />
              </View>

              {/* Center Meditation Visual & Progress Ring */}
              <View style={styles.timerVisualContainer}>
                {/* Breathing Ambient Aura */}
                <Animated.View
                  style={[
                    styles.timerMeditationAura,
                    {
                      transform: [{ scale: breathingScaleAnim }],
                      opacity: auraGlowAnim,
                    },
                  ]}
                />

                {/* Circular Progress Ring wrapping Meditation Image */}
                <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={ringSize} height={ringSize} style={styles.svgProgressRing}>
                    <Defs>
                      <SvgLinearGradient id="meditationProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#0d9488" />
                        <Stop offset="50%" stopColor="#06b6d4" />
                        <Stop offset="100%" stopColor="#14b8a6" />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Background Track */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="rgba(204, 251, 241, 0.7)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />

                    {/* Progress Circle */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="url(#meditationProgressGrad)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    />
                  </Svg>

                  {/* Central Meditation Disc with Image */}
                  <View style={styles.meditationDiscWrapper}>
                    <Image
                      source={MEDITATION_IMAGE}
                      style={styles.meditationDiscImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(15, 23, 42, 0.1)', 'rgba(15, 23, 42, 0.45)']}
                      style={StyleSheet.absoluteFillObject}
                    />

                    {/* Subtle Lotus / Stillness Icon in Center */}
                    <View style={styles.centerDiscBadge}>
                      <MaterialCommunityIcons name="weather-windy" size={24} color="#ffffff" />
                    </View>
                  </View>
                </View>

                {/* Digital Countdown Timer */}
                <Pressable onPress={handleDevSkip} style={styles.timerDigitalCard}>
                  <Text style={styles.timerDigitsText}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.timerSubheading}>5 Minutes of Stillness</Text>
                </Pressable>
              </View>

              {/* Changing Peaceful Mindfulness Prompts */}
              <View style={styles.promptsSection}>
                <View style={styles.promptBubble}>
                  <Animated.Text
                    style={[
                      styles.promptText,
                      { opacity: promptFadeAnim },
                    ]}
                  >
                    “{MEDITATION_PROMPTS[promptIndex]}”
                  </Animated.Text>
                </View>
              </View>

              {/* Bottom Breathing Reminder */}
              <View style={styles.bottomBreathingBar}>
                <Feather name="wind" size={14} color="#0f766e" />
                <Text style={styles.bottomBreathingText}>Breathe gently. Stay in this moment.</Text>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 3 — COMPLETION                                    */}
          {/* ====================================================== */}
          {page === 3 && (
            <View style={styles.pageContent}>
              <View style={{ height: 16 }} />

              {/* Calming Checkmark Medallion */}
              <View style={styles.completionMedallionSection}>
                <Animated.View
                  style={[
                    styles.completionAura,
                    {
                      transform: [{ scale: breathingScaleAnim }],
                      opacity: auraGlowAnim,
                    },
                  ]}
                />

                <LinearGradient
                  colors={['#0d9488', '#0f766e', '#115e59']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.completionMedallionCircle}
                >
                  <Animated.View style={{ transform: [{ scale: checkmarkScaleAnim }] }}>
                    <Feather name="check" size={54} color="#ffffff" />
                  </Animated.View>
                </LinearGradient>
              </View>

              {/* Titles & Copy */}
              <View style={styles.completionCard}>
                <Text style={styles.completionMainTitle}>Silent Sitting Complete</Text>
                <Text style={styles.completionSubtitle}>
                  You dedicated 5 quiet minutes to stillness and inner peace.
                </Text>

                {/* Reward Card */}
                <LinearGradient
                  colors={['#f0fdfa', '#ecfdf5', '#ffffff']}
                  style={styles.rewardCardContainer}
                >
                  <View style={styles.rewardMedalBadge}>
                    <Feather name="award" size={24} color="#0d9488" />
                  </View>
                  <Text style={styles.rewardPointsLabel}>+300 Points</Text>
                  <Text style={styles.rewardDescription}>
                    Your attention is rested, clear, and grounded.
                  </Text>
                </LinearGradient>

                {/* Summary Pills */}
                <View style={styles.summaryPillsRow}>
                  <View style={styles.summaryPill}>
                    <Feather name="clock" size={12} color="#0f766e" />
                    <Text style={styles.summaryPillText}>5 Minutes Completed</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Feather name="heart" size={12} color="#0d9488" />
                    <Text style={styles.summaryPillText}>Mind Restored</Text>
                  </View>
                </View>
              </View>

              {/* Claim Points Button */}
              <View style={styles.bottomActionWrapper}>
                <TouchableOpacity
                  style={[styles.primaryButton, isClaiming && styles.buttonDisabled]}
                  onPress={handleClaimPoints}
                  disabled={isClaiming}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0d9488', '#0f766e', '#115e59']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    {isClaiming ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.primaryButtonText}>Claiming 300 Points...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Claim 300 Points</Text>
                        <Feather name="arrow-right" size={20} color="#ffffff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(45, 212, 191, 0.45)',
  },
  safeArea: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  // Top Nav Header
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(204, 251, 241, 0.9)',
  },
  headerTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
    letterSpacing: 0.3,
  },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  quitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  sessionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(240, 253, 250, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(153, 246, 228, 0.8)',
  },
  activePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0d9488',
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },

  // Page 1 — Meditation Visual Hero Section
  meditationHeroSection: {
    height: height * 0.34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  meditationAura: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(45, 212, 191, 0.28)',
  },
  meditationImageFrame: {
    width: Math.min(width * 0.65, 240),
    height: Math.min(width * 0.65, 240),
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  meditationHeroImage: {
    width: '100%',
    height: '100%',
  },

  // Page 1 — Typography Card
  introCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginVertical: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroDescriptionLine1: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroDescriptionLine2: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeDuration: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  badgeDifficulty: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgePoints: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textDuration: {
    color: '#0369a1',
  },
  textDifficulty: {
    color: '#b45309',
  },
  textPoints: {
    color: '#047857',
  },

  // Page 2 — Timer Visual & Meditation Environment
  timerVisualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  timerMeditationAura: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
  },
  svgProgressRing: {
    position: 'absolute',
  },
  meditationDiscWrapper: {
    width: Math.min(width * 0.54, 200),
    height: Math.min(width * 0.54, 200),
    borderRadius: Math.min(width * 0.54, 200) / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  meditationDiscImage: {
    width: '100%',
    height: '100%',
  },
  centerDiscBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 118, 110, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  timerDigitalCard: {
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(204, 251, 241, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timerDigitsText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  timerSubheading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // Page 2 — Rotating Prompts
  promptsSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  promptBubble: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#134e4a',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomBreathingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(240, 253, 250, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(204, 251, 241, 0.9)',
  },
  bottomBreathingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f766e',
  },

  // Page 3 — Completion
  completionMedallionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.25,
    position: 'relative',
  },
  completionAura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(45, 212, 191, 0.3)',
  },
  completionMedallionCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  completionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginVertical: 12,
  },
  completionMainTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  rewardCardContainer: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 16,
  },
  rewardMedalBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rewardPointsLabel: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f766e',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#134e4a',
    textAlign: 'center',
  },
  summaryPillsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
  },

  // Action Buttons
  bottomActionWrapper: {
    width: '100%',
    paddingBottom: 4,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
