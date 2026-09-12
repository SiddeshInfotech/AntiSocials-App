import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  AppState,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
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
const TASK_DURATION_SECONDS = 3600; // 1 Hour (3600 seconds)

// Rotating motivational messages for Page 2
const MOTIVATIONAL_MESSAGES = [
  'Put the phone down.',
  'Look around you.',
  'Enjoy the moment.',
  'Give your mind some space.',
  'Stay present.',
  "You're doing great.",
];

// Ambient Floating Light Particles
const AMBIENT_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  size: 3 + Math.random() * 5,
  duration: 4000 + Math.random() * 3000,
  delay: (i % 5) * 380,
  color: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#34d399'][i % 5],
}));

export default function NoMediaTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 3 Pages: 1 (Intro), 2 (Timer), 3 (Completion)
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Timer & Session state
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  // Claiming state
  const [isClaiming, setIsClaiming] = useState(false);

  // Wall-clock synchronization for background resilience
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Animations
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const breathingScaleAnim = useRef(new Animated.Value(1)).current;
  const auraGlowAnim = useRef(new Animated.Value(0.6)).current;
  const messageFadeAnim = useRef(new Animated.Value(1)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;

  // Particle float loop
  const particleAnims = useRef(AMBIENT_PARTICLES.map(() => new Animated.Value(0))).current;

  // Continuous breathing & glow animations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScaleAnim, {
          toValue: 1.05,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathingScaleAnim, {
          toValue: 0.96,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(auraGlowAnim, {
          toValue: 0.95,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraGlowAnim, {
          toValue: 0.45,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating particles
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

  // Page 2: Rotating motivational messages (every 7 seconds)
  useEffect(() => {
    if (page !== 2) return;

    const interval = setInterval(() => {
      Animated.timing(messageFadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
        Animated.timing(messageFadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [page]);

  // Transition to Page 3 upon 00:00:00
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

  // Page Navigation Helper
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

  // Format time HH:MM:SS
  const formatTimeHHMMSS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      'Leave No Media Session?',
      'Your 1-hour offline session progress will reset if you exit before the timer finishes.',
      [
        { text: 'Stay Offline', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // SVG Progress Ring calculations
  const ringSize = Math.min(width * 0.74, 280);
  const strokeWidth = 9;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Percentage of hour completed
  const percentCompleted = Math.min(100, Math.round(progressRatio * 100));

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

      // Authenticated task completion for "No Media" (taskId: 27, Medium difficulty => 300 points)
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 27,
          task_name: 'No Media',
          reflection_text: 'Completed 1 hour of intentional digital detox away from screens',
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
            taskName: 'No Media',
            difficulty: 'Medium',
            message: 'Your mind has gained clarity.',
          },
        } as any);
      } else {
        Alert.alert('Unable to Claim Points', data.error || data.message || 'Please try again.');
        setIsClaiming(false);
      }
    } catch (err) {
      console.error('No Media completion error:', err);
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaiming(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Atmospheric Calm Light Gradient Background */}
      <LinearGradient
        colors={['#f0fdf4', '#f8fafc', '#eff6ff', '#f0fdfa']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Floating Light Particles */}
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
                backgroundColor: p.color,
                opacity: particleAnims[idx].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.7, 0],
                }),
                transform: [
                  {
                    translateY: particleAnims[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.85, height * 0.1],
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
                  <Feather name="slash" size={13} color="#059669" />
                  <Text style={styles.headerTagText}>Digital Detox</Text>
                </View>

                <View style={{ width: 40 }} />
              </View>

              {/* Central Animated No-Phone / Media Visual */}
              <View style={styles.heroVisualSection}>
                {/* Breathing Ambient Aura */}
                <Animated.View
                  style={[
                    styles.heroGlowAura,
                    {
                      transform: [{ scale: breathingScaleAnim }],
                      opacity: auraGlowAnim,
                    },
                  ]}
                />

                {/* Animated Central Detox Disc */}
                <Animated.View
                  style={[
                    styles.detoxDiscFrame,
                    { transform: [{ scale: breathingScaleAnim }] },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.detoxDiscGradient}
                  >
                    <View style={styles.detoxInnerRing}>
                      <MaterialCommunityIcons name="cellphone-off" size={62} color="#ffffff" />
                      <Text style={styles.detoxDiscLabel}>OFFLINE</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Title & Information Card */}
              <View style={styles.introCard}>
                <Text style={styles.heroTitle}>No Media</Text>
                <Text style={styles.heroSubtitle}>
                  Take a break from screens and give your mind space to slow down.
                </Text>

                {/* Exactly 2 Short Lines of Explanation */}
                <View style={styles.descriptionBlock}>
                  <Text style={styles.descLine}>
                    Spend one hour without social media, videos, games, or unnecessary screen use.
                  </Text>
                  <Text style={styles.descLine}>
                    Use this time to be present, relax, and enjoy the world around you.
                  </Text>
                </View>

                {/* Badges: 1 Hour, Medium, +300 Points */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#0284c7" />
                    <Text style={[styles.badgeText, styles.textDuration]}>1 Hour</Text>
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

              {/* Action Button */}
              <View style={styles.bottomActionWrapper}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigateToPage(2)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
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
          {/* PAGE 2 — 1 HOUR NO MEDIA TIMER                         */}
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
                  <View style={styles.activeDot} />
                  <Text style={styles.sessionStatusText}>Detox in Progress</Text>
                </View>

                <View style={{ width: 44 }} />
              </View>

              {/* Center Circular Timer & Progress Ring */}
              <View style={styles.timerVisualContainer}>
                {/* Breathing Ambient Aura */}
                <Animated.View
                  style={[
                    styles.timerAmbientAura,
                    {
                      transform: [{ scale: breathingScaleAnim }],
                      opacity: auraGlowAnim,
                    },
                  ]}
                />

                {/* SVG Circular Progress Ring */}
                <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={ringSize} height={ringSize} style={styles.svgProgressRing}>
                    <Defs>
                      <SvgLinearGradient id="detoxProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#10b981" />
                        <Stop offset="50%" stopColor="#06b6d4" />
                        <Stop offset="100%" stopColor="#3b82f6" />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Background Track */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="rgba(209, 250, 229, 0.7)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />

                    {/* Progress Circle */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="url(#detoxProgressGrad)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    />
                  </Svg>

                  {/* Inner Timer Display (Double-tap in __DEV__ to skip) */}
                  <Pressable onPress={handleDevSkip} style={styles.timerInnerCircle}>
                    <MaterialCommunityIcons name="leaf" size={28} color="#059669" style={{ marginBottom: 4 }} />
                    <Text style={styles.timerDigitsText}>{formatTimeHHMMSS(timeLeft)}</Text>
                    <Text style={styles.timerSubheading}>{percentCompleted}% of 1 Hour Completed</Text>
                  </Pressable>
                </View>
              </View>

              {/* Rotating Motivational Mindfulness Prompts */}
              <View style={styles.motivationalSection}>
                <View style={styles.messageBubble}>
                  <Animated.Text
                    style={[
                      styles.motivationalText,
                      { opacity: messageFadeAnim },
                    ]}
                  >
                    “{MOTIVATIONAL_MESSAGES[messageIndex]}”
                  </Animated.Text>
                </View>
              </View>

              {/* Bottom Grounding Bar */}
              <View style={styles.bottomGroundingBar}>
                <Feather name="eye" size={14} color="#047857" />
                <Text style={styles.bottomGroundingText}>Notice the room, nature, and sounds around you.</Text>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 3 — COMPLETION                                    */}
          {/* ====================================================== */}
          {page === 3 && (
            <View style={styles.pageContent}>
              <View style={{ height: 16 }} />

              {/* Celebratory Checkmark Medallion */}
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
                  colors={['#10b981', '#059669', '#047857']}
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
                <Text style={styles.completionMainTitle}>No Media Complete</Text>
                <Text style={styles.completionSubtitle}>
                  You gave yourself a full hour away from media. Well done.
                </Text>

                {/* Reward Card (+300 Points) */}
                <LinearGradient
                  colors={['#ecfdf5', '#f0fdf4', '#ffffff']}
                  style={styles.rewardCardContainer}
                >
                  <View style={styles.rewardMedalBadge}>
                    <Feather name="award" size={24} color="#059669" />
                  </View>
                  <Text style={styles.rewardPointsLabel}>+300 Points</Text>
                  <Text style={styles.rewardDescription}>
                    Points Earned • One hour of restored mental focus.
                  </Text>
                </LinearGradient>

                {/* Summary Badges */}
                <View style={styles.summaryPillsRow}>
                  <View style={styles.summaryPill}>
                    <Feather name="clock" size={12} color="#047857" />
                    <Text style={styles.summaryPillText}>60 Minutes Offline</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Feather name="shield" size={12} color="#059669" />
                    <Text style={styles.summaryPillText}>Screen-Free Mind</Text>
                  </View>
                </View>
              </View>

              {/* Claim 300 Points Button */}
              <View style={styles.bottomActionWrapper}>
                <TouchableOpacity
                  style={[styles.primaryButton, isClaiming && styles.buttonDisabled]}
                  onPress={handleClaimPoints}
                  disabled={isClaiming}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
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
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
  },

  // Top Header Row
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
    borderColor: 'rgba(209, 250, 229, 0.9)',
  },
  headerTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
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
    backgroundColor: 'rgba(236, 253, 245, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.8)',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },

  // Page 1 — Hero Section
  heroVisualSection: {
    height: height * 0.34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroGlowAura: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  detoxDiscFrame: {
    width: Math.min(width * 0.58, 220),
    height: Math.min(width * 0.58, 220),
    borderRadius: Math.min(width * 0.58, 220) / 2,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  detoxDiscGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  detoxInnerRing: {
    width: '88%',
    height: '88%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detoxDiscLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: 6,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  descriptionBlock: {
    marginBottom: 16,
  },
  descLine: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
    marginTop: 3,
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

  // Page 2 — Timer Styles
  timerVisualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  timerAmbientAura: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  svgProgressRing: {
    position: 'absolute',
  },
  timerInnerCircle: {
    width: Math.min(width * 0.58, 220),
    height: Math.min(width * 0.58, 220),
    borderRadius: Math.min(width * 0.58, 220) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
    padding: 16,
  },
  timerDigitsText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  timerSubheading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    textAlign: 'center',
  },

  // Page 2 — Motivational Quotes
  motivationalSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  messageBubble: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#064e3b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomGroundingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(236, 253, 245, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.9)',
  },
  bottomGroundingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },

  // Page 3 — Completion Styles
  completionMedallionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.25,
    position: 'relative',
  },
  completionAura: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
  },
  completionMedallionCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
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
    borderColor: '#a7f3d0',
    marginBottom: 16,
  },
  rewardMedalBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rewardPointsLabel: {
    fontSize: 32,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
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
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },

  // Action Buttons
  bottomActionWrapper: {
    width: '100%',
    paddingBottom: 4,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#059669',
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
