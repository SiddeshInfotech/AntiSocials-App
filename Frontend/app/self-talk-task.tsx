import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Image,
  TextInput,
  ScrollView,
  AppState,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// 5 Minutes (300 seconds)
const TASK_DURATION_SECONDS = 300;
const REQUIRED_WORD_COUNT = 150;

// Page 2: Exactly 7 Affirmations
const AFFIRMATIONS = [
  { id: '1', text: 'I am capable.', emoji: '⚡' },
  { id: '2', text: 'I believe in myself.', emoji: '💖' },
  { id: '3', text: 'I can handle challenges.', emoji: '🛡️' },
  { id: '4', text: 'I am proud of my progress.', emoji: '🌱' },
  { id: '5', text: 'I deserve kindness.', emoji: '☀️' },
  { id: '6', text: 'I am becoming stronger.', emoji: '💪' },
  { id: '7', text: 'I trust myself.', emoji: '✨' },
];

// Page 4: Rotating Encouraging Prompts
const TIMER_SUPPORTING_MESSAGES = [
  'Be kind to yourself.',
  'Your words matter.',
  'Give yourself encouragement.',
  'Notice how you speak to yourself.',
  'Stay with this moment.',
];

// Floating light particles
const AMBIENT_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 24) + 12,
  size: 3 + Math.random() * 5,
  duration: 6000 + Math.random() * 4000,
  delay: (i % 8) * 450,
}));

// Page 6 Celebration Confetti
const CONFETTI_PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#fb923c', '#f59e0b', '#fbbf24', '#f43f5e', '#38bdf8', '#34d399'][i % 6],
  size: 6 + Math.random() * 8,
  delay: (i % 6) * 120,
  duration: 2200 + Math.random() * 900,
}));

export default function SelfTalkTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 6 Pages/States
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // User input states
  const [selectedAffirmation, setSelectedAffirmation] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [supportingMsgIndex, setSupportingMsgIndex] = useState(0);

  // Claiming & Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Wall-clock references for AppState sync
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Animation values
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;
  const bgBreathingAnim = useRef(new Animated.Value(1)).current;
  const heroPulseAnim = useRef(new Animated.Value(1)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const quoteFadeAnim = useRef(new Animated.Value(1)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const glowRingAnim = useRef(new Animated.Value(1)).current;
  const rewardScaleAnim = useRef(new Animated.Value(0.8)).current;
  const rewardOpacityAnim = useRef(new Animated.Value(0)).current;

  // Page 2 card entrance animations
  const cardEntranceAnims = useRef(AFFIRMATIONS.map(() => new Animated.Value(0))).current;

  // Restore draft on mount
  useEffect(() => {
    SecureStore.getItemAsync('self_talk_journal_draft')
      .then((saved) => {
        if (saved) setJournalText(saved);
      })
      .catch(() => {});
  }, []);

  // Ambient loop animations
  useEffect(() => {
    // Gentle background breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgBreathingAnim, {
          toValue: 1.04,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgBreathingAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Title pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulseAnim, {
          toValue: 1.02,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heroPulseAnim, {
          toValue: 0.98,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.03,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Reflection Heart pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScaleAnim, {
          toValue: 1.12,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartScaleAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Reflection Glow Ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowRingAnim, {
          toValue: 1.3,
          duration: 2600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowRingAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Timer pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerPulseAnim, {
          toValue: 1.05,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(timerPulseAnim, {
          toValue: 0.97,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Smooth Page Transitions
  const goToPage = (nextPage: 1 | 2 | 3 | 4 | 5 | 6) => {
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPage(nextPage);
      pageSlideAnim.setValue(20);

      if (nextPage === 2) {
        cardEntranceAnims.forEach((anim) => anim.setValue(0));
        Animated.stagger(
          80,
          cardEntranceAnims.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            })
          )
        ).start();
      }

      if (nextPage === 4) {
        startFiveMinuteTimer();
      }

      if (nextPage === 6) {
        rewardScaleAnim.setValue(0.7);
        rewardOpacityAnim.setValue(0);
        Animated.parallel([
          Animated.spring(rewardScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(rewardOpacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Word count logic (Page 3)
  const wordCount = useMemo(() => {
    const trimmed = journalText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [journalText]);

  const isWordCountMet = wordCount >= REQUIRED_WORD_COUNT;

  const handleJournalTextChange = (text: string) => {
    setJournalText(text);
    SecureStore.setItemAsync('self_talk_journal_draft', text).catch(() => {});
  };

  // 5-Minute Timer (Page 4)
  const startFiveMinuteTimer = () => {
    const duration = TASK_DURATION_SECONDS;
    setTimeLeft(duration);
    setIsTimerActive(true);
    setIsTimerPaused(false);
    endTimeRef.current = Date.now() + duration * 1000;
  };

  // Background/Foreground lifecycle listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isTimerActive && !isTimerPaused && currentPage === 4) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
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
  }, [isTimerActive, isTimerPaused, currentPage]);

  // Active Timer Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (currentPage === 4 && isTimerActive && !isTimerPaused) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (interval) clearInterval(interval);
          handleTimerFinished();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPage, isTimerActive, isTimerPaused]);

  // Rotating encouraging prompts every 7 seconds
  useEffect(() => {
    let quoteInterval: ReturnType<typeof setInterval> | null = null;

    if (currentPage === 4) {
      quoteInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(quoteFadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(quoteFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();

        setSupportingMsgIndex((prev) => (prev + 1) % TIMER_SUPPORTING_MESSAGES.length);
      }, 7000);
    }

    return () => {
      if (quoteInterval) clearInterval(quoteInterval);
    };
  }, [currentPage]);

  // Pause / Resume Timer
  const handleTogglePause = () => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    if (isTimerPaused) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsTimerPaused(false);
    } else {
      setIsTimerPaused(true);
    }
  };

  // Timer complete -> Advance to Page 5
  const handleTimerFinished = () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
    goToPage(5);
  };

  // Fast developer skip (triple tap on timer in __DEV__)
  const devPressCountRef = useRef(0);
  const devPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDevSkip = () => {
    if (__DEV__) {
      devPressCountRef.current += 1;
      if (devPressTimeoutRef.current) clearTimeout(devPressTimeoutRef.current);
      devPressTimeoutRef.current = setTimeout(() => {
        devPressCountRef.current = 0;
      }, 600);

      if (devPressCountRef.current >= 3) {
        endTimeRef.current = Date.now() + 3000;
        setTimeLeft(3);
        devPressCountRef.current = 0;
      }
    }
  };

  // Format MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Page 6: Authenticated Backend Claim Flow
  const handleClaimPoints = async () => {
    if (isSubmitting || hasClaimed) return;

    setIsSubmitting(true);
    setClaimError(null);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setClaimError('Authorization token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Authenticated task completion API
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Encourage self-talk',
          taskId: 69,
          selected_affirmation: selectedAffirmation || '',
          encouragement_text: journalText || '',
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        throw new Error(data.error || 'Failed to award points. Please try again.');
      }

      setHasClaimed(true);
      await SecureStore.deleteItemAsync('self_talk_journal_draft').catch(() => {});

      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

      // Backend remains the single source of truth
      const pointsAwarded =
        data.pointsEarned ??
        data.pointsAdded ??
        data.points_earned ??
        data.points_rewarded ??
        300;
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '0';

      // Route to standard task success screen
      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsAwarded),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: 'Encourage Self-Talk',
          message: 'You gave yourself five minutes of encouragement and kindness.',
          difficulty: 'medium',
        },
      } as any);
    } catch (err: any) {
      console.error('Task claim error:', err);
      setClaimError(err?.message || 'Network request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Header Back Button Handler
  const handleHeaderBack = () => {
    if (currentPage === 1) {
      router.back();
    } else if (currentPage === 4 && isTimerActive && timeLeft > 0) {
      Alert.alert(
        'Exit Timer?',
        'Are you sure you want to stop your 5-minute self-talk session? Your progress will be lost.',
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'Stop & Exit',
            style: 'destructive',
            onPress: () => {
              setIsTimerActive(false);
              router.back();
            },
          },
        ]
      );
    } else {
      goToPage((currentPage - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  // Circular Progress Metrics
  const CIRCLE_SIZE = Math.min(width * 0.72, 260);
  const STROKE_WIDTH = 10;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* FULL-SCREEN PHOTO BACKGROUND (Edge to edge, cover, undistorted) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: bgBreathingAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/self-talk-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Subtle translucent gradient overlay for crisp text contrast */}
      <LinearGradient
        colors={
          currentPage === 1
            ? ['rgba(0, 0, 0, 0.12)', 'rgba(15, 10, 8, 0.28)', 'rgba(10, 6, 5, 0.65)']
            : ['rgba(15, 10, 8, 0.72)', 'rgba(25, 18, 14, 0.85)', 'rgba(15, 10, 8, 0.95)']
        }
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating light particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {AMBIENT_PARTICLES.map((p) => (
          <AmbientParticle key={p.id} {...p} />
        ))}
      </View>

      {/* FOREGROUND SAFE AREA */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Progress Indicator for Pages 2 to 6 */}
          {currentPage > 1 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>PAGE {currentPage} OF 6</Text>
              <View style={styles.progressTrack}>
                {[1, 2, 3, 4, 5, 6].map((stepNum) => (
                  <View
                    key={stepNum}
                    style={[
                      styles.progressDot,
                      stepNum <= currentPage && styles.progressDotActive,
                      stepNum === currentPage && styles.progressDotCurrent,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={{ width: 42 }} />
        </View>

        {/* MAIN PAGE CONTAINER WITH FADE & SLIDE TRANSITIONS */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {/* ================================================================= */}
          {/* PAGE 1 — INTRO                                                    */}
          {/* ================================================================= */}
          {currentPage === 1 && (
            <View style={styles.introContainer}>
              <View style={styles.introTopContent}>
                {/* Title */}
                <Animated.View
                  style={{
                    opacity: pageFadeAnim,
                    transform: [{ scale: heroPulseAnim }],
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.introTitle}>Encourage Self-Talk</Text>
                </Animated.View>

                {/* Subtitle Lines & Positive Explanation */}
                <View style={styles.subtitleContainer}>
                  <Text style={styles.introSubtitle}>Speak to yourself with kindness.</Text>
                  <Text style={styles.introSubtitleSecondary}>
                    Give yourself the encouragement you deserve.
                  </Text>
                  <Text style={styles.introDescription}>
                    How you speak to yourself shapes your strength and inner peace. Take five quiet minutes to give yourself the patience, care, and encouragement you deserve.
                  </Text>
                </View>

                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={14} color="#f59e0b" />
                    <Text style={[styles.badgeText, styles.textDuration]}>5 min</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDifficulty]}>
                    <Feather name="zap" size={14} color="#eab308" />
                    <Text style={[styles.badgeText, styles.textDifficulty]}>Medium</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeReward]}>
                    <Feather name="award" size={14} color="#fbbf24" />
                    <Text style={[styles.badgeText, styles.textReward]}>+300 Points</Text>
                  </View>
                </View>
              </View>

              {/* Start Now Button */}
              <View style={styles.introBottomArea}>
                <Animated.View
                  style={[
                    styles.startBtnWrap,
                    {
                      transform: [{ scale: buttonPulseAnim }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => {
                      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
                      goToPage(2);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#fb923c', '#ea580c']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.startBtnGradient}
                    >
                      <Text style={styles.startBtnText}>Start Now</Text>
                      <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 2 — CHOOSE YOUR AFFIRMATION                                  */}
          {/* ================================================================= */}
          {currentPage === 2 && (
            <View style={styles.pageInner}>
              <ScrollView
                contentContainerStyle={styles.affirmationsScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionTitle}>Choose Your Affirmation</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose the words you want to remind yourself of today.
                </Text>

                {/* 7 Affirmation Choices */}
                <View style={styles.affirmationsList}>
                  {AFFIRMATIONS.map((aff, index) => {
                    const isSelected = selectedAffirmation === aff.text;
                    const entranceAnim = cardEntranceAnims[index];

                    return (
                      <Animated.View
                        key={aff.id}
                        style={{
                          opacity: entranceAnim,
                          transform: [
                            {
                              translateY: entranceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [24, 0],
                              }),
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.affirmationCard,
                            isSelected && styles.affirmationCardSelected,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedAffirmation(aff.text);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.affirmationLeft}>
                            <View
                              style={[
                                styles.affIconWrap,
                                isSelected && styles.affIconWrapSelected,
                              ]}
                            >
                              <Text style={styles.affEmoji}>{aff.emoji}</Text>
                            </View>
                            <Text
                              style={[
                                styles.affirmationText,
                                isSelected && styles.affirmationTextSelected,
                              ]}
                            >
                              {aff.text}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected && <Feather name="check" size={14} color="#ffffff" />}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Continue Button */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    !selectedAffirmation && styles.continueBtnDisabled,
                  ]}
                  onPress={() => {
                    if (selectedAffirmation) {
                      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
                      goToPage(3);
                    }
                  }}
                  disabled={!selectedAffirmation}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      selectedAffirmation
                        ? ['#fb923c', '#ea580c']
                        : ['#374151', '#1f2937']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.continueBtnText}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 3 — WRITE TO YOURSELF (Min 150 Words)                        */}
          {/* ================================================================= */}
          {currentPage === 3 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={styles.writingScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionTitle}>Write to Yourself</Text>
                <Text style={styles.sectionSubtitle}>
                  Write something kind, encouraging, and honest to yourself.
                </Text>

                {/* Selected Affirmation Card */}
                {selectedAffirmation && (
                  <View style={styles.chosenAffirmationCard}>
                    <View style={styles.chosenAffirmationHeader}>
                      <Ionicons name="sparkles" size={14} color="#fb923c" />
                      <Text style={styles.chosenAffirmationLabel}>YOUR CHOSEN AFFIRMATION</Text>
                    </View>
                    <Text style={styles.chosenAffirmationText}>"{selectedAffirmation}"</Text>
                  </View>
                )}

                {/* Glass Journal Text Input */}
                <View
                  style={[
                    styles.journalBoxWrapper,
                    isInputFocused && styles.journalBoxWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.journalInput}
                    multiline
                    numberOfLines={8}
                    placeholder="Write a message to yourself..."
                    placeholderTextColor="#9ca3af"
                    value={journalText}
                    onChangeText={handleJournalTextChange}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    textAlignVertical="top"
                    autoFocus={false}
                  />

                  {/* Word Count Header & Bar */}
                  <View style={styles.wordCounterContainer}>
                    <View style={styles.wordCountRow}>
                      <Text
                        style={[
                          styles.wordCountText,
                          isWordCountMet && styles.wordCountTextComplete,
                        ]}
                      >
                        {wordCount} / {REQUIRED_WORD_COUNT} words
                      </Text>
                      {isWordCountMet ? (
                        <View style={styles.wordBadgeSuccess}>
                          <Feather name="check-circle" size={12} color="#10b981" />
                          <Text style={styles.wordBadgeSuccessText}>Requirement Met</Text>
                        </View>
                      ) : (
                        <Text style={styles.wordRemainingText}>
                          {REQUIRED_WORD_COUNT - wordCount} more words needed
                        </Text>
                      )}
                    </View>

                    {/* Progress Fill Bar */}
                    <View style={styles.wordProgressTrack}>
                      <View
                        style={[
                          styles.wordProgressFill,
                          {
                            width: `${Math.min(100, (wordCount / REQUIRED_WORD_COUNT) * 100)}%`,
                            backgroundColor: isWordCountMet ? '#10b981' : '#fb923c',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Start Timer Button (Gated strictly at 150+ actual words) */}
                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    !isWordCountMet && styles.continueBtnDisabled,
                    { marginTop: 24 },
                  ]}
                  onPress={() => {
                    if (isWordCountMet) {
                      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
                      goToPage(4);
                    }
                  }}
                  disabled={!isWordCountMet}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      isWordCountMet
                        ? ['#fb923c', '#ea580c']
                        : ['#374151', '#1f2937']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.continueBtnText}>Start Timer</Text>
                    <Feather name="clock" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>

                {!isWordCountMet && (
                  <Text style={styles.writingHelperText}>
                    Please write at least 150 words to unlock the 5-minute timer.
                  </Text>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* ================================================================= */}
          {/* PAGE 4 — REAL 5-MINUTE TIMER (05:00 → 00:00)                      */}
          {/* ================================================================= */}
          {currentPage === 4 && (
            <View style={styles.timerPageContainer}>
              {/* Selected Affirmation Highlight Banner */}
              <View style={styles.timerAffirmationBanner}>
                <Feather name="heart" size={16} color="#fb923c" style={{ marginRight: 8 }} />
                <Text style={styles.timerAffirmationTitle}>
                  "{selectedAffirmation || 'I am capable.'}"
                </Text>
              </View>

              {/* Circular SVG Timer */}
              <Animated.View
                style={[
                  styles.timerCircleWrap,
                  {
                    transform: [{ scale: timerPulseAnim }],
                  },
                ]}
              >
                <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                  <Defs>
                    <SvgGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#fb923c" />
                      <Stop offset="100%" stopColor="#f43f5e" />
                    </SvgGradient>
                  </Defs>

                  {/* Background Track */}
                  <Circle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={RADIUS}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                  />

                  {/* Animated Foreground Arc */}
                  <Circle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={RADIUS}
                    stroke="url(#timerGrad)"
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={
                      CIRCUMFERENCE * (1 - timeLeft / TASK_DURATION_SECONDS)
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                  />
                </Svg>

                {/* Inner Center Display */}
                <Pressable onPress={handleDevSkip} style={styles.timerCenterContent}>
                  <Text style={styles.timerCountdownDigits}>
                    {formatTimer(timeLeft)}
                  </Text>
                  <Text style={styles.timerStatusLabel}>
                    {isTimerPaused ? 'PAUSED' : 'BREATHE & LISTEN'}
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Cycling Encouraging Prompts */}
              <Animated.View style={[styles.timerQuoteBox, { opacity: quoteFadeAnim }]}>
                <Text style={styles.timerQuoteText}>
                  {TIMER_SUPPORTING_MESSAGES[supportingMsgIndex]}
                </Text>
              </Animated.View>

              {/* Pause / Resume Controls */}
              <View style={styles.timerControlsContainer}>
                <TouchableOpacity
                  style={[
                    styles.timerControlButton,
                    isTimerPaused ? styles.timerResumeBtn : styles.timerPauseBtn,
                  ]}
                  onPress={handleTogglePause}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isTimerPaused ? 'play' : 'pause'}
                    size={20}
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.timerControlText}>
                    {isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 5 — REFLECTION                                               */}
          {/* ================================================================= */}
          {currentPage === 5 && (
            <ScrollView
              contentContainerStyle={styles.reflectionScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Animated glowing heart visual */}
              <View style={styles.reflectionVisualWrap}>
                <Animated.View
                  style={[
                    styles.reflectionGlowRing,
                    {
                      transform: [{ scale: glowRingAnim }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.reflectionHeartCircle,
                    {
                      transform: [{ scale: heartScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#fb923c', '#ea580c']}
                    style={styles.reflectionHeartGradient}
                  >
                    <Ionicons name="heart" size={56} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              <Text style={styles.reflectionTitle}>You Deserve Your Own Encouragement</Text>
              <Text style={styles.reflectionSubtitle}>
                Take a moment to notice the words you chose for yourself.
              </Text>

              {/* Affirmation Feature Card */}
              <View style={styles.reflectionGlassCard}>
                <Text style={styles.reflectionCardLabel}>YOUR AFFIRMATION</Text>
                <Text style={styles.reflectionCardQuote}>
                  "{selectedAffirmation || 'I am capable.'}"
                </Text>
              </View>

              {/* User Note Excerpt Card */}
              {journalText.trim().length > 0 && (
                <View style={styles.userNoteGlassCard}>
                  <Text style={styles.userNoteCardLabel}>YOUR WORDS TO YOURSELF</Text>
                  <Text style={styles.userNoteText} numberOfLines={4}>
                    "{journalText.trim()}"
                  </Text>
                </View>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.continueBtn, { marginTop: 24 }]}
                onPress={() => {
                  Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
                  goToPage(6);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#fb923c', '#ea580c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.continueBtnText}>Continue</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ================================================================= */}
          {/* PAGE 6 — COMPLETION & 300 POINTS                                   */}
          {/* ================================================================= */}
          {currentPage === 6 && (
            <View style={styles.pageInner}>
              {/* Confetti Particles */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CONFETTI_PARTICLES.map((c) => (
                  <ConfettiPiece key={c.id} {...c} />
                ))}
              </View>

              <ScrollView
                contentContainerStyle={styles.finalScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Reward Hero Card */}
                <Animated.View
                  style={[
                    styles.rewardHeroCard,
                    {
                      opacity: rewardOpacityAnim,
                      transform: [{ scale: rewardScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(251, 146, 60, 0.25)', 'rgba(234, 88, 12, 0.08)']}
                    style={styles.rewardHeroGradient}
                  >
                    <View style={styles.trophyIconWrap}>
                      <Ionicons name="trophy" size={54} color="#fbbf24" />
                    </View>

                    <Text style={styles.finalTitle}>Self-Talk Complete</Text>
                    <Text style={styles.finalSubtitle}>
                      You gave yourself five minutes of encouragement and kindness.
                    </Text>

                    {/* Prominent Points Badge */}
                    <View style={styles.pointsBadgeWrap}>
                      <Feather name="award" size={24} color="#fbbf24" style={{ marginRight: 8 }} />
                      <Text style={styles.pointsBadgeText}>+300 Points</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* Error Banner with Retry if API fails */}
                {claimError && (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{claimError}</Text>
                  </View>
                )}

                {/* Claim 300 Points Button */}
                <TouchableOpacity
                  style={[
                    styles.claimBtn,
                    (isSubmitting || hasClaimed) && styles.claimBtnDisabled,
                  ]}
                  onPress={handleClaimPoints}
                  disabled={isSubmitting || hasClaimed}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#fb923c', '#ea580c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    {isSubmitting ? (
                      <View style={styles.claimingRow}>
                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                        <Text style={styles.claimBtnText}>Claiming 300 Points...</Text>
                      </View>
                    ) : (
                      <View style={styles.claimingRow}>
                        <Feather name="check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.claimBtnText}>Claim 300 Points</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {claimError && (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={handleClaimPoints}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={16} color="#fb923c" style={{ marginRight: 6 }} />
                    <Text style={styles.retryBtnText}>Retry Claim</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// =========================================================================
// AMBIENT FLOATING PARTICLE COMPONENT
// =========================================================================
function AmbientParticle({
  x,
  size,
  duration,
  delay,
}: {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}) {
  const translateY = useRef(new Animated.Value(height + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -30,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.5, duration: duration * 0.3, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(251, 146, 60, 0.45)',
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

// =========================================================================
// CONFETTI PIECE COMPONENT (PAGE 6)
// =========================================================================
function ConfettiPiece({
  x,
  color,
  size,
  delay,
  duration,
}: {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height * 0.7,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 140,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 600, delay: duration - 850, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 4, duration, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 4],
    outputRange: ['0deg', '1440deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size * 0.25,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    />
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#120c0a',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  progressDotActive: {
    backgroundColor: '#fb923c',
  },
  progressDotCurrent: {
    width: 22,
    backgroundColor: '#f97316',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  pageInner: {
    flex: 1,
  },

  // PAGE 1: INTRO
  introContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  introTopContent: {
    alignItems: 'center',
    paddingTop: 16,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  introSubtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fed7aa',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  introSubtitleSecondary: {
    fontSize: 15,
    color: '#f3f4f6',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  introDescription: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  badgeDuration: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    borderColor: 'rgba(234, 179, 8, 0.45)',
  },
  badgeReward: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textDuration: {
    color: '#fcd34d',
  },
  textDifficulty: {
    color: '#fde047',
  },
  textReward: {
    color: '#fef08a',
  },
  introBottomArea: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
  },
  startBtnWrap: {
    width: '100%',
    shadowColor: '#fb923c',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  startBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // PAGE 2: CHOOSE YOUR AFFIRMATION
  affirmationsScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  affirmationsList: {
    gap: 12,
  },
  affirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 20, 16, 0.72)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  affirmationCardSelected: {
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    borderColor: '#fb923c',
    shadowColor: '#fb923c',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  affirmationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  affIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  affIconWrapSelected: {
    backgroundColor: 'rgba(251, 146, 60, 0.25)',
  },
  affEmoji: {
    fontSize: 20,
  },
  affirmationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    flex: 1,
  },
  affirmationTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#fb923c',
    backgroundColor: '#fb923c',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
    backgroundColor: 'rgba(18, 12, 10, 0.85)',
  },
  continueBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#fb923c',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  continueBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // PAGE 3: WRITE TO YOURSELF
  writingScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  chosenAffirmationCard: {
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 146, 60, 0.35)',
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#fb923c',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chosenAffirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chosenAffirmationLabel: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  chosenAffirmationText: {
    color: '#fed7aa',
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  journalBoxWrapper: {
    backgroundColor: 'rgba(30, 20, 16, 0.72)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  journalBoxWrapperFocused: {
    borderColor: '#fb923c',
    backgroundColor: 'rgba(35, 22, 18, 0.85)',
    shadowColor: '#fb923c',
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  journalInput: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  wordCounterContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  wordCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fb923c',
  },
  wordCountTextComplete: {
    color: '#10b981',
  },
  wordBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  wordBadgeSuccessText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  wordRemainingText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  wordProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  wordProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  writingHelperText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },

  // PAGE 4: REAL 5-MINUTE TIMER
  timerPageContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  timerAffirmationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.35)',
  },
  timerAffirmationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fed7aa',
  },
  timerCircleWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCenterContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCountdownDigits: {
    fontSize: 52,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fb923c',
    letterSpacing: 2,
    marginTop: 6,
  },
  timerQuoteBox: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timerQuoteText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e5e7eb',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  timerControlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timerControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    borderWidth: 1.5,
  },
  timerPauseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerResumeBtn: {
    backgroundColor: 'rgba(251, 146, 60, 0.25)',
    borderColor: '#fb923c',
  },
  timerControlText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // PAGE 5: REFLECTION
  reflectionScroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  reflectionVisualWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  reflectionGlowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(251, 146, 60, 0.4)',
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
  },
  reflectionHeartCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    shadowColor: '#fb923c',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  reflectionHeartGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reflectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  reflectionSubtitle: {
    fontSize: 15,
    color: '#fed7aa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  reflectionGlassCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 20, 16, 0.72)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    marginBottom: 16,
    alignItems: 'center',
  },
  reflectionCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fb923c',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  reflectionCardQuote: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  userNoteGlassCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 20, 16, 0.6)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  userNoteCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  userNoteText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // PAGE 6: COMPLETION & 300 POINTS
  finalScroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  rewardHeroCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 146, 60, 0.4)',
    shadowColor: '#fb923c',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 24,
  },
  rewardHeroGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  trophyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  finalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  finalSubtitle: {
    fontSize: 15,
    color: '#fed7aa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  pointsBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
  },
  pointsBadgeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
    width: '100%',
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 14,
    flex: 1,
  },
  claimBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#fb923c',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  claimBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  claimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryBtnText: {
    color: '#fb923c',
    fontSize: 15,
    fontWeight: '600',
  },
});
