import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 300; // 5 minutes in seconds

export default function SitNearPeopleTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Steps:
  // 1: Introduction / Premium Layout
  // 2: Comfort Meter (Nervous, Comfortable, Relaxed)
  // 3: Empty Seat Selection (with 1 glowing chair)
  // 4: 5-Minute Public Seating Timer
  // 5: Success Completion Screen
  const [step, setStep] = useState(1);
  const [comfortLevel, setComfortLevel] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Rotating timer prompts
  const prompts = [
    '👀 "Notice the people around you."',
    '🌿 "You don\'t need to perform."',
    '☁️ "It\'s okay to simply exist here."',
    '🫶 "You\'re sharing space, and that\'s enough."',
    '✨ "Comfort grows with presence."'
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  // Animation values
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const floatMascotAnim = useRef(new Animated.Value(0)).current;
  const scaleMascotAnim = useRef(new Animated.Value(1)).current;
  const timerCircleBreathe = useRef(new Animated.Value(0.7)).current;
  const promptFadeAnim = useRef(new Animated.Value(1)).current;

  // Background breathing scale pulse (Lavender Glow)
  const bgBreathingAnim = useRef(new Animated.Value(1)).current;
  const purpleGlowOpacity = useRef(new Animated.Value(0.15)).current;

  // Seating page chair glow pulses
  const chairGlowPulse = useRef(new Animated.Value(0.6)).current;

  // Comfort Meter segment selection animation values
  const nervousScale = useRef(new Animated.Value(1)).current;
  const comfortableScale = useRef(new Animated.Value(1)).current;
  const relaxedScale = useRef(new Animated.Value(1)).current;

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
    // Mascot floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatMascotAnim, { toValue: -8, duration: 3300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatMascotAnim, { toValue: 0, duration: 3300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Background scale pulse breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgBreathingAnim, { toValue: 1.04, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgBreathingAnim, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Purple Glow opacity breath
    Animated.loop(
      Animated.sequence([
        Animated.timing(purpleGlowOpacity, { toValue: 0.35, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(purpleGlowOpacity, { toValue: 0.15, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Mascot scale pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleMascotAnim, { toValue: 1.04, duration: 3300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleMascotAnim, { toValue: 0.96, duration: 3300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer circle breathe glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerCircleBreathe, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerCircleBreathe, { toValue: 0.65, duration: 2300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Chair glowing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(chairGlowPulse, { toValue: 1.1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(chairGlowPulse, { toValue: 0.6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
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

  // Mindfulness prompts rotation (Dev: 10s, Prod: 60s)
  useEffect(() => {
    let promptTimer: ReturnType<typeof setInterval>;
    if (step === 4 && isActive && !isPaused) {
      const intervalMs = __DEV__ ? 10000 : 60000;
      promptTimer = setInterval(() => {
        Animated.timing(promptFadeAnim, { toValue: 0, duration: 550, useNativeDriver: true }).start(() => {
          setPromptIndex((prev) => (prev + 1) % prompts.length);
          Animated.timing(promptFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        });
      }, intervalMs);
    }
    return () => {
      if (promptTimer) clearInterval(promptTimer);
    };
  }, [step, isActive, isPaused]);

  // Transition controller
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
        await apiFetch('/api/tasks/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Sit Near People' })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(2);
  };

  // Select comfort level segment
  const handleSelectComfort = (level: string) => {
    setComfortLevel(level);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const scaleMap = {
      'Very Nervous': nervousScale,
      'Comfortable': comfortableScale,
      'Relaxed': relaxedScale,
    };

    const activeScale = scaleMap[level as keyof typeof scaleMap];
    if (activeScale) {
      Animated.sequence([
        Animated.timing(activeScale, { toValue: 1.06, duration: 150, useNativeDriver: true }),
        Animated.spring(activeScale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    }
  };

  // API Call: Save Comfort Level
  const handleConfirmComfort = async () => {
    if (!comfortLevel) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-comfort-level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Sit Near People',
            comfort_level: comfortLevel
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(3);
  };

  // Chair tap
  const handleSelectSeat = (seatId: number) => {
    setSelectedSeat(seatId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Start Seating Walk timer
  const handleSeatedContinue = () => {
    if (selectedSeat === null) {
      Alert.alert('Choose a Chair', 'Tap one of the empty chairs to sit down and begin.');
      return;
    }
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
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Sit Near People',
            comfort_level: comfortLevel
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
        message: 'You stayed in space.',
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Breathing Dusty Lavender Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: bgBreathingAnim }] }]}>
        <LinearGradient
          colors={['#F0EFFB', '#E8ECF3', '#D9DCEB']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Soft Purple Glow Pulse Effect */}
      <Animated.View
        style={[
          styles.purpleGlow,
          { opacity: purpleGlowOpacity }
        ]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
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
              <Feather name="x" size={18} color="#8B7CF8" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 4 && isActive && !isPaused && { backgroundColor: '#8B7CF8', shadowColor: '#8B7CF8' }]} />
            <Text style={styles.statusText}>
              {step === 4 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `SPACE.STEP_${step}`}
            </Text>
          </View>
        </View>

        {/* Dynamic Slide Step Content */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>

          {/* STEP 1: Details Greet Layout */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.mainEmoji}>🪑</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Sit Near People</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(139, 124, 248, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#8B7CF8' }]}>+300 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#4F46E5' }]}>5 Min</Text>
                  </View>
                </View>
              </View>

              {/* Glassmorphic Frosted Card */}
              <View style={styles.frostedGlassCard}>
                <Text style={styles.quoteText}>
                  "Confidence begins with being comfortable in shared spaces."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "You don't have to talk. Just be comfortably present."
                </Text>
                <Text style={styles.cardDescription}>
                  Spend five minutes sitting near other people (café, library, lounge) without using your phone. Simply observe your surroundings and share space calmly.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#8B7CF8', '#5C6BC0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Find a Spot</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Comfort Meter Selection */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Comfort Meter</Text>
              <Text style={styles.stepSubtitle}>
                "How comfortable do you feel right now?"
              </Text>

              {/* Staggered dynamic glass segment controls */}
              <View style={styles.comfortMeterContainer}>
                {/* Segment 1 */}
                <Animated.View style={{ transform: [{ scale: nervousScale }] }}>
                  <TouchableOpacity
                    style={[styles.comfortSegment, comfortLevel === 'Very Nervous' && styles.comfortSegmentActive]}
                    onPress={() => handleSelectComfort('Very Nervous')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.comfortEmoji}>😟</Text>
                    <View style={styles.comfortTextCol}>
                      <Text style={[styles.comfortLabel, comfortLevel === 'Very Nervous' && styles.comfortLabelActive]}>Very Nervous</Text>
                      <Text style={styles.comfortSublabel}>Feeling some social tension or anxiety</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Segment 2 */}
                <Animated.View style={{ transform: [{ scale: comfortableScale }] }}>
                  <TouchableOpacity
                    style={[styles.comfortSegment, comfortLevel === 'Comfortable' && styles.comfortSegmentActive]}
                    onPress={() => handleSelectComfort('Comfortable')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.comfortEmoji}>🙂</Text>
                    <View style={styles.comfortTextCol}>
                      <Text style={[styles.comfortLabel, comfortLevel === 'Comfortable' && styles.comfortLabelActive]}>Comfortable</Text>
                      <Text style={styles.comfortSublabel}>Slightly alert but feeling okay sharing space</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Segment 3 */}
                <Animated.View style={{ transform: [{ scale: relaxedScale }] }}>
                  <TouchableOpacity
                    style={[styles.comfortSegment, comfortLevel === 'Relaxed' && styles.comfortSegmentActive]}
                    onPress={() => handleSelectComfort('Relaxed')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.comfortEmoji}>😌</Text>
                    <View style={styles.comfortTextCol}>
                      <Text style={[styles.comfortLabel, comfortLevel === 'Relaxed' && styles.comfortLabelActive]}>Relaxed</Text>
                      <Text style={styles.comfortSublabel}>Completely at peace with the environment</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 'auto' }, !comfortLevel && styles.disabledBtn]}
                disabled={!comfortLevel}
                onPress={handleConfirmComfort}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={!comfortLevel ? ['#CBD5E1', '#94A3B8'] : ['#8B7CF8', '#5C6BC0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Confirm Comfort</Text>
                  <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Empty Seat Selection Screen */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Take a Seat</Text>
              <Text style={styles.stepSubtitle}>
                "Take a seat. Observe without judgment."
              </Text>

              {/* Rows of empty seats with 1 glowing chair */}
              <View style={styles.seatingLayout}>
                {[1, 2, 3].map((seatId) => {
                  const isGlowChair = seatId === 2; // Chair 2 is the glowing chair
                  const isSelected = selectedSeat === seatId;

                  return (
                    <TouchableOpacity
                      key={seatId}
                      style={[
                        styles.chairWrapper,
                        isSelected && styles.chairSelected,
                        isGlowChair && !isSelected && styles.chairGlowBase
                      ]}
                      onPress={() => handleSelectSeat(seatId)}
                      activeOpacity={0.85}
                    >
                      {isGlowChair && !isSelected && (
                        <Animated.View
                          style={[
                            styles.glowingPulseRing,
                            {
                              transform: [{ scale: chairGlowPulse }],
                              opacity: chairGlowPulse.interpolate({ inputRange: [0.6, 1.1], outputRange: [0.4, 0] })
                            }
                          ]}
                        />
                      )}
                      <Text style={[styles.chairEmoji, isSelected && { transform: [{ scale: 1.08 }] }]}>
                        {isSelected ? '🧎' : '🪑'}
                      </Text>
                      <Text style={styles.chairNumber}>Seat {seatId}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 'auto' }]} onPress={handleSeatedContinue} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#8B7CF8', '#5C6BC0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>I'm Seated</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: 5-Minute Seating Timer */}
          {step === 4 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerMascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.timerLargeEmoji}>🪑</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerDisplay, { opacity: timerCircleBreathe }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Animated.View style={[styles.promptCard, { opacity: promptFadeAnim }]}>
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

          {/* STEP 5: Success completion reward slide */}
          {step === 5 && (
            <View style={styles.successContainer}>
              <Text style={styles.successLargeEmoji}>🪑</Text>
              <Text style={styles.successHeading}>You stayed in space.</Text>
              <Text style={styles.successContext}>
                Sharing space with others without retreating to your device builds public confidence, reduces environmental tension, and grounds you in real-world human presence.
              </Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#8B7CF8', '#5C6BC0']}
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
    backgroundColor: '#F0EFFB',
  },
  purpleGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8B7CF8',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(92, 107, 192, 0.01)',
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
    backgroundColor: 'rgba(139, 124, 248, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B7CF8',
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
    borderColor: 'rgba(139, 124, 248, 0.15)',
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
    color: '#312E81',
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
    shadowColor: '#8B7CF8',
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
    backgroundColor: '#E8ECF3',
  },
  mediumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  frostedGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    shadowColor: '#8B7CF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#312E81',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(139, 124, 248, 0.12)',
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
    shadowColor: '#8B7CF8',
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
  comfortMeterContainer: {
    width: '100%',
    gap: 16,
  },
  comfortSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#8B7CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  comfortSegmentActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#8B7CF8',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1.5,
  },
  comfortEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  comfortTextCol: {
    flex: 1,
  },
  comfortLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  comfortLabelActive: {
    color: '#312E81',
  },
  comfortSublabel: {
    fontSize: 12,
    color: '#64748B',
  },
  seatingLayout: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    marginTop: 20,
  },
  chairWrapper: {
    width: width * 0.24,
    height: width * 0.32,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#8B7CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chairSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#8B7CF8',
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  chairGlowBase: {
    borderColor: 'rgba(139, 124, 248, 0.45)',
    borderWidth: 1.5,
  },
  glowingPulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#8B7CF8',
  },
  chairEmoji: {
    fontSize: 38,
    marginBottom: 8,
  },
  chairNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  timerMascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#8B7CF8',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  timerLargeEmoji: {
    fontSize: 60,
  },
  timerDisplay: {
    fontSize: 78,
    fontWeight: '200',
    color: '#312E81',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(139, 124, 248, 0.08)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  promptCard: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#312E81',
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
    shadowColor: '#8B7CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pauseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(139, 124, 248, 0.25)',
  },
  resumeBtn: {
    backgroundColor: '#8B7CF8',
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B7CF8',
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
    shadowColor: '#8B7CF8',
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
