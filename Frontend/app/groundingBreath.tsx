import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, apiFetch } from '../constants/Api';

const VIDEO_PATH = require('../assets/videos/Grounding_breath video_of_men.mp4');

// Premium typography, colors, and layout properties
const COLORS = {
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  white: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.7)',
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  darkOverlay: 'rgba(0, 0, 0, 0.25)',
};

// Breathing word rotations per phase
const INHALE_WORDS = ["Breathe In", "Present", "Calm", "Stay Here", "Inhale Deeply"];
const HOLD_WORDS = ["Hold", "Be Still", "Relax", "Hold Peace", "Remain Calm"];
const EXHALE_WORDS = ["Slowly Exhale", "Let Go", "Release", "Breathe Out", "Exhale Calm"];
const REST_WORDS = ["Relax", "Calm", "Let Go", "Stay Here", "Peace"];

const ParticleItem = ({ width, height, index }: { width: number; height: number; index: number }) => {
  const particleX = useSharedValue(Math.random() * width);
  const particleY = useSharedValue(height + Math.random() * 100);
  const scale = useSharedValue(Math.random() * 0.6 + 0.4);
  const opacity = useSharedValue(Math.random() * 0.35 + 0.1);
  const size = useMemo(() => Math.random() * 6 + 4, []);

  useEffect(() => {
    const duration = 12000 + Math.random() * 12000;
    const delay = Math.random() * 8000;

    particleY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(height + 50, { duration: 0 }),
          withTiming(-50, { duration, easing: Easing.linear })
        ),
        -1,
        false
      )
    );

    particleX.value = withRepeat(
      withSequence(
        withTiming(particleX.value + (Math.random() * 60 - 30), {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(particleX.value - (Math.random() * 60 - 30), {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: particleX.value },
      { translateY: particleY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        {
          backgroundColor: index % 2 === 0 ? COLORS.purple : COLORS.cyan,
          width: size,
          height: size,
        },
      ]}
    />
  );
};

// Reusable Floating Particles Component
const FloatingParticles = ({ width, height, count = 25 }: { width: number; height: number; count?: number }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <ParticleItem key={i} index={i} width={width} height={height} />
      ))}
    </View>
  );
};

// Concentric ripple glow circles for task completion screen
const RippleCircle = ({ delay }: { delay: number }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withTiming(1.8, { duration: 2500, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.rippleCircle, animatedStyle]} />;
};

// Safe haptic feedback trigger helper
const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (err) {
    console.warn('Haptics not supported:', err);
  }
};

export default function GroundingBreathScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Screen state machine: 'intro' | 'prepare' | 'breathing' | 'completion'
  const [screenState, setScreenState] = useState<'intro' | 'prepare' | 'breathing' | 'completion'>('intro');

  // Session & Timer States
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Resume Progress Modal States
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [savedProgress, setSavedProgress] = useState<{ timeLeft: number; completed: boolean } | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Points metadata returned from backend completion
  const [completionData, setCompletionData] = useState<{ totalPoints: number; streak: number; pointsAdded: number } | null>(null);

  // Shared Animation Values
  const orbScale = useSharedValue(1.0);
  const orbGlow = useSharedValue(0.3);
  const textOpacity = useSharedValue(1.0);

  // Breathing word guidance state
  const [displayWord, setDisplayWord] = useState('Breathe In');

  // Background video controller
  const videoPlayer = useVideoPlayer(VIDEO_PATH, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Calculate breathing phase index based on elapsed seconds
  const currentPhaseIndex = useMemo(() => {
    const elapsed = 300 - timeLeft;
    const pos = elapsed % 16;
    if (pos < 4) return 0;  // Inhale (4s)
    if (pos < 8) return 1;  // Hold (4s)
    if (pos < 14) return 2; // Exhale (6s)
    return 3;              // Rest (2s)
  }, [timeLeft]);

  // Compute total completed breath cycles
  const completedBreaths = useMemo(() => {
    const elapsed = 300 - timeLeft;
    return Math.floor(elapsed / 16);
  }, [timeLeft]);

  // Rotate instruction words based on completed breathing cycle count
  const currentInstructionWord = useMemo(() => {
    const cycleCount = completedBreaths;
    if (currentPhaseIndex === 0) {
      return INHALE_WORDS[cycleCount % INHALE_WORDS.length];
    } else if (currentPhaseIndex === 1) {
      return HOLD_WORDS[cycleCount % HOLD_WORDS.length];
    } else if (currentPhaseIndex === 2) {
      return EXHALE_WORDS[cycleCount % EXHALE_WORDS.length];
    } else {
      return REST_WORDS[cycleCount % REST_WORDS.length];
    }
  }, [currentPhaseIndex, completedBreaths]);

  // Fetch task progress from backend on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await apiFetch('/api/tasks/grounding-breath/progress', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.progress && !data.completed && data.progress.timeLeft < 300 && data.progress.timeLeft > 0) {
              const timeDiff = Date.now() - (data.progress.timestamp || 0);
              // Only offer to resume if it was saved within the past 24 hours
              if (timeDiff < 24 * 60 * 60 * 1000) {
                setSavedProgress(data.progress);
                setShowResumeModal(true);
                setIsLoadingProgress(false);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching grounding breath progress:', err);
      }
      setIsLoadingProgress(false);
    };

    fetchProgress();
  }, []);

  // Save progress to the backend
  const saveProgressApi = async (remainingSeconds: number, completedState: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const response = await apiFetch('/api/tasks/grounding-breath/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          timeLeft: remainingSeconds,
          completed: completedState
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        if (completedState && data.pointsAdded !== undefined) {
          setCompletionData({
            totalPoints: data.totalPoints,
            streak: data.streak,
            pointsAdded: data.pointsAdded
          });
        }
      }
    } catch (err) {
      console.error('Error saving grounding breath progress:', err);
    }
  };

  // Timer run loop
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextVal = prev - 1;
          // Auto-save progress every 10 seconds to the backend
          if (nextVal % 10 === 0 && nextVal > 0) {
            saveProgressApi(nextVal, false);
          }
          return nextVal;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Session finished
      setIsActive(false);
      saveProgressApi(0, true);
      triggerHaptic('success');
      setScreenState('completion');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

  // Handle breathing orb scaling, glowing animations, and haptic triggers
  useEffect(() => {
    if (!isActive || isPaused) {
      // Idle pulse state if on introduction screen or paused
      if (screenState === 'intro') {
        orbScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        orbGlow.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      }
      return;
    }

    // Trigger haptics on phase transition
    triggerHaptic(currentPhaseIndex === 3 ? 'light' : 'medium');

    if (currentPhaseIndex === 0) {
      // Inhale
      orbScale.value = withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.ease) });
      orbGlow.value = withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) });
    } else if (currentPhaseIndex === 1) {
      // Hold
      orbScale.value = withTiming(1.5, { duration: 4000 });
      orbGlow.value = withTiming(1.0, { duration: 4000 });
    } else if (currentPhaseIndex === 2) {
      // Exhale
      orbScale.value = withTiming(1.0, { duration: 6000, easing: Easing.inOut(Easing.ease) });
      orbGlow.value = withTiming(0.1, { duration: 6000, easing: Easing.inOut(Easing.ease) });
    } else {
      // Rest
      orbScale.value = withTiming(1.0, { duration: 2000 });
      orbGlow.value = withTiming(0.3, { duration: 2000 });
    }
  }, [currentPhaseIndex, isActive, isPaused, screenState]);

  // Smoothly fade and replace breath guidance typography
  useEffect(() => {
    if (!isActive || isPaused) return;

    textOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setDisplayWord)(currentInstructionWord);
      textOpacity.value = withTiming(1, { duration: 500 });
    });
  }, [currentInstructionWord, isActive, isPaused]);

  // Animated styles for breathing orb scale, glow, and final-minute warm overlays
  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    shadowOpacity: orbGlow.value * 0.8,
    shadowRadius: orbGlow.value * 25 + 5,
    backgroundColor: currentPhaseIndex === 0 || currentPhaseIndex === 1
      ? `rgba(6, 182, 212, ${orbGlow.value * 0.3 + 0.1})` // Cyan tint
      : `rgba(139, 92, 246, ${orbGlow.value * 0.3 + 0.1})`, // Purple tint
  }));

  const warmOverlayAnimatedStyle = useAnimatedStyle(() => {
    // Show warm amber overlay slowly whentimeLeft reaches final 60 seconds
    const showWarm = timeLeft <= 60 && timeLeft > 0 && screenState === 'breathing';
    return {
      opacity: withTiming(showWarm ? 0.22 : 0, { duration: 3000 }),
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Helper actions
  const handleBegin = () => {
    triggerHaptic('light');
    setScreenState('prepare');
  };

  const handleStartBreathing = () => {
    triggerHaptic('light');
    setScreenState('breathing');
    setIsActive(true);
  };

  const handleResumeSession = () => {
    if (savedProgress) {
      setTimeLeft(savedProgress.timeLeft);
      setScreenState('breathing');
      setIsActive(true);
    }
    setShowResumeModal(false);
  };

  const handleStartFresh = () => {
    setTimeLeft(300);
    setScreenState('intro');
    setIsActive(false);
    setShowResumeModal(false);
  };

  const handleAbort = () => {
    // Save progress on close and exit
    saveProgressApi(timeLeft, false);
    setIsActive(false);
    router.back();
  };

  const handleReturnHome = () => {
    triggerHaptic('light');
    router.replace({
      pathname: '/(tabs)',
      params: {
        updatedPoints: completionData?.totalPoints?.toString() || '',
        updatedStreak: completionData?.streak?.toString() || '',
      },
    } as any);
  };

  const formatTimerDigits = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Helper to determine width limits for responsive sizing
  const isTabletOrWeb = width > 600;
  const contentWidth = isTabletOrWeb ? 520 : width - 40;

  // Middle checkpoint notification overlay (lasts 6 seconds)
  const isMiddleCheckpointVisible = isActive && timeLeft <= 153 && timeLeft >= 147;

  // Final minute title overlay (lasts 6 seconds)
  const isFinalMinuteTextVisible = isActive && timeLeft <= 60 && timeLeft >= 54;

  if (isLoadingProgress) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={styles.loadingText}>Syncing mindfulness progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. Immersive Full-Screen Background Video */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          allowsPictureInPicture={false}
        />
        {/* Dark film overlay (25%) */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.darkOverlay }]} />
      </View>

      {/* 2. Warm overlay activated slowly during final minute */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: COLORS.amber },
          warmOverlayAnimatedStyle
        ]}
        pointerEvents="none"
      />

      {/* 3. Cinematic Floating Particles */}
      <FloatingParticles width={width} height={height} count={timeLeft <= 60 ? 35 : 20} />

      {/* 4. Resume Session Modal */}
      <Modal visible={showResumeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={[styles.modalCard, { width: contentWidth }]}>
            <MaterialCommunityIcons name="wind-power" size={48} color={COLORS.cyan} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Resume Breathing?</Text>
            <Text style={styles.modalDesc}>
              You have an active session with{' '}
              <Text style={{ color: COLORS.cyan, fontWeight: 'bold' }}>
                {formatTimerDigits(savedProgress?.timeLeft || 300)}
              </Text>{' '}
              remaining. Would you like to pick up where you left off?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={handleStartFresh}>
                <Text style={styles.modalCancelText}>Start Fresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleResumeSession}>
                <LinearGradient
                  colors={[COLORS.cyan, COLORS.blue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalGradientBtn}
                >
                  <Text style={styles.modalConfirmText}>Resume</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Screen 1 — INTRODUCTION */}
      {screenState === 'intro' && (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
              <Feather name="x" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.centerSection}>
            <Animated.View entering={FadeInDown.duration(1200)} style={styles.introOrbContainer}>
              <Animated.View style={[styles.breathingOrb, orbAnimatedStyle, { width: 140, height: 140, borderRadius: 70 }]} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(400).duration(1000)} style={styles.textBlock}>
              <Text style={styles.mainTitle}>Grounding Breath</Text>
              <Text style={styles.subtitle}>Take a few slow breaths.{'\n'}Return your attention to this moment.</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.quoteBlock}>
              <Text style={styles.quoteText}>"Your breath is your anchor."</Text>
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <Animated.View entering={FadeInUp.delay(1000).duration(1000)} style={{ width: contentWidth }}>
              <TouchableOpacity onPress={handleBegin} activeOpacity={0.85} style={styles.primaryBtn}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.blue, COLORS.cyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.primaryBtnText}>Begin Session</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.badgeText}>🕒 5 Minutes</Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      )}

      {/* Screen 2 — PREPARE */}
      {screenState === 'prepare' && (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreenState('intro')} style={styles.backBtn} activeOpacity={0.6}>
              <Feather name="arrow-left" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.centerSection}>
            <Animated.Text entering={FadeInDown.duration(800)} style={styles.prepTitle}>Prepare Yourself</Animated.Text>

            <Animated.View entering={FadeInUp.delay(300).duration(1000)} style={{ width: contentWidth }}>
              <BlurView intensity={20} tint="dark" style={styles.glassCard}>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>🌿</Text>
                  <Text style={styles.instructionText}>Sit comfortably</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>🌬️</Text>
                  <Text style={styles.instructionText}>Relax your shoulders</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>📱</Text>
                  <Text style={styles.instructionText}>Put your phone on silent</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>👁️</Text>
                  <Text style={styles.instructionText}>Gently soften your gaze</Text>
                </View>
                <View style={[styles.instructionRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.instructionEmoji}>❤️</Text>
                  <Text style={styles.instructionText}>There is nothing to achieve.{'\n'}Just breathe.</Text>
                </View>
              </BlurView>
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <Animated.View entering={FadeInUp.delay(600).duration(800)} style={{ width: contentWidth }}>
              <TouchableOpacity onPress={handleStartBreathing} activeOpacity={0.85} style={styles.primaryBtn}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.blue, COLORS.cyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.primaryBtnText}>Start Breathing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      )}

      {/* Screen 3 — BREATHING SESSION */}
      {screenState === 'breathing' && (
        <SafeAreaView style={styles.safeArea}>
          {/* Top HUD bar with Close, Digital timer, and Progress indicator */}
          <View style={[styles.sessionHUD, { top: insets.top + 10 }]}>
            <TouchableOpacity onPress={handleAbort} style={styles.abortBtn} activeOpacity={0.6}>
              <Feather name="x" size={20} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.hudCenter}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${((300 - timeLeft) / 300) * 100}%` }]} />
              </View>
            </View>

            <View style={styles.timerHudBadge}>
              <Text style={styles.timerHudText}>{formatTimerDigits(timeLeft)}</Text>
            </View>
          </View>

          {/* Central breathing core */}
          <View style={styles.breathingCoreContainer}>
            {/* Animated breathing orb */}
            <View style={styles.orbOuterRing}>
              <Animated.View
                style={[
                  styles.breathingOrb,
                  orbAnimatedStyle,
                  {
                    width: isTabletOrWeb ? 230 : 180,
                    height: isTabletOrWeb ? 230 : 180,
                    borderRadius: isTabletOrWeb ? 115 : 90,
                  },
                ]}
              >
                {/* Nested inner core element */}
                <View style={styles.orbInnerCore} />
              </Animated.View>
            </View>

            {/* Instruction word overlay */}
            <View style={styles.guidanceWordWrapper}>
              <Animated.Text style={[styles.guidanceText, textAnimatedStyle]}>
                {displayWord}
              </Animated.Text>
            </View>
          </View>

          {/* Pause overlay button */}
          <View style={styles.pauseBtnContainer}>
            <TouchableOpacity
              onPress={() => setIsPaused((prev) => !prev)}
              style={styles.pauseGlassBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={22}
                color={COLORS.white}
              />
              <Text style={styles.pauseBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
          </View>

          {/* Middle checkpoint toast */}
          {isMiddleCheckpointVisible && (
            <Animated.View entering={FadeIn.duration(800)} exiting={FadeOut.duration(800)} style={styles.checkpointToast}>
              <BlurView intensity={35} tint="dark" style={styles.toastBlur}>
                <Text style={styles.toastTextTitle}>You're doing great.</Text>
                <Text style={styles.toastTextSub}>Keep breathing.</Text>
              </BlurView>
            </Animated.View>
          )}

          {/* Final minute toast overlay */}
          {isFinalMinuteTextVisible && (
            <Animated.View entering={FadeIn.duration(1000)} exiting={FadeOut.duration(1000)} style={styles.checkpointToast}>
              <BlurView intensity={35} tint="dark" style={styles.toastBlur}>
                <Text style={[styles.toastTextTitle, { color: COLORS.amber }]}>One final minute.</Text>
                <Text style={styles.toastTextSub}>Stay with your breath.</Text>
              </BlurView>
            </Animated.View>
          )}
        </SafeAreaView>
      )}

      {/* Screen 4 — COMPLETION */}
      {screenState === 'completion' && (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerSection}>
            <View style={styles.completionIndicatorWrapper}>
              {/* Ripple circles radiating outwards */}
              <RippleCircle delay={0} />
              <RippleCircle delay={800} />
              <RippleCircle delay={1600} />

              <Animated.View entering={FadeIn.duration(1500)} style={styles.checkmarkCircle}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.cyan} />
              </Animated.View>
            </View>

            <Animated.Text entering={FadeInDown.delay(300).duration(800)} style={styles.completeTitle}>
              Breathing Complete
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(500).duration(800)} style={styles.completeSub}>
              You gave yourself five peaceful minutes.
            </Animated.Text>

            {/* Statistics Cards */}
            <Animated.View entering={FadeInUp.delay(700).duration(1000)} style={[styles.statsContainer, { width: contentWidth }]}>
              <BlurView intensity={20} tint="dark" style={styles.statGlassCell}>
                <Text style={styles.statEmoji}>🌬️</Text>
                <Text style={styles.statVal}>{completedBreaths}</Text>
                <Text style={styles.statLabel}>Breaths Completed</Text>
              </BlurView>

              <BlurView intensity={20} tint="dark" style={styles.statGlassCell}>
                <Text style={styles.statEmoji}>❤️</Text>
                <Text style={styles.statVal}>100%</Text>
                <Text style={styles.statLabel}>Calm Session</Text>
              </BlurView>

              <BlurView intensity={20} tint="dark" style={styles.statGlassCell}>
                <Text style={styles.statEmoji}>🧘</Text>
                <Text style={styles.statVal}>100%</Text>
                <Text style={styles.statLabel}>Mindfulness</Text>
              </BlurView>
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(900).duration(800)} style={styles.completionQuote}>
              "The present moment is where peace begins."
            </Animated.Text>

            {/* Reward Card */}
            <Animated.View entering={FadeInUp.delay(1000).duration(850)} style={[styles.rewardWrapper, { width: contentWidth }]}>
              <BlurView intensity={25} tint="dark" style={styles.rewardGlassCard}>
                <Text style={styles.rewardStar}>✨</Text>
                <Text style={styles.rewardText}>+250 Mind Points</Text>
              </BlurView>
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <Animated.View entering={FadeInUp.delay(1200).duration(800)} style={{ width: contentWidth }}>
              <TouchableOpacity onPress={handleReturnHome} activeOpacity={0.85} style={styles.primaryBtn}>
                <LinearGradient
                  colors={[COLORS.cyan, COLORS.blue, COLORS.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.primaryBtnText}>Return Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 15,
    marginTop: 15,
    letterSpacing: 0.5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  introOrbContainer: {
    marginBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Breathing orb styling
  breathingOrb: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  orbOuterRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbInnerCore: {
    width: '60%',
    height: '60%',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(6, 182, 212, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 26,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cyan,
    paddingLeft: 14,
    marginTop: 20,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.cyan,
    letterSpacing: 0.5,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeText: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: 13,
    marginTop: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  // Screen 2 Prepare styling
  prepTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 35,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassBg,
    overflow: 'hidden',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 16,
    marginBottom: 16,
  },
  instructionEmoji: {
    fontSize: 24,
    marginRight: 18,
  },
  instructionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  // Particles
  particle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  // Screen 3 HUD
  sessionHUD: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  abortBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudCenter: {
    flex: 1,
    marginHorizontal: 20,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 3,
  },
  timerHudBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  timerHudText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  breathingCoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidanceWordWrapper: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  guidanceText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pauseBtnContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  pauseGlassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pauseBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  // Checkpoint Toasts
  checkpointToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '32%',
    alignItems: 'center',
    zIndex: 100,
  },
  toastBlur: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  toastTextTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  toastTextSub: {
    color: COLORS.textDim,
    fontSize: 15,
    textAlign: 'center',
  },
  // Screen 4 Completion
  completionIndicatorWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkmarkCircle: {
    zIndex: 10,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  rippleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  completeSub: {
    fontSize: 16,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 35,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statGlassCell: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassBg,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  statVal: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  completionQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 30,
  },
  rewardWrapper: {
    marginBottom: 20,
  },
  rewardGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    overflow: 'hidden',
  },
  rewardStar: {
    fontSize: 18,
    marginRight: 8,
  },
  rewardText: {
    color: COLORS.amber,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    borderRadius: 28,
    padding: 30,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 15,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalCancelText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalGradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
