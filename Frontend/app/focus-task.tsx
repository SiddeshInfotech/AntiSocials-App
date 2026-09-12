import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
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
const TASK_DURATION_SECONDS = 600; // 10 minutes (600 seconds)

// Floating activity categories for Page 1
const FOCUS_ACTIVITIES = [
  { id: 'study', label: 'Study', icon: 'book-open', color: '#3b82f6', angle: 0 },
  { id: 'coding', label: 'Coding', icon: 'code', color: '#06b6d4', angle: 51 },
  { id: 'reading', label: 'Reading', icon: 'bookmark', color: '#8b5cf6', angle: 102 },
  { id: 'drawing', label: 'Drawing', icon: 'edit-3', color: '#ec4899', angle: 154 },
  { id: 'work', label: 'Work', icon: 'briefcase', color: '#f59e0b', angle: 205 },
  { id: 'exercise', label: 'Exercise', icon: 'activity', color: '#10b981', angle: 257 },
  { id: 'creativity', label: 'Creativity', icon: 'feather', color: '#6366f1', angle: 308 },
];

// Rotating mindfulness focus messages for Page 2
const FOCUS_MESSAGES = [
  'Ignore the urge to switch.',
  'Keep going.',
  'One thing at a time.',
  'Bring your attention back.',
  "You're doing great.",
  'Stay with it.',
  'Small focus creates big progress.',
];

// Celebratory particles for Page 3
const CELEBRATION_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'][i % 6],
  size: 6 + Math.random() * 8,
  delay: (i % 8) * 120,
  duration: 2200 + Math.random() * 800,
}));

export default function FocusTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Page navigation state: 1, 2, or 3
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Selected optional focus category (default null for open focus)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Timer & Session state
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isDistractionModalVisible, setIsDistractionModalVisible] = useState(false);

  // Focus message rotation index
  const [messageIndex, setMessageIndex] = useState(0);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wall clock synchronization for background resilience
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // ==========================================
  // ANIMATIONS
  // ==========================================
  // Page crossfade animation
  const pageFadeAnim = useRef(new Animated.Value(1)).current;

  // Focus orb breathing & pulse (Page 1 & 2)
  const orbPulseAnim = useRef(new Animated.Value(1)).current;
  const orbGlowAnim = useRef(new Animated.Value(0.7)).current;
  const orbRingRotateAnim = useRef(new Animated.Value(0)).current;

  // Interactive touch scale feedback on focus orb
  const orbTouchScale = useRef(new Animated.Value(1)).current;

  // Floating ambient drift for activity icons (Page 1)
  const floatingBobAnim = useRef(new Animated.Value(0)).current;

  // Page 2 rotating focus message crossfade
  const messageFadeAnim = useRef(new Animated.Value(1)).current;

  // Page 2 distraction overlay animation
  const distractionOverlayAnim = useRef(new Animated.Value(0)).current;
  const distractionScaleAnim = useRef(new Animated.Value(0.9)).current;

  // Page 3 celebration checkmark pop
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationConfettiAnim = useRef(new Animated.Value(0)).current;

  // ==========================================
  // INITIAL & LOOPING ANIMATIONS
  // ==========================================
  useEffect(() => {
    // Focus orb rhythmic breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulseAnim, {
          toValue: 1.06,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulseAnim, {
          toValue: 0.96,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb ambient glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlowAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbGlowAnim, {
          toValue: 0.55,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Concentric ring slow rotation
    Animated.loop(
      Animated.timing(orbRingRotateAnim, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Subtle bobbing for floating category badges
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingBobAnim, {
          toValue: -8,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingBobAnim, {
          toValue: 4,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Background resilience listener via AppState
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isTimerActive && page === 2) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleTimerFinished();
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isTimerActive, page]);

  // Page 2 Timer Interval Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (page === 2 && isTimerActive && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimerFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [page, isTimerActive, timeLeft]);

  // Page 2 Rotating focus message cycle (every 7 seconds)
  useEffect(() => {
    if (page !== 2) return;

    const messageInterval = setInterval(() => {
      // Fade out
      Animated.timing(messageFadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % FOCUS_MESSAGES.length);
        // Fade in
        Animated.timing(messageFadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, 7000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [page]);

  // Handle completion when timer finishes
  const handleTimerFinished = useCallback(() => {
    setIsTimerActive(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    // Smooth transition from Page 2 to Page 3
    Animated.timing(pageFadeAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setPage(3);
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Trigger celebration checkmark pop
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(checkmarkScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti burst animation
      Animated.timing(celebrationConfettiAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Transition helper between pages
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

  // Interactive touch handler for focus orb on Page 1
  const handleOrbPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    Animated.sequence([
      Animated.timing(orbTouchScale, {
        toValue: 1.12,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(orbTouchScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle "I got distracted" interaction
  const handleDistractedPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    setIsDistractionModalVisible(true);

    Animated.parallel([
      Animated.timing(distractionOverlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(distractionScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Dismiss distraction modal
  const handleDismissDistraction = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    Animated.parallel([
      Animated.timing(distractionOverlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(distractionScaleAnim, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDistractionModalVisible(false);
    });
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

  // Format MM:SS for countdown timer
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate elapsed focus time in minutes for focus streak indicator
  const elapsedMinutes = Math.floor((TASK_DURATION_SECONDS - timeLeft) / 60);

  // SVG Progress Ring calculations
  const ringSize = Math.min(width * 0.76, 280);
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Concentric ring rotation interpolation
  const ringRotationInterpolate = orbRingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseRingRotationInterpolate = orbRingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // Page 2 exit confirmation
  const handleExitSession = () => {
    Alert.alert(
      'Leave Focus Session?',
      'Your 10-minute focus progress will reset if you exit now.',
      [
        { text: 'Stay Focused', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // ==========================================
  // BACKEND CLAIM COMPLETION (PAGE 3)
  // ==========================================
  const handleClaimPoints = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}

    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to claim points.');
        setIsSubmitting(false);
        return;
      }

      // Exact backend payload matching seeded task #19 and Medium difficulty
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 19,
          task_name: 'Focus on one task (10 min)',
          distraction_text: selectedActivity ? `Focused on: ${selectedActivity}` : 'Single-task 10m deep focus',
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
            taskName: 'Focus on one task',
            difficulty: 'Medium',
          },
        } as any);
      } else {
        Alert.alert('Unable to Claim Points', data.error || data.message || 'Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Focus task claim points error:', error);
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Premium Light Ambient Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#F0FDF4', '#FAF5FF']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle Ambient Background Glowing Orbs */}
      <View style={styles.ambientBackdrop} pointerEvents="none">
        <View style={[styles.glowOrb, styles.glowOrbCyan]} />
        <View style={[styles.glowOrb, styles.glowOrbPurple]} />
        <View style={[styles.glowOrb, styles.glowOrbEmerald]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View style={[styles.pageContainer, { opacity: pageFadeAnim }]}>
          {/* ====================================================== */}
          {/* PAGE 1: CHOOSE YOUR FOCUS                              */}
          {/* ====================================================== */}
          {page === 1 && (
            <View style={styles.pageContent}>
              {/* Top Navigation Bar */}
              <View style={styles.topNavRow}>
                <TouchableOpacity
                  style={styles.navIconButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather name="arrow-left" size={20} color="#334155" />
                </TouchableOpacity>

                <View style={styles.headerTag}>
                  <Feather name="zap" size={13} color="#059669" />
                  <Text style={styles.headerTagText}>Deep Attention</Text>
                </View>

                <View style={{ width: 40 }} />
              </View>

              {/* Central Animated Focus Orb Area */}
              <View style={styles.orbStage}>
                {/* Rotating outer concentric dotted ring */}
                <Animated.View
                  style={[
                    styles.concentricRingOuter,
                    { transform: [{ rotate: ringRotationInterpolate }] },
                  ]}
                  pointerEvents="none"
                />

                {/* Counter-rotating inner ring */}
                <Animated.View
                  style={[
                    styles.concentricRingInner,
                    { transform: [{ rotate: reverseRingRotationInterpolate }] },
                  ]}
                  pointerEvents="none"
                />

                {/* Floating Activity Icons surrounding the Orb */}
                {FOCUS_ACTIVITIES.map((act, index) => {
                  const rad = (act.angle * Math.PI) / 180;
                  const distance = 120;
                  const offsetX = Math.cos(rad) * distance;
                  const offsetY = Math.sin(rad) * distance;
                  const isSelected = selectedActivity === act.label;

                  return (
                    <Animated.View
                      key={act.id}
                      style={[
                        styles.floatingIconWrapper,
                        {
                          transform: [
                            { translateX: offsetX },
                            { translateY: Animated.add(offsetY, floatingBobAnim) },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.floatingIconBadge,
                          isSelected && styles.floatingIconBadgeSelected,
                        ]}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch (_) {}
                          setSelectedActivity(isSelected ? null : act.label);
                        }}
                        activeOpacity={0.75}
                      >
                        <Feather
                          name={act.icon as any}
                          size={15}
                          color={isSelected ? '#ffffff' : act.color}
                        />
                        <Text
                          style={[
                            styles.floatingIconLabel,
                            isSelected && styles.floatingIconLabelSelected,
                          ]}
                        >
                          {act.label}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}

                {/* Central Focus Orb (Touch-reactive) */}
                <Pressable onPress={handleOrbPress}>
                  <Animated.View
                    style={[
                      styles.focusOrbWrapper,
                      {
                        transform: [
                          { scale: Animated.multiply(orbPulseAnim, orbTouchScale) },
                        ],
                      },
                    ]}
                  >
                    {/* Glowing outer aura */}
                    <Animated.View
                      style={[
                        styles.focusOrbAura,
                        { opacity: orbGlowAnim },
                      ]}
                    />

                    {/* Gradient Sphere */}
                    <LinearGradient
                      colors={['#06b6d4', '#3b82f6', '#8b5cf6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.focusOrbCore}
                    >
                      <View style={styles.focusOrbHighlight} />
                      <Feather name="target" size={42} color="#ffffff" />
                      <Text style={styles.focusOrbCenterText}>FOCUS</Text>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
              </View>

              {/* Text Information Card */}
              <View style={styles.introCard}>
                <Text style={styles.mainTitle}>Focus on One Task</Text>
                <Text style={styles.mainSubtitle}>
                  Give one thing your full attention for the next 10 minutes.
                </Text>

                {/* Badges: 10 min, Medium, +300 Points */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#2563eb" />
                    <Text style={[styles.badgeText, styles.textDuration]}>10 min</Text>
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

                {/* Motivational Quote */}
                <Text style={styles.mottoText}>
                  “One task. One moment. Full focus.”
                </Text>
              </View>

              {/* Start Focus Button */}
              <View style={styles.bottomActionContainer}>
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
                    <Text style={styles.primaryButtonText}>Start Focus</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 2: 10-MINUTE FOCUS MODE                           */}
          {/* ====================================================== */}
          {page === 2 && (
            <View style={styles.pageContent}>
              {/* Minimal Header */}
              <View style={styles.topNavRow}>
                <TouchableOpacity
                  style={styles.navTextButton}
                  onPress={handleExitSession}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color="#64748b" />
                  <Text style={styles.navTextButtonLabel}>Quit</Text>
                </TouchableOpacity>

                {/* Focus Streak Counter */}
                <View style={styles.focusStreakBadge}>
                  <MaterialCommunityIcons name="fire" size={16} color="#f59e0b" />
                  <Text style={styles.focusStreakText}>
                    Focus streak: {elapsedMinutes} min
                  </Text>
                </View>
              </View>

              {/* Central Concentric Focus Environment */}
              <View style={styles.timerCenterStage}>
                {/* Outermost breathing halo */}
                <Animated.View
                  style={[
                    styles.timerOuterHalo,
                    {
                      transform: [{ scale: orbPulseAnim }],
                      opacity: orbGlowAnim,
                    },
                  ]}
                />

                {/* Animated Rotating Concentric Rings */}
                <Animated.View
                  style={[
                    styles.timerRingRotating,
                    { transform: [{ rotate: ringRotationInterpolate }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.timerRingRotatingInner,
                    { transform: [{ rotate: reverseRingRotationInterpolate }] },
                  ]}
                />

                {/* Circular Progress Ring with Digital Countdown */}
                <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={ringSize} height={ringSize} style={styles.svgRing}>
                    <Defs>
                      <SvgLinearGradient id="focusProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#06b6d4" />
                        <Stop offset="50%" stopColor="#3b82f6" />
                        <Stop offset="100%" stopColor="#10b981" />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Track */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="rgba(226, 232, 240, 0.75)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />

                    {/* Animated Progress Indicator */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="url(#focusProgressGrad)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    />
                  </Svg>

                  {/* Center Content: Digital Timer */}
                  <Pressable
                    style={styles.timerTextContainer}
                    onPress={handleDevSkip}
                  >
                    <Animated.View
                      style={[
                        styles.timerCorePulse,
                        { transform: [{ scale: orbPulseAnim }] },
                      ]}
                    />
                    <Text style={styles.timerValueText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerSubCaption}>
                      {selectedActivity ? `Focusing on ${selectedActivity}` : 'Mindful Attention'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Text & Dynamic Focus Quotes */}
              <View style={styles.mindfulSection}>
                <Text style={styles.anchorHeadline}>Stay with one thing.</Text>

                {/* Rotating Quotes */}
                <View style={styles.rotatingMessageContainer}>
                  <Animated.Text
                    style={[
                      styles.rotatingMessageText,
                      { opacity: messageFadeAnim },
                    ]}
                  >
                    {FOCUS_MESSAGES[messageIndex]}
                  </Animated.Text>
                </View>
              </View>

              {/* Interactive Distraction Button */}
              <View style={styles.bottomActionContainer}>
                <TouchableOpacity
                  style={styles.distractionButton}
                  onPress={handleDistractedPress}
                  activeOpacity={0.8}
                >
                  <Feather name="compass" size={16} color="#64748b" />
                  <Text style={styles.distractionButtonText}>I got distracted</Text>
                </TouchableOpacity>
              </View>

              {/* Distraction Encouragement Modal Overlay */}
              {isDistractionModalVisible && (
                <Animated.View
                  style={[
                    styles.distractionBackdrop,
                    { opacity: distractionOverlayAnim },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.distractionCard,
                      { transform: [{ scale: distractionScaleAnim }] },
                    ]}
                  >
                    <View style={styles.distractionIconContainer}>
                      <Feather name="heart" size={32} color="#10b981" />
                    </View>
                    <Text style={styles.distractionTitle}>That's okay.</Text>
                    <Text style={styles.distractionMessage}>
                      Bring your attention back.
                    </Text>
                    <Text style={styles.distractionHint}>
                      Focus is not about never wandering—it is the practice of returning gently.
                    </Text>

                    <TouchableOpacity
                      style={styles.distractionResumeButton}
                      onPress={handleDismissDistraction}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.distractionResumeText}>Continue Focusing</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 3: FOCUS COMPLETE                                 */}
          {/* ====================================================== */}
          {page === 3 && (
            <View style={styles.pageContent}>
              {/* Confetti Particles */}
              {CELEBRATION_PARTICLES.map((p) => (
                <Animated.View
                  key={p.id}
                  style={[
                    styles.celebrationDot,
                    {
                      left: p.x,
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: p.color,
                      transform: [
                        {
                          translateY: celebrationConfettiAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, height * 0.85],
                          }),
                        },
                        {
                          rotate: celebrationConfettiAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', `${(p.id % 2 === 0 ? 1 : -1) * 360}deg`],
                          }),
                        },
                      ],
                      opacity: celebrationConfettiAnim.interpolate({
                        inputRange: [0, 0.2, 0.85, 1],
                        outputRange: [0, 0.9, 0.9, 0],
                      }),
                    },
                  ]}
                />
              ))}

              <View style={{ height: 20 }} />

              {/* Celebration Focus Orb with Checkmark */}
              <View style={styles.celebrationOrbContainer}>
                {/* Glowing Aura */}
                <Animated.View
                  style={[
                    styles.celebrationAura,
                    {
                      transform: [{ scale: orbPulseAnim }],
                      opacity: orbGlowAnim,
                    },
                  ]}
                />

                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.celebrationOrbSphere}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: checkmarkScaleAnim }],
                    }}
                  >
                    <Feather name="check" size={54} color="#ffffff" />
                  </Animated.View>
                </LinearGradient>
              </View>

              {/* Headings */}
              <View style={styles.celebrationTextCard}>
                <Text style={styles.celebrationTitle}>Focus Complete</Text>
                <Text style={styles.celebrationSubtitle}>
                  You gave one thing your full attention for 10 minutes.
                </Text>

                {/* Reward Highlight Card */}
                <LinearGradient
                  colors={['#ecfdf5', '#f0fdf4', '#f8fafc']}
                  style={styles.rewardCard}
                >
                  <View style={styles.rewardIconBadge}>
                    <Feather name="award" size={24} color="#059669" />
                  </View>
                  <Text style={styles.rewardPointsValue}>+300 Points</Text>
                  <Text style={styles.rewardSubtext}>
                    That's 10 minutes of intentional focus.
                  </Text>
                </LinearGradient>

                <View style={styles.celebrationDetailsRow}>
                  <View style={styles.detailPill}>
                    <Feather name="clock" size={13} color="#2563eb" />
                    <Text style={styles.detailPillText}>10 Minutes Elapsed</Text>
                  </View>
                  <View style={styles.detailPill}>
                    <Feather name="shield" size={13} color="#7c3aed" />
                    <Text style={styles.detailPillText}>Undivided Attention</Text>
                  </View>
                </View>
              </View>

              {/* Claim Reward Button */}
              <View style={styles.bottomActionContainer}>
                <TouchableOpacity
                  style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                  onPress={handleClaimPoints}
                  disabled={isSubmitting}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    {isSubmitting ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.primaryButtonText}>Claiming Reward...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Claim +300 Points</Text>
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
    backgroundColor: '#F8FAFC',
  },
  ambientBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.35,
  },
  glowOrbCyan: {
    top: -60,
    right: -50,
    width: 260,
    height: 260,
    backgroundColor: '#a5f3fc',
  },
  glowOrbPurple: {
    top: height * 0.38,
    left: -80,
    width: 240,
    height: 240,
    backgroundColor: '#ddd6fe',
  },
  glowOrbEmerald: {
    bottom: -40,
    right: -40,
    width: 260,
    height: 260,
    backgroundColor: '#bbf7d0',
  },
  safeArea: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  // Top Nav Bar
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(209, 250, 229, 0.8)',
  },
  headerTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    letterSpacing: 0.3,
  },
  navTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
  },
  navTextButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  focusStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(254, 243, 199, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.9)',
  },
  focusStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },

  // ==========================================
  // PAGE 1 STYLES
  // ==========================================
  orbStage: {
    height: height * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  concentricRingOuter: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderStyle: 'dashed',
  },
  concentricRingInner: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  floatingIconWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingIconBadgeSelected: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  floatingIconLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  floatingIconLabelSelected: {
    color: '#ffffff',
  },
  focusOrbWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusOrbAura: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
  },
  focusOrbCore: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  focusOrbHighlight: {
    position: 'absolute',
    top: 6,
    left: 20,
    width: 50,
    height: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ rotate: '-30deg' }],
  },
  focusOrbCenterText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: 4,
  },

  introCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginVertical: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
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
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  badgeDifficulty: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgePoints: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textDuration: {
    color: '#1e40af',
  },
  textDifficulty: {
    color: '#92400e',
  },
  textPoints: {
    color: '#065f46',
  },
  mottoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ==========================================
  // PAGE 2 STYLES
  // ==========================================
  timerCenterStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  timerOuterHalo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  timerRingRotating: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderStyle: 'dashed',
  },
  timerRingRotatingInner: {
    position: 'absolute',
    width: 255,
    height: 255,
    borderRadius: 127.5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  svgRing: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerCorePulse: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  timerValueText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  timerSubCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mindfulSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  anchorHeadline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  rotatingMessageContainer: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingMessageText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  distractionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  distractionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // Distraction Overlay Modal
  distractionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 99,
  },
  distractionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  distractionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  distractionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  distractionMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
    textAlign: 'center',
  },
  distractionHint: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  distractionResumeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distractionResumeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ==========================================
  // PAGE 3 STYLES
  // ==========================================
  celebrationDot: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  celebrationOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.28,
    position: 'relative',
  },
  celebrationAura: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  celebrationOrbSphere: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  celebrationTextCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginVertical: 10,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  celebrationSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  rewardCard: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 16,
  },
  rewardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rewardPointsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  rewardSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
    textAlign: 'center',
  },
  celebrationDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  detailPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Primary Buttons (Used across pages)
  bottomActionContainer: {
    width: '100%',
    paddingBottom: 4,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
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
