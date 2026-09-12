import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Rect, Path, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Ground Truth for the Cognitive Observation Challenge ─────────────────────
const CHALLENGE_TRUTH = {
  coreColor: 'Violet',
  position: 'Slightly Top-Right',
  geometry: 'Octahedral Prism',
  orbitalRings: '3 Golden Rings',
};

// ── Page 3 Memory Questions ──────────────────────────────────────────────────
const MEMORY_QUESTIONS = [
  {
    id: 'coreColor',
    category: 'Core Color',
    question: 'What color was the central pulsing core?',
    options: ['Violet', 'Emerald', 'Crimson', 'Amber'],
    correct: CHALLENGE_TRUTH.coreColor,
  },
  {
    id: 'position',
    category: 'Position',
    question: 'Where was the geometric artifact positioned?',
    options: ['Slightly Top-Right', 'Dead Center', 'Lower-Left', 'Bottom-Right'],
    correct: CHALLENGE_TRUTH.position,
  },
  {
    id: 'geometry',
    category: 'Geometry',
    question: 'What geometry formed the hovering centerpiece?',
    options: ['Octahedral Prism', 'Hexagonal Dome', 'Cubic Lattice', 'Torus Ring'],
    correct: CHALLENGE_TRUTH.geometry,
  },
  {
    id: 'orbitalRings',
    category: 'Orbital Rings',
    question: 'How many concentric orbital rings circled it?',
    options: ['3 Golden Rings', '1 Silver Ring', '5 Neon Rings', 'No Rings'],
    correct: CHALLENGE_TRUTH.orbitalRings,
  },
];

// Ambient floating particles
const NEURAL_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 30) + 15,
  size: 3 + Math.random() * 4,
  duration: 5000 + Math.random() * 4000,
  delay: (i % 7) * 350,
  color: ['#38bdf8', '#818cf8', '#c084fc', '#f59e0b', '#34d399'][i % 5],
}));

// Celebration Confetti
const CONFETTI_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#38bdf8', '#a855f7', '#fbbf24', '#34d399', '#f43f5e', '#ec4899'][i % 6],
  size: 6 + Math.random() * 7,
  delay: (i % 6) * 100,
  duration: 2200 + Math.random() * 800,
}));

export default function BrainVsCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 7 Pages
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Page 2: 10s Observation Countdown
  const [observeCountdown, setObserveCountdown] = useState(10);

  // Page 3: User Selected Answers
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // Page 4: Camera Scan Status
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [cameraScanProgress, setCameraScanProgress] = useState(0);

  // Page 5: Animated sequential row reveal counter
  const [revealedRows, setRevealedRows] = useState(0);

  // Page 7: Points count animation (0 -> 300) and API submission
  const [pointsCounter, setPointsCounter] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // ── Animations ─────────────────────────────────────────────────────────────
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageScaleAnim = useRef(new Animated.Value(1)).current;

  // Page 1: Brain Glow Pulse
  const brainPulseAnim = useRef(new Animated.Value(1)).current;
  const brainWaveAnim = useRef(new Animated.Value(0.4)).current;

  // Page 2: Observation Scanning Beam & Artifact Pulse
  const scanBeamAnim = useRef(new Animated.Value(0)).current;
  const artifactPulseAnim = useRef(new Animated.Value(1)).current;

  // Page 4: Camera HUD brackets
  const cameraReticleAnim = useRef(new Animated.Value(1)).current;

  // Page 6: AI Neural visual pulse
  const aiPulseAnim = useRef(new Animated.Value(1)).current;
  const meterProgressAnim = useRef(new Animated.Value(0)).current;

  // Page 7: Celebration scale
  const successBadgeAnim = useRef(new Animated.Value(0)).current;

  // Looping background animations
  useEffect(() => {
    // Brain pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(brainPulseAnim, {
          toValue: 1.08,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(brainPulseAnim, {
          toValue: 0.96,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Neural wave loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(brainWaveAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(brainWaveAnim, {
          toValue: 0.4,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Page 2 Scan beam loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanBeamAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanBeamAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Artifact pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(artifactPulseAnim, {
          toValue: 1.05,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(artifactPulseAnim, {
          toValue: 0.97,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Camera reticle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(cameraReticleAnim, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cameraReticleAnim, {
          toValue: 0.98,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // AI neural pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(aiPulseAnim, {
          toValue: 1.12,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aiPulseAnim, {
          toValue: 0.95,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── Cinematic Page Transition ──────────────────────────────────────────────
  const transitionToPage = (newPage: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(pageScaleAnim, {
        toValue: 0.96,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPage(newPage);

      // Page 2: Start non-skippable 10-second observation countdown
      if (newPage === 2) {
        setObserveCountdown(10);
      }

      // Page 5: Start sequential row reveal
      if (newPage === 5) {
        setRevealedRows(0);
      }

      // Page 6: Start AI meter animation
      if (newPage === 6) {
        meterProgressAnim.setValue(0);
        Animated.timing(meterProgressAnim, {
          toValue: 1,
          duration: 1200,
          delay: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }

      // Page 7: Start Celebration and Counter (0 -> 300)
      if (newPage === 7) {
        successBadgeAnim.setValue(0);
        Animated.spring(successBadgeAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }).start();
        animatePointsCounter();
      }

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pageScaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ── Page 2: Non-skippable 10-second Observation Timer ──────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (currentPage === 2 && observeCountdown > 0) {
      timer = setInterval(() => {
        setObserveCountdown((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            // Automatically advance to Page 3 at 0
            transitionToPage(3);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentPage, observeCountdown]);

  // ── Page 4: Camera Scan Simulation (2-3 seconds) ───────────────────────────
  const handleStartCameraScan = () => {
    if (isCameraScanning) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}

    setIsCameraScanning(true);
    setCameraScanProgress(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCameraScanProgress(step * 25);
      if (step >= 4) {
        clearInterval(interval);
        setTimeout(() => {
          setIsCameraScanning(false);
          transitionToPage(5);
        }, 500);
      }
    }, 500);
  };

  // ── Page 5: Sequential Comparison Row Reveal ────────────────────────────────
  useEffect(() => {
    if (currentPage === 5 && revealedRows < 4) {
      const timer = setTimeout(() => {
        setRevealedRows((prev) => prev + 1);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (_) {}
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [currentPage, revealedRows]);

  // ── Calculated Real Cognitive Metrics from User Answers ─────────────────────
  const cognitiveMetrics = useMemo(() => {
    let correctCount = 0;
    MEMORY_QUESTIONS.forEach((q) => {
      if (userAnswers[q.id] === q.correct) {
        correctCount += 1;
      }
    });

    const accuracyPercent = Math.round((correctCount / MEMORY_QUESTIONS.length) * 100);

    let insightText = '';
    let observationStyle = '';
    let detailFocusScore = 0;

    if (accuracyPercent >= 75) {
      insightText =
        'Your visual attention was highly focused. You naturally captured both major objects and subtle geometric details with acute perceptual fidelity.';
      observationStyle = 'Precision Observer';
      detailFocusScore = 94;
    } else if (accuracyPercent >= 50) {
      insightText =
        'You noticed the primary visual structures well, but your attention filtered out peripheral spatial details under time pressure.';
      observationStyle = 'Focused Inspector';
      detailFocusScore = 72;
    } else {
      insightText =
        'Your brain focused on the overall scene gestalt more than individual technical details. Slowing down your gaze will enhance micro-retention.';
      observationStyle = 'Holistic Synthesizer';
      detailFocusScore = 48;
    }

    return {
      correctCount,
      totalCount: MEMORY_QUESTIONS.length,
      accuracyPercent,
      insightText,
      observationStyle,
      detailFocusScore,
    };
  }, [userAnswers]);

  // ── Page 7: Points Counter Animation (0 -> 300) ────────────────────────────
  const animatePointsCounter = () => {
    setPointsCounter(0);
    const duration = 1200;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.round(progress * 300);
      setPointsCounter(current);
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 40);
  };

  // ── Page 7: Authenticated Backend Reward Claim ──────────────────────────────
  const handleClaimReward = async () => {
    if (isClaiming || hasClaimed) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setClaimError('Authentication token not found. Please log in again.');
        setIsClaiming(false);
        return;
      }

      // Existing authenticated task completion API
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 48,
          task_name: 'Brain vs Camera',
          accuracy: cognitiveMetrics.accuracyPercent,
          observation_style: cognitiveMetrics.observationStyle,
          user_answers: userAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        throw new Error(data.error || data.message || 'Failed to claim points.');
      }

      setHasClaimed(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}

      const pointsEarned =
        data.pointsEarned ??
        data.pointsAdded ??
        data.points_earned ??
        data.points_rewarded ??
        300;
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '0';

      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsEarned),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: 'Brain vs Camera',
          difficulty: 'Medium',
          message: 'You tested the gap between perception and reality.',
        },
      } as any);
    } catch (err: any) {
      console.error('Brain vs Camera claim error:', err);
      setClaimError(err?.message || 'Network request failed. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Back Navigation Handler
  const handleHeaderBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    if (currentPage === 1) {
      router.back();
    } else if (currentPage === 2) {
      Alert.alert('Leave Challenge?', 'Leaving now will cancel the observation test.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ]);
    } else if (currentPage === 3) {
      if (currentQuestionIdx > 0) {
        setCurrentQuestionIdx((prev) => prev - 1);
      } else {
        transitionToPage(1);
      }
    } else if (currentPage === 7) {
      router.replace('/(tabs)');
    } else {
      transitionToPage((currentPage - 1) as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Atmospheric Space-Black Linear Gradient */}
      <LinearGradient
        colors={['#05050b', '#0a0918', '#110b24', '#06060f']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Neural Particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {NEURAL_PARTICLES.map((p) => (
          <AmbientParticle key={p.id} {...p} />
        ))}
      </View>

      {/* Foreground Safe Area */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Progress Indicator: PAGE X OF 7 */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>CHALLENGE {currentPage} OF 7</Text>
            <View style={styles.progressTrack}>
              {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => (
                <View
                  key={stepNum}
                  style={[
                    styles.progressDot,
                    stepNum <= currentPage && styles.progressDotActive,
                    stepNum === currentPage && styles.progressDotCurrent,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={{ width: 42 }} />
        </View>

        {/* Animated Main Content Wrapper */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ scale: pageScaleAnim }],
            },
          ]}
        >
          {/* ================================================================= */}
          {/* PAGE 1 — THE CHALLENGE (Neural Activation Intro)                   */}
          {/* ================================================================= */}
          {currentPage === 1 && (
            <View style={styles.pageOneContainer}>
              <View style={styles.pageOneHero}>
                {/* Glowing Neural Visual */}
                <View style={styles.brainVisualOuter}>
                  <Animated.View
                    style={[
                      styles.brainWaveRing,
                      {
                        opacity: brainWaveAnim,
                        transform: [{ scale: brainPulseAnim }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.brainCoreGlow,
                      {
                        transform: [{ scale: brainPulseAnim }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#818cf8', '#6366f1', '#4338ca']}
                      style={styles.brainCoreGradient}
                    >
                      <MaterialCommunityIcons name="brain" size={68} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>
                </View>

                <Text style={styles.pageOneTitle}>Brain vs Camera</Text>
                <Text style={styles.pageOneSubtitle}>
                  Can your brain notice what the camera sees?
                </Text>

                {/* Metadata Badges */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeCategory]}>
                    <Ionicons name="sparkles" size={13} color="#a855f7" />
                    <Text style={[styles.badgeText, { color: '#c084fc' }]}>Cognitive Challenge</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#38bdf8" />
                    <Text style={[styles.badgeText, { color: '#7dd3fc' }]}>~5 min</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#fbbf24" />
                    <Text style={[styles.badgeText, { color: '#fde047' }]}>+300 Points</Text>
                  </View>
                </View>

                <View style={styles.explanationCard}>
                  <Text style={styles.explanationLine}>Your brain notices more than you realize.</Text>
                  <Text style={styles.explanationLineSub}>
                    Let’s test how accurately you remember what you see.
                  </Text>
                </View>
              </View>

              {/* Start Challenge Button */}
              <View style={styles.pageOneBottom}>
                <TouchableOpacity
                  style={styles.primaryGlowingBtn}
                  onPress={() => transitionToPage(2)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5', '#3730a3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryBtnText}>Start Challenge</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 2 — LOOK (Immersive Observation Scene with 10s Timer)         */}
          {/* ================================================================= */}
          {currentPage === 2 && (
            <View style={styles.pageTwoContainer}>
              <View style={styles.pageHeaderBanner}>
                <Text style={styles.sceneTitle}>Look Closely</Text>
                <Text style={styles.sceneSubtitle}>
                  You have a few moments to observe.
                </Text>
                <Text style={styles.sceneHint}>
                  Look at colors, shapes, positions and small details.
                </Text>
              </View>

              {/* Observation Canvas */}
              <View style={styles.observationCanvas}>
                {/* Scanning Beam */}
                <Animated.View
                  style={[
                    styles.scanningBeam,
                    {
                      transform: [
                        {
                          translateY: scanBeamAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-140, 140],
                          }),
                        },
                      ],
                    },
                  ]}
                />

                {/* Target Focus Reticle Corners */}
                <View style={[styles.hudCorner, styles.hudTopLeft]} />
                <View style={[styles.hudCorner, styles.hudTopRight]} />
                <View style={[styles.hudCorner, styles.hudBottomLeft]} />
                <View style={[styles.hudCorner, styles.hudBottomRight]} />

                {/* Rich Geometric Cognitive Artifact (Ground Truth) */}
                <Animated.View
                  style={[
                    styles.artifactWrapper,
                    {
                      transform: [{ scale: artifactPulseAnim }],
                    },
                  ]}
                >
                  {/* Outer Concentric Golden Orbital Rings (Count = 3) */}
                  <View style={[styles.orbitalRing, styles.ringOne]} />
                  <View style={[styles.orbitalRing, styles.ringTwo]} />
                  <View style={[styles.orbitalRing, styles.ringThree]} />

                  {/* Center Emerald Octahedral Prism */}
                  <View style={styles.prismContainer}>
                    <LinearGradient
                      colors={['#10b981', '#06b6d4', '#047857']}
                      style={styles.prismDiamond}
                    >
                      {/* Central Pulsing Core (Color = Violet) */}
                      <View style={styles.violetCore}>
                        <LinearGradient
                          colors={['#c084fc', '#a855f7', '#7e22ce']}
                          style={styles.violetCoreGradient}
                        />
                      </View>
                    </LinearGradient>
                  </View>
                </Animated.View>
              </View>

              {/* Non-skippable Countdown Meter */}
              <View style={styles.countdownContainer}>
                <View style={styles.countdownRingWrap}>
                  <Text style={styles.countdownDigits}>{observeCountdown}</Text>
                </View>
                <Text style={styles.countdownCaption}>OBSERVING DETAILS</Text>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 3 — YOUR MEMORY (Floating Memory Questions)                  */}
          {/* ================================================================= */}
          {currentPage === 3 && (
            <View style={styles.pageThreeContainer}>
              <View style={styles.memoryHeader}>
                <Text style={styles.memoryTitle}>What Do You Remember?</Text>
                <Text style={styles.memorySubtitle}>
                  Question {currentQuestionIdx + 1} of {MEMORY_QUESTIONS.length}
                </Text>
              </View>

              {/* Active Question Card */}
              <View style={styles.questionCard}>
                <Text style={styles.questionCategory}>
                  {MEMORY_QUESTIONS[currentQuestionIdx].category.toUpperCase()}
                </Text>
                <Text style={styles.questionText}>
                  {MEMORY_QUESTIONS[currentQuestionIdx].question}
                </Text>

                {/* Option Cards */}
                <View style={styles.optionsList}>
                  {MEMORY_QUESTIONS[currentQuestionIdx].options.map((opt) => {
                    const isSelected =
                      userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id] === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.optionBtn,
                          isSelected && styles.optionBtnSelected,
                        ]}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch (_) {}
                          setUserAnswers((prev) => ({
                            ...prev,
                            [MEMORY_QUESTIONS[currentQuestionIdx].id]: opt,
                          }));
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.optionBtnText,
                            isSelected && styles.optionBtnTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                        <View
                          style={[
                            styles.optionRadio,
                            isSelected && styles.optionRadioSelected,
                          ]}
                        >
                          {isSelected && <Feather name="check" size={14} color="#ffffff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Navigation between questions / Lock Memory */}
              <View style={styles.memoryBottomBar}>
                {currentQuestionIdx < MEMORY_QUESTIONS.length - 1 ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryGlowingBtn,
                      !userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id] &&
                        styles.btnDisabled,
                    ]}
                    disabled={!userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id]}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      } catch (_) {}
                      setCurrentQuestionIdx((prev) => prev + 1);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id]
                          ? ['#6366f1', '#4f46e5']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.primaryGradient}
                    >
                      <Text style={styles.primaryBtnText}>Next Question</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.primaryGlowingBtn,
                      !userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id] &&
                        styles.btnDisabled,
                    ]}
                    disabled={!userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id]}
                    onPress={() => transitionToPage(4)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        userAnswers[MEMORY_QUESTIONS[currentQuestionIdx].id]
                          ? ['#a855f7', '#7e22ce']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.primaryGradient}
                    >
                      <Text style={styles.primaryBtnText}>Lock My Memory</Text>
                      <MaterialCommunityIcons name="brain" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 4 — CAMERA REVEAL (AR HUD Lens & Scanner)                     */}
          {/* ================================================================= */}
          {currentPage === 4 && (
            <View style={styles.pageFourContainer}>
              <View style={styles.cameraHeader}>
                <Text style={styles.cameraTitle}>Now Let The Camera See</Text>
                <Text style={styles.cameraSubtitle}>
                  Your brain created its own version of what you saw.
                </Text>
                <Text style={styles.cameraExplanation}>
                  Now compare it with the visual reality.
                </Text>
              </View>

              {/* Camera-style Viewfinder Frame */}
              <Animated.View
                style={[
                  styles.cameraViewfinder,
                  {
                    transform: [{ scale: cameraReticleAnim }],
                  },
                ]}
              >
                {/* Corner Markers */}
                <View style={[styles.cameraBracket, styles.bracketTL]} />
                <View style={[styles.cameraBracket, styles.bracketTR]} />
                <View style={[styles.cameraBracket, styles.bracketBL]} />
                <View style={[styles.cameraBracket, styles.bracketBR]} />

                {/* Crosshair Center */}
                <View style={styles.cameraCrosshair}>
                  <View style={styles.crosshairH} />
                  <View style={styles.crosshairV} />
                  <Feather name="camera" size={28} color="#38bdf8" />
                </View>

                {/* Laser Scanning Line during analysis */}
                {isCameraScanning && (
                  <View style={styles.cameraScanningLineWrap}>
                    <LinearGradient
                      colors={['transparent', '#38bdf8', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cameraScanningLine}
                    />
                  </View>
                )}

                <View style={styles.cameraHudFooter}>
                  <Text style={styles.hudStatusText}>
                    {isCameraScanning
                      ? `ANALYZING VISUAL DETAILS… ${cameraScanProgress}%`
                      : 'OPTICAL SENSOR READY'}
                  </Text>
                </View>
              </Animated.View>

              {/* Reveal Reality Button */}
              <View style={styles.cameraBottomBar}>
                <TouchableOpacity
                  style={[styles.primaryGlowingBtn, isCameraScanning && styles.btnDisabled]}
                  disabled={isCameraScanning}
                  onPress={handleStartCameraScan}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={isCameraScanning ? ['#0284c7', '#0369a1'] : ['#0284c7', '#2563eb']}
                    style={styles.primaryGradient}
                  >
                    {isCameraScanning ? (
                      <View style={styles.rowCentered}>
                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                        <Text style={styles.primaryBtnText}>Scanning Reality...</Text>
                      </View>
                    ) : (
                      <View style={styles.rowCentered}>
                        <Feather name="aperture" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>Reveal Reality</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 5 — BRAIN vs CAMERA (Split Comparison Dashboard)             */}
          {/* ================================================================= */}
          {currentPage === 5 && (
            <View style={styles.pageFiveContainer}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareTitle}>Brain vs Camera</Text>
                <Text style={styles.compareSubtitle}>Perception vs Reality Analysis</Text>
              </View>

              {/* Comparison Table */}
              <View style={styles.comparisonDashboard}>
                <View style={styles.dashboardColumnHeader}>
                  <View style={styles.colHeaderLeft}>
                    <MaterialCommunityIcons name="brain" size={16} color="#c084fc" />
                    <Text style={styles.colHeaderTextBrain}>YOUR BRAIN</Text>
                  </View>
                  <View style={styles.colHeaderRight}>
                    <Feather name="camera" size={15} color="#38bdf8" />
                    <Text style={styles.colHeaderTextCamera}>CAMERA</Text>
                  </View>
                </View>

                {/* 4 Sequential Comparison Rows */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {MEMORY_QUESTIONS.map((q, idx) => {
                    const isRevealed = idx < revealedRows;
                    const userVal = userAnswers[q.id] || 'Skipped';
                    const isMatch = userVal === q.correct;

                    if (!isRevealed) {
                      return (
                        <View key={q.id} style={styles.rowPlaceholder}>
                          <Text style={styles.rowPlaceholderText}>
                            Analyzing {q.category}...
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <View
                        key={q.id}
                        style={[
                          styles.compareRow,
                          isMatch ? styles.compareRowMatch : styles.compareRowMiss,
                        ]}
                      >
                        <View style={styles.rowCategoryBadge}>
                          <Text style={styles.rowCategoryText}>{q.category}</Text>
                        </View>

                        <View style={styles.rowDetails}>
                          <View style={styles.rowLeftDetail}>
                            <Text style={styles.rowBrainAnswer} numberOfLines={1}>
                              {userVal}
                            </Text>
                          </View>

                          <View style={styles.rowStatusIndicator}>
                            {isMatch ? (
                              <View style={styles.statusBadgeSuccess}>
                                <Feather name="check" size={13} color="#10b981" />
                                <Text style={styles.statusSuccessText}>Correct</Text>
                              </View>
                            ) : (
                              <View style={styles.statusBadgeMiss}>
                                <Feather name="x" size={13} color="#ef4444" />
                                <Text style={styles.statusMissText}>Missed</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.rowRightDetail}>
                            <Text style={styles.rowCameraTruth} numberOfLines={1}>
                              {q.correct}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Observation Accuracy Footer */}
              <View style={styles.accuracyFooterCard}>
                <Text style={styles.accuracyLabel}>Your Observation Accuracy</Text>
                <Text style={styles.accuracyValue}>
                  {cognitiveMetrics.accuracyPercent}%
                </Text>
              </View>

              {/* Continue to AI Insight Button */}
              <View style={styles.compareBottomBar}>
                <TouchableOpacity
                  style={[styles.primaryGlowingBtn, revealedRows < 4 && styles.btnDisabled]}
                  disabled={revealedRows < 4}
                  onPress={() => transitionToPage(6)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      revealedRows >= 4
                        ? ['#8b5cf6', '#6d28d9']
                        : ['#374151', '#1f2937']
                    }
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryBtnText}>See My AI Insight</Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 6 — AI INSIGHT (Cognitive Neural Analysis)                   */}
          {/* ================================================================= */}
          {currentPage === 6 && (
            <ScrollView
              contentContainerStyle={styles.pageSixScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.aiHeader}>
                <Text style={styles.aiTitle}>Your Cognitive Insight</Text>
                <Text style={styles.aiSubtitle}>AI Neural Pattern Synthesis</Text>
              </View>

              {/* Animated AI Brain Visual */}
              <Animated.View
                style={[
                  styles.aiVisualOrb,
                  {
                    transform: [{ scale: aiPulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#3b82f6', '#06b6d4']}
                  style={styles.aiVisualOrbGradient}
                >
                  <MaterialCommunityIcons name="molecule" size={54} color="#ffffff" />
                </LinearGradient>
              </Animated.View>

              {/* Dynamic Personalized Insight */}
              <View style={styles.insightBox}>
                <View style={styles.insightHeaderRow}>
                  <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
                  <Text style={styles.insightHeaderLabel}>AI ANALYSIS RESULT</Text>
                </View>
                <Text style={styles.insightBodyText}>
                  {cognitiveMetrics.insightText}
                </Text>
              </View>

              {/* Animated Cognitive Metric Bars */}
              <View style={styles.metricsContainer}>
                {/* Meter 1: Observation Style */}
                <View style={styles.metricItem}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricTitle}>Observation Style</Text>
                    <Text style={styles.metricValueHighlight}>
                      {cognitiveMetrics.observationStyle}
                    </Text>
                  </View>
                </View>

                {/* Meter 2: Detail Focus */}
                <View style={styles.metricItem}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricTitle}>Detail Focus</Text>
                    <Text style={styles.metricValue}>
                      {cognitiveMetrics.detailFocusScore}%
                    </Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <Animated.View
                      style={[
                        styles.meterFill,
                        {
                          width: `${cognitiveMetrics.detailFocusScore}%`,
                          backgroundColor: '#38bdf8',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Meter 3: Memory Accuracy */}
                <View style={styles.metricItem}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricTitle}>Memory Accuracy</Text>
                    <Text style={styles.metricValue}>
                      {cognitiveMetrics.accuracyPercent}%
                    </Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <Animated.View
                      style={[
                        styles.meterFill,
                        {
                          width: `${cognitiveMetrics.accuracyPercent}%`,
                          backgroundColor: '#a855f7',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Complete Challenge Button */}
              <TouchableOpacity
                style={[styles.primaryGlowingBtn, { marginTop: 28, marginBottom: 20 }]}
                onPress={() => transitionToPage(7)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#6366f1', '#4338ca']}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryBtnText}>Complete Challenge</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ================================================================= */}
          {/* PAGE 7 — COMPLETION (Celebration & +300 Points)                    */}
          {/* ================================================================= */}
          {currentPage === 7 && (
            <View style={styles.pageSevenContainer}>
              {/* Confetti Particles */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CONFETTI_PARTICLES.map((c) => (
                  <ConfettiPiece key={c.id} {...c} />
                ))}
              </View>

              <ScrollView
                contentContainerStyle={styles.pageSevenScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Celebratory Neural Medallion */}
                <Animated.View
                  style={[
                    styles.celebrationHeroCard,
                    {
                      transform: [{ scale: successBadgeAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(99, 102, 241, 0.25)', 'rgba(168, 85, 247, 0.08)']}
                    style={styles.celebrationCardGradient}
                  >
                    <View style={styles.trophyIconWrap}>
                      <Ionicons name="ribbon-outline" size={54} color="#fbbf24" />
                    </View>

                    <Text style={styles.completionTitle}>Challenge Complete</Text>
                    <Text style={styles.completionSubtitle}>
                      You just tested the gap between perception and memory.
                    </Text>

                    {/* Animated Points Counter (0 -> 300) */}
                    <View style={styles.pointsPill}>
                      <Feather name="award" size={24} color="#fbbf24" style={{ marginRight: 8 }} />
                      <Text style={styles.pointsPillText}>+{pointsCounter} Points</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* Compact Results Summary */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Observation Accuracy</Text>
                    <Text style={styles.summaryValue}>
                      {cognitiveMetrics.accuracyPercent}%
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryInsightSection}>
                    <Text style={styles.summaryInsightLabel}>Cognitive Insight</Text>
                    <Text style={styles.summaryInsightText} numberOfLines={3}>
                      {cognitiveMetrics.insightText}
                    </Text>
                  </View>
                </View>

                {/* Error Banner with Retry */}
                {claimError && (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{claimError}</Text>
                  </View>
                )}

                {/* Final Done Button (Calls authenticated backend API) */}
                <TouchableOpacity
                  style={[
                    styles.primaryGlowingBtn,
                    (isClaiming || hasClaimed) && styles.btnDisabled,
                    { marginTop: 20 },
                  ]}
                  onPress={handleClaimReward}
                  disabled={isClaiming || hasClaimed}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.primaryGradient}
                  >
                    {isClaiming ? (
                      <View style={styles.rowCentered}>
                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                        <Text style={styles.primaryBtnText}>Awarding 300 Points...</Text>
                      </View>
                    ) : (
                      <View style={styles.rowCentered}>
                        <Feather name="check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>Done</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {claimError && (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={handleClaimReward}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                    <Text style={styles.retryBtnText}>Retry Reward</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── Floating Ambient Neural Particle ─────────────────────────────────────────
function AmbientParticle({
  x,
  size,
  duration,
  delay,
  color,
}: {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}) {
  const translateY = useRef(new Animated.Value(height + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -30,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.65, duration: duration * 0.3, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

// ── Confetti Particle for Page 7 ─────────────────────────────────────────────
function ConfettiPiece({
  x,
  color,
  size,
  delay,
  duration,
}: {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height * 0.75,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 160,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 600, delay: duration - 850, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 4, duration, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 4],
    outputRange: ['0deg', '1440deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size * 0.25,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    />
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050b',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  progressDotActive: {
    backgroundColor: '#38bdf8',
  },
  progressDotCurrent: {
    width: 20,
    backgroundColor: '#818cf8',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── PAGE 1: THE CHALLENGE
  pageOneContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  pageOneHero: {
    alignItems: 'center',
    paddingTop: 10,
  },
  brainVisualOuter: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brainWaveRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  brainCoreGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    shadowColor: '#818cf8',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  brainCoreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageOneTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pageOneSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  badgeCategory: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  badgeDuration: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  badgeReward: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  explanationCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 27, 58, 0.65)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    alignItems: 'center',
  },
  explanationLine: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  explanationLineSub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  pageOneBottom: {
    width: '100%',
  },
  primaryGlowingBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },

  // ── PAGE 2: LOOK
  pageTwoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pageHeaderBanner: {
    alignItems: 'center',
  },
  sceneTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  sceneSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#38bdf8',
    textAlign: 'center',
  },
  sceneHint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  observationCanvas: {
    width: '100%',
    height: 290,
    backgroundColor: 'rgba(15, 12, 35, 0.75)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  scanningBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.9)',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    zIndex: 2,
  },
  hudCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#38bdf8',
  },
  hudTopLeft: { top: 12, left: 12, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  hudTopRight: { top: 12, right: 12, borderTopWidth: 2.5, borderRightWidth: 2.5 },
  hudBottomLeft: { bottom: 12, left: 12, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
  hudBottomRight: { bottom: 12, right: 12, borderBottomWidth: 2.5, borderRightWidth: 2.5 },

  // Cognitive Artifact Positioning: Slightly Top-Right
  artifactWrapper: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: 28 }, { translateY: -18 }],
  },
  orbitalRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.75)',
  },
  ringOne: { width: 160, height: 160 },
  ringTwo: { width: 130, height: 130, borderColor: 'rgba(245, 158, 11, 0.65)' },
  ringThree: { width: 105, height: 105, borderColor: 'rgba(251, 191, 36, 0.5)' },
  prismContainer: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prismDiamond: {
    width: 58,
    height: 58,
    borderRadius: 14,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  violetCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    transform: [{ rotate: '-45deg' }],
  },
  violetCoreGradient: {
    flex: 1,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownRingWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    marginBottom: 8,
  },
  countdownDigits: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  countdownCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.8,
  },

  // ── PAGE 3: YOUR MEMORY
  pageThreeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 32,
  },
  memoryHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  memoryTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  memorySubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c084fc',
    letterSpacing: 1,
  },
  questionCard: {
    backgroundColor: 'rgba(25, 20, 50, 0.75)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  questionCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#c084fc',
    shadowColor: '#c084fc',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  optionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  optionBtnTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#c084fc',
    backgroundColor: '#a855f7',
  },
  memoryBottomBar: {
    width: '100%',
  },

  // ── PAGE 4: CAMERA REVEAL
  pageFourContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  cameraHeader: {
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  cameraSubtitle: {
    fontSize: 15,
    color: '#38bdf8',
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraExplanation: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  cameraViewfinder: {
    width: '100%',
    height: 280,
    backgroundColor: 'rgba(8, 20, 35, 0.8)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cameraBracket: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#38bdf8',
  },
  bracketTL: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3 },
  bracketTR: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3 },
  bracketBL: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3 },
  bracketBR: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraCrosshair: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: 80,
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
  },
  crosshairV: {
    position: 'absolute',
    height: 80,
    width: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
  },
  cameraScanningLineWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '48%',
    height: 6,
    justifyContent: 'center',
  },
  cameraScanningLine: {
    height: 3,
    width: '100%',
  },
  cameraHudFooter: {
    position: 'absolute',
    bottom: 20,
  },
  hudStatusText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cameraBottomBar: {
    width: '100%',
  },

  // ── PAGE 5: BRAIN vs CAMERA
  pageFiveContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
  },
  compareHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  compareTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  compareSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  comparisonDashboard: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 42, 0.7)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    padding: 16,
    marginBottom: 14,
  },
  dashboardColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  colHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colHeaderTextBrain: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c084fc',
    letterSpacing: 1.2,
  },
  colHeaderTextCamera: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  rowPlaceholder: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    alignItems: 'center',
  },
  rowPlaceholderText: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  compareRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compareRowMatch: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  compareRowMiss: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  rowCategoryBadge: {
    marginBottom: 6,
  },
  rowCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 1,
  },
  rowDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeftDetail: {
    flex: 1,
  },
  rowBrainAnswer: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  rowStatusIndicator: {
    paddingHorizontal: 8,
  },
  statusBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusSuccessText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeMiss: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusMissText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  rowRightDetail: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowCameraTruth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8',
  },
  accuracyFooterCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bae6fd',
    letterSpacing: 1,
  },
  accuracyValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  compareBottomBar: {
    width: '100%',
  },

  // ── PAGE 6: AI INSIGHT
  pageSixScroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    alignItems: 'center',
  },
  aiHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#c084fc',
    fontWeight: '600',
  },
  aiVisualOrb: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  aiVisualOrbGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightBox: {
    width: '100%',
    backgroundColor: 'rgba(30, 24, 60, 0.75)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    padding: 18,
    marginBottom: 20,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightHeaderLabel: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  insightBodyText: {
    fontSize: 15,
    color: '#f1f5f9',
    lineHeight: 23,
  },
  metricsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    gap: 16,
  },
  metricItem: {},
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  metricValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
  },
  meterTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ── PAGE 7: COMPLETION
  pageSevenContainer: {
    flex: 1,
  },
  pageSevenScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  celebrationHeroCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    shadowColor: '#6366f1',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 20,
  },
  celebrationCardGradient: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  trophyIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
  },
  pointsPillText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(25, 20, 50, 0.75)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  summaryInsightSection: {},
  summaryInsightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  summaryInsightText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
    width: '100%',
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
});
