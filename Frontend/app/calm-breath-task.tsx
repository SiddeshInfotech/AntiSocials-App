import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const REFLECTION_DURATION = 120; // 2 minutes (120 seconds)

export default function CalmBreathTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Step navigation: 1 = Intro/Detail, 2 = Guided Breathing, 3 = Completed Breathing / Transition, 4 = Reflection Timer
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 2 state: Guided Breathing
  const [cycleCount, setCycleCount] = useState(0); // 0 to 3
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(4); // Inhale 4s, Hold 2s, Exhale 6s

  // Step 4 state: Reflection Timer
  const [timeLeft, setTimeLeft] = useState(REFLECTION_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current; // Main screen elements fade
  const stepTransitionAnim = useRef(new Animated.Value(1)).current; // Transition between steps
  
  // Breathing circle animations
  const circleScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Background cloud animations
  const cloud1X = useRef(new Animated.Value(-100)).current;
  const cloud2X = useRef(new Animated.Value(width + 50)).current;
  const cloud3Y = useRef(new Animated.Value(height * 0.4)).current;

  // AppState recovery tracking for the 2-minute timer
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Cloud Floating Background Loops
  useEffect(() => {
    const cloud1Anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud1X, { toValue: width + 100, duration: 32000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(cloud1X, { toValue: -100, duration: 0, useNativeDriver: true }),
      ])
    );

    const cloud2Anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud2X, { toValue: -150, duration: 42000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(cloud2X, { toValue: width + 100, duration: 0, useNativeDriver: true }),
      ])
    );

    const cloud3Anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud3Y, { toValue: height * 0.4 - 20, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(cloud3Y, { toValue: height * 0.4 + 20, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    cloud1Anim.start();
    cloud2Anim.start();
    cloud3Anim.start();

    return () => {
      cloud1Anim.stop();
      cloud2Anim.stop();
      cloud3Anim.stop();
    };
  }, []);

  // Idle glow pulsing animation
  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.25, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, []);

  // Step 2: Guided Breathing Cycle loop (using interval ticks)
  useEffect(() => {
    if (step !== 2) return;

    // Trigger haptic at start of step
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Initial scale timing trigger
    triggerBreathingCircleAnimation('inhale');

    const interval = setInterval(() => {
      setPhaseTimeLeft((prev) => {
        if (prev <= 1) {
          // Transition to next phase
          let nextPhase: 'inhale' | 'hold' | 'exhale' = 'inhale';
          let nextDuration = 4;

          if (breathPhase === 'inhale') {
            nextPhase = 'hold';
            nextDuration = 2;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Light alert for hold
          } else if (breathPhase === 'hold') {
            nextPhase = 'exhale';
            nextDuration = 6;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Clear release feedback
          } else if (breathPhase === 'exhale') {
            const nextCycle = cycleCount + 1;
            setCycleCount(nextCycle);

            if (nextCycle >= 3) {
              // Completed all 3 cycles!
              clearInterval(interval);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              transitionToStep(3);
              return 0;
            } else {
              nextPhase = 'inhale';
              nextDuration = 4;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }

          setBreathPhase(nextPhase);
          triggerBreathingCircleAnimation(nextPhase);
          return nextDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, breathPhase, cycleCount]);

  // Handle breathing circle scale target per phase
  const triggerBreathingCircleAnimation = (phase: 'inhale' | 'hold' | 'exhale') => {
    circleScale.stopAnimation();
    if (phase === 'inhale') {
      Animated.timing(circleScale, {
        toValue: 1.5,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (phase === 'hold') {
      // Stay expanded
      Animated.timing(circleScale, {
        toValue: 1.5,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    } else if (phase === 'exhale') {
      Animated.timing(circleScale, {
        toValue: 1.0,
        duration: 6000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  // Step 4: Reflection Timer run loop & background appstate handler
  useEffect(() => {
    let interval: any = null;

    if (step === 4 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleCompleteTask();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // AppState background/foreground recovery
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 4 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            handleCompleteTask();
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [step, isActive, isPaused]);

  // Fade out of current step and fade in the next step
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleStartBreathing = () => {
    transitionToStep(2);
  };

  const handleStartReflection = () => {
    transitionToStep(4);
    setIsActive(true);
  };

  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '20', totalPoints: '0', streak: '0' };
    
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Calm Breath',
            calm_breath_summary: `Breathing exercise completed: Yes | Reflection timer completed: Yes | Completion timestamp: ${new Date().toISOString()}`
          })
        });
        const data = await response.json();
        
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.pointsAdded?.toString() || '20', 
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0'
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('Error', data.error || 'Failed to submit task completion');
        }
      } else {
        Alert.alert('Authorization Error', 'No authorization token found. Please log in again.');
      }
    } catch(e) { 
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }

    router.replace({ 
      pathname: '/task-success', 
      params: { 
        points: pointsData.pointsAdded, 
        totalPoints: pointsData.totalPoints, 
        streak: pointsData.streak,
        message: 'You stabilized.',
        difficulty: 'medium'
      } 
    } as any);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // UI layout configurations for step 2 details
  const getPhaseColor = () => {
    if (breathPhase === 'inhale') return '#34d399'; // Calm Emerald Inhale
    if (breathPhase === 'hold') return '#38bdf8'; // Sky Blue Hold
    return '#fb7185'; // Soft Rose Exhale
  };

  const getPhaseTitle = () => {
    if (breathPhase === 'inhale') return 'Breathe In';
    if (breathPhase === 'hold') return 'Hold';
    return 'Breathe Out';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* BACKGROUND GRAPHICS: Calming Soft Sky to Forest breeze Gradient */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={step === 4 ? ['#03101E', '#061D2B', '#0A2624'] : ['#081729', '#0d2836', '#143c3c', '#1b4a3a']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Animated Background Clouds for calming depth */}
        <Animated.View style={[styles.cloud, { transform: [{ translateX: cloud1X }], top: height * 0.15, opacity: 0.08 }]} />
        <Animated.View style={[styles.cloud, { transform: [{ translateX: cloud2X }], top: height * 0.32, width: 140, height: 45, opacity: 0.05 }]} />
        <Animated.View style={[styles.cloud, { transform: [{ translateY: cloud3Y }], left: width * 0.2, width: 100, height: 35, opacity: 0.07 }]} />
        
        {/* Soft Radial Ambient Glow */}
        <View style={styles.radialGlow} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <View style={styles.hudBackIcon}>
              <Feather name="x" size={20} color="#34D399" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>
          <View style={styles.systemStatus}>
            <View style={[styles.dotIndicator, step === 4 && isActive && !isPaused && { backgroundColor: '#34D399', shadowColor: '#34D399' }]} />
            <Text style={styles.statusText}>
              {step === 4 ? (isPaused ? 'SYS.PAUSED' : 'SYS.ACTIVE') : 'BREATH.GUIDE'}
            </Text>
          </View>
        </View>

        {/* STEP TRANSITION ANIMATED CONTENT */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>
          
          {/* STEP 1: DETAILED INTRODUCTION */}
          {step === 1 && (
            <View style={styles.innerContainer}>
              <View style={styles.emojiContainer}>
                <Text style={styles.largeEmoji}>🌬️</Text>
              </View>

              <View style={styles.introHeader}>
                <Text style={styles.taskTitle}>Calm Breath</Text>
                <View style={styles.badgesRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#34D399' }]}>+20 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#38BDF8' }]}>2 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardPanel}>
                <View style={styles.panelEdge} />
                <Text style={styles.panelDescription}>
                  Take a short pause and calm your mind through slow, mindful breathing.{"\n\n"}
                  Follow the guided breathing rhythm, allowing your body to relax and your thoughts to slow down.{"\n\n"}
                  A few intentional breaths can reduce stress, improve focus, and help you feel more grounded.
                </Text>
                <View style={styles.divider} />
                <Text style={styles.quoteText}>
                  "A calm breath can change the direction of your day."
                </Text>
              </View>

              <View style={styles.illustrationArea}>
                <Animated.View style={[styles.pulseCircleGlow, { opacity: glowOpacity }]} />
                <View style={styles.staticCircle}>
                  <Feather name="wind" size={24} color="rgba(255,255,255,0.4)" />
                </View>
                <Text style={styles.instructionText}>
                  Let's slow everything down with a few deep breaths.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleStartBreathing} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#059669', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Begin Breathing</Text>
                  <Feather name="chevron-right" size={20} color="#061D2B" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: ANIMATED BREATHING CYCLE */}
          {step === 2 && (
            <View style={styles.innerContainer}>
              <View style={styles.breathCycleIndicator}>
                <Text style={styles.cycleLabel}>CYCLE {cycleCount + 1} OF 3</Text>
                <View style={styles.cycleProgressBg}>
                  <View style={[styles.cycleProgressFill, { width: `${((cycleCount * 12 + (12 - phaseTimeLeft)) / 36) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.animationCenterpiece}>
                {/* Outermost breathing visual waves */}
                <Animated.View style={[styles.breathingOuterWave, { transform: [{ scale: circleScale }], opacity: 0.12, borderColor: getPhaseColor() }]} />
                <Animated.View style={[styles.breathingInnerWave, { transform: [{ scale: Animated.multiply(circleScale, 0.85) }], opacity: 0.2, backgroundColor: getPhaseColor() }]} />
                <Animated.View style={[styles.breathingCoreCircle, { transform: [{ scale: Animated.multiply(circleScale, 0.7) }], shadowColor: getPhaseColor() }]}>
                  <Text style={styles.coreEmoji}>🌬️</Text>
                </Animated.View>

                {/* Live seconds countdown inside step */}
                <Text style={[styles.phaseCountdown, { color: getPhaseColor() }]}>{phaseTimeLeft}s</Text>
              </View>

              <View style={styles.breathInstructionCard}>
                <Text style={[styles.breathPhaseTitle, { color: getPhaseColor() }]}>
                  {getPhaseTitle()}
                </Text>
                <Text style={styles.breathPhaseHint}>
                  {breathPhase === 'inhale' && 'Allow your stomach to expand as you fill your lungs.'}
                  {breathPhase === 'hold' && 'Pause and let stillness rest in your body.'}
                  {breathPhase === 'exhale' && 'Release slowly, letting go of any lingering tension.'}
                </Text>
              </View>

              <View style={styles.breathTimingsHUD}>
                <View style={[styles.timingPill, breathPhase === 'inhale' && styles.timingPillActive]}>
                  <Text style={styles.timingPillText}>Inhale 4s</Text>
                </View>
                <View style={[styles.timingPill, breathPhase === 'hold' && styles.timingPillActive]}>
                  <Text style={styles.timingPillText}>Hold 2s</Text>
                </View>
                <View style={[styles.timingPill, breathPhase === 'exhale' && styles.timingPillActive]}>
                  <Text style={styles.timingPillText}>Exhale 6s</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: BREATHING COMPLETED / TRANSITION SCREEN */}
          {step === 3 && (
            <View style={[styles.innerContainer, { justifyContent: 'center', gap: 40 }]}>
              <View style={styles.successBadgeArea}>
                <View style={styles.checkmarkOuter}>
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.checkmarkInner}
                  >
                    <Feather name="check" size={44} color="#052E16" />
                  </LinearGradient>
                </View>
                <Text style={styles.calmSuccessText}>
                  Your breathing has slowed. Stay with this calm.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleStartReflection} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#0284C7', '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Start Reflection Timer</Text>
                  <Feather name="clock" size={18} color="#061D2B" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: 2-MINUTE REFLECTION TIMER */}
          {step === 4 && (
            <View style={[styles.innerContainer, { justifyContent: 'space-between' }]}>
              <View style={styles.timerHeader}>
                <Text style={styles.timerStageTitle}>Mindful Reflection</Text>
                <Text style={styles.timerStageDesc}>
                  Put away notifications. Sit with stillness while the clock runs down.
                </Text>
              </View>

              {/* Countdown timer centerpiece */}
              <View style={styles.reflectionTimerContainer}>
                <View style={styles.reflectionRing}>
                  <Text style={styles.reflectionDigits}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.reflectionSubtext}>REMAINING</Text>
                </View>
              </View>

              {/* Pause / Resume Controls */}
              <View style={styles.reflectionControlsRow}>
                <TouchableOpacity
                  style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.75}
                >
                  <Feather name={isPaused ? 'play' : 'pause'} size={20} color="#fff" />
                  <Text style={styles.controlBtnText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
                </TouchableOpacity>

                {/* Instant abort/quit options handles by top bar X */}
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
    backgroundColor: '#05101E',
  },
  safeArea: {
    flex: 1,
  },
  cloud: {
    position: 'absolute',
    width: 180,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  radialGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: 'rgba(52, 211, 153, 0.04)',
    top: height * 0.2,
    left: -width * 0.25,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBackIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  backText: {
    fontSize: 12,
    color: '#34D399',
    marginLeft: 8,
    fontWeight: '700',
    letterSpacing: 2,
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 25,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  emojiContainer: {
    marginTop: 15,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  largeEmoji: {
    fontSize: 38,
  },
  introHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  taskTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardPanel: {
    backgroundColor: 'rgba(10, 20, 32, 0.65)',
    padding: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    position: 'relative',
    marginTop: 15,
  },
  panelEdge: {
    position: 'absolute',
    top: -1,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#34D399',
  },
  panelDescription: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  quoteText: {
    color: '#34D399',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  illustrationArea: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  pulseCircleGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34D399',
    top: 0,
  },
  staticCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryActionBtn: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: {
    color: '#061D2B',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Step 2: Guided breathing styles
  breathCycleIndicator: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  cycleLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cycleProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: '80%',
    overflow: 'hidden',
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2,
  },
  animationCenterpiece: {
    height: height * 0.35,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  breathingOuterWave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
  },
  breathingInnerWave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  breathingCoreCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0F1D30',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  coreEmoji: {
    fontSize: 48,
  },
  phaseCountdown: {
    position: 'absolute',
    bottom: 25,
    fontSize: 22,
    fontWeight: 'bold',
  },
  breathInstructionCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  breathPhaseTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  breathPhaseHint: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  breathTimingsHUD: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  timingPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  timingPillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  timingPillText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },

  // Step 3: transition styles
  successBadgeArea: {
    alignItems: 'center',
    gap: 20,
  },
  checkmarkOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  checkmarkInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmSuccessText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 26,
  },

  // Step 4: Reflection styles
  timerHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerStageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  timerStageDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  reflectionTimerContainer: {
    marginVertical: 40,
  },
  reflectionRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  reflectionDigits: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFF',
  },
  reflectionSubtext: {
    fontSize: 10,
    color: '#38BDF8',
    letterSpacing: 2,
    fontWeight: '800',
    marginTop: 4,
  },
  reflectionControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 30,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
  },
  pauseBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resumeBtn: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: '#34D399',
  },
  controlBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
