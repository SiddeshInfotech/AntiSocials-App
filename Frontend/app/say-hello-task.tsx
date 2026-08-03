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
const TIMER_DURATION = 300; // 5 minutes in seconds

export default function SayHelloTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Task Steps:
  // 1: Welcoming / Detail screen
  // 2: Checklist (Person 1 & 2)
  // 3: Reflection Emotion Question
  // 4: Timer Screen
  // 5: Completion Success Screen
  const [step, setStep] = useState(1);
  const [greeting1, setGreeting1] = useState(false);
  const [greeting2, setGreeting2] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const mascotFloatAnim = useRef(new Animated.Value(0)).current;
  const mascotScaleAnim = useRef(new Animated.Value(0.95)).current;
  const timerGlowAnim = useRef(new Animated.Value(0.6)).current;

  // Checklist Card completion scales
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;

  // Background appState recovery tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // AppState listener to maintain timer duration accurately when backgrounded
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

  // Initial loops for breathing backgrounds and mascot floats
  useEffect(() => {
    // Background Breathing Scale loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background color shifts
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 15000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 15000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Mascot float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnim, { toValue: -8, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotFloatAnim, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Mascot scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScaleAnim, { toValue: 1.05, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(mascotScaleAnim, { toValue: 0.95, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer Glow pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerGlowAnim, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer Run Loop
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

  // Step transitions helper (adds fadeOut & fadeIn spring animations)
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 400,
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
          body: JSON.stringify({ task_name: 'Say Hello to 2 People' })
        });
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
    transitionToStep(2);
  };

  // API Call: Save Checklist / Greeting Progress
  const handleToggleGreeting = async (index: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let nextG1 = greeting1;
    let nextG2 = greeting2;

    if (index === 1) {
      nextG1 = !greeting1;
      setGreeting1(nextG1);
      // Trigger card bounce
      Animated.sequence([
        Animated.timing(card1Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(card1Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    } else {
      nextG2 = !greeting2;
      setGreeting2(nextG2);
      // Trigger card bounce
      Animated.sequence([
        Animated.timing(card2Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(card2Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    }

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-greeting-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Say Hello to 2 People',
            greeting1_completed: nextG1,
            greeting2_completed: nextG2
          })
        });
      }
    } catch (e) {
      console.error('Error saving greeting progress:', e);
    }
  };

  // Checklist Step Complete action
  const handleChecklistContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(3);
  };

  // API Call: Save Reflection Emotion Chip
  const handleSelectEmotion = async (emotion: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotion(emotion);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-emotion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Say Hello to 2 People',
            emotion: emotion,
            greeting1_completed: greeting1,
            greeting2_completed: greeting2
          })
        });
      }
    } catch (e) {
      console.error('Error saving emotion progress:', e);
    }
  };

  // Start reflection timer
  const handleStartTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(4);
    setIsActive(true);
  };

  // API Call: Final complete task and award points
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
            task_name: 'Say Hello to 2 People',
            greeting1_completed: greeting1,
            greeting2_completed: greeting2,
            reflection_emotion: selectedEmotion
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
        message: 'You opened connection.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev skip: double click timer to skip reflection timer
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3); // Fast forward timer
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const emotionChips = [
    { label: '😊 Happy', value: 'Happy' },
    { label: '😌 Relaxed', value: 'Relaxed' },
    { label: '💪 Confident', value: 'Confident' },
    { label: '🤝 Connected', value: 'Connected' },
    { label: '🌟 Inspired', value: 'Inspired' },
    { label: '😅 Nervous but Proud', value: 'Nervous but Proud' }
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Breathing background styling */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <LinearGradient
          colors={step === 4 ? ['#FEF3C7', '#FDE68A', '#FDBA74'] : ['#FFFDF9', '#FFF8EB', '#FFF2E0']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
        <LinearGradient
          colors={step === 4 ? ['#FDE68A', '#FDBA74', '#F97316'] : ['#FFFBF4', '#FFF5E1', '#FFEED1']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Vignette Overlay */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                "Abort Task?",
                "Are you sure you want to exit? Your progress will not be saved.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Exit", style: "destructive", onPress: () => router.back() }
                ]
              );
            }} 
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={18} color="#D97706" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 4 && isActive && !isPaused && { backgroundColor: '#EA580C' }]} />
            <Text style={styles.statusText}>
              {step === 4 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `HELLO.STEP_${step}`}
            </Text>
          </View>
        </View>

        {/* Dynamic Animated Wizards Step container */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>
          
          {/* STEP 1: Introduction Detail View */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.mainEmoji}>👋</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Say Hello to 2 People</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#D97706' }]}>+200 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#4F46E5' }]}>5 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "A single hello can begin a beautiful connection."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "Small greetings create meaningful connections."
                </Text>
                <Text style={styles.cardDescription}>
                  A simple greeting can brighten someone's day and help build confidence.{"\n\n"}
                  Today, greet two different people with a simple "Hello", "Good Morning", "Hi", or a friendly smile.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Let's Connect</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Greetings Checklist */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Who did you greet today?</Text>
              <Text style={styles.stepSubtitle}>
                Tap the checkboxes once you have shared a friendly greeting or hello with someone.
              </Text>

              <View style={styles.checklistContainer}>
                {/* Person 1 Card */}
                <Animated.View style={[styles.checklistCard, greeting1 && styles.checklistCardCompleted, { transform: [{ scale: card1Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, greeting1 && styles.checklistLabelCompleted]}>Person 1</Text>
                    <Text style={styles.checklistSublabel}>Greet a colleague, neighbor, or shopkeeper</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, greeting1 && styles.checkboxCompleted]}
                    onPress={() => handleToggleGreeting(1)}
                    activeOpacity={0.7}
                  >
                    {greeting1 ? (
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Person 2 Card */}
                <Animated.View style={[styles.checklistCard, greeting2 && styles.checklistCardCompleted, { transform: [{ scale: card2Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, greeting2 && styles.checklistLabelCompleted]}>Person 2</Text>
                    <Text style={styles.checklistSublabel}>Say hello or share a smile with another person</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, greeting2 && styles.checkboxCompleted]}
                    onPress={() => handleToggleGreeting(2)}
                    activeOpacity={0.7}
                  >
                    {greeting2 ? (
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 'auto' }, (!greeting1 || !greeting2) && styles.disabledBtn]}
                disabled={!greeting1 || !greeting2}
                onPress={handleChecklistContinue}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={(!greeting1 || !greeting2) ? ['#CBD5E1', '#94A3B8'] : ['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Continue to Reflection</Text>
                  <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Reflection Emotion Questions */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.reflectionHeader}>
                <Text style={styles.largeEmoji}>🤝</Text>
                <Text style={styles.stepTitle}>How did you feel after saying hello?</Text>
                <Text style={styles.stepSubtitle}>
                  Reflecting on positive connections helps reinforce confidence and mindfulness.
                </Text>
              </View>

              <View style={styles.chipsContainer}>
                {emotionChips.map((chip, idx) => {
                  const isSelected = selectedEmotion === chip.value;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.emotionChip, isSelected && styles.emotionChipSelected]}
                      onPress={() => handleSelectEmotion(chip.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 'auto' }, !selectedEmotion && styles.disabledBtn]}
                disabled={!selectedEmotion}
                onPress={handleStartTimer}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={!selectedEmotion ? ['#CBD5E1', '#94A3B8'] : ['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Begin Reflection</Text>
                  <Feather name="clock" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: 5-Minute Reflection Timer */}
          {step === 4 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerMascotCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.timerLargeEmoji}>👋</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Text style={styles.reflectionPrompt}>
                "Great job! Spend a few moments appreciating this positive interaction."
              </Text>

              <Text style={styles.timerSubheading}>
                "Keep this positive energy with you today."
              </Text>

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

          {/* STEP 5: Success & Reward Claims */}
          {step === 5 && (
            <View style={styles.successContainer}>
              <Text style={styles.successLargeEmoji}>👋</Text>
              <Text style={styles.successText}>You opened connection.</Text>
              <Text style={styles.successSubtext}>
                Each smile and word of connection builds confidence and weaves a stronger, warmer community around us.
              </Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? "Saving progress..." : "Claim +200 Task Points"}
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
    backgroundColor: '#FFFDF9',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(217, 119, 6, 0.02)',
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
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.15)',
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
    color: '#78350F',
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
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  mainEmoji: {
    fontSize: 74,
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 26,
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
    shadowColor: '#D97706',
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
    color: '#78350F',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
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
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  checklistCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: 'rgba(22, 163, 74, 0.15)',
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
    color: '#15803D',
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
    borderColor: '#D97706',
    backgroundColor: 'transparent',
  },
  reflectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeEmoji: {
    fontSize: 54,
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 6,
  },
  emotionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  emotionChipSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: '#EA580C',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#EA580C',
    fontWeight: '700',
  },
  timerMascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#D97706',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  timerLargeEmoji: {
    fontSize: 60,
  },
  timerText: {
    fontSize: 78,
    fontWeight: '200',
    color: '#78350F',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(217, 119, 6, 0.08)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  reflectionPrompt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  timerSubheading: {
    fontSize: 14,
    color: '#9A3412',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 35,
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
  successText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  claimBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#10B981',
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
