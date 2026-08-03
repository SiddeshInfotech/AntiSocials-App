import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 300; // 5 minutes in seconds

export default function PresenceTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen Steps:
  // 1: Detail Dashboard (Silhouettes, overlapping circle graphic, quote)
  // 2: Shared Circle Intro (Park bench overlooking lake, glowing circle expand)
  // 3: Companion Cards (Friend, Family, Classmate selection)
  // 4: Overlapping Circles Pre-timer (Aligning user/companion circles)
  // 5: Presence Experience Lake (Lake ripple progress, countdown, float quotes)
  // 6: Final Celebration (Overlapping circles merge, birds fly, points claim)
  const [step, setStep] = useState(1);

  // States
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Animations
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;

  // Step 2 seat circle expansion
  const seatGlowAnim = useRef(new Animated.Value(0)).current;

  // Step 3 companion cards layout animations
  const cardScaleFriend = useRef(new Animated.Value(1)).current;
  const cardScaleFamily = useRef(new Animated.Value(1)).current;
  const cardScaleClass = useRef(new Animated.Value(1)).current;
  const cardScaleColleague = useRef(new Animated.Value(1)).current;
  const cardScaleNearby = useRef(new Animated.Value(1)).current;
  const cardScaleOther = useRef(new Animated.Value(1)).current;

  const cardTranslateY = useRef(new Animated.Value(0)).current;

  // Step 4 circles overlap animations
  const circleOffsetLeft = useRef(new Animated.Value(-60)).current;
  const circleOffsetRight = useRef(new Animated.Value(60)).current;
  const circleOverlapScale = useRef(new Animated.Value(1)).current;

  // Step 5 lake ripple progress & leaf drift
  const waveRipple1 = useRef(new Animated.Value(0)).current;
  const waveRipple2 = useRef(new Animated.Value(0)).current;
  const waveRippleGlobal = useRef(new Animated.Value(0)).current;
  const leafDriftAnim = useRef(new Animated.Value(-50)).current;

  // Step 6 bird fly animation
  const birdFlyX = useRef(new Animated.Value(-150)).current;
  const birdFlyY = useRef(new Animated.Value(120)).current;

  // Background appState tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Reflection texts
  const ambientQuotes = [
    '🤍 "Silence can be comfortable."',
    '🌊 "Notice the moment you\'re sharing."',
    '🫂 "Presence creates connection."',
    '✨ "You don\'t need to say anything."',
  ];

  // Companion data
  const companionOptions = [
    { label: '👨 Friend', value: 'Friend', refScale: cardScaleFriend },
    { label: '👩 Family', value: 'Family', refScale: cardScaleFamily },
    { label: '🎓 Classmate', value: 'Classmate', refScale: cardScaleClass },
    { label: '💼 Colleague', value: 'Colleague', refScale: cardScaleColleague },
    { label: '🌍 Nearby', value: 'Someone Nearby', refScale: cardScaleNearby },
    { label: '✨ Other', value: 'Other', refScale: cardScaleOther },
  ];

  // Ambient effects loops
  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Floating cards soft drift in Step 3
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardTranslateY, { toValue: -8, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(cardTranslateY, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer loop for quote changes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 5) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % ambientQuotes.length);
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Background state recover logic
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 5 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            transitionToStep(6);
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

  // Timer count down thread
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          // Incrementally scale global ripple line towards boundaries
          const progress = (TIMER_DURATION - prev) / TIMER_DURATION;
          waveRippleGlobal.setValue(progress);

          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(6);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Loop ripples on lake surface
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waveRipple1, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(waveRipple1, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(2000),
            Animated.timing(waveRipple2, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(waveRipple2, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ])
      ).start();

      // Leaf drift loop across screen
      Animated.loop(
        Animated.sequence([
          Animated.timing(leafDriftAnim, { toValue: width + 50, duration: 8000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(leafDriftAnim, { toValue: -50, duration: 0, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, { toValue: 1.07, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(timerPulseAnim, { toValue: 1, duration: 1200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // Transition controller
  const transitionToStep = (nextStep: number) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (nextStep === 2) {
          // Play glowing circle seats expansion
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.timing(seatGlowAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
        if (nextStep === 4) {
          // Align user circle and companion circle together
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.parallel([
            Animated.timing(circleOffsetLeft, { toValue: -15, duration: 2500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(circleOffsetRight, { toValue: 15, duration: 2500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]).start();
        }
        if (nextStep === 6) {
          // Play final overlapping circles merge & birds fly animation
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.parallel([
            Animated.timing(circleOffsetLeft, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(circleOffsetRight, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(circleOverlapScale, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
            Animated.timing(birdFlyX, { toValue: width + 100, duration: 6000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(birdFlyY, { toValue: 40, duration: 6000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]).start();
        }
      });
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
          body: JSON.stringify({ task_name: 'Sit with Someone for 5 Minutes' })
        });
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
    transitionToStep(2);
  };

  // Selection handler for Companion cards
  const handleSelectCompanion = async (choice: string, scaleAnim: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCompanion(choice);

    // Spring tap animation
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.25, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start(async () => {
      // Save Companion type progress to API
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await fetch(`${API_BASE_URL}/api/tasks/save-presence-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              task_name: 'Sit with Someone for 5 Minutes',
              companion_type: choice,
            })
          });
        }
      } catch (e) {
        console.error('Error saving companion progress:', e);
      }
      
      // Delay transition to step 4 slightly for visual clarity
      setTimeout(() => {
        transitionToStep(4);
      }, 350);
    });
  };

  // Confirmation trigger "We're Sitting Together"
  const handleConfirmSitting = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-presence-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Sit with Someone for 5 Minutes',
            session_started: true,
            duration: 0
          })
        });
      }
    } catch (e) {
      console.error('Error saving session start:', e);
    }

    transitionToStep(5); // Go to Ripple Timer screen
  };

  // API Call: Final complete task
  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Sit with Someone for 5 Minutes',
            companion_type: selectedCompanion,
            session_started: true,
            session_completed: true,
            duration: TIMER_DURATION
          })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '300',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0'
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('Error', data.error || 'Failed to complete task');
        }
      } else {
        Alert.alert('Auth Error', 'Please log in again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }

    // Redirect to task success page
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You shared space.',
        difficulty: 'hard'
      }
    } as any);
  };

  // Dev fast-forward shortcut
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3); // Fast forward to 3 seconds remaining
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Abort Challenge?',
                'Are you sure you want to exit? Your progress will be discarded.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => router.back() },
                ]
              );
            }}
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={16} color="#0F766E" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 5 && isActive && !isPaused && { backgroundColor: '#7DD3FC' }]} />
            <Text style={styles.statusText}>
              {step === 5 ? (isPaused ? 'SESSION.PAUSE' : 'SESSION.ACTIVE') : `PRESENCE.STEP_${step}`}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: contentFadeAnim }]}>

          {/* STEP 1: TASK DETAIL PAGE (DASHBOARD) */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              {/* Top: Silhouette illustration */}
              <View style={styles.illustrationFrame}>
                <Text style={styles.illustrationEmoji}>👥</Text>
                <Text style={styles.illustrationText}>Silent Accord</Text>
              </View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Sit with Someone for 5 Minutes</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.hardBadge]}>
                    <Text style={styles.hardBadgeText}>⭐⭐⭐ Hard</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(15, 118, 110, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#0F766E' }]}>+300 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(125, 211, 252, 0.2)' }]}>
                    <Text style={[styles.badgeText, { color: '#0369A1' }]}>5 Min</Text>
                  </View>
                </View>
              </View>

              {/* Center: Animated overlapping-circle graphic */}
              <View style={styles.overlapRingContainer}>
                <View style={styles.ringCenterTrack}>
                  <Animated.View style={[styles.dashboardCircle, { backgroundColor: 'rgba(125, 211, 252, 0.3)', marginRight: -20, transform: [{ scale: pulseAnim }] }]} />
                  <Animated.View style={[styles.dashboardCircle, { backgroundColor: 'rgba(15, 118, 110, 0.3)', marginLeft: -20, transform: [{ scale: pulseAnim }] }]} />
                </View>
              </View>

              {/* Bottom: Minimal quote card */}
              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "The most meaningful moments are often the quietest ones."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.cardDescription}>
                  Connection doesn't always require words. Choose someone you're comfortable sitting near, and spend five minutes sharing space without focusing on screens.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#0F766E', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>🫂 Enter Shared Space</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: SHARED CIRCLE INTRO */}
          {step === 2 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={styles.stepIntroHeader}>
                <Text style={styles.stepTitle}>"Sometimes the greatest connection is simply being present."</Text>
                <Text style={styles.stepSubtitle}>"You don't have to fill every silence. Presence is enough."</Text>
              </View>

              {/* Park bench overlooking lake background */}
              <View style={styles.lakeVisualizationBox}>
                {/* Simulated lake bench seats */}
                <View style={styles.parkBenchOutline}>
                  <View style={styles.benchSeat}>
                    <Text style={styles.seatLabel}>User</Text>
                  </View>
                  <View style={styles.benchSeat}>
                    <Text style={styles.seatLabel}>Companion</Text>
                  </View>
                </View>

                {/* Glowing circles expanding across both seats */}
                <Animated.View
                  style={[
                    styles.benchGlowCircle,
                    {
                      transform: [
                        {
                          scale: seatGlowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.1, 1.8],
                          }),
                        },
                      ],
                      opacity: seatGlowAnim.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0, 0.4, 0.15],
                      }),
                    },
                  ]}
                />
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => transitionToStep(3)} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#0F766E', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Choose Companion ➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: CHOOSE YOUR COMPANION */}
          {step === 3 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.stepTitle}>Choose Your Companion</Text>
                <Text style={styles.stepSubtitle}>
                  Select who you are currently sitting near to start the presence session.
                </Text>
              </View>

              {/* Companion Floating Cards grid */}
              <Animated.View style={[styles.companionCardsGrid, { transform: [{ translateY: cardTranslateY }] }]}>
                {companionOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.companionCard,
                      selectedCompanion === opt.value && styles.companionCardSelected,
                    ]}
                    onPress={() => handleSelectCompanion(opt.value, opt.refScale)}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={{ transform: [{ scale: opt.refScale }] }}>
                      <Text style={styles.companionCardLabel}>{opt.label}</Text>
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </Animated.View>

              <View style={{ height: 40 }} />
            </View>
          )}

          {/* STEP 4: SHARED CIRCLE ALIGNMENT */}
          {step === 4 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.stepTitle}>Overlapping Presence</Text>
                <Text style={styles.stepSubtitle}>
                  "Connection isn't measured by conversation. It's measured by presence."
                </Text>
              </View>

              {/* Overlapping presence rings */}
              <View style={styles.overlappingCirclesCanvas}>
                <Animated.View
                  style={[
                    styles.presenceCircleNode,
                    {
                      transform: [{ translateX: circleOffsetLeft }, { scale: circleOverlapScale }],
                      backgroundColor: 'rgba(125, 211, 252, 0.45)', // Aqua glow
                      shadowColor: '#7DD3FC',
                    },
                  ]}
                >
                  <Text style={styles.presenceCircleLabel}>You</Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.presenceCircleNode,
                    {
                      transform: [{ translateX: circleOffsetRight }, { scale: circleOverlapScale }],
                      backgroundColor: 'rgba(15, 118, 110, 0.45)', // Teal glow
                      shadowColor: '#0F766E',
                    },
                  ]}
                >
                  <Text style={styles.presenceCircleLabel}>
                    {selectedCompanion === 'Someone Nearby' ? 'Nearby' : selectedCompanion}
                  </Text>
                </Animated.View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSitting} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#0F766E', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>We're Sitting Together 🫂</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: PRESENCE EXPERIENCE LAKE */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              {/* Leaf drifting horizontally */}
              <Animated.View
                style={[
                  styles.driftingLeaf,
                  {
                    transform: [{ translateX: leafDriftAnim }],
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>🍃</Text>
              </Animated.View>

              <View style={styles.timerHeaderBlock}>
                <Text style={styles.timerScreenTitle}>Lake of Silence</Text>
                <Text style={styles.timerScreenSubtitle}>
                  Put your device down and enjoy the quiet presence.
                </Text>
              </View>

              {/* Peaceful lake progress rippling animation */}
              <View style={styles.lakeRippleFrame}>
                {/* Background circular water ripple waves */}
                <Animated.View
                  style={[
                    styles.lakeRippleRing,
                    {
                      transform: [
                        {
                          scale: waveRipple1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 2.5],
                          }),
                        },
                      ],
                      opacity: waveRipple1.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0.6, 0.3, 0],
                      }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.lakeRippleRing,
                    {
                      transform: [
                        {
                          scale: waveRipple2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 2.5],
                          }),
                        },
                      ],
                      opacity: waveRipple2.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0.6, 0.3, 0],
                      }),
                    },
                  ]}
                />

                {/* Main Shoreline progress indicator ring */}
                <Animated.View
                  style={[
                    styles.lakeShorelineProgressRing,
                    {
                      transform: [
                        {
                          scale: waveRippleGlobal.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1.8],
                          }),
                        },
                      ],
                      borderColor: '#7DD3FC',
                    },
                  ]}
                />

                {/* Center countdown timer */}
                <Animated.View style={[styles.timerCircleBody, { transform: [{ scale: timerPulseAnim }] }]}>
                  <Pressable onPress={handleDevSkip}>
                    <Text style={styles.lakeTimerDigits}>{formatTime(timeLeft)}</Text>
                  </Pressable>
                  <Text style={styles.lakeTimerIndicator}>Present</Text>
                </Animated.View>
              </View>

              {/* Ambient quote update box */}
              <View style={styles.ambientQuoteBox}>
                <Text style={styles.ambientQuoteText}>{ambientQuotes[quoteIndex]}</Text>
              </View>

              {/* Timer controllers */}
              <View style={styles.timerControlsFrame}>
                <TouchableOpacity
                  style={[styles.timerControlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timerControlBtnText}>{isPaused ? 'Resume Session' : 'Pause'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 6: FINAL CELEBRATION */}
          {step === 6 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Flying bird illustration */}
              <Animated.View
                style={[
                  styles.flyingBirdItem,
                  {
                    transform: [{ translateX: birdFlyX }, { translateY: birdFlyY }],
                  },
                ]}
              >
                <Text style={{ fontSize: 28 }}>🕊️</Text>
              </Animated.View>

              <View style={styles.badgeWrapper}>
                <LinearGradient
                  colors={['#7DD3FC', '#0F766E']}
                  style={styles.badgeHalo}
                >
                  <Text style={styles.badgeEmoji}>🏅</Text>
                </LinearGradient>
              </View>

              <Text style={styles.celebrationTitle}>Shared Presence</Text>
              <Text style={styles.celebrationSubtitle}>
                "Today, you chose connection without pressure."
              </Text>

              {/* Completed fully merged symbol */}
              <View style={styles.fullyMergedPresenceFrame}>
                <View style={styles.mergedRingContainer}>
                  <LinearGradient
                    colors={['#7DD3FC', '#0F766E']}
                    style={styles.mergedCircleGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="heart" size={28} color="#F8FAFC" />
                  </LinearGradient>
                </View>
                <Text style={styles.fullyMergedLabel}>ONE SHARED SPACE 🫂</Text>
              </View>

              <Text style={styles.completionMessageText}>"You shared space."</Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0F766E', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'Saving progress...' : 'Claim +300 Task Points'}
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
    backgroundColor: '#1E293B', // Calm Slate Dark Theme
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
    height: 50,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 15,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  illustrationFrame: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  illustrationEmoji: {
    fontSize: 54,
  },
  illustrationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7DD3FC',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 15,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  hardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overlapRingContainer: {
    width: 140,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  ringCenterTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  detailsCard: {
    backgroundColor: '#334155',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#475569',
    marginVertical: 10,
  },
  cardDescription: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 10,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  stepIntroHeader: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  stepTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 15,
  },
  lakeVisualizationBox: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  parkBenchOutline: {
    flexDirection: 'row',
    gap: 40,
    zIndex: 10,
  },
  benchSeat: {
    width: 90,
    height: 70,
    borderRadius: 15,
    backgroundColor: 'rgba(71, 85, 105, 0.8)',
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  benchGlowCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#7DD3FC',
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  companionCardsGrid: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  companionCard: {
    width: '45%',
    height: 90,
    borderRadius: 20,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companionCardSelected: {
    borderColor: '#7DD3FC',
    backgroundColor: 'rgba(125, 211, 252, 0.12)',
  },
  companionCardLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  overlappingCirclesCanvas: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  presenceCircleNode: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#F8FAFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  presenceCircleLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  driftingLeaf: {
    position: 'absolute',
    top: height * 0.18,
  },
  timerHeaderBlock: {
    alignItems: 'center',
    marginTop: 15,
  },
  timerScreenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  timerScreenSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  lakeRippleFrame: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 30,
  },
  lakeRippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#7DD3FC',
    opacity: 0,
  },
  lakeShorelineProgressRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  timerCircleBody: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#334155',
    borderWidth: 3,
    borderColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 20,
  },
  lakeTimerDigits: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7DD3FC',
  },
  lakeTimerIndicator: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  ambientQuoteBox: {
    backgroundColor: '#334155',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#475569',
    width: '100%',
    marginVertical: 15,
  },
  ambientQuoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  timerControlsFrame: {
    width: '100%',
    marginBottom: 20,
  },
  timerControlBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtn: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  resumeBtn: {
    backgroundColor: '#0F766E',
  },
  timerControlBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  flyingBirdItem: {
    position: 'absolute',
  },
  badgeWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeHalo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 68,
  },
  celebrationTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  fullyMergedPresenceFrame: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 25,
  },
  mergedRingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  mergedCircleGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullyMergedLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7DD3FC',
    marginTop: 8,
    letterSpacing: 1,
  },
  completionMessageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7DD3FC',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  claimBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientClaimBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
