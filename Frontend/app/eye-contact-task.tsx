import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 180; // 3 minutes in seconds

export default function EyeContactTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Steps:
  // 1: Introduction / Details
  // 2: Staggered Prep Guide Cards
  // 3: Yes/No Confirmation Card (with "Not Yet" encouragement screen option)
  // 3.5: "Not Yet" Friendly Encouragement Slide
  // 4: Emotion Reflection Chips
  // 5: 3-Minute Walk/Eye-Contact reflection timer
  // 6: Success completion screen
  const [step, setStep] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Rotating quotes/reminders
  const quotes = [
    '“Stay present.”',
    '“Human connection begins with attention.”',
    '“Every genuine moment matters.”',
    '“Look around, there is beauty in every face.”',
    '“Be here now, with all your senses open.”'
  ];
  const [quoteIndex, setPromptIndex] = useState(0);

  // Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const glowPulseAnim = useRef(new Animated.Value(1)).current;
  const floatMascotAnim = useRef(new Animated.Value(0)).current;
  const scaleMascotAnim = useRef(new Animated.Value(1)).current;
  const timerBreatheAnim = useRef(new Animated.Value(0.7)).current;
  const quoteFadeAnim = useRef(new Animated.Value(1)).current;

  // Staggered Prep Cards Animations
  const prepCard1Op = useRef(new Animated.Value(0)).current;
  const prepCard1Tr = useRef(new Animated.Value(30)).current;
  const prepCard2Op = useRef(new Animated.Value(0)).current;
  const prepCard2Tr = useRef(new Animated.Value(30)).current;
  const prepCard3Op = useRef(new Animated.Value(0)).current;
  const prepCard3Tr = useRef(new Animated.Value(30)).current;

  // Golden Floating Particles
  const p1X = useRef(new Animated.Value(width * 0.15)).current;
  const p1Y = useRef(new Animated.Value(height)).current;
  const p1Opacity = useRef(new Animated.Value(0)).current;

  const p2X = useRef(new Animated.Value(width * 0.45)).current;
  const p2Y = useRef(new Animated.Value(height)).current;
  const p2Opacity = useRef(new Animated.Value(0)).current;

  const p3X = useRef(new Animated.Value(width * 0.75)).current;
  const p3Y = useRef(new Animated.Value(height)).current;
  const p3Opacity = useRef(new Animated.Value(0)).current;

  const p4X = useRef(new Animated.Value(width * 0.3)).current;
  const p4Y = useRef(new Animated.Value(height)).current;
  const p4Opacity = useRef(new Animated.Value(0)).current;

  // Background AppState Recovery Tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // AppState background timer sync
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

  // Main UI loops
  useEffect(() => {
    // Soft breathing background scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, { toValue: 1.04, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulseAnim, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Floating mascot animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatMascotAnim, { toValue: -6, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatMascotAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Scale mascot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleMascotAnim, { toValue: 1.05, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleMascotAnim, { toValue: 0.95, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer heartbeat glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerBreatheAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerBreatheAnim, { toValue: 0.7, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Floating Golden Particles Setup
    const runParticle = (x: Animated.Value, y: Animated.Value, op: Animated.Value, startLeft: number) => {
      y.setValue(height);
      x.setValue(startLeft + (Math.random() - 0.5) * 80);
      op.setValue(0);

      Animated.sequence([
        Animated.delay(Math.random() * 3000),
        Animated.parallel([
          Animated.timing(y, { toValue: height * 0.1, duration: 9000 + Math.random() * 4000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(6500),
            Animated.timing(op, { toValue: 0, duration: 2000, useNativeDriver: true })
          ])
        ])
      ]).start(() => runParticle(x, y, op, startLeft));
    };

    runParticle(p1X, p1Y, p1Opacity, width * 0.15);
    runParticle(p2X, p2Y, p2Opacity, width * 0.45);
    runParticle(p3X, p3Y, p3Opacity, width * 0.75);
    runParticle(p4X, p4Y, p4Opacity, width * 0.3);
  }, []);

  // Timer loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(6);
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

  // Quote rotation (faster in Dev: 8s, 45s in production)
  useEffect(() => {
    let rotation: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused) {
      const intervalMs = __DEV__ ? 8000 : 45000;
      rotation = setInterval(() => {
        Animated.timing(quoteFadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
          setPromptIndex((prev) => (prev + 1) % quotes.length);
          Animated.timing(quoteFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        });
      }, intervalMs);
    }
    return () => {
      if (rotation) clearInterval(rotation);
    };
  }, [step, isActive, isPaused]);

  // Trigger step 2 staggered card load
  useEffect(() => {
    if (step === 2) {
      Animated.stagger(250, [
        Animated.parallel([
          Animated.timing(prepCard1Op, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(prepCard1Tr, { toValue: 0, friction: 6, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(prepCard2Op, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(prepCard2Tr, { toValue: 0, friction: 6, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(prepCard3Op, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(prepCard3Tr, { toValue: 0, friction: 6, useNativeDriver: true })
        ])
      ]).start();
    }
  }, [step]);

  // Transition controller
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true
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
          body: JSON.stringify({ task_name: 'Make Eye Contact Once' })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(2);
  };

  // API Call: Eye Contact Confirmation
  const handleConfirmation = async (confirmed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!confirmed) {
      transitionToStep(3.5); // go to encouragement fallback
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-eye-contact-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Make Eye Contact Once',
            eye_contact_confirmed: true
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(4);
  };

  // API Call: Save Reflection Emotion
  const handleEmotionSelect = async (emotion: string) => {
    setSelectedEmotion(emotion);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-eye-contact-emotion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Make Eye Contact Once',
            eye_contact_confirmed: true,
            emotion
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    // Proceed to timer step after short delay
    setTimeout(() => {
      transitionToStep(5);
      setIsActive(true);
    }, 600);
  };

  // API Call: Complete Task
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
            task_name: 'Make Eye Contact Once',
            eye_contact_confirmed: true,
            eye_contact_emotion: selectedEmotion
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

    // Redirect to global success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You acknowledged presence.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev double click skip
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Breathing Amber/Cream Nature Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: glowPulseAnim }] }]}>
        <LinearGradient
          colors={['#FEF3C7', '#FFFBEB', '#FFF7ED']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Floating Golden Particles Layer */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View style={[styles.particle, { transform: [{ translateX: p1X }, { translateY: p1Y }], opacity: p1Opacity }]} />
        <Animated.View style={[styles.particle, { transform: [{ translateX: p2X }, { translateY: p2Y }], opacity: p2Opacity }, { width: 10, height: 10, borderRadius: 5 }]} />
        <Animated.View style={[styles.particle, { transform: [{ translateX: p3X }, { translateY: p3Y }], opacity: p3Opacity }]} />
        <Animated.View style={[styles.particle, { transform: [{ translateX: p4X }, { translateY: p4Y }], opacity: p4Opacity }, { width: 6, height: 6, borderRadius: 3 }]} />
      </View>

      {/* Vignette Overlay */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* HUD Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Abort Challenge?",
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
              <Feather name="x" size={18} color="#B45309" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 5 && isActive && !isPaused && { backgroundColor: '#F59E0B', shadowColor: '#F59E0B' }]} />
            <Text style={styles.statusText}>
              {step === 5 ? (isPaused ? 'PAUSE' : 'REFLECT') : `EYE.STAGE_${step}`}
            </Text>
          </View>
        </View>

        {/* Dynamic Slide View */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>

          {/* STEP 1: Details / Greet Intro */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.mainEmoji}>👁️🗨️</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Make Eye Contact Once</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(180, 83, 9, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#B45309' }]}>+200 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#4F46E5' }]}>3 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "Sometimes the deepest conversation happens without words."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "Real connection begins when we truly see each other."
                </Text>
                <Text style={styles.cardDescription}>
                  Today, make gentle eye contact with one person for a few seconds. Smile if it feels natural. The goal is to simply be present with another human being.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F59E0B', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>I'm Ready</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Staggered Prep Guide Cards */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Prepare your presence</Text>
              <Text style={styles.stepSubtitle}>
                Calm your thoughts and soften your focus before meeting another person's eyes.
              </Text>

              <View style={styles.prepCardsContainer}>
                {/* Card 1 */}
                <Animated.View style={[styles.prepCard, { opacity: prepCard1Op, transform: [{ translateY: prepCard1Tr }] }]}>
                  <View style={styles.prepCircle}>
                    <Ionicons name="eye-outline" size={24} color="#B45309" />
                  </View>
                  <View style={styles.prepTextCol}>
                    <Text style={styles.prepLabel}>Relax your eyes</Text>
                    <Text style={styles.prepDescription}>Soften your focus. Avoid staring or intense gazes; maintain soft, welcoming awareness.</Text>
                  </View>
                </Animated.View>

                {/* Card 2 */}
                <Animated.View style={[styles.prepCard, { opacity: prepCard2Op, transform: [{ translateY: prepCard2Tr }] }]}>
                  <View style={styles.prepCircle}>
                    <Feather name="smile" size={22} color="#B45309" />
                  </View>
                  <View style={styles.prepTextCol}>
                    <Text style={styles.prepLabel}>Keep a natural smile</Text>
                    <Text style={styles.prepDescription}>A subtle smile makes you approachable and lets the other person feel safe and acknowledged.</Text>
                  </View>
                </Animated.View>

                {/* Card 3 */}
                <Animated.View style={[styles.prepCard, { opacity: prepCard3Op, transform: [{ translateY: prepCard3Tr }] }]}>
                  <View style={styles.prepCircle}>
                    <FontAwesome5 name="seedling" size={20} color="#B45309" />
                  </View>
                  <View style={styles.prepTextCol}>
                    <Text style={styles.prepLabel}>Stay present</Text>
                    <Text style={styles.prepDescription}>Let go of internal judgments. Focus entirely on the human presence before you for just a few seconds.</Text>
                  </View>
                </Animated.View>
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 'auto' }]} onPress={() => transitionToStep(3)} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F59E0B', '#B45309']}
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

          {/* STEP 3: Yes/No Confirmation Card */}
          {step === 3 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.mainEmoji}>👁️🗨️</Text>
              </Animated.View>

              <View style={styles.confirmCard}>
                <Text style={styles.confirmQuestion}>Did you make gentle eye contact with someone today?</Text>
                <Text style={styles.confirmContext}>
                  It could have been a quick hello, a smile with a coworker, or acknowledging a stranger in passing.
                </Text>
              </View>

              <View style={styles.confirmButtonsRow}>
                <TouchableOpacity style={styles.confirmBtnYes} onPress={() => handleConfirmation(true)} activeOpacity={0.85}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.gradientBtn}>
                    <Feather name="check" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Yes, I Did</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtnNo} onPress={() => handleConfirmation(false)} activeOpacity={0.85}>
                  <View style={styles.innerConfirmBtnNo}>
                    <Feather name="rotate-ccw" size={16} color="#B45309" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmBtnNoText}>Not Yet</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3.5: Friendly Encouragement Slide */}
          {step === 3.5 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <View style={styles.encourageCircle}>
                <Ionicons name="sparkles" size={54} color="#D97706" />
              </View>
              <Text style={styles.encourageTitle}>Take your time!</Text>
              <Text style={styles.encourageMessage}>
                No pressure at all. Social confidence is a daily practice. Keep this challenge in mind as you walk through your day.
              </Text>
              <Text style={styles.encourageSubmessage}>
                Whenever you naturally cross paths with a colleague, neighbor, or shopkeeper—give it a try! We will be here when you are ready.
              </Text>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 40 }]} onPress={() => router.back()} activeOpacity={0.85}>
                <LinearGradient colors={['#F59E0B', '#B45309']} style={styles.gradientBtn}>
                  <Text style={styles.btnText}>Back to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Emotion Reflection Chips */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Reflect on the connection</Text>
              <Text style={styles.stepSubtitle}>
                "How did that moment feel?"
              </Text>

              <View style={styles.emotionGrid}>
                {[
                  { label: 'Comfortable', icon: '🌞' },
                  { label: 'Connected', icon: '💛' },
                  { label: 'Calm', icon: '🌱' },
                  { label: 'Confident', icon: '✨' },
                  { label: 'Warm', icon: '😊' },
                  { label: 'Seen', icon: '🤝' },
                ].map((item) => {
                  const isSelected = selectedEmotion === item.label;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.emotionChip, isSelected && styles.emotionChipSelected]}
                      onPress={() => handleEmotionSelect(item.label)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emotionIcon}>{item.icon}</Text>
                      <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.reflectionGuidance}>
                Tap the chip that best describes your experience to begin the reflection timer.
              </Text>
            </View>
          )}

          {/* STEP 5: 3-Minute Reflection Timer */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.timerEmoji}>👁️</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerDisplay, { opacity: timerBreatheAnim }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Animated.View style={[styles.quoteCard, { opacity: quoteFadeAnim }]}>
                <Text style={styles.quoteCaption}>{quotes[quoteIndex]}</Text>
              </Animated.View>

              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.controlText, isPaused && { color: '#FFFFFF' }]}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 6: Success Completion */}
          {step === 6 && (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>👁️🗨️</Text>
              <Text style={styles.successHeading}>You acknowledged presence.</Text>
              <Text style={styles.successContextText}>
                By looking another person in the eyes, you crossed the bridge of screen isolation and truly saw another human being. You are building real-world connection.
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F59E0B', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimButtonText}>
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
    backgroundColor: '#FFFBEB',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.45)',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(217, 119, 6, 0.01)',
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
    backgroundColor: 'rgba(180, 83, 9, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
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
    borderColor: 'rgba(180,83,9,0.15)',
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
    shadowColor: '#F59E0B',
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
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 4,
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
  prepCardsContainer: {
    width: '100%',
    gap: 16,
  },
  prepCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  prepCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  prepTextCol: {
    flex: 1,
  },
  prepLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  prepDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  confirmCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    marginBottom: 28,
  },
  confirmQuestion: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  confirmContext: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmButtonsRow: {
    width: '100%',
    gap: 12,
  },
  confirmBtnYes: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  confirmBtnNo: {
    width: '100%',
    height: 54,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  innerConfirmBtnNo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnNoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
  },
  encourageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  encourageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 10,
  },
  encourageMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  encourageSubmessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 28,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    minWidth: '45%',
  },
  emotionChipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: 'rgba(217, 119, 6, 0.25)',
    transform: [{ scale: 1.03 }],
  },
  emotionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emotionLabelSelected: {
    color: '#B45309',
  },
  reflectionGuidance: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  timerEmoji: {
    fontSize: 64,
  },
  timerDisplay: {
    fontSize: 78,
    fontWeight: '200',
    color: '#78350F',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(217, 119, 6, 0.06)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  quoteCard: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  quoteCaption: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  timerControls: {
    width: '60%',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B45309',
  },
  controlBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pauseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.25)',
  },
  resumeBtn: {
    backgroundColor: '#D97706',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  successEmoji: {
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
  successContextText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  claimButton: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 15,
    elevation: 4,
  },
  gradientClaimBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
