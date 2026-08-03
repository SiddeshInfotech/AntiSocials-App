import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 1200; // 20 minutes in seconds

export default function EatMealTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Steps:
  // 1: Introduction / Details
  // 2: Preparation Checklist (phone away, prepare meal, water nearby)
  // 3: Mindful Eating Guide (5 step cards)
  // 4: 20-Minute Meal Timer
  // 5: Success Completion Screen
  const [step, setStep] = useState(1);

  // Preparation check states
  const [phoneAway, setPhoneAway] = useState(false);
  const [prepMeal, setPrepMeal] = useState(false);
  const [waterNearby, setWaterNearby] = useState(false);

  // Eating guide states
  const [guideIndex, setGuideIndex] = useState(0);
  const guideCards = [
    { icon: '👃', label: 'Aroma', text: 'Take a moment to smell your food.' },
    { icon: '👀', label: 'Appearance', text: 'Look carefully at the colors and textures.' },
    { icon: '😋', label: 'First Bite', text: 'Take your first bite slowly.' },
    { icon: '🧘', label: 'Chewing', text: 'Chew slowly and enjoy every bite.' },
    { icon: '🙏', label: 'Presence', text: 'Stay with your meal—not your screen.' },
  ];

  // Timer states
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rotating timer reminders
  const reminders = [
    '🍽️ "Enjoy the next bite."',
    '💧 "Take a sip of water."',
    '🌿 "Notice the flavors."',
    '😊 "Stay present."',
    '🥣 "No phone. Just this moment."'
  ];
  const [reminderIndex, setReminderIndex] = useState(0);

  // Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const floatMascotAnim = useRef(new Animated.Value(0)).current;
  const scaleMascotAnim = useRef(new Animated.Value(1)).current;
  const bgBreathingAnim = useRef(new Animated.Value(1)).current;
  const reminderFadeAnim = useRef(new Animated.Value(1)).current;
  const timerCircleBreathe = useRef(new Animated.Value(0.7)).current;

  // Staggered Checklist bouncing values
  const check1Scale = useRef(new Animated.Value(1)).current;
  const check2Scale = useRef(new Animated.Value(1)).current;
  const check3Scale = useRef(new Animated.Value(1)).current;

  // Eating guide slide values
  const guideCardScale = useRef(new Animated.Value(1)).current;
  const guideCardTranslateX = useRef(new Animated.Value(0)).current;

  // Soft rising steam particle values (x, y, opacity)
  const steam1X = useRef(new Animated.Value(width * 0.35)).current;
  const steam1Y = useRef(new Animated.Value(height * 0.55)).current;
  const steam1Op = useRef(new Animated.Value(0)).current;

  const steam2X = useRef(new Animated.Value(width * 0.55)).current;
  const steam2Y = useRef(new Animated.Value(height * 0.55)).current;
  const steam2Op = useRef(new Animated.Value(0)).current;

  const steam3X = useRef(new Animated.Value(width * 0.45)).current;
  const steam3Y = useRef(new Animated.Value(height * 0.65)).current;
  const steam3Op = useRef(new Animated.Value(0)).current;

  // Background AppState Recovery Tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Sync background timer updates on resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 4 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            transitionToStep(5);
            setIsActive(false);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [step, isActive, isPaused]);

  // General animation loops setup
  useEffect(() => {
    // Background breathing scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgBreathingAnim, { toValue: 1.04, duration: 7500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgBreathingAnim, { toValue: 1, duration: 7500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Floating mascot animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatMascotAnim, { toValue: -8, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatMascotAnim, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Mascot scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleMascotAnim, { toValue: 1.04, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleMascotAnim, { toValue: 0.96, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer glow breath pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerCircleBreathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerCircleBreathe, { toValue: 0.65, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Steam Rising Loops
    const riseSteam = (x: Animated.Value, y: Animated.Value, op: Animated.Value, startLeft: number) => {
      y.setValue(height * 0.62);
      x.setValue(startLeft + (Math.random() - 0.5) * 40);
      op.setValue(0);

      Animated.sequence([
        Animated.delay(Math.random() * 2000),
        Animated.parallel([
          Animated.timing(y, { toValue: height * 0.2, duration: 7000 + Math.random() * 3000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0.45, duration: 1500, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(4500),
            Animated.timing(op, { toValue: 0, duration: 2000, useNativeDriver: true })
          ]),
          Animated.timing(x, { toValue: startLeft + (Math.random() - 0.5) * 100, duration: 8000, useNativeDriver: true })
        ])
      ]).start(() => riseSteam(x, y, op, startLeft));
    };

    riseSteam(steam1X, steam1Y, steam1Op, width * 0.35);
    riseSteam(steam2X, steam2Y, steam2Op, width * 0.55);
    riseSteam(steam3X, steam3Y, steam3Op, width * 0.45);
  }, []);

  // Timer countdown ticks
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 4 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(5);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // Mindful eating reminders rotation (Dev: 10s, Prod: 180s)
  useEffect(() => {
    let reminderTimer: ReturnType<typeof setInterval>;
    if (step === 4 && isActive && !isPaused) {
      const intervalMs = __DEV__ ? 10000 : 180000;
      reminderTimer = setInterval(() => {
        Animated.timing(reminderFadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          setReminderIndex((prev) => (prev + 1) % reminders.length);
          Animated.timing(reminderFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        });
      }, intervalMs);
    }
    return () => {
      if (reminderTimer) clearInterval(reminderTimer);
    };
  }, [step, isActive, isPaused]);

  // Transition handler
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  };

  // API Call: Start Task
  const handleStartTask = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Eat One Meal Without Phone' })
        });
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
    transitionToStep(2);
  };

  // API Call: Save Preparation Checklist
  const handleToggleChecklist = async (index: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let c1 = phoneAway;
    let c2 = prepMeal;
    let c3 = waterNearby;

    if (index === 1) {
      c1 = !phoneAway;
      setPhoneAway(c1);
      Animated.sequence([
        Animated.timing(check1Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(check1Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    } else if (index === 2) {
      c2 = !prepMeal;
      setPrepMeal(c2);
      Animated.sequence([
        Animated.timing(check2Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(check2Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    } else {
      c3 = !waterNearby;
      setWaterNearby(c3);
      Animated.sequence([
        Animated.timing(check3Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(check3Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    }

    const allChecked = c1 && c2 && c3;

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-eat-prep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Eat One Meal Without Phone',
            prep_completed: allChecked
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Go to step 3 guide
  const handleChecklistContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(3);
  };

  // Staggered Slide guides transitions
  const handleNextGuide = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (guideIndex < guideCards.length - 1) {
      // Slide left card transition
      Animated.sequence([
        Animated.timing(guideCardTranslateX, { toValue: -width, duration: 250, useNativeDriver: true }),
        Animated.timing(guideCardScale, { toValue: 0.9, duration: 0, useNativeDriver: true }),
        Animated.timing(guideCardTranslateX, { toValue: width, duration: 0, useNativeDriver: true }),
      ]).start(() => {
        setGuideIndex((prev) => prev + 1);
        Animated.parallel([
          Animated.timing(guideCardTranslateX, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.spring(guideCardScale, { toValue: 1, friction: 4, useNativeDriver: true })
        ]).start();
      });
    } else {
      // Finished all cards, call backend progress
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await fetch(`${API_BASE_URL}/api/tasks/save-eat-guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              task_name: 'Eat One Meal Without Phone',
              prep_completed: true,
              guide_completed: true
            })
          });
        }
      } catch (e) {
        console.error(e);
      }
      transitionToStep(4);
      setIsActive(true);
    }
  };

  // API Call: complete task and claim points
  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '200', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Eat One Meal Without Phone',
            prep_completed: true,
            guide_completed: true
          })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '200',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0'
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('Error', data.error || 'Failed to submit task completion');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }

    // Redirect to success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You stayed present.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev double tap skip
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const allPrepChecked = phoneAway && prepMeal && waterNearby;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Breathing Dining warm background (LinearGradients) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: bgBreathingAnim }] }]}>
        <LinearGradient
          colors={['#FFF8F2', '#FFF5EB', '#FFF2E1']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Steam particle decoration layer (Only during Step 4: Timer) */}
      {step === 4 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Animated.View style={[styles.steamParticle, { transform: [{ translateX: steam1X }, { translateY: steam1Y }], opacity: steam1Op }]} />
          <Animated.View style={[styles.steamParticle, { transform: [{ translateX: steam2X }, { translateY: steam2Y }], opacity: steam2Op }, { width: 14, height: 14, borderRadius: 7 }]} />
          <Animated.View style={[styles.steamParticle, { transform: [{ translateX: steam3X }, { translateY: steam3Y }], opacity: steam3Op }, { width: 10, height: 10, borderRadius: 5 }]} />
        </View>
      )}

      {/* Vignette Overlay */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Abort Meal?",
                "Are you sure you want to stop? Your progress will be lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Abort", style: "destructive", onPress: () => router.back() }
                ]
              );
            }}
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={18} color="#EA580C" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 4 && isActive && !isPaused && { backgroundColor: '#EA580C', shadowColor: '#EA580C' }]} />
            <Text style={styles.statusText}>
              {step === 4 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `MEAL.STEP_${step}`}
            </Text>
          </View>
        </View>

        {/* Slide Step content container */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>

          {/* STEP 1: Details Greet Page */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.mainEmoji}>🥣</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Eat One Meal Without Phone</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(234, 88, 12, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#EA580C' }]}>+200 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#4F46E5' }]}>20 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "The best meals are enjoyed with your attention, not your phone."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "Your meal deserves your full attention."
                </Text>
                <Text style={styles.cardDescription}>
                  For this meal, keep your phone completely away. Focus only on your food and the present moment—reconnect with taste, aroma, chewing, and hunger.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Begin Mindful Meal</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Prep Checklist */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Let's set the table</Text>
              <Text style={styles.stepSubtitle}>
                Create a calm, distraction-free environment to prepare yourself for mindful eating.
              </Text>

              <View style={styles.checklistContainer}>
                {/* Item 1 */}
                <Animated.View style={[styles.checklistCard, phoneAway && styles.checklistCardCompleted, { transform: [{ scale: check1Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, phoneAway && styles.checklistLabelCompleted]}>Put your phone away</Text>
                    <Text style={styles.checklistSublabel}>Place your device in another room or out of arm's reach</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, phoneAway && styles.checkboxCompleted]}
                    onPress={() => handleToggleChecklist(1)}
                    activeOpacity={0.7}
                  >
                    {phoneAway ? (
                      <Ionicons name="checkmark-circle" size={32} color="#EA580C" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Item 2 */}
                <Animated.View style={[styles.checklistCard, prepMeal && styles.checklistCardCompleted, { transform: [{ scale: check2Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, prepMeal && styles.checklistLabelCompleted]}>Prepare your meal</Text>
                    <Text style={styles.checklistSublabel}>Plate your food nicely and sit down comfortably</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, prepMeal && styles.checkboxCompleted]}
                    onPress={() => handleToggleChecklist(2)}
                    activeOpacity={0.7}
                  >
                    {prepMeal ? (
                      <Ionicons name="checkmark-circle" size={32} color="#EA580C" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Item 3 */}
                <Animated.View style={[styles.checklistCard, waterNearby && styles.checklistCardCompleted, { transform: [{ scale: check3Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, waterNearby && styles.checklistLabelCompleted]}>Keep a glass of water nearby</Text>
                    <Text style={styles.checklistSublabel}>Pour water to cleanse your palate and slow down</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, waterNearby && styles.checkboxCompleted]}
                    onPress={() => handleToggleChecklist(3)}
                    activeOpacity={0.7}
                  >
                    {waterNearby ? (
                      <Ionicons name="checkmark-circle" size={32} color="#EA580C" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 'auto' }, !allPrepChecked && styles.disabledBtn]}
                disabled={!allPrepChecked}
                onPress={handleChecklistContinue}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={!allPrepChecked ? ['#CBD5E1', '#94A3B8'] : ['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Continue</Text>
                  <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Mindful Eating Card Slides */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Mindful eating cards</Text>
              <Text style={styles.stepSubtitle}>
                Follow these five simple steps before starting your distraction-free meal.
              </Text>

              {/* Staggered animated card slides */}
              <Animated.View style={[
                styles.guideCard,
                { transform: [{ translateX: guideCardTranslateX }, { scale: guideCardScale }] }
              ]}>
                <View style={styles.guideIconContainer}>
                  <Text style={styles.guideIcon}>{guideCards[guideIndex].icon}</Text>
                </View>
                <Text style={styles.guideLabel}>{guideCards[guideIndex].label}</Text>
                <Text style={styles.guideText}>{guideCards[guideIndex].text}</Text>
              </Animated.View>

              {/* Page dots indicator */}
              <View style={styles.dotsRow}>
                {guideCards.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.dotItem, idx === guideIndex && styles.dotItemActive]}
                  />
                ))}
              </View>

              {/* Custom finish guide overlay */}
              {guideIndex === guideCards.length - 1 && (
                <Text style={styles.successMessageLabel}>
                  "You're ready for a distraction-free meal."
                </Text>
              )}

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 'auto' }]} onPress={handleNextGuide} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>
                    {guideIndex === guideCards.length - 1 ? 'Start Eating' : 'Next Step'}
                  </Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: 20-Minute Meal Timer */}
          {step === 4 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerMascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.timerLargeEmoji}>🥣</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerTextDisplay, { opacity: timerCircleBreathe }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Animated.View style={[styles.reminderCard, { opacity: reminderFadeAnim }]}>
                <Text style={styles.reminderText}>
                  {reminders[reminderIndex]}
                </Text>
              </Animated.View>

              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.controlBtnText, isPaused && { color: '#FFFFFF' }]}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5: Claim Reward completion slide */}
          {step === 5 && (
            <View style={styles.successContainer}>
              <Text style={styles.successLargeEmoji}>🥣</Text>
              <Text style={styles.successHeading}>You stayed present.</Text>
              <Text style={styles.successContext}>
                Eating without screen distractions helps reduce overeating, improves digestion, and turns a simple daily routine into a grounding mindful ceremony.
              </Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? "Saving response..." : "Claim +200 Task Points"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    backgroundColor: '#FFF8F2',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(234, 88, 12, 0.01)',
  },
  steamParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(234,88,12,0.15)',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C2D12',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  mascotCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  mainEmoji: {
    fontSize: 70,
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediumBadge: {
    backgroundColor: '#FEF08A',
  },
  mediumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#7C2D12',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    marginVertical: 14,
  },
  illustrationText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  checklistContainer: {
    width: '100%',
    gap: 16,
  },
  checklistCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  checklistCardCompleted: {
    backgroundColor: '#FFF2E1',
    borderColor: 'rgba(234, 88, 12, 0.15)',
  },
  checklistTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  checklistLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  checklistLabelCompleted: {
    color: '#C2410C',
    textDecorationLine: 'line-through',
  },
  checklistSublabel: {
    fontSize: 12,
    color: '#64748B',
  },
  checkbox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    transform: [{ scale: 1.05 }],
  },
  checkboxPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EA580C',
    backgroundColor: 'transparent',
  },
  guideCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.08)',
    marginTop: 10,
    marginBottom: 20,
    minHeight: 220,
    justifyContent: 'center',
  },
  guideIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF2E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideIcon: {
    fontSize: 34,
  },
  guideLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA580C',
    marginBottom: 6,
  },
  guideText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dotItem: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotItemActive: {
    backgroundColor: '#EA580C',
    width: 18,
  },
  successMessageLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C2D12',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  timerMascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#EA580C',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  timerLargeEmoji: {
    fontSize: 62,
  },
  timerTextDisplay: {
    fontSize: 78,
    fontWeight: '200',
    color: '#7C2D12',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(234, 88, 12, 0.08)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  reminderCard: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C2D12',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerControls: {
    width: '60%',
    alignItems: 'center',
  },
  controlBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pauseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  resumeBtn: {
    backgroundColor: '#EA580C',
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  successLargeEmoji: {
    fontSize: 84,
    marginBottom: 20,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  successContext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  claimBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  gradientClaimBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
