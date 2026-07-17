import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Easing, Dimensions, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const REFLECTION_DURATION = 300; // 5 minutes (300 seconds)

export default function CourageUnlockTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Step flow: 
  // 1 = Locked Intro
  // 2 = Input Fear/Limit (min 20 chars)
  // 3 = Input Commitment (min 15 chars)
  // 4 = Unlock animation
  // 5 = Reflection timer (displays user commitment)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Inputs
  const [fear, setFear] = useState('');
  const [commitment, setCommitment] = useState('');

  // Step 5 timer state
  const [timeLeft, setTimeLeft] = useState(REFLECTION_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // General Fade Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;

  // Background spotlight floating
  const spotX = useRef(new Animated.Value(-50)).current;
  const spotY = useRef(new Animated.Value(-50)).current;

  // STEP 4 - ANIMATIONS REFS
  const keyTranslateX = useRef(new Animated.Value(60)).current;
  const keyTranslateY = useRef(new Animated.Value(-60)).current;
  const keyRotate = useRef(new Animated.Value(0)).current;
  const keyScale = useRef(new Animated.Value(1.4)).current;
  const keyOpacity = useRef(new Animated.Value(0)).current;

  const shackleTranslateY = useRef(new Animated.Value(0)).current;
  const lockRotate = useRef(new Animated.Value(0)).current;
  const lockScale = useRef(new Animated.Value(1)).current;
  
  const glowScale = useRef(new Animated.Value(0.1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Spark/Particle Animated Refs (10 particles)
  const particles = useRef(Array.from({ length: 10 }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  // AppState recovery tracking for 5-minute timer
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Spotlight animation loop
  useEffect(() => {
    const floatSpot = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(spotX, { toValue: width * 0.4, duration: 15000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(spotY, { toValue: height * 0.2, duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(spotX, { toValue: -50, duration: 15000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(spotY, { toValue: -50, duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ])
    );
    floatSpot.start();
    return () => floatSpot.stop();
  }, []);

  // Trigger unlock sequence in Step 4
  useEffect(() => {
    if (step !== 4) return;

    // Reset animations
    keyTranslateX.setValue(60);
    keyTranslateY.setValue(-60);
    keyRotate.setValue(0);
    keyScale.setValue(1.4);
    keyOpacity.setValue(0);
    shackleTranslateY.setValue(0);
    lockRotate.setValue(0);
    lockScale.setValue(1);
    glowScale.setValue(0.1);
    glowOpacity.setValue(0);

    particles.forEach(p => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.scale.setValue(0);
      p.opacity.setValue(0);
    });

    // Golden key unlock haptic triggers
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const keyTurnTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1200);

    const lockOpenTimer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1600);

    // START ANIMATION
    // 1. Key enters lock
    Animated.sequence([
      Animated.parallel([
        Animated.timing(keyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(keyTranslateX, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(keyTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(keyScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]),
      // 2. Key turns 90deg
      Animated.delay(200),
      Animated.timing(keyRotate, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      
      // 3. Shackle pops up & Lock expands/shakes slightly
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(shackleTranslateY, { toValue: -15, duration: 300, easing: Easing.out(Easing.back(1.7)), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(lockRotate, { toValue: 0.08, duration: 80, useNativeDriver: true }),
          Animated.timing(lockRotate, { toValue: -0.08, duration: 80, useNativeDriver: true }),
          Animated.timing(lockRotate, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]),
      ]),

      // 4. Golden glow wave burst & particles launch
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(glowScale, { toValue: 15, duration: 1200, easing: Easing.out(Easing.linear), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        // Animate particles outward
        ...particles.map((p, idx) => {
          const angle = (idx / particles.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
          const distance = 80 + Math.random() * 80;
          const targetX = Math.cos(angle) * distance;
          const targetY = Math.sin(angle) * distance;

          return Animated.parallel([
            Animated.timing(p.x, { toValue: targetX, duration: 1000 + Math.random() * 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(p.y, { toValue: targetY, duration: 1000 + Math.random() * 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(p.scale, { toValue: 1.0, duration: 300, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.opacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0, duration: 800, delay: 200, useNativeDriver: true }),
            ])
          ]);
        })
      ])
    ]).start();

    return () => {
      clearTimeout(keyTurnTimer);
      clearTimeout(lockOpenTimer);
    };
  }, [step]);

  // Step 5: Reflection Timer count-down
  useEffect(() => {
    let interval: any = null;

    if (step === 5 && isActive && !isPaused && timeLeft > 0) {
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

  // AppState recover check
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 5 && isActive && !isPaused) {
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

  // Step transition fadeout/fadein helper
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 400,
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

  const handleNextStep2 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    transitionToStep(2);
  };

  const handleNextStep3 = () => {
    if (fear.trim().length < 20) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    transitionToStep(3);
  };

  const handleCommitUnlock = () => {
    if (commitment.trim().length < 15) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(4);
  };

  const handleBeginReflection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    transitionToStep(5);
    setIsActive(true);
  };

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
            task_name: 'Courage Unlock',
            fear: fear,
            commitment: commitment,
            unlock_completed: 'Yes'
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
          Alert.alert('Error', data.error || 'Failed to submit task completion');
        }
      } else {
        Alert.alert('Authorization Error', 'No authorization token found. Please log in again.');
      }
    } catch (e) {
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
        message: 'You expanded.',
        difficulty: 'hard'
      }
    } as any);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const keySpin = keyRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg']
  });

  const lockSpin = lockRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1rad', '1rad']
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* BACKGROUND: Premium dark carbon/gold atmospheric theme */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={step === 5 ? ['#010204', '#060B12', '#0A1320'] : ['#020406', '#09101A', '#132135', '#1D304A']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Spotlight floating radial glow */}
        <Animated.View style={[styles.floatingSpotlight, { transform: [{ translateX: spotX }, { translateY: spotY }] }]} />

        {/* Vignette overlays for deep cinematic quality */}
        <View style={styles.vignetteTop} />
        <View style={styles.vignetteBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <View style={styles.hudBackIcon}>
              <Feather name="x" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>
          <View style={styles.systemStatus}>
            <View style={[styles.dotIndicator, step === 5 && isActive && !isPaused && { backgroundColor: '#F59E0B', shadowColor: '#F59E0B' }]} />
            <Text style={styles.statusText}>
              {step === 5 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : 'COURAGE.INIT'}
            </Text>
          </View>
        </View>

        {/* MAIN STEP ANIMATED LAYER */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>
          
          {/* STEP 1: LOCKED STATE / INFO */}
          {step === 1 && (
            <View style={styles.innerContainer}>
              <View style={styles.emojiContainer}>
                <Text style={styles.largeEmoji}>🗝️</Text>
              </View>

              <View style={styles.introHeader}>
                <Text style={styles.taskTitle}>Courage Unlock</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.hardBadge]}>
                    <Text style={styles.hardBadgeText}>🔥 Hard</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#F59E0B' }]}>+300 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#38BDF8' }]}>5 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardPanel}>
                <View style={styles.panelEdge} />
                <Text style={styles.panelDescription}>
                  Courage isn't something you find—it's something you unlock within yourself.{"\n\n"}
                  Take a moment to recognize a fear, challenge, or limiting belief that has been holding you back.{"\n\n"}
                  Then make a small promise to yourself about the courageous action you'll take next.{"\n\n"}
                  Every brave decision unlocks a stronger version of you.
                </Text>
                <View style={styles.divider} />
                <Text style={styles.quoteText}>
                  "Locked doors open only when you're willing to turn the key."
                </Text>
              </View>

              <View style={styles.lockedArea}>
                <View style={styles.lockVisual}>
                  <Ionicons name="lock-closed" size={32} color="rgba(245, 158, 11, 0.5)" />
                </View>
                <Text style={styles.lockedSubtitle}>
                  "Every fear locks away a stronger version of yourself."
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleNextStep2} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#D97706', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Unlock Courage</Text>
                  <Feather name="chevron-right" size={20} color="#0E1218" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: FACE YOUR LIMIT */}
          {step === 2 && (
            <View style={[styles.innerContainer, { justifyContent: 'flex-start', gap: 20 }]}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepIndicatorText}>STEP 1 OF 2</Text>
                <Text style={styles.stepQuestion}>
                  What's one fear or challenge you want to overcome?
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.multilineInput}
                  multiline
                  numberOfLines={5}
                  value={fear}
                  onChangeText={setFear}
                  placeholder="I've been avoiding..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardAppearance="dark"
                />
                
                <View style={styles.inputFooter}>
                  <Text style={[styles.charCountText, fear.trim().length >= 20 ? { color: '#10B981' } : { color: '#EF4444' }]}>
                    {fear.trim().length} / 20 characters required
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 'auto' }, fear.trim().length < 20 && { opacity: 0.4 }]}
                onPress={handleNextStep3}
                disabled={fear.trim().length < 20}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#D97706', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Continue</Text>
                  <Feather name="chevron-right" size={20} color="#0E1218" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: COURAGE COMMITMENT */}
          {step === 3 && (
            <View style={[styles.innerContainer, { justifyContent: 'flex-start', gap: 20 }]}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepIndicatorText}>STEP 2 OF 2</Text>
                <Text style={styles.stepQuestion}>
                  What's one small action you'll take within the next 24 hours?
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.multilineInput, { height: 100 }]}
                  multiline
                  numberOfLines={3}
                  value={commitment}
                  onChangeText={setCommitment}
                  placeholder="I will..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardAppearance="dark"
                />

                <View style={styles.inputFooter}>
                  <Text style={[styles.charCountText, commitment.trim().length >= 15 ? { color: '#10B981' } : { color: '#EF4444' }]}>
                    {commitment.trim().length} / 15 characters required
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 'auto' }, commitment.trim().length < 15 && { opacity: 0.4 }]}
                onPress={handleCommitUnlock}
                disabled={commitment.trim().length < 15}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#D97706', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Commit & Unlock</Text>
                  <Feather name="key" size={18} color="#0E1218" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: UNLOCK ANIMATION */}
          {step === 4 && (
            <View style={[styles.innerContainer, { justifyContent: 'center', gap: 40 }]}>
              <View style={styles.unlockAnimationArea}>
                
                {/* Golden burst light wave */}
                <Animated.View style={[styles.unlockWave, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />

                {/* Padlock structure */}
                <Animated.View style={[styles.lockContainer, { transform: [{ scale: lockScale }, { rotate: lockSpin }] }]}>
                  {/* Lock shackle (top hook part) */}
                  <Animated.View style={[styles.lockShackle, { transform: [{ translateY: shackleTranslateY }] }]} />
                  {/* Lock body */}
                  <View style={styles.lockBody}>
                    {/* Keyhole */}
                    <View style={styles.keyholeOuter}>
                      <View style={styles.keyholeCore} />
                    </View>
                  </View>
                </Animated.View>

                {/* Golden key overlay */}
                <Animated.View style={[styles.keyOverlay, {
                  opacity: keyOpacity,
                  transform: [
                    { translateX: keyTranslateX },
                    { translateY: keyTranslateY },
                    { rotate: keySpin },
                    { scale: keyScale }
                  ]
                }]}>
                  <MaterialCommunityIcons name="key-variant" size={44} color="#F59E0B" />
                </Animated.View>

                {/* Floating particle sparkles */}
                {particles.map((p, idx) => (
                  <Animated.View key={idx} style={[styles.particle, {
                    left: width * 0.44, // center alignment base
                    top: height * 0.16,
                    transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
                    opacity: p.opacity
                  }]} />
                ))}

              </View>

              <View style={styles.unlockMessageBlock}>
                <Text style={styles.unlockMainTitle}>Courage Unlocked.</Text>
                <Text style={styles.unlockSubtitleText}>
                  Your commitment has been set. Prepare to reflect on it.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleBeginReflection} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#D97706', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Begin Reflection</Text>
                  <Feather name="arrow-right" size={20} color="#0E1218" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: REFLECTION TIMER */}
          {step === 5 && (
            <View style={[styles.innerContainer, { justifyContent: 'space-between' }]}>
              
              <View style={styles.commitmentCard}>
                <Text style={styles.commitmentKicker}>MY DAILY PROMISE</Text>
                <Text style={styles.commitmentQuote}>
                  "{commitment}"
                </Text>
              </View>

              <View style={styles.timerDisplayContainer}>
                <View style={styles.timerRing}>
                  <Text style={styles.digitsText}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.digitsKicker}>REMAINING</Text>
                </View>
              </View>

              <View style={styles.reflectionControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Feather name={isPaused ? 'play' : 'pause'} size={18} color="#fff" />
                  <Text style={styles.controlText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
                </TouchableOpacity>
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
    backgroundColor: '#020406',
  },
  safeArea: {
    flex: 1,
  },
  floatingSpotlight: {
    position: 'absolute',
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: (width * 1.6) / 2,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    top: height * 0.1,
    left: -width * 0.3,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: 'rgba(2, 4, 6, 0.65)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    backgroundColor: 'rgba(2, 4, 6, 0.9)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  backText: {
    fontSize: 12,
    color: '#F59E0B',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  largeEmoji: {
    fontSize: 36,
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
  hardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  hardBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardPanel: {
    backgroundColor: 'rgba(8, 12, 20, 0.7)',
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
    backgroundColor: '#F59E0B',
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
    color: '#F59E0B',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  lockedArea: {
    alignItems: 'center',
    marginVertical: 20,
  },
  lockVisual: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockedSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 240,
    lineHeight: 18,
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
    color: '#0E1218',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Steps 2 & 3 content input styles
  stepIndicator: {
    alignItems: 'center',
    marginTop: 20,
  },
  stepIndicatorText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  stepQuestion: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  inputContainer: {
    width: '100%',
    gap: 10,
  },
  multilineInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 15,
    textAlignVertical: 'top',
    height: 140,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  charCountText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Step 4: Unlock Animation visual styles
  unlockAnimationArea: {
    height: height * 0.35,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unlockWave: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  lockContainer: {
    width: 110,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  lockShackle: {
    position: 'absolute',
    top: 15,
    width: 68,
    height: 72,
    borderRadius: 34,
    borderWidth: 8,
    borderColor: '#A1A8B5',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  lockBody: {
    width: 100,
    height: 86,
    borderRadius: 16,
    backgroundColor: '#334155',
    borderWidth: 3,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  keyholeOuter: {
    width: 22,
    height: 28,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  keyholeCore: {
    position: 'absolute',
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  keyOverlay: {
    position: 'absolute',
    zIndex: 3,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    left: width * 0.38,
    top: height * 0.13,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  unlockMessageBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  unlockMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  unlockSubtitleText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Step 5: Reflection timer style
  commitmentCard: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  commitmentKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 2,
    marginBottom: 10,
  },
  commitmentQuote: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerDisplayContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  timerRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  digitsText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFF',
  },
  digitsKicker: {
    fontSize: 10,
    color: '#F59E0B',
    letterSpacing: 2,
    fontWeight: '800',
    marginTop: 4,
  },
  reflectionControls: {
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  controlText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
