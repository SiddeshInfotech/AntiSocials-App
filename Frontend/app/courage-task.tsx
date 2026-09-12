import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  AppState,
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
const TASK_DURATION_SECONDS = 300; // 5 minutes (300 seconds)
const REQUIRED_WORD_COUNT = 150;

// Page 2: Exactly 7 Courage Choices
const COURAGE_CHOICES = [
  { id: 'fear', emoji: '🦁', title: 'I faced a fear.', desc: 'Stepped into something that made me nervous.', color: '#f59e0b' },
  { id: 'kept_going', emoji: '💪', title: 'I kept going.', desc: 'Preserved even when giving up felt easier.', color: '#ef4444' },
  { id: 'new', emoji: '🌟', title: 'I tried something new.', desc: 'Embraced the unfamiliar with an open heart.', color: '#fbbf24' },
  { id: 'stand_up', emoji: '❤️', title: 'I stood up for myself.', desc: 'Honored my boundaries and spoke my truth.', color: '#ec4899' },
  { id: 'challenge', emoji: '🔥', title: 'I overcame a challenge.', desc: 'Pushed through adversity with determination.', color: '#f97316' },
  { id: 'growth', emoji: '🌱', title: 'I grew from something difficult.', desc: 'Found wisdom and strength in hardship.', color: '#10b981' },
  { id: 'could_not', emoji: '✨', title: "I did something I didn't think I could.", desc: 'Surprised myself by proving my doubts wrong.', color: '#8b5cf6' },
];

// Page 4: 6 Rotating Supportive Motivational Messages
const MOTIVATIONAL_MESSAGES = [
  'You were stronger than you thought.',
  "Remember how far you've come.",
  'Let that courage stay with you.',
  'You handled something difficult.',
  'Give yourself credit.',
  'You are capable of more than you know.',
];

// Full-screen ambient ember particles
const AMBIENT_EMBERS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 30) + 15,
  size: 3 + Math.random() * 5,
  duration: 4500 + Math.random() * 3500,
  delay: (i % 6) * 320,
  color: ['#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#a855f7', '#38bdf8'][i % 6],
}));

// Page 6 Celebratory Confetti
const CONFETTI_PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  size: 6 + Math.random() * 7,
  color: ['#fbbf24', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#38bdf8'][i % 6],
  duration: 2400 + Math.random() * 900,
  delay: (i % 7) * 120,
}));

export default function CourageTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 6 Pages/States: 1 -> 2 -> 3 -> 4 -> 5 -> 6
  const [page, setPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // States across the journey
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [courageStory, setCourageStory] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Page 4 Timer States
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  // Page 6 Claiming State
  const [isClaiming, setIsClaiming] = useState(false);

  // Wall-clock synchronization for background resilience
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Page transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Background animated ambient loops
  const bgBreathingAnim = useRef(new Animated.Value(1)).current;
  const auraGlowAnim = useRef(new Animated.Value(0.5)).current;
  const orbFloatAnim = useRef(new Animated.Value(0)).current;

  // Page 1 Staggered Entrance
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current;
  const startButtonAnim = useRef(new Animated.Value(0)).current;

  // Page 2 Staggered Entrance for 7 Cards
  const choiceCardAnims = useRef(COURAGE_CHOICES.map(() => new Animated.Value(0))).current;

  // Page 4 Rotating Prompts crossfade
  const messageFadeAnim = useRef(new Animated.Value(1)).current;

  // Page 5 Courage Spark Expansion
  const sparkScaleAnim = useRef(new Animated.Value(0.8)).current;
  const sparkRaysAnim = useRef(new Animated.Value(0.3)).current;

  // Page 6 Celebration Animations
  const completionScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // Ember particles
  const emberAnims = useRef(AMBIENT_EMBERS.map(() => new Animated.Value(0))).current;

  // Helper to count actual words (not characters)
  const actualWordCount = useMemo(() => {
    const trimmed = courageStory.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [courageStory]);

  const hasMetWordRequirement = actualWordCount >= REQUIRED_WORD_COUNT;

  // Load saved draft on mount
  useEffect(() => {
    SecureStore.getItemAsync('courage_moment_draft')
      .then((draft) => {
        if (draft) setCourageStory(draft);
      })
      .catch((err) => console.error('Error loading draft:', err));
  }, []);

  // Continuous full-screen ambient animation loops
  useEffect(() => {
    // Breathing background glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgBreathingAnim, {
          toValue: 1.06,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgBreathingAnim, {
          toValue: 0.96,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Soft aura glow
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

    // Floating orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloatAnim, {
          toValue: -8,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbFloatAnim, {
          toValue: 6,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating embers loop
    emberAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(AMBIENT_EMBERS[idx].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: AMBIENT_EMBERS[idx].duration,
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

    // Page 1 Staggered Entrance
    Animated.sequence([
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleFadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(startButtonAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Trigger Page 2 staggered card entrance
  useEffect(() => {
    if (page === 2) {
      choiceCardAnims.forEach((anim) => anim.setValue(0));
      const staggered = choiceCardAnims.map((anim, idx) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 380,
          delay: idx * 80,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        })
      );
      Animated.stagger(70, staggered).start();
    }
  }, [page]);

  // Page 4 AppState listener for background resilience
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isTimerActive && page === 4) {
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

  // Page 4 Timer Interval Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (page === 4 && isTimerActive && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimerComplete();
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

  // Page 4 Rotating motivational prompts
  useEffect(() => {
    if (page !== 4) return;

    const quoteInterval = setInterval(() => {
      Animated.timing(messageFadeAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
        Animated.timing(messageFadeAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, 7000);

    return () => clearInterval(quoteInterval);
  }, [page]);

  // Page 5 Courage spark animation trigger
  useEffect(() => {
    if (page === 5) {
      sparkScaleAnim.setValue(0.8);
      sparkRaysAnim.setValue(0.3);

      Animated.parallel([
        Animated.spring(sparkScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(sparkRaysAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [page]);

  // Page 6 Completion animation trigger
  useEffect(() => {
    if (page === 6) {
      completionScaleAnim.setValue(0);
      confettiAnim.setValue(0);

      Animated.parallel([
        Animated.spring(completionScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [page]);

  // Timer complete -> Move to Page 5 automatically
  const handleTimerComplete = useCallback(() => {
    setIsTimerActive(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    navigateToPage(5);
  }, []);

  // Cinematic Page Transition Helper
  const navigateToPage = (newPage: 1 | 2 | 3 | 4 | 5 | 6, direction: 'forward' | 'backward' = 'forward') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    const slideOut = direction === 'forward' ? -35 : 35;
    const slideIn = direction === 'forward' ? 35 : -35;

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: slideOut,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(newPage);
      if (newPage === 4) {
        setIsTimerActive(true);
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }
      pageSlideAnim.setValue(slideIn);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Back Navigation
  const handleBackNavigation = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    if (page === 4 && isTimerActive) {
      Alert.alert(
        'Pause Reflection?',
        'Your 5-minute courage timer is active. Leaving now will reset the timer.',
        [
          { text: 'Stay Here', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              setIsTimerActive(false);
              navigateToPage(3, 'backward');
            },
          },
        ]
      );
      return;
    }

    if (page > 1) {
      navigateToPage((page - 1) as 1 | 2 | 3 | 4 | 5 | 6, 'backward');
    } else {
      router.back();
    }
  };

  // Text Change with Auto-Save
  const handleStoryChange = (text: string) => {
    setCourageStory(text);
    SecureStore.setItemAsync('courage_moment_draft', text).catch((err) =>
      console.error('Error auto-saving draft:', err)
    );
  };

  // Developer testing quick-skip (double-tap timer in __DEV__)
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

  // Format time MM:SS
  const formatTimeMMSS = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Progress Ring calculations
  const ringSize = Math.min(width * 0.72, 270);
  const strokeWidth = 9;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Page 6 Backend Point Submission
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

      const selectedCategory = COURAGE_CHOICES.find((c) => c.id === selectedChoiceId)?.title || 'Faced a Challenge';

      // Authenticated task completion (matches backend task ID 70, Medium difficulty => 300 points)
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 70,
          task_name: 'Write courage moment',
          courage_category: selectedCategory,
          journal_entry: courageStory.trim(),
          reflection_text: `Courage: ${selectedCategory}. Story: ${courageStory.trim()}`,
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        // Clear local draft upon completion
        await SecureStore.deleteItemAsync('courage_moment_draft');

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
            taskName: 'Write Courage Moment',
            difficulty: 'Medium',
            message: 'Your courage has been honored.',
          },
        } as any);
      } else {
        Alert.alert('Unable to Claim Points', data.error || data.message || 'Please try again.');
        setIsClaiming(false);
      }
    } catch (err) {
      console.error('Courage task claim error:', err);
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaiming(false);
    }
  };

  const selectedCategoryObj = COURAGE_CHOICES.find((c) => c.id === selectedChoiceId);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* FULL-SCREEN CONTINUOUS ANIMATED BACKGROUND */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ scale: bgBreathingAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#090a10', '#12111d', '#1e1124', '#150914']}
          locations={[0, 0.35, 0.75, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Soft Glowing Ambient Orbs & Rays */}
      <View style={styles.ambientLightingContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.ambientGlowEmberTop,
            { opacity: auraGlowAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.ambientGlowPurpleBottom,
            { opacity: auraGlowAnim },
          ]}
        />
      </View>

      {/* Atmospheric Ember Particles */}
      <View style={styles.particleContainer} pointerEvents="none">
        {AMBIENT_EMBERS.map((p, idx) => (
          <Animated.View
            key={p.id}
            style={[
              styles.emberParticle,
              {
                left: p.x,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: emberAnims[idx].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.85, 0],
                }),
                transform: [
                  {
                    translateY: emberAnims[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.9, height * 0.08],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        {/* Page 6 Confetti Particles */}
        {page === 6 &&
          CONFETTI_PARTICLES.map((c) => (
            <Animated.View
              key={c.id}
              style={[
                styles.confettiParticle,
                {
                  left: c.x,
                  width: c.size,
                  height: c.size,
                  borderRadius: c.size / 2,
                  backgroundColor: c.color,
                  opacity: confettiAnim.interpolate({
                    inputRange: [0, 0.2, 0.85, 1],
                    outputRange: [0, 0.9, 0.9, 0],
                  }),
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, height * 0.85],
                      }),
                    },
                    {
                      rotate: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${(c.id % 2 === 0 ? 1 : -1) * 360}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Universal Top Navigation Header */}
        <View style={styles.navHeaderBar}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={handleBackNavigation}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={18} color="#e2e8f0" />
          </TouchableOpacity>

          {/* Progress Pill Indicator */}
          <View style={styles.pagePillBadge}>
            <View style={styles.pageDotActive} />
            <Text style={styles.pagePillText}>Stage {page} of 6</Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        <Animated.View
          style={[
            styles.pageWrapper,
            {
              opacity: pageFadeAnim,
              transform: [{ translateX: pageSlideAnim }],
            },
          ]}
        >
          {/* ====================================================== */}
          {/* PAGE 1 — INTRODUCTION                                  */}
          {/* ====================================================== */}
          {page === 1 && (
            <View style={styles.pageInner}>
              <View style={styles.heroCenterStage}>
                {/* Courage Insignia Medallion */}
                <View style={styles.courageInsigniaWrapper}>
                  {/* Outer Pulsing Aura */}
                  <Animated.View
                    style={[
                      styles.insigniaAuraHalo,
                      {
                        transform: [{ scale: bgBreathingAnim }],
                        opacity: auraGlowAnim,
                      },
                    ]}
                  />

                  {/* Glassmorphic Courage Disc */}
                  <Animated.View
                    style={[
                      styles.courageDisc,
                      { transform: [{ translateY: orbFloatAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['rgba(245, 158, 11, 0.45)', 'rgba(239, 68, 68, 0.25)', 'rgba(15, 23, 42, 0.7)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.courageDiscGradient}
                    >
                      <MaterialCommunityIcons name="shield-sun" size={54} color="#fbbf24" />
                      <Text style={styles.insigniaLabel}>COURAGE</Text>
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* Typography Card */}
                <View style={styles.glassCard}>
                  <Animated.Text style={[styles.mainHeroTitle, { opacity: titleFadeAnim }]}>
                    Write Courage Moment
                  </Animated.Text>
                  <Animated.Text style={[styles.mainHeroSubtitle, { opacity: subtitleFadeAnim }]}>
                    Remember a moment when you found the courage to keep going.
                  </Animated.Text>

                  {/* 2 Short Lines of Explanation */}
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLine}>
                      Sometimes we are stronger than we realize.
                    </Text>
                    <Text style={styles.explanationLine}>
                      Take a moment to remember the courage you showed.
                    </Text>
                  </View>

                  {/* Badges: 5 min, Medium, +300 Points */}
                  <View style={styles.badgesRow}>
                    <View style={[styles.badge, styles.badgeDuration]}>
                      <Feather name="clock" size={13} color="#38bdf8" />
                      <Text style={[styles.badgeText, styles.textDuration]}>5 min</Text>
                    </View>
                    <View style={[styles.badge, styles.badgeDifficulty]}>
                      <Feather name="bar-chart-2" size={13} color="#fbbf24" />
                      <Text style={[styles.badgeText, styles.textDifficulty]}>Medium</Text>
                    </View>
                    <View style={[styles.badge, styles.badgePoints]}>
                      <Feather name="award" size={13} color="#34d399" />
                      <Text style={[styles.badgeText, styles.textPoints]}>+300 Points</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Button: Start Now */}
              <Animated.View style={[styles.bottomActionArea, { opacity: startButtonAnim }]}>
                <TouchableOpacity
                  style={styles.primaryGradientButton}
                  onPress={() => navigateToPage(2)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706', '#b45309']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    <Text style={styles.buttonLabelText}>Start Now</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 2 — CHOOSE YOUR COURAGE MOMENT                    */}
          {/* ====================================================== */}
          {page === 2 && (
            <View style={styles.pageInner}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.choicesScrollWrapper}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Choose Your Courage Moment</Text>
                  <Text style={styles.sectionSubtitle}>
                    What kind of moment would you like to remember?
                  </Text>
                </View>

                {/* 7 Animated Choices */}
                <View style={styles.choicesList}>
                  {COURAGE_CHOICES.map((choice, idx) => {
                    const isSelected = selectedChoiceId === choice.id;
                    return (
                      <Animated.View
                        key={choice.id}
                        style={{
                          opacity: choiceCardAnims[idx],
                          transform: [
                            {
                              translateY: choiceCardAnims[idx].interpolate({
                                inputRange: [0, 1],
                                outputRange: [22, 0],
                              }),
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.choiceCard,
                            isSelected && styles.choiceCardSelected,
                            selectedChoiceId !== null && !isSelected && styles.choiceCardDimmed,
                          ]}
                          onPress={() => {
                            try {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            } catch (_) {}
                            setSelectedChoiceId(choice.id);
                          }}
                          activeOpacity={0.85}
                        >
                          <View style={[styles.choiceEmojiCapsule, { borderColor: choice.color }]}>
                            <Text style={styles.choiceEmojiText}>{choice.emoji}</Text>
                          </View>
                          <View style={styles.choiceTextBox}>
                            <Text style={[styles.choiceTitleText, isSelected && { color: choice.color }]}>
                              {choice.title}
                            </Text>
                            <Text style={styles.choiceDescText}>{choice.desc}</Text>
                          </View>
                          <View style={[styles.choiceCheckCapsule, isSelected && styles.choiceCheckCapsuleActive]}>
                            {isSelected && <Feather name="check" size={12} color="#ffffff" />}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Continue Button */}
              <View style={styles.bottomActionArea}>
                <TouchableOpacity
                  style={[styles.primaryGradientButton, !selectedChoiceId && styles.buttonDisabled]}
                  onPress={() => {
                    if (selectedChoiceId) {
                      navigateToPage(3);
                    }
                  }}
                  disabled={!selectedChoiceId}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={selectedChoiceId ? ['#f59e0b', '#d97706', '#b45309'] : ['#334155', '#1e293b', '#0f172a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    <Text style={styles.buttonLabelText}>Continue</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 3 — WRITE YOUR COURAGE MOMENT                     */}
          {/* ====================================================== */}
          {page === 3 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.pageInner}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.writingScrollWrapper}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Write Your Courage Moment</Text>
                    <Text style={styles.sectionSubtitle}>
                      Tell yourself the story of a moment when you were brave.
                    </Text>
                  </View>

                  {/* Selected Category Reminder Pill */}
                  {selectedCategoryObj && (
                    <View style={styles.selectedPillBanner}>
                      <Text style={styles.selectedPillEmoji}>{selectedCategoryObj.emoji}</Text>
                      <Text style={styles.selectedPillTitle}>{selectedCategoryObj.title}</Text>
                    </View>
                  )}

                  {/* Large Multiline Text Box with Glowing Border */}
                  <View
                    style={[
                      styles.writingBoxCard,
                      isInputFocused && styles.writingBoxCardFocused,
                    ]}
                  >
                    <View style={styles.writingBoxTopRow}>
                      <View style={styles.writingPromptBadge}>
                        <Feather name="edit-3" size={13} color="#f59e0b" />
                        <Text style={styles.writingPromptLabel}>Your Story</Text>
                      </View>

                      {/* Live Word Counter: X / 150 words */}
                      <View
                        style={[
                          styles.wordCountBadge,
                          hasMetWordRequirement && styles.wordCountBadgeSuccess,
                        ]}
                      >
                        <Text
                          style={[
                            styles.wordCountText,
                            hasMetWordRequirement && styles.wordCountTextSuccess,
                          ]}
                        >
                          {actualWordCount} / {REQUIRED_WORD_COUNT} words
                        </Text>
                      </View>
                    </View>

                    <TextInput
                      style={styles.journalTextInput}
                      multiline
                      numberOfLines={8}
                      placeholder="Write about your courage moment..."
                      placeholderTextColor="#64748b"
                      value={courageStory}
                      onChangeText={handleStoryChange}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Word Count Hint */}
                  <View style={styles.wordRequirementHintBox}>
                    <Feather
                      name={hasMetWordRequirement ? 'check-circle' : 'info'}
                      size={14}
                      color={hasMetWordRequirement ? '#34d399' : '#f59e0b'}
                    />
                    <Text style={styles.wordRequirementHintText}>
                      {hasMetWordRequirement
                        ? '150-word goal reached! Take your time to reflect and proceed.'
                        : `Please write at least ${REQUIRED_WORD_COUNT - actualWordCount} more words to unlock the timer.`}
                    </Text>
                  </View>
                </ScrollView>

                {/* Start Timer Button */}
                <View style={styles.bottomActionArea}>
                  <TouchableOpacity
                    style={[styles.primaryGradientButton, !hasMetWordRequirement && styles.buttonDisabled]}
                    onPress={() => {
                      if (hasMetWordRequirement) {
                        navigateToPage(4);
                      }
                    }}
                    disabled={!hasMetWordRequirement}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={hasMetWordRequirement ? ['#f59e0b', '#d97706', '#b45309'] : ['#334155', '#1e293b', '#0f172a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buttonGradientLayer}
                    >
                      <Text style={styles.buttonLabelText}>Start Timer</Text>
                      <Feather name="clock" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* ====================================================== */}
          {/* PAGE 4 — 5 MINUTE COURAGE TIMER                        */}
          {/* ====================================================== */}
          {page === 4 && (
            <View style={styles.pageInner}>
              {/* Minimal Top Header */}
              <View style={styles.timerTopStatusRow}>
                {selectedCategoryObj && (
                  <View style={styles.categoryActiveBanner}>
                    <Text style={styles.activeBannerEmoji}>{selectedCategoryObj.emoji}</Text>
                    <Text style={styles.activeBannerText}>{selectedCategoryObj.title}</Text>
                  </View>
                )}
              </View>

              {/* Center Circular Countdown & Progress Ring */}
              <View style={styles.timerCenterContainer}>
                {/* Breathing Ambient Aura */}
                <Animated.View
                  style={[
                    styles.timerHaloAura,
                    {
                      transform: [{ scale: bgBreathingAnim }],
                      opacity: auraGlowAnim,
                    },
                  ]}
                />

                {/* SVG Circular Progress Ring */}
                <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={ringSize} height={ringSize} style={styles.svgProgressRing}>
                    <Defs>
                      <SvgLinearGradient id="courageTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#f59e0b" />
                        <Stop offset="50%" stopColor="#ef4444" />
                        <Stop offset="100%" stopColor="#ec4899" />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Track */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="rgba(251, 191, 36, 0.18)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />

                    {/* Animated Progress Circle */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="url(#courageTimerGrad)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    />
                  </Svg>

                  {/* Inner Timer Disc (Double-tap in __DEV__ to skip) */}
                  <Pressable onPress={handleDevSkip} style={styles.timerInnerContent}>
                    <MaterialCommunityIcons name="shield-sun" size={32} color="#fbbf24" style={{ marginBottom: 4 }} />
                    <Text style={styles.timerDigitsText}>{formatTimeMMSS(timeLeft)}</Text>
                    <Text style={styles.timerCaptionText}>5-Minute Stillness</Text>
                  </Pressable>
                </View>
              </View>

              {/* Rotating Supportive Motivational Messages */}
              <View style={styles.motivationalSection}>
                <View style={styles.messageBubble}>
                  <Animated.Text
                    style={[
                      styles.motivationalQuoteText,
                      { opacity: messageFadeAnim },
                    ]}
                  >
                    “{MOTIVATIONAL_MESSAGES[messageIndex]}”
                  </Animated.Text>
                </View>
              </View>

              {/* Bottom Reminder Pill */}
              <View style={styles.bottomGroundingBar}>
                <Feather name="feather" size={14} color="#fbbf24" />
                <Text style={styles.bottomGroundingText}>Let your courage sink into your mind.</Text>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 5 — COURAGE REFLECTION                            */}
          {/* ====================================================== */}
          {page === 5 && (
            <View style={styles.pageInner}>
              <View style={styles.heroCenterStage}>
                {/* Animated Courage Spark Visual */}
                <View style={styles.sparkVisualWrapper}>
                  {/* Expanding Light Rays Aura */}
                  <Animated.View
                    style={[
                      styles.sparkExpandingHalo,
                      {
                        transform: [{ scale: sparkRaysAnim }],
                        opacity: auraGlowAnim,
                      },
                    ]}
                  />

                  {/* Animated Courage Spark Centerpiece */}
                  <Animated.View
                    style={[
                      styles.sparkCoreDisc,
                      { transform: [{ scale: sparkScaleAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#f59e0b', '#ef4444', '#7c3aed']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sparkGradient}
                    >
                      <MaterialCommunityIcons name="star-four-points" size={54} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* Reflection Card */}
                <View style={styles.glassCard}>
                  <Text style={styles.mainHeroTitle}>Your Courage Matters</Text>
                  <Text style={styles.mainHeroSubtitle}>
                    Every brave moment becomes part of your story.
                  </Text>

                  {/* Highlight of Selected Category */}
                  {selectedCategoryObj && (
                    <View style={styles.reflectionCategoryPill}>
                      <Text style={styles.reflectionCategoryEmoji}>{selectedCategoryObj.emoji}</Text>
                      <Text style={styles.reflectionCategoryText}>{selectedCategoryObj.title}</Text>
                    </View>
                  )}

                  {/* Short Reflection Message */}
                  <View style={styles.reflectionMessageBox}>
                    <Text style={styles.reflectionMessageText}>
                      “You took time to remember your strength. Carry that feeling forward.”
                    </Text>
                  </View>
                </View>
              </View>

              {/* Continue Button */}
              <View style={styles.bottomActionArea}>
                <TouchableOpacity
                  style={styles.primaryGradientButton}
                  onPress={() => navigateToPage(6)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706', '#b45309']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    <Text style={styles.buttonLabelText}>Continue</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 6 — COMPLETION                                    */}
          {/* ====================================================== */}
          {page === 6 && (
            <View style={styles.pageInner}>
              <View style={styles.heroCenterStage}>
                {/* Celebratory Medallion */}
                <View style={styles.completionMedallionContainer}>
                  <Animated.View
                    style={[
                      styles.completionHalo,
                      {
                        transform: [{ scale: bgBreathingAnim }],
                        opacity: auraGlowAnim,
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      styles.completionCoreDisc,
                      { transform: [{ scale: completionScaleAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#f59e0b', '#d97706', '#b45309']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.completionDiscGradient}
                    >
                      <Feather name="check" size={54} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* Completion Details Card */}
                <View style={styles.glassCard}>
                  <Text style={styles.mainHeroTitle}>Courage Moment Complete</Text>
                  <Text style={styles.mainHeroSubtitle}>
                    You remembered a moment when you were brave and gave yourself credit for it.
                  </Text>

                  {/* Reward Card: +300 Points */}
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.2)', 'rgba(217, 119, 6, 0.25)', 'rgba(15, 23, 42, 0.8)']}
                    style={styles.rewardContainer}
                  >
                    <View style={styles.rewardMedalBadge}>
                      <Feather name="award" size={26} color="#fbbf24" />
                    </View>
                    <Text style={styles.rewardPointsVal}>+300 Points</Text>
                    <Text style={styles.rewardSubtext}>Strength Honored • Mind Grounded</Text>
                  </LinearGradient>

                  <View style={styles.summaryBadgesRow}>
                    <View style={styles.summaryBadgePill}>
                      <Feather name="clock" size={12} color="#fbbf24" />
                      <Text style={styles.summaryBadgeText}>5 Min Reflection</Text>
                    </View>
                    <View style={styles.summaryBadgePill}>
                      <Feather name="file-text" size={12} color="#34d399" />
                      <Text style={styles.summaryBadgeText}>150+ Words Logged</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Button: Claim 300 Points */}
              <View style={styles.bottomActionArea}>
                <TouchableOpacity
                  style={[styles.primaryGradientButton, isClaiming && styles.buttonDisabled]}
                  onPress={handleClaimPoints}
                  disabled={isClaiming}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    {isClaiming ? (
                      <View style={styles.loadingFlexRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.buttonLabelText}>Claiming 300 Points...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.buttonLabelText}>Claim 300 Points</Text>
                        <Feather name="arrow-right" size={19} color="#ffffff" />
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
    backgroundColor: '#090a10',
  },
  safeArea: {
    flex: 1,
  },
  ambientLightingContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientGlowEmberTop: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  ambientGlowPurpleBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  emberParticle: {
    position: 'absolute',
  },
  confettiParticle: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },

  // Top Nav Header
  navHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  pagePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  pageDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  pagePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    letterSpacing: 0.3,
  },

  // Page Wrapper
  pageWrapper: {
    flex: 1,
  },
  pageInner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  // Page 1 — Intro
  heroCenterStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courageInsigniaWrapper: {
    width: Math.min(width * 0.58, 220),
    height: Math.min(width * 0.58, 220),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  insigniaAuraHalo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  courageDisc: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  courageDiscGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insigniaLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fef3c7',
    letterSpacing: 2,
    marginTop: 6,
  },
  glassCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    width: '100%',
  },
  mainHeroTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  mainHeroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  explanationBox: {
    marginBottom: 16,
    alignItems: 'center',
  },
  explanationLine: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
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
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgePoints: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textDuration: {
    color: '#38bdf8',
  },
  textDifficulty: {
    color: '#fbbf24',
  },
  textPoints: {
    color: '#34d399',
  },

  // Page 2 — Choices
  choicesScrollWrapper: {
    paddingBottom: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  choicesList: {
    gap: 10,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    gap: 12,
  },
  choiceCardSelected: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  choiceCardDimmed: {
    opacity: 0.55,
  },
  choiceEmojiCapsule: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  choiceEmojiText: {
    fontSize: 20,
  },
  choiceTextBox: {
    flex: 1,
  },
  choiceTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  choiceDescText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  choiceCheckCapsule: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCheckCapsuleActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },

  // Page 3 — Writing
  writingScrollWrapper: {
    paddingBottom: 20,
  },
  selectedPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    marginBottom: 14,
  },
  selectedPillEmoji: {
    fontSize: 16,
  },
  selectedPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  writingBoxCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  writingBoxCardFocused: {
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  writingBoxTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  writingPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  writingPromptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  wordCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  wordCountBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  wordCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  wordCountTextSuccess: {
    color: '#34d399',
  },
  journalTextInput: {
    minHeight: 180,
    fontSize: 15,
    color: '#f8fafc',
    lineHeight: 23,
  },
  wordRequirementHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  wordRequirementHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#cbd5e1',
    flex: 1,
    lineHeight: 17,
  },

  // Page 4 — Timer
  timerTopStatusRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  activeBannerEmoji: {
    fontSize: 14,
  },
  activeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  timerCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  timerHaloAura: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  svgProgressRing: {
    position: 'absolute',
  },
  timerInnerContent: {
    width: Math.min(width * 0.54, 205),
    height: Math.min(width * 0.54, 205),
    borderRadius: Math.min(width * 0.54, 205) / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
    padding: 16,
  },
  timerDigitsText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  timerCaptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
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
  motivationalQuoteText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fef3c7',
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
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  bottomGroundingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fde68a',
  },

  // Page 5 — Courage Reflection
  sparkVisualWrapper: {
    width: Math.min(width * 0.58, 220),
    height: Math.min(width * 0.58, 220),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  sparkExpandingHalo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  sparkCoreDisc: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  sparkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    marginBottom: 14,
  },
  reflectionCategoryEmoji: {
    fontSize: 15,
  },
  reflectionCategoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  reflectionMessageBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reflectionMessageText: {
    fontSize: 14,
    color: '#fef3c7',
    textAlign: 'center',
    lineHeight: 21,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Page 6 — Completion
  completionMedallionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.24,
    position: 'relative',
  },
  completionHalo: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
  },
  completionCoreDisc: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  completionDiscGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 62.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardContainer: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    marginBottom: 14,
  },
  rewardMedalBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  rewardPointsVal: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rewardSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fde68a',
    textAlign: 'center',
  },
  summaryBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  summaryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },

  // Action Buttons
  bottomActionArea: {
    width: '100%',
    paddingBottom: 4,
  },
  primaryGradientButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonGradientLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  loadingFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
