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
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Scenarios & Signals for Page 2 ───────────────────────────────────────────
const FEAR_SCENARIOS = [
  'Speaking in front of people',
  'Making a mistake',
  'Being judged',
  'Unexpected messages',
  'Being alone in an unfamiliar place',
  'Missing an important deadline',
  'Something else',
];

const PHYSICAL_SIGNALS = [
  { id: 'heart', label: 'Heart racing', icon: 'heart-pulse' },
  { id: 'thoughts', label: 'Fast thoughts', icon: 'lightning-bolt' },
  { id: 'tension', label: 'Muscle tension', icon: 'arm-flex' },
  { id: 'escape', label: 'Wanting to escape', icon: 'run-fast' },
  { id: 'focus', label: 'Difficulty focusing', icon: 'eye-off' },
  { id: 'stomach', label: 'Stomach sensation', icon: 'water-alert' },
];

// ── Body Zones for Page 3 ───────────────────────────────────────────────────
const BODY_ZONES = [
  { id: 'head', name: 'Head', x: 120, y: 36 },
  { id: 'shoulders', name: 'Shoulders', x: 120, y: 78 },
  { id: 'chest', name: 'Chest', x: 120, y: 110 },
  { id: 'stomach', name: 'Stomach', x: 120, y: 145 },
  { id: 'hands', name: 'Hands', x: 50, y: 155 },
  { id: 'legs', name: 'Legs', x: 120, y: 220 },
];

// ── Page 4 Guidance Prompts ──────────────────────────────────────────────────
const OBSERVATION_PROMPTS = [
  'Notice the sensation.',
  'Name it without judging it.',
  'Watch your thoughts come and go.',
  'Relax your shoulders.',
  'You don’t have to react immediately.',
  'Let the feeling rise and fall.',
];

// Ambient Particles
const NEURAL_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 30) + 15,
  size: 3 + Math.random() * 4,
  duration: 5500 + Math.random() * 3500,
  delay: (i % 7) * 350,
  color: ['#f43f5e', '#fb7185', '#cbd5e1', '#fda4af', '#f43f5e'][i % 5],
}));

// Page 7 Celebration Particles
const CELEBRATION_PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f59e0b'][i % 6],
  size: 6 + Math.random() * 7,
  delay: (i % 6) * 100,
  duration: 2200 + Math.random() * 800,
}));

export default function FearTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 7 Pages
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Page 2 State: Scenario & Primary Signal
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  // Page 3 State: Body Zone & Sensation Intensity (1 - 5)
  const [selectedBodyZone, setSelectedBodyZone] = useState<string | null>(null);
  const [sensationIntensity, setSensationIntensity] = useState<number>(3);

  // Page 4 State: 90s Observation Timer (01:30)
  const [observeTimeLeft, setObserveTimeLeft] = useState(90);
  const [isObserving, setIsObserving] = useState(false);
  const [observePromptIndex, setObservePromptIndex] = useState(0);

  // Page 5 State: 60s Controlled Fear Challenge
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(60);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [stimulusPromptIndex, setStimulusPromptIndex] = useState(0);
  const [userDecisions, setUserDecisions] = useState<{ pause: number; react: number }>({
    pause: 0,
    react: 0,
  });
  const [recentDecisionFeedback, setRecentDecisionFeedback] = useState<string | null>(null);

  // Page 7 State: Reflection & Claiming
  const [reflectionText, setReflectionText] = useState('');
  const [pointsCounter, setPointsCounter] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Pause / Exit Safety Modal
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);

  // ── Animations ─────────────────────────────────────────────────────────────
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageScaleAnim = useRef(new Animated.Value(1)).current;

  // Page 1 Breathing/Heartbeat Orb
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const orbWaveAnim = useRef(new Animated.Value(0.4)).current;

  // Page 3 Body Zone Pulse
  const bodyZonePulse = useRef(new Animated.Value(0)).current;

  // Page 4 Breathing Orb (4s Inhale, 6s Exhale)
  const breathingScale = useRef(new Animated.Value(1)).current;

  // Page 5 Stimulus Tension Wave
  const stimulusPulseAnim = useRef(new Animated.Value(1)).current;

  // Page 6 AI Metric Meter
  const aiMeterAnim = useRef(new Animated.Value(0)).current;

  // Page 7 Transformation / Celebration
  const successBadgeAnim = useRef(new Animated.Value(0)).current;

  // Looping Ambient Animations
  useEffect(() => {
    // Page 1 Heartbeat pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.08,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.0,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.05,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.0,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb wave ring loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbWaveAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(orbWaveAnim, {
          toValue: 0.3,
          duration: 2400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Page 4 Breathing Orb: 4s inhale (scale up) -> 6s exhale (scale down)
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.35,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: 0.95,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Page 5 Stimulus tension loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(stimulusPulseAnim, {
          toValue: 1.06,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stimulusPulseAnim, {
          toValue: 0.96,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── Page Transition Helper ─────────────────────────────────────────────────
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

      // Page 5: Start 60s challenge automatically
      if (newPage === 5) {
        setChallengeTimeLeft(60);
        setIsChallengeActive(true);
      }

      // Page 6: Trigger AI meter animations
      if (newPage === 6) {
        aiMeterAnim.setValue(0);
        Animated.timing(aiMeterAnim, {
          toValue: 1,
          duration: 1200,
          delay: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }

      // Page 7: Trigger point counter animation when reached
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

  // ── Page 4: 90s Observation Timer ──────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (currentPage === 4 && isObserving && observeTimeLeft > 0) {
      timer = setInterval(() => {
        setObserveTimeLeft((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            setIsObserving(false);
            // Automatically advance to Page 5 when timer reaches 00:00
            transitionToPage(5);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentPage, isObserving, observeTimeLeft]);

  // Page 4 Rotating Guidance Prompts every 15s
  useEffect(() => {
    let promptInterval: ReturnType<typeof setInterval> | null = null;
    if (currentPage === 4 && isObserving) {
      promptInterval = setInterval(() => {
        setObservePromptIndex((prev) => (prev + 1) % OBSERVATION_PROMPTS.length);
      }, 14000);
    }
    return () => {
      if (promptInterval) clearInterval(promptInterval);
    };
  }, [currentPage, isObserving]);

  // ── Page 5: 60s Controlled Fear Challenge ──────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (currentPage === 5 && isChallengeActive && challengeTimeLeft > 0) {
      timer = setInterval(() => {
        setChallengeTimeLeft((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            setIsChallengeActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentPage, isChallengeActive, challengeTimeLeft]);

  // Page 5 Stimulus pulse interval changes
  useEffect(() => {
    let stimulusInterval: ReturnType<typeof setInterval> | null = null;
    if (currentPage === 5 && isChallengeActive) {
      stimulusInterval = setInterval(() => {
        setStimulusPromptIndex((prev) => (prev + 1) % 4);
      }, 15000);
    }
    return () => {
      if (stimulusInterval) clearInterval(stimulusInterval);
    };
  }, [currentPage, isChallengeActive]);

  // Handle User Decision on Page 5
  const handleRecordChoice = (type: 'react' | 'pause') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    setUserDecisions((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    setRecentDecisionFeedback(
      type === 'pause' ? 'Mindful Space Created' : 'Automatic Reaction Acknowledged'
    );
    setTimeout(() => {
      setRecentDecisionFeedback(null);
    }, 2000);
  };

  // ── Calculated Real AI Cognitive Analysis ──────────────────────────────────
  const cognitiveAnalysis = useMemo(() => {
    const totalChoices = userDecisions.pause + userDecisions.react;
    const pauseRatio = totalChoices > 0 ? userDecisions.pause / totalChoices : 0.6;

    // Calculate real metrics from user's actual responses
    const awarenessScore = Math.min(96, Math.max(68, Math.round(75 + pauseRatio * 20)));
    const responseControlScore = Math.min(94, Math.max(60, Math.round(65 + pauseRatio * 25)));
    const bodyAwarenessScore = Math.min(95, Math.max(70, 72 + sensationIntensity * 4));

    let primaryCategory = 'AWARENESS';
    let patternSummary = '';

    if (pauseRatio >= 0.6) {
      primaryCategory = 'REGULATION';
      patternSummary = `You noticed physical tension in your ${selectedBodyZone || 'body'}, but demonstrated the conscious ability to pause before reacting.`;
    } else if (sensationIntensity >= 4) {
      primaryCategory = 'BODY FOCUS';
      patternSummary = `Your fear signal manifests strongly as ${selectedSignal || 'physical arousal'}. Identifying this sensation is the foundational key to mindful regulation.`;
    } else {
      primaryCategory = 'AWARENESS';
      patternSummary = `You observed your instinctive urge to react quickly. Bringing conscious attention creates the essential space between feeling and action.`;
    }

    return {
      awarenessScore,
      responseControlScore,
      bodyAwarenessScore,
      primaryCategory,
      patternSummary,
    };
  }, [userDecisions, sensationIntensity, selectedBodyZone, selectedSignal]);

  // ── Page 7: Points Counter Animation (0 -> 600) ────────────────────────────
  const animatePointsCounter = () => {
    setPointsCounter(0);
    const duration = 1400;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.round(progress * 600);
      setPointsCounter(current);
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 35);
  };

  // ── Page 7: Authenticated Backend Reward Claim ──────────────────────────────
  const handleClaimReward = async () => {
    if (isSubmitting || hasClaimed) return;
    if (reflectionText.trim().length === 0) {
      Alert.alert('Reflection Required', 'Please write one thing you noticed about yourself to complete.');
      return;
    }

    setIsSubmitting(true);
    setClaimError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setClaimError('Authorization token not found. Please log in again.');
        setIsSubmitting(false);
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
          taskId: 68,
          task_name: 'Observe Fear Response',
          difficulty: 'Hard',
          scenario: selectedScenario,
          signal: selectedSignal,
          body_zone: selectedBodyZone,
          intensity: sensationIntensity,
          reflection: reflectionText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        throw new Error(data.error || data.message || 'Failed to submit task completion.');
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
        600;
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '0';

      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsEarned),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: 'Observe Fear Response',
          difficulty: 'Hard',
          message: 'You observed your fear response without reacting.',
        },
      } as any);
    } catch (err: any) {
      console.error('Observe Fear Response claim error:', err);
      setClaimError(err?.message || 'Network request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Exit Handler (No points awarded on early exit)
  const handleExitTaskSafely = () => {
    setIsPauseModalVisible(false);
    setIsObserving(false);
    setIsChallengeActive(false);
    router.back();
  };

  // Header Back Button Handler
  const handleHeaderBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    if (currentPage === 1) {
      router.back();
    } else if (currentPage === 4 || currentPage === 5) {
      setIsPauseModalVisible(true);
    } else {
      transitionToPage((currentPage - 1) as any);
    }
  };

  // Format MM:SS
  const formatTimerMMSS = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dev Fast Skip (triple tap on timer in __DEV__)
  const devTapCount = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      devTapCount.current += 1;
      if (devTapCount.current >= 3) {
        devTapCount.current = 0;
        if (currentPage === 4) setObserveTimeLeft(2);
        if (currentPage === 5) setChallengeTimeLeft(2);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Atmospheric Dark Wellness Gradient */}
      <LinearGradient
        colors={['#090507', '#12080d', '#1f0d16', '#080406']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Neural Particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {NEURAL_PARTICLES.map((p) => (
          <AmbientParticle key={p.id} {...p} />
        ))}
      </View>

      {/* Safe Area */}
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
            <Text style={styles.progressText}>STAGE {currentPage} OF 7</Text>
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

          {/* Pause Option during active challenges */}
          {currentPage === 4 || currentPage === 5 ? (
            <TouchableOpacity
              style={styles.pauseQuickBtn}
              onPress={() => setIsPauseModalVisible(true)}
              activeOpacity={0.7}
            >
              <Feather name="pause" size={18} color="#fda4af" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>

        {/* Animated Page Container */}
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
          {/* PAGE 1 — ENTER THE CHALLENGE                                      */}
          {/* ================================================================= */}
          {currentPage === 1 && (
            <View style={styles.pageOneContainer}>
              <View style={styles.pageOneHero}>
                {/* Neural Pulse / Breathing Heartbeat Orb */}
                <View style={styles.heartbeatOrbWrap}>
                  <Animated.View
                    style={[
                      styles.heartbeatWaveRing,
                      {
                        opacity: orbWaveAnim,
                        transform: [{ scale: heartbeatAnim }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.heartbeatCore,
                      {
                        transform: [{ scale: heartbeatAnim }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#f43f5e', '#e11d48', '#881337']}
                      style={styles.heartbeatGradient}
                    >
                      <MaterialCommunityIcons name="heart-pulse" size={62} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>
                </View>

                <Text style={styles.pageOneTitle}>Observe Fear Response</Text>

                {/* Metadata Badges: HARD | +600 Points | ~8 min */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeHard]}>
                    <Feather name="shield" size={13} color="#f43f5e" />
                    <Text style={[styles.badgeText, { color: '#fb7185' }]}>HARD</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#fbbf24" />
                    <Text style={[styles.badgeText, { color: '#fde047' }]}>+600 Points</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#38bdf8" />
                    <Text style={[styles.badgeText, { color: '#7dd3fc' }]}>~8 min</Text>
                  </View>
                </View>

                <View style={styles.introTextBox}>
                  <Text style={styles.introTextPrimary}>
                    Fear can change your thoughts, body, and attention in seconds.
                  </Text>
                  <Text style={styles.introTextSecondary}>
                    Today, you won’t fight the feeling. You’ll learn to observe it.
                  </Text>
                </View>

                {/* Safety Warning Advisory */}
                <View style={styles.safetyAdvisory}>
                  <Feather name="info" size={14} color="#fb7185" style={{ marginRight: 6 }} />
                  <Text style={styles.safetyText}>
                    Stay within a level that feels manageable. You can pause anytime.
                  </Text>
                </View>
              </View>

              {/* Enter Challenge Button */}
              <View style={styles.pageOneBottom}>
                <TouchableOpacity
                  style={styles.primaryGlowingBtn}
                  onPress={() => transitionToPage(2)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#f43f5e', '#be123c', '#881337']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryBtnText}>Enter Challenge</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 2 — IDENTIFY YOUR FEAR SIGNAL (Radar Pattern)                */}
          {/* ================================================================= */}
          {currentPage === 2 && (
            <ScrollView
              contentContainerStyle={styles.pageTwoScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What happens first?</Text>
                <Text style={styles.sectionInstruction}>
                  Think of a mild, everyday situation that makes you uncomfortable.
                </Text>
              </View>

              {/* Everyday Scenarios Grid */}
              <View style={styles.scenarioList}>
                {FEAR_SCENARIOS.map((scen) => {
                  const isSelected = selectedScenario === scen;
                  return (
                    <TouchableOpacity
                      key={scen}
                      style={[
                        styles.scenarioChip,
                        isSelected && styles.scenarioChipSelected,
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (_) {}
                        setSelectedScenario(scen);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.scenarioChipText,
                          isSelected && styles.scenarioChipTextSelected,
                        ]}
                      >
                        • {scen}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionSubTitle}>
                  When fear begins, what do you notice first?
                </Text>
              </View>

              {/* Physical Signal Cards */}
              <View style={styles.signalGrid}>
                {PHYSICAL_SIGNALS.map((sig) => {
                  const isSelected = selectedSignal === sig.label;
                  return (
                    <TouchableOpacity
                      key={sig.id}
                      style={[
                        styles.signalCard,
                        isSelected && styles.signalCardSelected,
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch (_) {}
                        setSelectedSignal(sig.label);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.signalIconWrap, isSelected && styles.signalIconWrapActive]}>
                        <MaterialCommunityIcons
                          name={sig.icon as any}
                          size={22}
                          color={isSelected ? '#ffffff' : '#fb7185'}
                        />
                      </View>
                      <Text style={[styles.signalLabel, isSelected && styles.signalLabelSelected]}>
                        {sig.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.primaryGlowingBtn,
                  (!selectedScenario || !selectedSignal) && styles.btnDisabled,
                  { marginTop: 28, marginBottom: 20 },
                ]}
                disabled={!selectedScenario || !selectedSignal}
                onPress={() => transitionToPage(3)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    selectedScenario && selectedSignal
                      ? ['#f43f5e', '#be123c']
                      : ['#374151', '#1f2937']
                  }
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ================================================================= */}
          {/* PAGE 3 — BODY RESPONSE SCAN (Interactive Body Map)                 */}
          {/* ================================================================= */}
          {currentPage === 3 && (
            <ScrollView
              contentContainerStyle={styles.pageThreeScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Scan Your Body</Text>
                <Text style={styles.sectionInstruction}>
                  Take a slow breath. Notice where your body holds the response.
                </Text>
              </View>

              {/* Interactive Abstract Human Body Map Canvas */}
              <View style={styles.bodyCanvasContainer}>
                <Svg width={240} height={280} viewBox="0 0 240 280">
                  <Defs>
                    <SvgGradient id="silhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
                      <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
                    </SvgGradient>
                  </Defs>
                  {/* Stylized Human Silhouette */}
                  {/* Head */}
                  <Circle cx={120} cy={36} r={22} fill="url(#silhouetteGrad)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth={1.5} />
                  {/* Neck & Shoulders */}
                  <Path d="M 95 68 Q 120 62 145 68 L 175 88 L 155 140 L 138 140 L 138 185 L 152 265 L 126 265 L 120 195 L 114 265 L 88 265 L 102 185 L 102 140 L 85 140 L 65 88 Z" fill="url(#silhouetteGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth={1.5} />
                </Svg>

                {/* Interactive Body Nodes */}
                {BODY_ZONES.map((zone) => {
                  const isSelected = selectedBodyZone === zone.name;
                  return (
                    <TouchableOpacity
                      key={zone.id}
                      style={[
                        styles.bodyNodePoint,
                        { left: zone.x - 22, top: zone.y - 22 },
                        isSelected && styles.bodyNodePointSelected,
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch (_) {}
                        setSelectedBodyZone(zone.name);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.bodyNodeInner, isSelected && styles.bodyNodeInnerSelected]}>
                        <Text style={styles.bodyNodeText}>{zone.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sensation Intensity Slider (1 to 5) */}
              <View style={styles.intensityCard}>
                <Text style={styles.intensityTitle}>How strong is the sensation?</Text>
                <View style={styles.intensityRow}>
                  {[1, 2, 3, 4, 5].map((level) => {
                    const isSelected = sensationIntensity === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.intensityBtn,
                          isSelected && styles.intensityBtnSelected,
                        ]}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch (_) {}
                          setSensationIntensity(level);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.intensityBtnText,
                            isSelected && styles.intensityBtnTextSelected,
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.intensityLabels}>
                  <Text style={styles.intensitySubLabel}>1 — Barely noticeable</Text>
                  <Text style={styles.intensitySubLabel}>5 — Strong</Text>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.primaryGlowingBtn,
                  !selectedBodyZone && styles.btnDisabled,
                  { marginTop: 24, marginBottom: 20 },
                ]}
                disabled={!selectedBodyZone}
                onPress={() => transitionToPage(4)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={selectedBodyZone ? ['#f43f5e', '#be123c'] : ['#374151', '#1f2937']}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ================================================================= */}
          {/* PAGE 4 — OBSERVE WITHOUT REACTING (90s Breathing Environment)     */}
          {/* ================================================================= */}
          {currentPage === 4 && (
            <View style={styles.pageFourContainer}>
              <View style={styles.observeHeader}>
                <Text style={styles.observeTitle}>Don’t Fight It</Text>
                <Text style={styles.observeSubtitle}>
                  For the next 90 seconds, notice the response without trying to remove it.
                </Text>
              </View>

              {/* Large Animated Breathing Orb (4s Inhale, 6s Exhale) */}
              <View style={styles.breathingOrbContainer}>
                <Animated.View
                  style={[
                    styles.breathingOuterAura,
                    {
                      transform: [{ scale: breathingScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.breathingCoreOrb,
                    {
                      transform: [{ scale: breathingScale }],
                    },
                  ]}
                >
                  <Pressable onPress={handleDevSkip} style={{ alignItems: 'center' }}>
                    <Text style={styles.breathingTimerDigits}>
                      {formatTimerMMSS(observeTimeLeft)}
                    </Text>
                    <Text style={styles.breathingPhaseLabel}>
                      {isObserving ? 'OBSERVE & BREATHE' : 'READY'}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>

              {/* Rotating Guidance Prompt */}
              <View style={styles.observePromptBox}>
                <Text style={styles.observePromptText}>
                  "{OBSERVATION_PROMPTS[observePromptIndex]}"
                </Text>
              </View>

              {/* Bottom Action: Begin Observation */}
              <View style={styles.observeBottomBar}>
                {!isObserving ? (
                  <TouchableOpacity
                    style={styles.primaryGlowingBtn}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      } catch (_) {}
                      setIsObserving(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#f43f5e', '#be123c']}
                      style={styles.primaryGradient}
                    >
                      <Text style={styles.primaryBtnText}>Begin Observation</Text>
                      <Feather name="play" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pauseSubtleBtn}
                    onPress={() => setIsPauseModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="pause-circle" size={18} color="#fda4af" style={{ marginRight: 6 }} />
                    <Text style={styles.pauseSubtleText}>Pause Challenge</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 5 — CONTROLLED FEAR CHALLENGE (60s Response vs Choice)       */}
          {/* ================================================================= */}
          {currentPage === 5 && (
            <View style={styles.pageFiveContainer}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>Notice The Urge</Text>
                <Text style={styles.challengeSubtitle}>
                  A mild trigger will appear. Notice your first reaction, then choose how you respond.
                </Text>
              </View>

              {/* 60s Countdown Bar */}
              <View style={styles.challengeTimerBar}>
                <Feather name="clock" size={14} color="#fb7185" style={{ marginRight: 6 }} />
                <Pressable onPress={handleDevSkip}>
                  <Text style={styles.challengeTimerDigits}>
                    {formatTimerMMSS(challengeTimeLeft)} remaining
                  </Text>
                </Pressable>
              </View>

              {/* Controlled Visual Stimulus Frame (Mild, Non-traumatic tension) */}
              <Animated.View
                style={[
                  styles.stimulusFrame,
                  {
                    transform: [{ scale: stimulusPulseAnim }],
                  },
                ]}
              >
                <View style={styles.stimulusCardHeader}>
                  <MaterialCommunityIcons name="alert-decagram-outline" size={24} color="#fb7185" />
                  <Text style={styles.stimulusCardTag}>CONTROLLED STIMULUS</Text>
                </View>

                {stimulusPromptIndex === 0 && (
                  <Text style={styles.stimulusBody}>
                    "A sudden unexpected notification sounds from an unknown sender."
                  </Text>
                )}
                {stimulusPromptIndex === 1 && (
                  <Text style={styles.stimulusBody}>
                    "You suddenly realize you might have forgotten something critical."
                  </Text>
                )}
                {stimulusPromptIndex === 2 && (
                  <Text style={styles.stimulusBody}>
                    "Everyone in the meeting turns their attention directly to you."
                  </Text>
                )}
                {stimulusPromptIndex === 3 && (
                  <Text style={styles.stimulusBody}>
                    "A sudden abrupt sound breaks the silence behind you."
                  </Text>
                )}

                {recentDecisionFeedback && (
                  <View style={styles.feedbackBanner}>
                    <Text style={styles.feedbackBannerText}>{recentDecisionFeedback}</Text>
                  </View>
                )}
              </Animated.View>

              {/* Choice Action Buttons: React Now vs Pause & Observe */}
              <View style={styles.choiceButtonsContainer}>
                {/* Automatic Response */}
                <TouchableOpacity
                  style={[styles.choiceBtn, styles.choiceBtnReact]}
                  onPress={() => handleRecordChoice('react')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.choiceLabelCategory}>AUTOMATIC RESPONSE</Text>
                  <Text style={styles.choiceBtnTitle}>React Now</Text>
                </TouchableOpacity>

                {/* Chosen Response */}
                <TouchableOpacity
                  style={[styles.choiceBtn, styles.choiceBtnPause]}
                  onPress={() => handleRecordChoice('pause')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.choiceLabelCategory}>CHOSEN RESPONSE</Text>
                  <Text style={styles.choiceBtnTitle}>Pause & Observe</Text>
                </TouchableOpacity>
              </View>

              {/* Completed Button when 60s ends */}
              {challengeTimeLeft === 0 && (
                <TouchableOpacity
                  style={[styles.primaryGlowingBtn, { marginTop: 16 }]}
                  onPress={() => transitionToPage(6)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryBtnText}>Challenge Complete — Continue</Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ================================================================= */}
          {/* PAGE 6 — AI FEAR RESPONSE ANALYSIS                                */}
          {/* ================================================================= */}
          {currentPage === 6 && (
            <ScrollView
              contentContainerStyle={styles.pageSixScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Fear Response</Text>
                <Text style={styles.sectionInstruction}>
                  Analyzing your observation pattern…
                </Text>
              </View>

              {/* AI Neural Synthesis Badge */}
              <View style={styles.analysisHeroCard}>
                <View style={styles.analysisCategoryPill}>
                  <MaterialCommunityIcons name="brain" size={16} color="#fb7185" />
                  <Text style={styles.analysisCategoryText}>
                    {cognitiveAnalysis.primaryCategory}
                  </Text>
                </View>
                <Text style={styles.patternSummaryText}>
                  {cognitiveAnalysis.patternSummary}
                </Text>
              </View>

              {/* 3 Animated Metrics: Awareness, Response Control, Body Awareness */}
              <View style={styles.metricsContainer}>
                {/* Metric 1: Awareness */}
                <View style={styles.metricRowItem}>
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>Awareness</Text>
                    <Text style={styles.metricValueText}>{cognitiveAnalysis.awarenessScore}%</Text>
                  </View>
                  <View style={styles.metricTrack}>
                    <Animated.View
                      style={[
                        styles.metricFill,
                        {
                          width: `${cognitiveAnalysis.awarenessScore}%`,
                          backgroundColor: '#fb7185',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Metric 2: Response Control */}
                <View style={styles.metricRowItem}>
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>Response Control</Text>
                    <Text style={styles.metricValueText}>
                      {cognitiveAnalysis.responseControlScore}%
                    </Text>
                  </View>
                  <View style={styles.metricTrack}>
                    <Animated.View
                      style={[
                        styles.metricFill,
                        {
                          width: `${cognitiveAnalysis.responseControlScore}%`,
                          backgroundColor: '#38bdf8',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Metric 3: Body Awareness */}
                <View style={styles.metricRowItem}>
                  <View style={styles.metricHeaderRow}>
                    <Text style={styles.metricLabel}>Body Awareness</Text>
                    <Text style={styles.metricValueText}>
                      {cognitiveAnalysis.bodyAwarenessScore}%
                    </Text>
                  </View>
                  <View style={styles.metricTrack}>
                    <Animated.View
                      style={[
                        styles.metricFill,
                        {
                          width: `${cognitiveAnalysis.bodyAwarenessScore}%`,
                          backgroundColor: '#a855f7',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Button: Reflect On This */}
              <TouchableOpacity
                style={[styles.primaryGlowingBtn, { marginTop: 28, marginBottom: 24 }]}
                onPress={() => transitionToPage(7)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#f43f5e', '#be123c']}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryBtnText}>Reflect On This</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ================================================================= */}
          {/* PAGE 7 — REFLECTION + COMPLETION (+600 POINTS)                    */}
          {/* ================================================================= */}
          {currentPage === 7 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              {/* Confetti Particles */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CELEBRATION_PARTICLES.map((c) => (
                  <ConfettiPiece key={c.id} {...c} />
                ))}
              </View>

              <ScrollView
                contentContainerStyle={styles.pageSevenScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Required Reflection Box */}
                <View style={styles.reflectionCard}>
                  <Text style={styles.reflectionTitle}>
                    What did you learn about your fear response?
                  </Text>
                  <TextInput
                    style={styles.reflectionInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Write one thing you noticed about yourself…"
                    placeholderTextColor="#9ca3af"
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    textAlignVertical="top"
                  />
                </View>

                {/* 3 Transformation Milestones */}
                <View style={styles.milestonesRow}>
                  <View style={styles.milestoneBadge}>
                    <Feather name="check" size={12} color="#10b981" />
                    <Text style={styles.milestoneText}>Fear Observed</Text>
                  </View>
                  <View style={styles.milestoneBadge}>
                    <Feather name="check" size={12} color="#10b981" />
                    <Text style={styles.milestoneText}>Response Understood</Text>
                  </View>
                  <View style={styles.milestoneBadge}>
                    <Feather name="check" size={12} color="#10b981" />
                    <Text style={styles.milestoneText}>Choice Created</Text>
                  </View>
                </View>

                {/* Celebratory Card */}
                <Animated.View
                  style={[
                    styles.celebrationCard,
                    {
                      transform: [{ scale: successBadgeAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(244, 63, 94, 0.25)', 'rgba(225, 29, 72, 0.08)']}
                    style={styles.celebrationCardGradient}
                  >
                    <View style={styles.trophyIconWrap}>
                      <Ionicons name="shield-checkmark" size={54} color="#fbbf24" />
                    </View>

                    <Text style={styles.challengeCompleteTitle}>Challenge Complete</Text>

                    {/* Animated Points Pill (0 -> 600) */}
                    <View style={styles.pointsPill}>
                      <Feather name="award" size={24} color="#fbbf24" style={{ marginRight: 8 }} />
                      <Text style={styles.pointsPillText}>+{pointsCounter} Points</Text>
                    </View>

                    <Text style={styles.quoteWisdomText}>
                      "Awareness grows when you create space between a feeling and your response."
                    </Text>
                  </LinearGradient>
                </Animated.View>

                {/* Error Banner with Retry */}
                {claimError && (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{claimError}</Text>
                  </View>
                )}

                {/* Complete Button (Calls Backend API) */}
                <TouchableOpacity
                  style={[
                    styles.primaryGlowingBtn,
                    (isSubmitting || hasClaimed || reflectionText.trim().length === 0) &&
                      styles.btnDisabled,
                    { marginTop: 16, marginBottom: 30 },
                  ]}
                  onPress={handleClaimReward}
                  disabled={isSubmitting || hasClaimed || reflectionText.trim().length === 0}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      reflectionText.trim().length > 0
                        ? ['#10b981', '#059669']
                        : ['#374151', '#1f2937']
                    }
                    style={styles.primaryGradient}
                  >
                    {isSubmitting ? (
                      <View style={styles.rowCentered}>
                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                        <Text style={styles.primaryBtnText}>Awarding 600 Points...</Text>
                      </View>
                    ) : (
                      <View style={styles.rowCentered}>
                        <Feather name="check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>Complete</Text>
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
                    <Feather name="refresh-cw" size={16} color="#fb7185" style={{ marginRight: 6 }} />
                    <Text style={styles.retryBtnText}>Retry Claim</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* ── Pause / Exit Safety Modal ─────────────────────────────────────── */}
      <Modal
        visible={isPauseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPauseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pauseModalCard}>
            <View style={styles.pauseModalIconWrap}>
              <Feather name="pause" size={32} color="#fb7185" />
            </View>

            <Text style={styles.pauseModalTitle}>Challenge Paused</Text>
            <Text style={styles.pauseModalDesc}>
              You can return when you feel ready. Take a moment to ground yourself.
            </Text>

            <TouchableOpacity
              style={styles.modalContinueBtn}
              onPress={() => setIsPauseModalVisible(false)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#f43f5e', '#be123c']} style={styles.primaryGradient}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalExitBtn}
              onPress={handleExitTaskSafely}
              activeOpacity={0.7}
            >
              <Text style={styles.modalExitBtnText}>Exit Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Floating Ambient Particle ────────────────────────────────────────────────
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
            Animated.timing(opacity, { toValue: 0.6, duration: duration * 0.3, useNativeDriver: true }),
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
    backgroundColor: '#090507',
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
  pauseQuickBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#fb7185',
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
    backgroundColor: '#fb7185',
  },
  progressDotCurrent: {
    width: 20,
    backgroundColor: '#f43f5e',
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

  // ── PAGE 1: ENTER THE CHALLENGE
  pageOneContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  pageOneHero: {
    alignItems: 'center',
    paddingTop: 8,
  },
  heartbeatOrbWrap: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  heartbeatWaveRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  heartbeatCore: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
  },
  heartbeatGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageOneTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
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
  badgeHard: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  badgeReward: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  badgeDuration: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  introTextBox: {
    width: '100%',
    backgroundColor: 'rgba(35, 15, 25, 0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    marginBottom: 16,
  },
  introTextPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  introTextSecondary: {
    fontSize: 14,
    color: '#fda4af',
    textAlign: 'center',
    lineHeight: 20,
  },
  safetyAdvisory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  safetyText: {
    color: '#fda4af',
    fontSize: 12,
    lineHeight: 16,
  },
  pageOneBottom: {
    width: '100%',
  },
  primaryGlowingBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#f43f5e',
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

  // ── PAGE 2: IDENTIFY FEAR SIGNAL
  pageTwoScroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionInstruction: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  scenarioList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  scenarioChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scenarioChipSelected: {
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    borderColor: '#f43f5e',
  },
  scenarioChipText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  scenarioChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionSubTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  signalCard: {
    width: '48%',
    backgroundColor: 'rgba(35, 18, 28, 0.7)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  signalCardSelected: {
    borderColor: '#f43f5e',
    backgroundColor: 'rgba(244, 63, 94, 0.22)',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  signalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalIconWrapActive: {
    backgroundColor: '#f43f5e',
  },
  signalLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  signalLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // ── PAGE 3: BODY RESPONSE SCAN
  pageThreeScroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
  },
  bodyCanvasContainer: {
    width: '100%',
    height: 290,
    backgroundColor: 'rgba(25, 12, 20, 0.6)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  bodyNodePoint: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyNodePointSelected: {
    transform: [{ scale: 1.1 }],
  },
  bodyNodeInner: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 15, 24, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  bodyNodeInnerSelected: {
    backgroundColor: '#f43f5e',
    borderColor: '#ffffff',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  bodyNodeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  intensityCard: {
    backgroundColor: 'rgba(35, 18, 28, 0.7)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    marginTop: 8,
  },
  intensityTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  intensityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  intensityBtnSelected: {
    borderColor: '#f43f5e',
    backgroundColor: '#f43f5e',
  },
  intensityBtnText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
  intensityBtnTextSelected: {
    color: '#ffffff',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 6,
  },
  intensitySubLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },

  // ── PAGE 4: OBSERVE WITHOUT REACTING
  pageFourContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  observeHeader: {
    alignItems: 'center',
  },
  observeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  observeSubtitle: {
    fontSize: 14,
    color: '#fda4af',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  breathingOrbContainer: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingOuterAura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  breathingCoreOrb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.6,
    shadowRadius: 28,
  },
  breathingTimerDigits: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  breathingPhaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fda4af',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  observePromptBox: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  observePromptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  observeBottomBar: {
    width: '100%',
    alignItems: 'center',
  },
  pauseSubtleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  pauseSubtleText: {
    color: '#fda4af',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── PAGE 5: CONTROLLED FEAR CHALLENGE
  pageFiveContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
  },
  challengeHeader: {
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  challengeTimerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    marginVertical: 6,
  },
  challengeTimerDigits: {
    color: '#fda4af',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  stimulusFrame: {
    backgroundColor: 'rgba(35, 15, 25, 0.75)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  stimulusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  stimulusCardTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fb7185',
    letterSpacing: 1.5,
  },
  stimulusBody: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  feedbackBanner: {
    marginTop: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 10,
  },
  feedbackBannerText: {
    color: '#fda4af',
    fontSize: 11,
    fontWeight: '700',
  },
  choiceButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  choiceBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  choiceBtnReact: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
  },
  choiceBtnPause: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  choiceLabelCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  choiceBtnTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ── PAGE 6: AI FEAR RESPONSE ANALYSIS
  pageSixScroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
  },
  analysisHeroCard: {
    backgroundColor: 'rgba(35, 18, 28, 0.75)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    marginBottom: 20,
  },
  analysisCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  analysisCategoryText: {
    color: '#fb7185',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  patternSummaryText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 23,
    fontWeight: '500',
  },
  metricsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    gap: 16,
  },
  metricRowItem: {},
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  metricValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  metricTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ── PAGE 7: REFLECTION + COMPLETION
  pageSevenScroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  reflectionCard: {
    backgroundColor: 'rgba(30, 16, 24, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    marginBottom: 16,
  },
  reflectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  reflectionInput: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
  },
  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 18,
  },
  milestoneBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    justifyContent: 'center',
  },
  milestoneText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  celebrationCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    marginBottom: 16,
  },
  celebrationCardGradient: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
  },
  trophyIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  challengeCompleteTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 14,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    marginBottom: 16,
  },
  pointsPillText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  quoteWisdomText: {
    fontSize: 13,
    color: '#fda4af',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
    paddingHorizontal: 8,
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
    marginTop: 12,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#fb7185',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── PAUSE / EXIT SAFETY MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pauseModalCard: {
    width: '100%',
    backgroundColor: '#180a12',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    alignItems: 'center',
  },
  pauseModalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pauseModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  pauseModalDesc: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalContinueBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 12,
  },
  modalExitBtn: {
    paddingVertical: 10,
  },
  modalExitBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
