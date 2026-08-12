import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  TouchableOpacity,
  StatusBar,
  Image,
  AppState,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  SharedValue
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/theme';
import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Background Glow Orb Config ───────────────────────────────────────────
interface OrbProps {
  color: string;
  delayX: number;
  delayY: number;
  durationX: number;
  durationY: number;
  initialX: number;
  initialY: number;
  size: number;
}

function BackgroundOrb({
  color,
  delayX,
  delayY,
  durationX,
  durationY,
  initialX,
  initialY,
  size
}: OrbProps) {
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);

  useEffect(() => {
    x.value = withDelay(
      delayX,
      withRepeat(
        withSequence(
          withTiming(initialX + width * 0.15, { duration: durationX, easing: Easing.inOut(Easing.ease) }),
          withTiming(initialX - width * 0.15, { duration: durationX * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(initialX, { duration: durationX * 0.9, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    y.value = withDelay(
      delayY,
      withRepeat(
        withSequence(
          withTiming(initialY + height * 0.1, { duration: durationY, easing: Easing.inOut(Easing.ease) }),
          withTiming(initialY - height * 0.1, { duration: durationY * 1.1, easing: Easing.inOut(Easing.ease) }),
          withTiming(initialY, { duration: durationY * 0.9, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      left: x.value,
      top: y.value,
    };
  });

  return <Animated.View style={animatedStyle} />;
}

// ── Floating Light Dust Particle ──────────────────────────────────────────
interface ParticleProps {
  idx: number;
}

function FloatingParticle({ idx }: ParticleProps) {
  const x = useSharedValue(Math.random() * width);
  // Distribute particles vertically on mount
  const y = useSharedValue(height * (0.3 + Math.random() * 0.6));
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4 + Math.random() * 1.2);

  useEffect(() => {
    const duration = 7000 + Math.random() * 8000;
    const startDelay = Math.random() * 4000;

    const runAnimation = () => {
      y.value = height * 0.9;
      opacity.value = 0;
      x.value = Math.random() * width;

      // Animate particle floating upwards
      y.value = withTiming(
        height * 0.1,
        { duration, easing: Easing.out(Easing.quad) }
      );

      // Phase-in and phase-out opacity
      opacity.value = withSequence(
        withTiming(0.25 + Math.random() * 0.45, { duration: duration * 0.25 }),
        withDelay(
          duration * 0.45,
          withTiming(0, { duration: duration * 0.3 })
        )
      );
    };

    const timeout = setTimeout(() => {
      runAnimation();
      const interval = setInterval(runAnimation, duration);
      return () => {
        clearInterval(interval);
      };
    }, startDelay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: x.value,
      top: y.value,
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#FFEBD3', // Soft warm white particle color
    };
  });

  return <Animated.View style={animatedStyle} />;
}

// ── Chakra Definition ───────────────────────────────────────────────────
interface ChakraItem {
  color: string;
  glowColor: string;
  name: string;
  top: string;
}

const CHAKRAS: ChakraItem[] = [
  { name: 'Crown', top: '32%', color: '#D946EF', glowColor: '#F472B6' },       // Violet
  { name: 'Third Eye', top: '36.5%', color: '#6366F1', glowColor: '#818CF8' },   // Indigo
  { name: 'Throat', top: '41%', color: '#0EA5E9', glowColor: '#38BDF8' },      // Light Blue
  { name: 'Heart', top: '47.5%', color: '#10B981', glowColor: '#34D399' },     // Green
  { name: 'Solar Plexus', top: '53%', color: '#EAB308', glowColor: '#FACC15' },// Yellow
  { name: 'Sacral', top: '58.5%', color: '#F97316', glowColor: '#FB923C' },     // Orange
  { name: 'Root', top: '64.5%', color: '#EF4444', glowColor: '#F87171' },       // Red
];

interface ChakraDotProps {
  chakra: ChakraItem;
  index: number;
  pulseValue: SharedValue<number>;
}

function ChakraDot({ chakra, index, pulseValue }: ChakraDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const phase = pulseValue.value * 2 * Math.PI;
    // Sequential delay offset down the spine
    const offset = index * 0.55;
    const waveVal = Math.sin(phase - offset);
    
    // Scale and Opacity pulse equations
    const scale = 0.85 + 0.35 * (waveVal + 1) / 2;
    const opacity = 0.45 + 0.55 * (waveVal + 1) / 2;

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.chakraBase,
        {
          top: chakra.top as any,
          left: '50%',
          backgroundColor: chakra.color,
          shadowColor: chakra.glowColor,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.chakraInner} />
    </Animated.View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────
export default function StillnessWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  interface TaskDetails {
    title: string;
    description: string;
    duration: number;
    difficulty: string;
    points_reward: number;
  }

  // Task & Timer States
  const [taskData, setTaskData] = useState<TaskDetails | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // default 5 minutes (300 seconds)
  const [isLoading, setIsLoading] = useState(false);

  // Fetch task metadata from Backend
  useEffect(() => {
    let active = true;
    const fetchTaskDetails = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await apiFetch('/api/tasks/Silent Sitting', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (active) {
              setTaskData({
                title: data.title,
                description: data.description,
                duration: Number(data.duration) || 5,
                difficulty: data.difficulty || 'Medium',
                points_reward: Number(data.points_reward) || 20
              });
              setTimeLeft((Number(data.duration) || 5) * 60);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      }
    };

    fetchTaskDetails();
    return () => {
      active = false;
    };
  }, []);

  // AppState recovery tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Reanimated values for continuous loops
  const bgScale = useSharedValue(1.02);
  const auraScale = useSharedValue(1);
  const auraOpacity = useSharedValue(0.6);
  const floatY = useSharedValue(0);
  const chakraPulse = useSharedValue(0);

  // Button interaction values
  const buttonScale = useSharedValue(1);

  // Start continuous relaxing animations
  useEffect(() => {
    // Background breathing scale
    bgScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.02, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 1. Aura breathing scale
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 4200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 2. Aura breathing opacity
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 4200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Gentle float/drift for illustration
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 3800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 4. Infinite phase-shift driver for chakras
    chakraPulse.value = withRepeat(
      withTiming(1, { duration: 6500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // AppState listener to handle backgrounding/resuming
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive, isPaused]);

  // Timer Run Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            completeTaskBackend();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, isPaused]);

  // Submit task completion to backend and navigate to success page
  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Silent Sitting' })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.pointsAdded?.toString() || "20", 
            totalPoints: data.totalPoints?.toString() || "0",
            streak: data.streak?.toString() || "0"
          };
        } else {
          Alert.alert("Error", data.error || "Failed to submit task completion");
        }
      } else {
        Alert.alert("Authorization Error", "No authorization token found. Please log in again.");
      }
    } catch(e) { 
      console.error(e);
      Alert.alert("Connection Error", "Network request failed. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }

    router.replace({ 
      pathname: '/task-success', 
      params: { 
        points: pointsData.pointsAdded, 
        totalPoints: pointsData.totalPoints, 
        streak: pointsData.streak,
        message: "Stillness deepened."
      } 
    } as any);
  };

  const handleAbortPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Abort Meditation?",
      "Are you sure you want to stop? Your progress will be lost.",
      [
        { text: "Continue Sitting", style: "cancel" },
        { 
          text: "Abort", 
          style: "destructive", 
          onPress: () => {
            setIsActive(false);
            setIsPaused(false);
            setTimeLeft(300);
          } 
        }
      ]
    );
  };

  const handleHeaderBack = () => {
    if (isActive) {
      handleAbortPress();
    } else {
      router.back();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Developer testing skipping helper (double click timer to skip to 3 seconds)
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

  // Button Press Animations
  const handlePressIn = () => {
    buttonScale.value = withTiming(0.94, { duration: 120, easing: Easing.out(Easing.quad) });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1.0, { duration: 180, easing: Easing.out(Easing.quad) });
  };

  const handleStartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const auraAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: auraScale.value }],
      opacity: auraOpacity.value,
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: bgScale.value },
        { translateY: floatY.value * 0.4 }
      ],
    };
  });

  // Generate 18 floating background dust particles
  const particles = Array.from({ length: 18 }).map((_, i) => (
    <FloatingParticle key={i} idx={i} />
  ));

  const systemFonts = Fonts as any;
  const roundedFont = systemFonts?.rounded || 'System';
  const serifFont = systemFonts?.serif || 'Georgia';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Animated Background & Silhouette Canvas ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, backgroundAnimatedStyle]}>
        <Image
          source={require('../assets/images/stillness_meditation.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Pulsing Aura Behind Silhouette */}
        <Animated.View style={[styles.auraBacking, auraAnimatedStyle]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(217, 70, 239, 0.25)', 'rgba(99, 102, 241, 0.15)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        {/* Floating dust particles overlay */}
        {particles}

        {/* Vertical Pulsing Chakra Lights (anchored perfectly to the silhouette in the image) */}
        {CHAKRAS.map((chakra, idx) => (
          <ChakraDot
            key={chakra.name}
            chakra={chakra}
            index={idx}
            pulseValue={chakraPulse}
          />
        ))}
      </Animated.View>

      {/* Glassmorphic Header Navigation */}
      <View style={[styles.headerContainer, { top: insets.top || 20 }]}>
        <TouchableOpacity
          onPress={handleHeaderBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: roundedFont }]}>Silent Sitting</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content Area */}
      <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
        {!isActive ? (
          <>
            {/* Spacer to push texts to bottom half leaving silhouette visible */}
            <View style={styles.topSpacer} />

            {/* ── Bottom Section (Texts & Button) ── */}
            <View style={styles.bottomSection}>
              
              {/* Typography */}
              <Animated.View style={styles.textGroup} entering={FadeInDown.delay(350).duration(900)}>
                <Text style={[styles.title, { fontFamily: serifFont }]}>
                  Find your Inner Peace
                </Text>
                <Text style={styles.subtitle}>
                  Begin your journey to mindfulness and spiritual awakening.{'\n'}
                  Let every breath guide you closer to serenity
                </Text>
              </Animated.View>

              {/* Dynamic Backend Task Metadata Badges */}
              {taskData && (
                <Animated.View style={styles.badgeRow} entering={FadeInDown.delay(500).duration(950)}>
                  <View style={styles.badge}>
                    <Feather name="clock" size={13} color="#00FFFF" />
                    <Text style={[styles.badgeText, { fontFamily: roundedFont }]}>{taskData.duration} min</Text>
                  </View>
                  <View style={styles.badgeDivider} />
                  <View style={styles.badge}>
                    <Feather name="award" size={13} color="#00FFFF" />
                    <Text style={[styles.badgeText, { fontFamily: roundedFont }]}>+{taskData.points_reward} Pts</Text>
                  </View>
                  <View style={styles.badgeDivider} />
                  <View style={styles.badge}>
                    <Feather name="activity" size={13} color="#00FFFF" />
                    <Text style={[styles.badgeText, { fontFamily: roundedFont }]}>{taskData.difficulty}</Text>
                  </View>
                </Animated.View>
              )}

              {/* Primary Action Button */}
              <Animated.View entering={FadeInDown.delay(700).duration(950)} style={styles.buttonWrapper}>
                <Animated.View style={buttonAnimatedStyle}>
                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleStartPress}
                    style={({ pressed }) => [
                      styles.buttonPressable,
                      pressed && Platform.OS === 'ios' && { opacity: 0.95 }
                    ]}
                  >
                    <LinearGradient
                      colors={['#00FFFF', '#00D8F6']} // High-contrast glowing Cyan gradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={[styles.buttonText, { fontFamily: roundedFont }]}>
                        Start Now
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </Animated.View>

            </View>
          </>
        ) : (
          <>
            {/* Spacer to align timer text exactly below head/heart of the body silhouette */}
            <View style={styles.timerTopSpacer} />

            {/* ── Active Timer Section ── */}
            <Animated.View entering={FadeIn.duration(800)} style={styles.timerContentWrapper}>
              <Pressable onPress={handleDevSkip}>
                <Text style={[styles.timerText, { fontFamily: roundedFont }]}>
                  {formatTime(timeLeft)}
                </Text>
              </Pressable>

              <Text style={styles.focusSubtitle}>
                {isPaused ? "Meditation Paused" : "Sitting in silence..."}
              </Text>

              <View style={styles.controlsContainer}>
                {/* Pause / Resume Button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPaused(!isPaused);
                  }}
                  style={[styles.pauseButton, !isPaused && styles.pauseButtonOutline]}
                >
                  <LinearGradient
                    colors={isPaused ? ['#00FFFF', '#00D8F6'] : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pauseGradient}
                  >
                    <Text style={[styles.pauseText, { color: isPaused ? '#080210' : '#FFFFFF', fontFamily: roundedFont }]}>
                      {isPaused ? "Resume" : "Pause"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Abort Button */}
                <TouchableOpacity
                  onPress={handleAbortPress}
                  style={styles.abortButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.abortText}>Abort Meditation</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080210',
  },
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 15,
  },
  headerSpacer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSpacer: {
    height: height * 0.46,
  },
  timerTopSpacer: {
    height: height * 0.42,
  },
  illustrationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  auraBacking: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: '47%',
    left: '50%',
    marginLeft: -120,
    marginTop: -120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  timerContentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
  },
  timerText: {
    fontSize: 76,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  focusSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.5,
    marginBottom: 44,
    textAlign: 'center',
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pauseButton: {
    width: width * 0.78,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  pauseButtonOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pauseGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pauseText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  abortButton: {
    padding: 12,
    marginTop: 18,
  },
  abortText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  imageWrapper: {
    width: width * 0.82,
    height: width * 0.82 * 1.08,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meditationImage: {
    width: '100%',
    height: '100%',
  },
  chakraBase: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -7,
    marginTop: -7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 12,
    elevation: 8,
  },
  chakraInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  textGroup: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  buttonPressable: {
    width: width * 0.78,
    borderRadius: 28,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#080210',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
