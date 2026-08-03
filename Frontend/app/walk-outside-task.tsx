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
const TIMER_DURATION = 600; // 10 minutes in seconds

export default function WalkOutsideTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Task Steps:
  // 1: Introduction / Details
  // 2: Preparation Checklist
  // 3: Start Walking Motivational screen
  // 4: 10-Minute Walk Timer
  // 5: Completion Success Screen
  const [step, setStep] = useState(1);

  // Preparation items check state
  const [phoneInPocket, setPhoneInPocket] = useState(false);
  const [deepBreath, setDeepBreath] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);

  // Timer states
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isLoading, setIsLoading] = useState(false);

  // Rotating prompts
  const prompts = [
    '🌤️ "Look up at the sky."',
    '🌳 "Notice something green."',
    '🍃 "Feel the fresh air."',
    '👣 "Keep a comfortable pace."',
    '🌼 "Observe something you\'ve never noticed before."'
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  // Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const mascotFloatAnim = useRef(new Animated.Value(0)).current;
  const mascotScaleAnim = useRef(new Animated.Value(0.95)).current;
  const timerGlowAnim = useRef(new Animated.Value(0.6)).current;
  const promptFadeAnim = useRef(new Animated.Value(1)).current;

  // Checklist bounces
  const check1Scale = useRef(new Animated.Value(1)).current;
  const check2Scale = useRef(new Animated.Value(1)).current;
  const check3Scale = useRef(new Animated.Value(1)).current;

  // Nature floating leaves animation values
  const leaf1X = useRef(new Animated.Value(-50)).current;
  const leaf1Y = useRef(new Animated.Value(height * 0.2)).current;
  const leaf1Rot = useRef(new Animated.Value(0)).current;

  const leaf2X = useRef(new Animated.Value(width + 50)).current;
  const leaf2Y = useRef(new Animated.Value(height * 0.5)).current;
  const leaf2Rot = useRef(new Animated.Value(0)).current;

  const leaf3X = useRef(new Animated.Value(-50)).current;
  const leaf3Y = useRef(new Animated.Value(height * 0.75)).current;
  const leaf3Rot = useRef(new Animated.Value(0)).current;

  // Background appState recovery tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // AppState listener for background timer tracking
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

  // Initial loops for breathing background, float mascot, and leaves
  useEffect(() => {
    // Background breathing scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background shift color loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 18000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Mascot float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnim, { toValue: -8, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotFloatAnim, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Mascot scale pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScaleAnim, { toValue: 1.04, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(mascotScaleAnim, { toValue: 0.96, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer Glow pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerGlowAnim, { toValue: 0.6, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Floating Leaf 1 Loop
    const floatLeaf1 = () => {
      leaf1X.setValue(-50);
      leaf1Y.setValue(height * 0.15 + Math.random() * 80);
      leaf1Rot.setValue(0);
      Animated.parallel([
        Animated.timing(leaf1X, { toValue: width + 50, duration: 12000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(leaf1Y, { toValue: height * 0.4 + Math.random() * 100, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(leaf1Rot, { toValue: 6, duration: 12000, easing: Easing.linear, useNativeDriver: true })
      ]).start(() => floatLeaf1());
    };

    // Floating Leaf 2 Loop
    const floatLeaf2 = () => {
      leaf2X.setValue(width + 50);
      leaf2Y.setValue(height * 0.4 + Math.random() * 80);
      leaf2Rot.setValue(0);
      Animated.parallel([
        Animated.timing(leaf2X, { toValue: -50, duration: 14000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(leaf2Y, { toValue: height * 0.65 + Math.random() * 100, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(leaf2Rot, { toValue: -6, duration: 14000, easing: Easing.linear, useNativeDriver: true })
      ]).start(() => floatLeaf2());
    };

    // Floating Leaf 3 Loop
    const floatLeaf3 = () => {
      leaf3X.setValue(-50);
      leaf3Y.setValue(height * 0.65 + Math.random() * 80);
      leaf3Rot.setValue(0);
      Animated.parallel([
        Animated.timing(leaf3X, { toValue: width + 50, duration: 13000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(leaf3Y, { toValue: height * 0.9 + Math.random() * 100, duration: 13000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(leaf3Rot, { toValue: 8, duration: 13000, easing: Easing.linear, useNativeDriver: true })
      ]).start(() => floatLeaf3());
    };

    // Launch floating leaves animations
    floatLeaf1();
    floatLeaf2();
    floatLeaf3();
  }, []);

  // Timer countdown loop
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

  // Prompt cycle rotation loop (every 10s in Dev for visual testing, 120s in Prod)
  useEffect(() => {
    let promptInterval: ReturnType<typeof setInterval>;
    if (step === 4 && isActive && !isPaused) {
      const durationMs = __DEV__ ? 12000 : 120000; // Rotate faster in Dev
      promptInterval = setInterval(() => {
        Animated.timing(promptFadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          setPromptIndex((prev) => (prev + 1) % prompts.length);
          Animated.timing(promptFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        });
      }, durationMs);
    }
    return () => {
      if (promptInterval) clearInterval(promptInterval);
    };
  }, [step, isActive, isPaused]);

  // Transition helper with step fadeout & fadein springs
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
          body: JSON.stringify({ task_name: 'Walk Outside for 10 Minutes' })
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
    let c1 = phoneInPocket;
    let c2 = deepBreath;
    let c3 = doorOpen;

    if (index === 1) {
      c1 = !phoneInPocket;
      setPhoneInPocket(c1);
      Animated.sequence([
        Animated.timing(check1Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(check1Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    } else if (index === 2) {
      c2 = !deepBreath;
      setDeepBreath(c2);
      Animated.sequence([
        Animated.timing(check2Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(check2Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    } else {
      c3 = !doorOpen;
      setDoorOpen(c3);
      Animated.sequence([
        Animated.timing(check3Scale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(check3Scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    }

    const allCompleted = c1 && c2 && c3;

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-prep-checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Walk Outside for 10 Minutes',
            prep_completed: allCompleted
          })
        });
      }
    } catch (e) {
      console.error('Error saving checklist progress:', e);
    }
  };

  // Go to step 3
  const handleChecklistContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(3);
  };

  // Go to step 4 (start walk timer)
  const handleStartWalking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(4);
    setIsActive(true);
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
            task_name: 'Walk Outside for 10 Minutes',
            prep_completed: true
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
      } else {
        Alert.alert('Auth Error', 'No authorization token found. Please log in again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }

    // Route to success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You stepped out.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev skip: double click timer to skip walking timer
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

  // Leaf interpolates for floating breeze rotation
  const leaf1Spin = leaf1Rot.interpolate({ inputRange: [0, 6], outputRange: ['0deg', '360deg'] });
  const leaf2Spin = leaf2Rot.interpolate({ inputRange: [-6, 0], outputRange: ['-360deg', '0deg'] });
  const leaf3Spin = leaf3Rot.interpolate({ inputRange: [0, 8], outputRange: ['0deg', '360deg'] });

  const allPrepChecked = phoneInPocket && deepBreath && doorOpen;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Breathing Nature Background (LinearGradients) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <LinearGradient
          colors={step === 4 ? ['#ECFDF5', '#D1FAE5', '#D1FAE5'] : ['#F0FDF4', '#E8F5E9', '#FFFDEB']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
        <LinearGradient
          colors={step === 4 ? ['#D1FAE5', '#A7F3D0', '#34D399'] : ['#E8F5E9', '#FFFDF0', '#F1F8E9']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Nature Floating leaves decoration layer */}
      {step === 4 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Animated.View style={[styles.leaf, { transform: [{ translateX: leaf1X }, { translateY: leaf1Y }, { rotate: leaf1Spin }] }]}>
            <MaterialCommunityIcons name="leaf" size={20} color="rgba(16, 185, 129, 0.4)" />
          </Animated.View>
          <Animated.View style={[styles.leaf, { transform: [{ translateX: leaf2X }, { translateY: leaf2Y }, { rotate: leaf2Spin }] }]}>
            <MaterialCommunityIcons name="leaf-maple" size={24} color="rgba(4, 120, 87, 0.3)" />
          </Animated.View>
          <Animated.View style={[styles.leaf, { transform: [{ translateX: leaf3X }, { translateY: leaf3Y }, { rotate: leaf3Spin }] }]}>
            <MaterialCommunityIcons name="leaf" size={16} color="rgba(52, 211, 153, 0.4)" />
          </Animated.View>
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
                "Abort Walk?",
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
              <Feather name="x" size={18} color="#059669" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 4 && isActive && !isPaused && { backgroundColor: '#10B981', shadowColor: '#10B981' }]} />
            <Text style={styles.statusText}>
              {step === 4 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `WALK.STEP_${step}`}
            </Text>
          </View>
        </View>

        {/* Multi-step screen slides */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>
          
          {/* STEP 1: Introduction / Details */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.mainEmoji}>🥾</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Walk Outside for 10 Minutes</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#059669' }]}>+200 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#4F46E5' }]}>10 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "A short walk can change your entire mindset."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "Sometimes the best reset begins with a single step."
                </Text>
                <Text style={styles.cardDescription}>
                  Take a break from screens and step outside. Walk at your own pace for 10 minutes while paying attention to your surroundings.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Let's Go Outside</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Prep Checklist */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Let's get ready</Text>
              <Text style={styles.stepSubtitle}>
                Prepare yourself to step away from screens and connect with the real world outside.
              </Text>

              <View style={styles.checklistContainer}>
                {/* Check 1 */}
                <Animated.View style={[styles.checklistCard, phoneInPocket && styles.checklistCardCompleted, { transform: [{ scale: check1Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, phoneInPocket && styles.checklistLabelCompleted]}>Phone in Pocket</Text>
                    <Text style={styles.checklistSublabel}>Safely tuck your phone away to avoid visual distractions</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, phoneInPocket && styles.checkboxCompleted]}
                    onPress={() => handleToggleChecklist(1)}
                    activeOpacity={0.7}
                  >
                    {phoneInPocket ? (
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Check 2 */}
                <Animated.View style={[styles.checklistCard, deepBreath && styles.checklistCardCompleted, { transform: [{ scale: check2Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, deepBreath && styles.checklistLabelCompleted]}>Deep Breath</Text>
                    <Text style={styles.checklistSublabel}>Take one conscious, slow breath to ground yourself</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, deepBreath && styles.checkboxCompleted]}
                    onPress={() => handleToggleChecklist(2)}
                    activeOpacity={0.7}
                  >
                    {deepBreath ? (
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                    ) : (
                      <View style={styles.checkboxPlaceholder} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Check 3 */}
                <Animated.View style={[styles.checklistCard, doorOpen && styles.checklistCardCompleted, { transform: [{ scale: check3Scale }] }]}>
                  <View style={styles.checklistTextContainer}>
                    <Text style={[styles.checklistLabel, doorOpen && styles.checklistLabelCompleted]}>Open the Door</Text>
                    <Text style={styles.checklistSublabel}>Step outside onto the trail, path, or street</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, doorOpen && styles.checkboxCompleted]}
                    onPress={() => handleToggleChecklist(3)}
                    activeOpacity={0.7}
                  >
                    {doorOpen ? (
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
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
                  colors={!allPrepChecked ? ['#CBD5E1', '#94A3B8'] : ['#10B981', '#059669']}
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

          {/* STEP 3: Motivational Screen */}
          {step === 3 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.mainEmoji}>🥾</Text>
              </Animated.View>

              <Text style={styles.motivationalTitle}>Ready to begin?</Text>
              <Text style={styles.motivationalMessage}>
                "Enjoy your walk. Notice the world around you instead of your screen."
              </Text>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 40 }]} onPress={handleStartWalking} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Start Walking</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: 10-Minute Walk Timer with prompts */}
          {step === 4 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerMascotCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.timerLargeEmoji}>🥾</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Animated.View style={[styles.promptContainer, { opacity: promptFadeAnim }]}>
                <Text style={styles.promptText}>
                  {prompts[promptIndex]}
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

          {/* STEP 5: Success Reward State */}
          {step === 5 && (
            <View style={styles.successContainer}>
              <Text style={styles.successLargeEmoji}>🥾</Text>
              <Text style={styles.successText}>You stepped out.</Text>
              <Text style={styles.successSubtext}>
                Taking a break from screens and moving through nature feeds the soul, refreshes focus, and brings peace to your mind.
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
    backgroundColor: '#F0FDF4',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  leaf: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
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
    borderColor: 'rgba(16,185,129,0.15)',
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
    color: '#064E3B',
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
    shadowColor: '#10B981',
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
    shadowColor: '#10B981',
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
    color: '#064E3B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
    shadowColor: '#10B981',
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
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  checklistCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(16, 163, 129, 0.15)',
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
    color: '#047857',
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
    borderColor: '#10B981',
    backgroundColor: 'transparent',
  },
  motivationalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
  },
  motivationalMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#064E3B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  timerMascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#10B981',
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
    color: '#064E3B',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(16, 185, 129, 0.08)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  promptContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
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
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pauseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  resumeBtn: {
    backgroundColor: '#059669',
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
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
