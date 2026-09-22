import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  ScrollView,
  AppState,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width } = Dimensions.get('window');

// 5 Minutes = 300 seconds
const TASK_DURATION_SECONDS = 300;

// Rotating mindfulness reminders during 5-minute timer
const HYDRATION_QUOTES = [
  'Feel the cool refreshment soothing your throat and settling your body.',
  'Hydration is an act of gentle self-care. It restores clarity and vitality.',
  'Notice how taking a slow pause eases mental fatigue and tension.',
  'Your body is grateful for every mindful sip you give it today.',
  'Breathe gently. Let this moment be about nourishment and calm.',
  'Clear water, clear mind. Savor the stillness of this pause.',
];

// Page 2: Water check options
const WATER_CHECK_OPTIONS = [
  { id: '1', label: 'Within the last hour', icon: 'check-circle', desc: 'Feeling well-hydrated' },
  { id: '2', label: 'A few hours ago', icon: 'clock', desc: 'Time for a fresh glass' },
  { id: '3', label: 'Not since earlier today', icon: 'alert-circle', desc: 'Body definitely needs water' },
  { id: '4', label: 'Feeling dehydrated right now', icon: 'droplet', desc: 'Ready for intentional replenishment' },
];

// Page 3: 4 Mindful Drinking Steps
const MINDFUL_STEPS = [
  {
    id: 1,
    title: 'Hold & Notice',
    instruction: 'Hold your glass with both hands. Notice its cool temperature, weight, and presence.',
    actionLabel: 'Noticed Temperature',
  },
  {
    id: 2,
    title: 'Observe & Breathe',
    instruction: 'Look into the clear water. Take one slow, grounding breath in and out.',
    actionLabel: 'Took Deep Breath',
  },
  {
    id: 3,
    title: 'Sip Slowly',
    instruction: 'Take a small, gentle sip. Let the water touch your lips and tongue without rushing.',
    actionLabel: 'Sipped Mindfully',
  },
  {
    id: 4,
    title: 'Feel & Swallow',
    instruction: 'Swallow attentively. Feel the cool sensation traveling down, calming your nervous system.',
    actionLabel: 'Completed Mindful Sip',
  },
];

// Page 5: Reflection Feelings
const REFLECTION_FEELINGS = [
  { id: 'refreshed', label: 'Refreshed', emoji: '💧' },
  { id: 'energized', label: 'More Energized', emoji: '⚡' },
  { id: 'calmer', label: 'Calmer & Centered', emoji: '🧘' },
  { id: 'clear', label: 'Cleared Mind', emoji: '🧠' },
  { id: 'grounded', label: 'Light & Grounded', emoji: '🌿' },
];

export default function MindfulHydrationScreen() {
  const router = useRouter();

  // Exactly 6 Pages
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Page 2: Water Check State
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [glassesToday, setGlassesToday] = useState<number>(3);

  // Page 3: Mindful Steps State
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Page 4: 5-Minute Timer State
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const endTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Page 5: Reflection State
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Page 6: Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animation values
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Background AppState sync for accurate timer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isTimerRunning && currentPage === 4) {
        if (endTimeRef.current > 0) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            setIsTimerRunning(false);
            Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    });
    return () => subscription.remove();
  }, [isTimerRunning, currentPage]);

  // Real Timer Countdown
  useEffect(() => {
    if (currentPage === 4 && isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setIsTimerRunning(false);
          Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentPage, isTimerRunning]);

  // Quote rotation on Page 4
  useEffect(() => {
    if (currentPage === 4 && isTimerRunning) {
      const qTimer = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % HYDRATION_QUOTES.length);
      }, 8000);
      return () => clearInterval(qTimer);
    }
  }, [currentPage, isTimerRunning]);

  // Gentle pulse loop for timer
  useEffect(() => {
    if (currentPage === 4 && isTimerRunning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [currentPage, isTimerRunning]);

  // Robust Page Transitions
  const goToPage = (nextPage: 1 | 2 | 3 | 4 | 5 | 6) => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    setCurrentPage(nextPage);
    pageFadeAnim.setValue(0.3);

    if (nextPage === 4 && !timerStarted) {
      setTimerStarted(true);
      setIsTimerRunning(true);
      endTimeRef.current = Date.now() + TASK_DURATION_SECONDS * 1000;
    }

    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // Header Back Button
  const handleHeaderBack = () => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    if (currentPage === 1) {
      router.back();
    } else {
      goToPage((currentPage - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  // Page 3: Toggle Mindful Steps
  const handleToggleStep = (stepId: number) => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const allStepsCompleted = MINDFUL_STEPS.every((s) => completedSteps.includes(s.id));

  // Page 4: Pause / Resume Timer
  const toggleTimerPause = () => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsTimerRunning(true);
    }
  };

  // Fast-forward shortcut in __DEV__ (triple tap)
  const devTapCount = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      devTapCount.current += 1;
      if (devTapCount.current >= 3) {
        endTimeRef.current = Date.now() + 2000;
        setTimeLeft(2);
        devTapCount.current = 0;
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG circular timer metrics
  const CIRCLE_SIZE = Math.min(width * 0.72, 260);
  const STROKE_WIDTH = 10;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressRatio = (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  // Page 5: Reflection validation
  const isReflectionComplete = selectedFeeling !== null && reflectionText.trim().length >= 8;

  // Page 6: Authenticated Completion
  const handleCompleteTask = async () => {
    if (isSubmitting || hasClaimed) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setErrorMessage('Authentication token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const selectedOption = WATER_CHECK_OPTIONS.find((o) => o.id === selectedCheckId);

      // Authenticated call to existing task completion system
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Mindful Hydration',
          taskId: 136,
          hydration_check: selectedOption?.label || 'Completed Hydration',
          reflection_emotion: selectedFeeling || 'Refreshed',
          reflection_sentence: reflectionText.trim(),
        }),
      });

      const responseText = await response.text();
      console.log(`[Mindful Hydration] POST /api/tasks/complete status: ${response.status}`);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Mindful Hydration JSON Parse Error] HTTP ${response.status}:`, responseText.slice(0, 300));
        throw new Error(
          response.status === 503
            ? 'Backend service is currently unavailable (HTTP 503). Please verify server is running.'
            : `Server returned non-JSON response (HTTP ${response.status}).`
        );
      }

      if (!response.ok && !data?.success) {
        throw new Error(data?.error || data?.message || `Task completion failed (HTTP ${response.status})`);
      }

      setHasClaimed(true);
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

      // Authoritative reward check (Medium difficulty = 300 points)
      const isDuplicate = data.rewardClaimed === false || (data.pointsEarned === 0 && data.points_earned === 0);
      const pointsAwarded = isDuplicate ? 0 : (
        data.pointsEarned ??
        data.pointsAdded ??
        data.points_earned ??
        data.points_rewarded ??
        300
      );
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '1';

      // Navigate through existing task-success screen
      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsAwarded),
          pointsAdded: String(pointsAwarded),
          pointsEarned: String(pointsAwarded),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: 'Mindful Hydration',
          difficulty: 'medium',
          message: 'You nourished your body and calmed your mind with mindful hydration.',
          rewardClaimed: isDuplicate ? 'false' : 'true',
        },
      } as any);
    } catch (err: any) {
      console.error('Mindful Hydration completion error:', err);
      setErrorMessage(err?.message || 'Network request failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Ocean Aesthetic Gradient */}
      <LinearGradient
        colors={['#081c2e', '#0b233a', '#061320']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Water Glow accents */}
      <View style={styles.waterGlowOrb} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Stepper Indicator */}
          <View style={styles.stepperContainer}>
            <Text style={styles.stepperText}>PAGE {currentPage} OF 6</Text>
            <View style={styles.stepperDotsRow}>
              {[1, 2, 3, 4, 5, 6].map((p) => (
                <View
                  key={p}
                  style={[
                    styles.stepperDot,
                    p <= currentPage && styles.stepperDotActive,
                    p === currentPage && styles.stepperDotCurrent,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={{ width: 42 }} />
        </View>

        {/* Content Container */}
        <Animated.View style={[styles.mainContent, { opacity: pageFadeAnim }]}>
          {/* ================================================================= */}
          {/* PAGE 1: INTRODUCTION                                              */}
          {/* ================================================================= */}
          {currentPage === 1 && (
            <View style={styles.pageFlexContainer}>
              <ScrollView
                contentContainerStyle={styles.introScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Icon */}
                <View style={styles.heroWaterIconWrap}>
                  <MaterialCommunityIcons name="water-check" size={54} color="#38bdf8" />
                </View>

                <Text style={styles.introTitle}>Mindful Hydration</Text>
                <Text style={styles.introSubtitle}>
                  Drink with presence. Reconnect with your body.
                </Text>

                {/* Badges */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#38bdf8" />
                    <Text style={[styles.badgeText, { color: '#7dd3fc' }]}>5 min</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDifficulty]}>
                    <Feather name="zap" size={13} color="#f59e0b" />
                    <Text style={[styles.badgeText, { color: '#fcd34d' }]}>Medium</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#34d399" />
                    <Text style={[styles.badgeText, { color: '#6ee7b7' }]}>+300 Points</Text>
                  </View>
                </View>

                {/* Educational Card */}
                <View style={styles.cardContainer}>
                  <Text style={styles.cardHeading}>Why Mindful Hydration Matters</Text>
                  <Text style={styles.cardBody}>
                    In the rush of digital distractions, we often ignore our body's simplest cry: thirst.
                    When we do drink, we gulp water while staring at screens without truly tasting or feeling it.
                  </Text>
                  <Text style={[styles.cardBody, { marginTop: 10 }]}>
                    Mindful hydration turns a daily necessity into a restorative pause. By sipping with awareness, you calm your nervous system, reset your attention, and nourish every cell in your body.
                  </Text>
                </View>

                {/* 4 Steps Overview */}
                <View style={styles.overviewList}>
                  <View style={styles.overviewItem}>
                    <View style={styles.stepNumPill}><Text style={styles.stepNumText}>1</Text></View>
                    <Text style={styles.overviewItemText}>Assess your daily water balance</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <View style={styles.stepNumPill}><Text style={styles.stepNumText}>2</Text></View>
                    <Text style={styles.overviewItemText}>Guided 4-step mindful sip practice</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <View style={styles.stepNumPill}><Text style={styles.stepNumText}>3</Text></View>
                    <Text style={styles.overviewItemText}>5-minute calm hydration focus timer</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <View style={styles.stepNumPill}><Text style={styles.stepNumText}>4</Text></View>
                    <Text style={styles.overviewItemText}>Body reflection & +300 points reward</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Continue Button */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => goToPage(2)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#0284c7', '#0369a1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.primaryBtnText}>Begin Practice</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 2: WATER CHECK                                               */}
          {/* ================================================================= */}
          {currentPage === 2 && (
            <View style={styles.pageFlexContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionHeaderTitle}>Hydration Check</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Tune into your physical state. When did you last drink a full glass of water?
                </Text>

                {/* Option Cards */}
                <View style={{ width: '100%', gap: 12, marginBottom: 24 }}>
                  {WATER_CHECK_OPTIONS.map((opt) => {
                    const isSelected = selectedCheckId === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.checkOptionCard,
                          isSelected && styles.checkOptionCardSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCheckId(opt.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.checkCardLeft}>
                          <View
                            style={[
                              styles.checkIconWrap,
                              isSelected && styles.checkIconWrapSelected,
                            ]}
                          >
                            <Feather
                              name={opt.icon as any}
                              size={20}
                              color={isSelected ? '#38bdf8' : '#94a3b8'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.checkOptionTitle,
                                isSelected && styles.checkOptionTitleSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <Text style={styles.checkOptionDesc}>{opt.desc}</Text>
                          </View>
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
                    );
                  })}
                </View>

                {/* Daily Glasses Counter */}
                <View style={styles.counterBox}>
                  <Text style={styles.counterHeading}>Glasses of water drank today:</Text>
                  <View style={styles.counterControlsRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => {
                        Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                        setGlassesToday((g) => Math.max(0, g - 1));
                      }}
                      activeOpacity={0.75}
                    >
                      <Feather name="minus" size={20} color="#ffffff" />
                    </TouchableOpacity>

                    <View style={styles.counterValueWrap}>
                      <Text style={styles.counterValueText}>{glassesToday}</Text>
                      <Text style={styles.counterValueSub}>glasses (~{glassesToday * 250} ml)</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => {
                        Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                        setGlassesToday((g) => g + 1);
                      }}
                      activeOpacity={0.75}
                    >
                      <Feather name="plus" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* Continue Button: Requires selecting an option */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    !selectedCheckId && styles.primaryBtnDisabled,
                  ]}
                  onPress={() => {
                    if (selectedCheckId) {
                      goToPage(3);
                    }
                  }}
                  disabled={!selectedCheckId}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      selectedCheckId
                        ? ['#0284c7', '#0369a1']
                        : ['#334155', '#1e293b']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.primaryBtnText}>
                      {selectedCheckId ? 'Continue to Guided Sip' : 'Select Water Status First'}
                    </Text>
                    {selectedCheckId && (
                      <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 3: MINDFUL DRINKING GUIDED ACTIVITY                          */}
          {/* ================================================================= */}
          {currentPage === 3 && (
            <View style={styles.pageFlexContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionHeaderTitle}>Guided Mindful Sip</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Grab a glass or bottle of water. Actively complete all 4 mindful steps.
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressBarWrapper}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${(completedSteps.length / MINDFUL_STEPS.length) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressStatusText}>
                    {completedSteps.length} of {MINDFUL_STEPS.length} Steps Completed
                  </Text>
                </View>

                {/* Mindful Steps Checklist */}
                <View style={{ width: '100%', gap: 12 }}>
                  {MINDFUL_STEPS.map((step) => {
                    const isDone = completedSteps.includes(step.id);
                    return (
                      <TouchableOpacity
                        key={step.id}
                        style={[
                          styles.stepCard,
                          isDone && styles.stepCardDone,
                        ]}
                        onPress={() => handleToggleStep(step.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.stepCardTop}>
                          <View style={[styles.stepNumberBadge, isDone && styles.stepNumberBadgeDone]}>
                            {isDone ? (
                              <Feather name="check" size={14} color="#ffffff" />
                            ) : (
                              <Text style={styles.stepNumberText}>{step.id}</Text>
                            )}
                          </View>
                          <Text style={[styles.stepCardTitle, isDone && styles.stepCardTitleDone]}>
                            {step.title}
                          </Text>
                        </View>

                        <Text style={styles.stepCardInstruction}>{step.instruction}</Text>

                        <View style={styles.stepActionRow}>
                          <View
                            style={[
                              styles.stepPillBtn,
                              isDone && styles.stepPillBtnDone,
                            ]}
                          >
                            <Feather
                              name={isDone ? 'check-circle' : 'circle'}
                              size={15}
                              color={isDone ? '#34d399' : '#38bdf8'}
                              style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.stepPillText, isDone && styles.stepPillTextDone]}>
                              {isDone ? 'Step Completed' : step.actionLabel}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Continue Button: Requires all 4 steps completed */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    !allStepsCompleted && styles.primaryBtnDisabled,
                  ]}
                  onPress={() => {
                    if (allStepsCompleted) {
                      goToPage(4);
                    }
                  }}
                  disabled={!allStepsCompleted}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      allStepsCompleted
                        ? ['#0284c7', '#0369a1']
                        : ['#334155', '#1e293b']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.primaryBtnText}>
                      {allStepsCompleted ? 'Continue to 5-Min Pause' : `Complete All 4 Steps (${completedSteps.length}/4)`}
                    </Text>
                    {allStepsCompleted && (
                      <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 4: 5-MINUTE COUNTDOWN TIMER                                  */}
          {/* ================================================================= */}
          {currentPage === 4 && (
            <View style={styles.pageFlexContainer}>
              <ScrollView
                contentContainerStyle={styles.timerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionHeaderTitle}>5-Minute Hydration Pause</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Sit quietly. Take slow sips as needed and allow calm focus to settle in.
                </Text>

                {/* Circular SVG Timer */}
                <Animated.View
                  style={[
                    styles.timerCircleOuter,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                    <Defs>
                      <SvgGradient id="waterTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#38bdf8" />
                        <Stop offset="100%" stopColor="#0284c7" />
                      </SvgGradient>
                    </Defs>

                    {/* Track */}
                    <Circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={RADIUS}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth={STROKE_WIDTH}
                      fill="transparent"
                    />

                    {/* Animated foreground ring */}
                    <Circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={RADIUS}
                      stroke="url(#waterTimerGrad)"
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                    />
                  </Svg>

                  {/* Inner Digits Display */}
                  <Pressable onPress={handleDevSkip} style={styles.timerCenterContent}>
                    <Text style={styles.timerDigitDisplay}>
                      {formatTimer(timeLeft)}
                    </Text>
                    <Text style={styles.timerStatusLabel}>
                      {timeLeft === 0
                        ? 'PAUSE COMPLETED 💧'
                        : isTimerRunning
                        ? 'REST & HYDRATE'
                        : 'TIMER PAUSED'}
                    </Text>
                  </Pressable>
                </Animated.View>

                {/* Rotating Hydration Quotes */}
                <View style={styles.quoteBox}>
                  <MaterialCommunityIcons name="water" size={20} color="#38bdf8" style={{ marginBottom: 6 }} />
                  <Text style={styles.quoteText}>
                    "{HYDRATION_QUOTES[quoteIndex]}"
                  </Text>
                </View>

                {/* Pause / Resume button */}
                {timeLeft > 0 && (
                  <TouchableOpacity
                    style={styles.timerToggleBtn}
                    onPress={toggleTimerPause}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={isTimerRunning ? 'pause' : 'play'}
                      size={20}
                      color="#ffffff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.timerToggleText}>
                      {isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Completed Banner */}
                {timeLeft === 0 && (
                  <View style={styles.timerCompletedBanner}>
                    <Feather name="check-circle" size={24} color="#34d399" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timerCompletedHeading}>5 Minutes Finished!</Text>
                      <Text style={styles.timerCompletedSub}>
                        You hydrated with full mindfulness. Proceed to your reflection.
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Continue Button: Locked until timer reaches 0:00 */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    timeLeft > 0 && styles.primaryBtnDisabled,
                  ]}
                  onPress={() => {
                    if (timeLeft === 0) {
                      goToPage(5);
                    }
                  }}
                  disabled={timeLeft > 0}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      timeLeft === 0
                        ? ['#0284c7', '#0369a1']
                        : ['#334155', '#1e293b']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {timeLeft > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="lock" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>
                          Timer Running ({formatTimer(timeLeft)})
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Continue to Reflection</Text>
                        <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 5: REFLECTION                                                */}
          {/* ================================================================= */}
          {currentPage === 5 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.pageFlexContainer}>
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.sectionHeaderTitle}>Mindful Reflection</Text>
                  <Text style={styles.sectionHeaderSubtitle}>
                    Notice the shift in your energy and clarity after drinking with awareness.
                  </Text>

                  {/* Feeling Chips Selection */}
                  <Text style={styles.fieldLabel}>How does your body feel now?</Text>
                  <View style={styles.chipsRow}>
                    {REFLECTION_FEELINGS.map((f) => {
                      const isSelected = selectedFeeling === f.label;
                      return (
                        <TouchableOpacity
                          key={f.id}
                          style={[
                            styles.chipBtn,
                            isSelected && styles.chipBtnSelected,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedFeeling(f.label);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={{ fontSize: 18, marginRight: 6 }}>{f.emoji}</Text>
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Reflection Text Input */}
                  <Text style={[styles.fieldLabel, { marginTop: 22 }]}>
                    What did you notice during this hydration pause?
                  </Text>
                  <View style={styles.reflectionInputWrapper}>
                    <TextInput
                      style={styles.reflectionInput}
                      placeholder="e.g., I realized how thirsty I was. Taking slow sips made me feel instantly more alert and calm..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={reflectionText}
                      onChangeText={setReflectionText}
                      textAlignVertical="top"
                    />
                  </View>
                </ScrollView>

                {/* Continue Button: Requires feeling and reflection text */}
                <View style={styles.bottomBar}>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !isReflectionComplete && styles.primaryBtnDisabled,
                    ]}
                    onPress={() => {
                      if (isReflectionComplete) {
                        goToPage(6);
                      }
                    }}
                    disabled={!isReflectionComplete}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        isReflectionComplete
                          ? ['#0284c7', '#0369a1']
                          : ['#334155', '#1e293b']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={styles.primaryBtnText}>
                        {isReflectionComplete ? 'Proceed to Completion' : 'Select Feeling & Add Note'}
                      </Text>
                      {isReflectionComplete && (
                        <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* ================================================================= */}
          {/* PAGE 6: COMPLETION (+300 POINTS)                                  */}
          {/* ================================================================= */}
          {currentPage === 6 && (
            <View style={styles.pageFlexContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Reward Card */}
                <View style={styles.rewardHeroCard}>
                  <LinearGradient
                    colors={['rgba(56, 189, 248, 0.25)', 'rgba(2, 132, 199, 0.1)']}
                    style={styles.rewardHeroGradient}
                  >
                    <View style={styles.trophyCircle}>
                      <MaterialCommunityIcons name="water-check" size={56} color="#38bdf8" />
                    </View>

                    <Text style={styles.completionTitle}>Hydration Complete!</Text>
                    <Text style={styles.completionSubtitle}>
                      You refreshed your mind and body with 5 minutes of mindful hydration.
                    </Text>

                    {/* Prominent 300 Points Badge */}
                    <View style={styles.pointsRewardBadge}>
                      <Feather name="award" size={24} color="#34d399" style={{ marginRight: 8 }} />
                      <Text style={styles.pointsRewardText}>+300 Points</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Session Recap */}
                <View style={styles.recapCard}>
                  <Text style={styles.recapHeading}>SESSION SUMMARY</Text>

                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Initial Check:</Text>
                    <Text style={styles.recapValue}>
                      {WATER_CHECK_OPTIONS.find((o) => o.id === selectedCheckId)?.label || 'Completed'}
                    </Text>
                  </View>

                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Mindful Sips:</Text>
                    <Text style={styles.recapValue}>4 of 4 Steps Completed</Text>
                  </View>

                  <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Focused Pause:</Text>
                    <Text style={styles.recapValue}>5 minutes</Text>
                  </View>

                  {selectedFeeling && (
                    <View style={styles.recapRow}>
                      <Text style={styles.recapLabel}>Feeling After:</Text>
                      <Text style={styles.recapValue}>{selectedFeeling}</Text>
                    </View>
                  )}
                </View>

                {/* Error Banner */}
                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Claim Points Button */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (isSubmitting || hasClaimed) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleCompleteTask}
                  disabled={isSubmitting || hasClaimed}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#0284c7', '#0369a1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {isSubmitting ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                        <Text style={styles.primaryBtnText}>Claiming 300 Points...</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>Claim 300 Points</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {errorMessage && (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={handleCompleteTask}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={15} color="#38bdf8" style={{ marginRight: 6 }} />
                    <Text style={styles.retryBtnText}>Retry Completion</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061320',
  },
  waterGlowOrb: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
    width: '100%',
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
  stepperContainer: {
    alignItems: 'center',
  },
  stepperText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  stepperDotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepperDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  stepperDotActive: {
    backgroundColor: '#38bdf8',
  },
  stepperDotCurrent: {
    width: 22,
    backgroundColor: '#0284c7',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    zIndex: 10,
  },
  pageFlexContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // PAGE 1: INTRO
  introScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroWaterIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#7dd3fc',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  badgeDuration: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  badgeReward: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: 'rgba(15, 34, 56, 0.75)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 21,
  },
  overviewList: {
    width: '100%',
    gap: 10,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 34, 56, 0.55)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepNumPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  overviewItemText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },

  // COMMON SECTION HEADERS
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },

  // PAGE 2: WATER CHECK
  checkOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 34, 56, 0.7)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkOptionCardSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  checkCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  checkIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkIconWrapSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  checkOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  checkOptionTitleSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  checkOptionDesc: {
    fontSize: 12,
    color: '#94a3b8',
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
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
  },
  counterBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 34, 56, 0.65)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
  },
  counterHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7dd3fc',
    marginBottom: 14,
  },
  counterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValueWrap: {
    alignItems: 'center',
    minWidth: 100,
  },
  counterValueText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  counterValueSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  // PAGE 3: MINDFUL DRINKING
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  progressStatusText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  stepCard: {
    backgroundColor: 'rgba(15, 34, 56, 0.72)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepCardDone: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  stepCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberBadgeDone: {
    backgroundColor: '#34d399',
  },
  stepNumberText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepCardTitleDone: {
    color: '#7dd3fc',
  },
  stepCardInstruction: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stepPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  stepPillBtnDone: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34d399',
  },
  stepPillText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  stepPillTextDone: {
    color: '#34d399',
    fontWeight: '700',
  },

  // PAGE 4: TIMER
  timerScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  timerCircleOuter: {
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigitDisplay: {
    fontSize: 50,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  timerStatusLabel: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  quoteBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 34, 56, 0.75)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    marginBottom: 18,
  },
  quoteText: {
    color: '#e2e8f0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  timerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerToggleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  timerCompletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    width: '100%',
    marginTop: 10,
  },
  timerCompletedHeading: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timerCompletedSub: {
    color: '#d1fae5',
    fontSize: 13,
    lineHeight: 18,
  },

  // PAGE 5: REFLECTION
  fieldLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipBtnSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderColor: '#38bdf8',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  reflectionInputWrapper: {
    width: '100%',
    backgroundColor: 'rgba(15, 34, 56, 0.8)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    minHeight: 140,
  },
  reflectionInput: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
  },

  // PAGE 6: COMPLETION
  rewardHeroCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginBottom: 18,
  },
  rewardHeroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#7dd3fc',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  pointsRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.22)',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#34d399',
  },
  pointsRewardText: {
    color: '#34d399',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recapCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 34, 56, 0.75)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  recapHeading: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  recapLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  recapValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'right',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    width: '100%',
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },

  // BOTTOM BAR
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(6, 19, 32, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#0284c7',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
