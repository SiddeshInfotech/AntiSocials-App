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
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 600; // 10 minutes in seconds

export default function AskQuestionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Task Steps:
  // 1: Detail Dashboard Page (Intro)
  // 2: Cross the Bridge (Bridge lights up section-by-section)
  // 3: Question Generator (Interactive Spinning Category Wheel)
  // 4: Confidence Meter Before (Nervous, Okay, Ready selection)
  // 5: Conversation Ripple (Confirmation + expanding ripples)
  // 6: Confidence Meter After (Post-interaction selection + Comparison Chart)
  // 7: Moment of Courage (10-minute twilight city skyline timer)
  // 8: Final Celebration (Fully lit bridge, firework beams, claim points)
  const [step, setStep] = useState(1);

  // Challenge State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [generatedStarter, setGeneratedStarter] = useState<string | null>(null);
  const [confidenceBefore, setConfidenceBefore] = useState<string | null>(null);
  const [confidenceAfter, setConfidenceAfter] = useState<string | null>(null);
  const [conversationConfirmed, setConversationConfirmed] = useState(false);

  // Timer State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Bridge section animations
  const bridgeLight1 = useRef(new Animated.Value(0)).current;
  const bridgeLight2 = useRef(new Animated.Value(0)).current;
  const bridgeLight3 = useRef(new Animated.Value(0)).current;
  const bridgeLight4 = useRef(new Animated.Value(0)).current;
  const bridgeLight5 = useRef(new Animated.Value(0)).current;

  // Spinning categories wheel animation
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);

  // Ripple Animation
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Chart Comparison heights
  const beforeChartHeight = useRef(new Animated.Value(0)).current;
  const afterChartHeight = useRef(new Animated.Value(0)).current;

  // Background appState recovery tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Ambient effects state
  const [speechBubbles, setSpeechBubbles] = useState<{ id: number; left: number; text: string; speed: number; scale: number }[]>([]);
  const [windowLights, setWindowLights] = useState<boolean[]>(Array(18).fill(false));
  const [fireworks, setFireworks] = useState<{ id: number; left: number; top: number; color: string; scale: number }[]>([]);

  const categories = [
    { name: '☕ Everyday', value: 'everyday', starters: ['"Excuse me, is this seat free?"', '"Have you tried this before?"'] },
    { name: '📍 Directions', value: 'directions', starters: ['"Where can I find the nearest café?"', '"Do you know where the train station is?"'] },
    { name: '😊 Friendly', value: 'friendly', starters: ['"How has your day been?"', '"Nice jacket, where did you get it?"'] },
    { name: '🏫 Campus', value: 'campus', starters: ['"Do you know when the library closes?"', '"Is this the queue for student services?"'] },
    { name: '🛒 Shopping', value: 'shopping', starters: ['"Excuse me, do you know where the checkout line starts?"', '"Have you tried this flavor?"'] },
    { name: '💼 Workplace', value: 'workplace', starters: ['"Hi there, how is your project going?"', '"Do you know if the printer is working?"'] },
  ];

  const encouragingQuotes = [
    '💬 "Every expert communicator once started with hello."',
    '🌉 "Confidence grows through action."',
    '✨ "Small conversations create big changes."',
    '🤝 "You proved that taking the first step is possible."',
  ];

  // Initialize Speech Bubbles for Timer screen
  useEffect(() => {
    const bubblesList = ['💬', '👋', '✨', '🌉', '🤝', '😊', '💬', '✨'];
    const newBubbles = bubblesList.map((text, i) => ({
      id: i,
      left: Math.random() * (width - 40),
      text,
      speed: 4000 + Math.random() * 4000,
      scale: 0.6 + Math.random() * 0.8,
    }));
    setSpeechBubbles(newBubbles);

    // Initial random city window lights
    setWindowLights(Array(18).fill(false).map(() => Math.random() > 0.6));

    // Fireworks configuration
    const colors = ['#2563EB', '#34D399', '#06B6D4', '#60A5FA', '#34D399'];
    const newFireworks = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: 30 + Math.random() * (width - 80),
      top: 100 + Math.random() * (height * 0.4),
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.5 + Math.random() * 0.8,
    }));
    setFireworks(newFireworks);
  }, []);

  // Quote rotation loop in Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 7) {
      interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % encouragingQuotes.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // AppState listener for background timer tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 7 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            transitionToStep(8);
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

  // General pulse animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer Run Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 7 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          // Incrementally turn on city windows as time ticks
          const progress = (TIMER_DURATION - prev) / TIMER_DURATION;
          const turnOnCount = Math.floor(progress * 18);
          setWindowLights((prevLights) => {
            const next = [...prevLights];
            for (let i = 0; i < turnOnCount; i++) {
              if (i < next.length) next[i] = true;
            }
            return next;
          });

          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(8);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, { toValue: 1.08, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(timerPulseAnim, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // Step transition helper
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
      }).start(() => {
        if (nextStep === 5) {
          // Play positive ripple animation
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
        if (nextStep === 6) {
          // Animate comparison graph bars
          const beforeValue = confidenceBefore === 'Nervous' ? 40 : confidenceBefore === 'Okay' ? 70 : 100;
          const afterValue = confidenceAfter === 'Nervous' ? 40 : confidenceAfter === 'Okay' ? 70 : 100;
          
          Animated.parallel([
            Animated.timing(beforeChartHeight, { toValue: beforeValue, duration: 1000, easing: Easing.out(Easing.bounce), useNativeDriver: false }),
            Animated.timing(afterChartHeight, { toValue: afterValue, duration: 1000, easing: Easing.out(Easing.bounce), useNativeDriver: false })
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
        await apiFetch('/api/tasks/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Ask Someone a Simple Question' })
        });
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
    transitionToStep(2);
  };

  // Sequential bridge lighting handler for Step 2
  const runBridgeLighting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(bridgeLight1, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bridgeLight2, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bridgeLight3, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bridgeLight4, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bridgeLight5, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        transitionToStep(3); // Go to Question Generator
      }, 400);
    });
  };

  // Interactive Spin Wheel Category Handler
  const handleSpinWheel = () => {
    if (isSpinning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSpinning(true);

    const randomVal = Math.floor(Math.random() * categories.length);
    const chosenCategory = categories[randomVal];
    const fullRotation = 360 * 4 + (randomVal * 60);

    Animated.timing(wheelRotation, {
      toValue: fullRotation,
      duration: 2500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(async () => {
      setIsSpinning(false);
      setSelectedCategory(chosenCategory.value);
      const startersList = chosenCategory.starters;
      const starterPrompt = startersList[Math.floor(Math.random() * startersList.length)];
      setGeneratedStarter(starterPrompt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save initial progress to API
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await apiFetch('/api/tasks/save-ask-question-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              task_name: 'Ask Someone a Simple Question',
              category: chosenCategory.name,
              starter: starterPrompt,
            })
          });
        }
      } catch (e) {
        console.error('Error saving prompt progress:', e);
      }
    });
  };

  // Save Confidence Level Before
  const handleSelectConfidenceBefore = async (level: 'Nervous' | 'Okay' | 'Ready') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfidenceBefore(level);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-ask-question-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone a Simple Question',
            confidence_before: level,
          })
        });
      }
    } catch (e) {
      console.error('Error saving confidence before:', e);
    }

    setTimeout(() => {
      transitionToStep(5); // Go to Ripple Screen
    }, 450);
  };

  // Confirm asking question
  const handleConfirmAsked = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConversationConfirmed(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-ask-question-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone a Simple Question',
            confirmed: true,
          })
        });
      }
    } catch (e) {
      console.error('Error saving confirmation:', e);
    }

    transitionToStep(6); // Go to Confidence After screen
  };

  // Save Confidence Level After
  const handleSelectConfidenceAfter = async (level: 'Nervous' | 'Okay' | 'Ready') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfidenceAfter(level);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-ask-question-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone a Simple Question',
            confidence_after: level,
          })
        });
      }
    } catch (e) {
      console.error('Error saving confidence after:', e);
    }
  };

  const handleStartReflection = async () => {
    transitionToStep(7); // Go to Timer
    setIsActive(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-ask-question-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone a Simple Question',
            timer_completion: false,
          })
        });
      }
    } catch (e) {
      console.error('Error saving timer started state:', e);
    }
  };

  // API Call: Final complete task
  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone a Simple Question',
            category: selectedCategory,
            starter: generatedStarter,
            confidence_before: confidenceBefore,
            confidence_after: confidenceAfter,
            confirmed: conversationConfirmed,
            timer_completion: true
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
      Alert.alert('Connection Error', 'Network request failed. Please verify your connection.');
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
        message: 'You initiated interaction.',
        difficulty: 'hard'
      }
    } as any);
  };

  // Developer fast-forward gesture
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3); // Fast forward to 3 seconds
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Wheel rotation interpolation
  const interpolatedWheelRotation = wheelRotation.interpolate({
    inputRange: [0, 360 * 10],
    outputRange: ['0deg', `${360 * 10}deg`],
  });

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
              <Feather name="x" size={16} color="#2563EB" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 7 && isActive && !isPaused && { backgroundColor: '#34D399' }]} />
            <Text style={styles.statusText}>
              {step === 7 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `BRIDGE.STEP_${step}`}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>
          
          {/* STEP 1: DASHBOARD PAGE */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.mainEmoji}>🌉</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Ask Someone a Simple Question</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.hardBadge]}>
                    <Text style={styles.hardBadgeText}>⭐⭐⭐ Hard</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#2563EB' }]}>+600 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#059669' }]}>10 Min</Text>
                  </View>
                </View>
              </View>

              {/* Progress comparison ring placeholder */}
              <View style={styles.dashboardRingContainer}>
                <LinearGradient
                  colors={['#2563EB', '#34D399']}
                  style={styles.neonRingLine}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.innerRingContent}>
                    <Feather name="shield" size={32} color="#2563EB" />
                    <Text style={styles.innerRingText}>Initiate Connection</Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "A single question can open doors that silence never will."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.cardDescription}>
                  Every conversation begins by crossing one small bridge. gently step outside your comfort zone by asking someone an easy, natural question.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>🌉 Cross the Bridge</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: CROSS THE BRIDGE */}
          {step === 2 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={styles.introHeader}>
                <Text style={styles.introTitle}>"Every conversation begins by crossing one small bridge."</Text>
                <Text style={styles.introSubtitle}>Light up the path to reach the other side</Text>
              </View>

              {/* Illustrated Bridge layout */}
              <View style={styles.bridgeVisualization}>
                <Text style={styles.zoneTextLeft}>Comfort Zone</Text>

                <View style={styles.bridgeTrack}>
                  {/* Segment 1 */}
                  <Animated.View style={[styles.bridgeSegment, { opacity: bridgeLight1 }]} />
                  {/* Segment 2 */}
                  <Animated.View style={[styles.bridgeSegment, { opacity: bridgeLight2 }]} />
                  {/* Segment 3 */}
                  <Animated.View style={[styles.bridgeSegment, { opacity: bridgeLight3 }]} />
                  {/* Segment 4 */}
                  <Animated.View style={[styles.bridgeSegment, { opacity: bridgeLight4 }]} />
                  {/* Segment 5 */}
                  <Animated.View style={[styles.bridgeSegment, { opacity: bridgeLight5 }]} />
                </View>

                <Text style={styles.zoneTextRight}>Connection</Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={runBridgeLighting} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>🌉 Light the Bridge</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: QUESTION GENERATOR */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Interactive Question Generator</Text>
              <Text style={styles.stepSubtitle}>
                Spin the category wheel to unlock a natural question starter.
              </Text>

              {/* Spin Categories Wheel */}
              <View style={styles.wheelOuterCircle}>
                <Animated.View
                  style={[
                    styles.wheelCircle,
                    { transform: [{ rotate: interpolatedWheelRotation }] },
                  ]}
                >
                  {/* 6 Category sectors */}
                  {categories.map((c, i) => (
                    <View
                      key={c.value}
                      style={[
                        styles.wheelSector,
                        { transform: [{ rotate: `${i * 60}deg` }] },
                      ]}
                    >
                      <Text style={styles.wheelSectorLabel}>{c.name.split(' ')[0]}</Text>
                    </View>
                  ))}
                </Animated.View>
                {/* Pointer marker */}
                <View style={styles.wheelPointer} />
              </View>

              {/* Selection result box */}
              {generatedStarter ? (
                <View style={styles.promptResultBox}>
                  <Text style={styles.resultCategoryLabel}>
                    Selected Category: {categories.find((c) => c.value === selectedCategory)?.name}
                  </Text>
                  <Text style={styles.resultPromptText}>{generatedStarter}</Text>
                </View>
              ) : (
                <View style={styles.promptResultBoxPlaceholder}>
                  <Text style={styles.resultPlaceholderText}>Spin the wheel to choose your quest topic</Text>
                </View>
              )}

              <View style={styles.wheelActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, isSpinning && { opacity: 0.5 }]}
                  disabled={isSpinning}
                  onPress={handleSpinWheel}
                >
                  <Text style={styles.secondaryActionBtnText}>
                    {generatedStarter ? '🔄 Spin Again' : '🎡 Spin Wheel'}
                  </Text>
                </TouchableOpacity>

                {generatedStarter && (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => transitionToStep(4)}
                  >
                    <Text style={styles.primaryActionBtnText}>Lock in Question ➔</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* STEP 4: CONFIDENCE METER BEFORE */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Before the Question</Text>
              <Text style={styles.stepSubtitle}>
                How confident do you feel before asking this question? Let's record your starting state.
              </Text>

              {/* Custom high-fidelity slider buttons */}
              <View style={styles.confidenceSelectionRow}>
                <TouchableOpacity
                  style={[
                    styles.confidenceButton,
                    styles.nervousBtnBorder,
                    confidenceBefore === 'Nervous' && styles.nervousBtnActive,
                  ]}
                  onPress={() => handleSelectConfidenceBefore('Nervous')}
                >
                  <Text style={styles.confidenceBtnEmoji}>😰</Text>
                  <Text style={styles.confidenceBtnText}>Nervous</Text>
                  <Text style={styles.confidenceBtnSubtitle}>A bit worried</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confidenceButton,
                    styles.okayBtnBorder,
                    confidenceBefore === 'Okay' && styles.okayBtnActive,
                  ]}
                  onPress={() => handleSelectConfidenceBefore('Okay')}
                >
                  <Text style={styles.confidenceBtnEmoji}>🙂</Text>
                  <Text style={styles.confidenceBtnText}>Okay</Text>
                  <Text style={styles.confidenceBtnSubtitle}>Felt decent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confidenceButton,
                    styles.readyBtnBorder,
                    confidenceBefore === 'Ready' && styles.readyBtnActive,
                  ]}
                  onPress={() => handleSelectConfidenceBefore('Ready')}
                >
                  <Text style={styles.confidenceBtnEmoji}>😎</Text>
                  <Text style={styles.confidenceBtnText}>Ready</Text>
                  <Text style={styles.confidenceBtnSubtitle}>Ready to go</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5: CONVERSATION RIPPLE */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Expanding ripples circles */}
              <View style={styles.rippleOuterFrame}>
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 3.2],
                          }),
                        },
                      ],
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.8, 0.3, 0],
                      }),
                      borderColor: '#2563EB',
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 2.3],
                          }),
                        },
                      ],
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0.8, 0.2, 0],
                      }),
                      borderColor: '#34D399',
                    },
                  ]}
                />

                {/* Speech bubbles node */}
                <View style={styles.rippleCenterNode}>
                  <Text style={styles.rippleCenterEmoji}>💬</Text>
                </View>
              </View>

              <Text style={styles.rippleHeader}>"One small interaction creates lasting confidence."</Text>
              <Text style={styles.rippleSubtitle}>
                You asked: <Text style={{ fontStyle: 'italic', fontWeight: 'bold' }}>{generatedStarter}</Text>
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmAsked} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#34D399', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Yes, I Asked It! 🤝</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: CONFIDENCE METER AFTER */}
          {step === 6 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.stepTitle}>After the Question</Text>
                <Text style={styles.stepSubtitle}>
                  How do you feel now that you initiated the connection?
                </Text>
              </View>

              {/* Confidence Selection if not selected yet */}
              {!confidenceAfter ? (
                <View style={styles.confidenceSelectionRow}>
                  <TouchableOpacity
                    style={[styles.confidenceButton, styles.nervousBtnBorder]}
                    onPress={() => handleSelectConfidenceAfter('Nervous')}
                  >
                    <Text style={styles.confidenceBtnEmoji}>😰</Text>
                    <Text style={styles.confidenceBtnText}>Nervous</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confidenceButton, styles.okayBtnBorder]}
                    onPress={() => handleSelectConfidenceAfter('Okay')}
                  >
                    <Text style={styles.confidenceBtnEmoji}>🙂</Text>
                    <Text style={styles.confidenceBtnText}>Okay</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confidenceButton, styles.readyBtnBorder]}
                    onPress={() => handleSelectConfidenceAfter('Ready')}
                  >
                    <Text style={styles.confidenceBtnEmoji}>😎</Text>
                    <Text style={styles.confidenceBtnText}>Ready</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Smooth animated graph comparing before vs after
                <View style={styles.comparisonGraphContainer}>
                  <Text style={styles.graphTitle}>Before vs After Confidence</Text>
                  
                  <View style={styles.graphBarsRow}>
                    {/* Before Bar */}
                    <View style={styles.graphColumn}>
                      <View style={styles.graphBarTrack}>
                        <Animated.View
                          style={[
                            styles.graphBarFill,
                            {
                              height: beforeChartHeight.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                              }),
                              backgroundColor: '#2563EB',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.graphBarLabel}>Before</Text>
                      <Text style={styles.graphBarValue}>{confidenceBefore}</Text>
                    </View>

                    {/* After Bar */}
                    <View style={styles.graphColumn}>
                      <View style={styles.graphBarTrack}>
                        <Animated.View
                          style={[
                            styles.graphBarFill,
                            {
                              height: afterChartHeight.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                              }),
                              backgroundColor: '#34D399',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.graphBarLabel}>After</Text>
                      <Text style={styles.graphBarValue}>{confidenceAfter}</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, !confidenceAfter && styles.disabledBtn]}
                disabled={!confidenceAfter}
                onPress={handleStartReflection}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={!confidenceAfter ? ['#CBD5E1', '#94A3B8'] : ['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Enter Courage Space ➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 7: MOMENT OF COURAGE (10-Minute Timer) */}
          {step === 7 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              {/* Floating particles */}
              {speechBubbles.map((p) => (
                <Animated.View
                  key={p.id}
                  style={[
                    styles.floatingSpeechBubble,
                    {
                      left: p.left,
                      transform: [{ scale: p.scale }],
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{p.text}</Text>
                </Animated.View>
              ))}

              <View style={styles.timerTopInfo}>
                <Text style={styles.timerHeader}>Courage Space</Text>
                <Text style={styles.timerSubheading}>
                  Dwell in the confidence of taking action. Each question is a bridge.
                </Text>
              </View>

              {/* Twillight City Skyline progress visualization */}
              <View style={styles.skylineBox}>
                <View style={styles.cityLightsFrame}>
                  {Array.from({ length: 6 }).map((_, colIdx) => (
                    <View key={colIdx} style={[styles.building, { height: 100 + colIdx * 15 }]}>
                      {/* 3 Window lights per building */}
                      {Array.from({ length: 3 }).map((_, winIdx) => {
                        const cellId = colIdx * 3 + winIdx;
                        const isLit = windowLights[cellId];
                        return (
                          <View
                            key={winIdx}
                            style={[
                              styles.windowLight,
                              isLit && styles.windowLightLit,
                            ]}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>

                {/* Digital countdown overlay */}
                <View style={styles.timerDigitsOverlay}>
                  <Pressable onPress={handleDevSkip}>
                    <Text style={styles.skylineTimerText}>{formatTime(timeLeft)}</Text>
                  </Pressable>
                  <Text style={styles.skylineTimerSub}>Reflecting...</Text>
                </View>
              </View>

              {/* Encouraging Quote */}
              <View style={styles.timerQuoteBox}>
                <Text style={styles.timerQuoteText}>{encouragingQuotes[currentQuoteIndex]}</Text>
              </View>

              <View style={styles.timerControlsRow}>
                <TouchableOpacity
                  style={[styles.timerControlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timerControlBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 8: FINAL CELEBRATION */}
          {step === 8 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Confetti / Firework beams */}
              {fireworks.map((fw) => (
                <View
                  key={fw.id}
                  style={[
                    styles.fireworkBeam,
                    {
                      left: fw.left,
                      top: fw.top,
                      backgroundColor: fw.color,
                      transform: [{ scale: fw.scale }],
                    },
                  ]}
                />
              ))}

              <View style={styles.badgeWrapper}>
                <LinearGradient
                  colors={['#2563EB', '#34D399']}
                  style={styles.badgeHalo}
                >
                  <Text style={styles.badgeEmoji}>🏅</Text>
                </LinearGradient>
              </View>

              <Text style={styles.celebrationHeader}>Conversation Starter</Text>
              <Text style={styles.celebrationSubtext}>
                "Today you didn't wait for connection—you created it."
              </Text>

              {/* Fully illuminated bridge representation */}
              <View style={styles.celebrationBridge}>
                <LinearGradient
                  colors={['#2563EB', '#34D399']}
                  style={styles.fullyLitBridgeLine}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.bridgeStatusText}>BRIDGE FULLY LIGHTED ⚡</Text>
              </View>

              <Text style={styles.questCompletionMessage}>"You initiated interaction."</Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
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
    backgroundColor: '#111827', // Dark Theme Charcoal
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
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D1D5DB',
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
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  mainEmoji: {
    fontSize: 60,
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 15,
  },
  taskTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#F9FAFC',
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
  dashboardRingContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  neonRingLine: {
    width: 150,
    height: 150,
    borderRadius: 75,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRingContent: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 10,
  },
  cardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
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
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  introHeader: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  introSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  bridgeVisualization: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  zoneTextLeft: {
    fontSize: 14,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  zoneTextRight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 15,
    textTransform: 'uppercase',
  },
  bridgeTrack: {
    width: 32,
    height: height * 0.35,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  bridgeSegment: {
    width: 24,
    height: height * 0.05,
    borderRadius: 6,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  wheelOuterCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 6,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    position: 'relative',
    marginVertical: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  wheelCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#111827',
    overflow: 'hidden',
    position: 'relative',
  },
  wheelSector: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  wheelSectorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
  },
  wheelPointer: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderLeftColor: 'transparent',
    borderRightWidth: 12,
    borderRightColor: 'transparent',
    borderTopWidth: 20,
    borderTopColor: '#34D399',
    zIndex: 10,
  },
  promptResultBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#2563EB',
    marginVertical: 10,
    alignItems: 'center',
  },
  resultCategoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    textTransform: 'uppercase',
  },
  resultPromptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  promptResultBoxPlaceholder: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#374151',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPlaceholderText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  wheelActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 10,
    gap: 12,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confidenceSelectionRow: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 20,
    marginVertical: 30,
  },
  confidenceButton: {
    width: '100%',
    height: 70,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  nervousBtnBorder: { borderColor: '#4B5563' },
  okayBtnBorder: { borderColor: '#4B5563' },
  readyBtnBorder: { borderColor: '#4B5563' },
  nervousBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  okayBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  readyBtnActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  confidenceBtnEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  confidenceBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFC',
  },
  confidenceBtnSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  rippleOuterFrame: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 30,
  },
  rippleCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    opacity: 0,
  },
  rippleCenterNode: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F2937',
    borderWidth: 3,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  rippleCenterEmoji: {
    fontSize: 40,
  },
  rippleHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  rippleSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
    marginBottom: 20,
  },
  comparisonGraphContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  graphBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    flex: 1,
    alignItems: 'flex-end',
  },
  graphColumn: {
    alignItems: 'center',
    width: '40%',
  },
  graphBarTrack: {
    width: 32,
    height: height * 0.22,
    backgroundColor: '#111827',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  graphBarFill: {
    width: '100%',
    borderRadius: 16,
  },
  graphBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D1D5DB',
    marginTop: 10,
  },
  graphBarValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginTop: 2,
  },
  floatingSpeechBubble: {
    position: 'absolute',
    bottom: 50,
  },
  timerTopInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  timerHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  timerSubheading: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  skylineBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginVertical: 20,
  },
  cityLightsFrame: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 15,
    height: '100%',
  },
  building: {
    width: '12%',
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'space-around',
    paddingVertical: 10,
    alignItems: 'center',
  },
  windowLight: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: '#374151',
  },
  windowLightLit: {
    backgroundColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  timerDigitsOverlay: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skylineTimerText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#06B6D4',
    letterSpacing: 1.5,
  },
  skylineTimerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  timerQuoteBox: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
    marginVertical: 15,
  },
  timerQuoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  timerControlsRow: {
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
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  resumeBtn: {
    backgroundColor: '#2563EB',
  },
  timerControlBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  fireworkBeam: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
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
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 68,
  },
  celebrationHeader: {
    fontSize: 25,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  celebrationSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  celebrationBridge: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 25,
  },
  fullyLitBridgeLine: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  bridgeStatusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34D399',
    marginTop: 8,
    letterSpacing: 1,
  },
  questCompletionMessage: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  claimBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#2563EB',
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
