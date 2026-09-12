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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, {
  Circle,
  G,
  Line,
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Path,
} from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── TASK CONSTANTS ─────────────────────────────────────────────────────────────
const TASK_ID = 66;
const TASK_NAME = 'Do One Uncomfortable Thing';
const TASK_POINTS = 600;
const DEFAULT_MISSION_TIMER = 300; // 5 minutes in seconds
const EXTENSION_SECONDS = 180;     // +3 minutes extension

// ── CATEGORIES (PAGE 2) ────────────────────────────────────────────────────────
interface ActionCategory {
  id: string;
  tag: string;
  title: string;
  defaultAction: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
}

const ACTION_CATEGORIES: ActionCategory[] = [
  { id: 'social', tag: 'SOCIAL', title: 'Start a conversation', defaultAction: 'start a genuine conversation with someone nearby', icon: 'chat-outline', accent: '#38bdf8' },
  { id: 'courage', tag: 'COURAGE', title: 'Speak up', defaultAction: 'ask a clear question or express an idea instead of staying quiet', icon: 'bullhorn-outline', accent: '#f59e0b' },
  { id: 'boundaries', tag: 'BOUNDARIES', title: 'Say no', defaultAction: 'respectfully say no to an unnecessary request or commitment', icon: 'shield-outline', accent: '#ec4899' },
  { id: 'responsibility', tag: 'RESPONSIBILITY', title: 'Do the thing you’ve delayed', defaultAction: 'take the first 10 minutes on an avoided task right now', icon: 'clock-fast', accent: '#10b981' },
  { id: 'curiosity', tag: 'CURIOSITY', title: 'Try something new', defaultAction: 'order or test something outside my normal comfortable routine', icon: 'compass-outline', accent: '#8b5cf6' },
  { id: 'honesty', tag: 'HONESTY', title: 'Say what you really think', defaultAction: 'share an honest and constructive viewpoint politely', icon: 'heart-outline', accent: '#ef4444' },
  { id: 'initiative', tag: 'INITIATIVE', title: 'Ask for help', defaultAction: 'reach out and ask for advice or clarification on something', icon: 'hand-wave-outline', accent: '#06b6d4' },
];

// ── DISCOMFORT SCALE (PAGE 3) ──────────────────────────────────────────────────
const DISCOMFORT_LEVELS = [
  { id: 'comfortable', label: 'Comfortable', note: 'Too safe to grow', color: '#10b981' },
  { id: 'noticeable', label: 'Noticeable', note: 'Sweet spot for growth', color: '#38bdf8' },
  { id: 'uncomfortable', label: 'Uncomfortable', note: 'High growth challenge', color: '#f59e0b' },
  { id: 'very_uncomfortable', label: 'Very Uncomfortable', note: 'Pushing boundaries', color: '#ef4444' },
];

// ── OUTCOME CHECKBOXES (PAGE 6) ────────────────────────────────────────────────
const OUTCOME_OPTIONS = [
  'It was easier than expected',
  'It was uncomfortable but manageable',
  'It was genuinely difficult',
  'I realized I was avoiding it unnecessarily',
  'Something unexpected happened',
];

// ── UNSAFE KEYWORDS CHECKER ────────────────────────────────────────────────────
const UNSAFE_KEYWORDS = [
  'hurt', 'harm', 'kill', 'suicide', 'die', 'illegal', 'steal', 'rob',
  'crime', 'fight', 'punch', 'hit', 'weapon', 'drugs', 'humiliate', 'naked',
  'jump', 'crash', 'stab', 'extreme', 'dangerous'
];

export default function DoOneUncomfortableThingScreen() {
  const router = useRouter();

  // ── NAVIGATION & STATE ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // ── PAGE DATA STATE ──────────────────────────────────────────────────────────
  // Page 2
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | null>(null);

  // Page 3 (Mission Builder)
  const [customAction, setCustomAction] = useState('');
  const [contextInput, setContextInput] = useState('with a colleague / peer');
  const [timeInput, setTimeInput] = useState('today');
  const [discomfortIndex, setDiscomfortIndex] = useState(1); // Noticeable
  const [isSafetyWarning, setIsSafetyWarning] = useState(false);

  // Page 4 (Countdown)
  const [launchCountdown, setLaunchCountdown] = useState<number | 'GO'>(3);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Page 5 (Do It - Live Mission)
  const [missionStatus, setMissionStatus] = useState<'NOT DONE' | 'IN PROGRESS' | 'CONFIRMING'>('NOT DONE');
  const [activeCheckpoint, setActiveCheckpoint] = useState<1 | 2 | 3 | 4>(1);
  const [missionTimer, setMissionTimer] = useState(DEFAULT_MISSION_TIMER);
  const [hasExtendedTimer, setHasExtendedTimer] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Page 6 (Check Back In)
  const [beforeAnxiety, setBeforeAnxiety] = useState(7);
  const [beforeResistance, setBeforeResistance] = useState(8);
  const [beforeConfidence, setBeforeConfidence] = useState(4);
  const [afterAnxiety, setAfterAnxiety] = useState(3);
  const [afterResistance, setAfterResistance] = useState(2);
  const [afterConfidence, setAfterConfidence] = useState(8);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>(['It was easier than expected']);
  const [surpriseNote, setSurpriseNote] = useState('');

  // Page 8 (Mission Complete)
  const [stampPhase, setStampPhase] = useState<'MISSION' | 'VERIFIED' | 'COMPLETE'>('MISSION');
  const [pointsDisplay, setPointsDisplay] = useState(0);

  // ── ANIMATION REFS ──────────────────────────────────────────────────────────
  const pageFade = useRef(new Animated.Value(1)).current;
  const pageSlideX = useRef(new Animated.Value(0)).current;
  const pageSlideY = useRef(new Animated.Value(0)).current;

  // Page 1: Word entries + horizontal radar line
  const p1Word1 = useRef(new Animated.Value(0)).current;
  const p1Word2 = useRef(new Animated.Value(0)).current;
  const p1Word3 = useRef(new Animated.Value(0)).current;
  const p1ScanLineX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const p1BtnGlow = useRef(new Animated.Value(1)).current;

  // Page 2: Comfort map circles
  const p2EdgeScale = useRef(new Animated.Value(1)).current;
  const p2EdgePulse = useRef(new Animated.Value(0.4)).current;
  const p2CardSnap = useRef(new Animated.Value(0)).current;

  // Page 3: Sentence builder pieces
  const p3Piece1 = useRef(new Animated.Value(0)).current;
  const p3Piece2 = useRef(new Animated.Value(0)).current;
  const p3Piece3 = useRef(new Animated.Value(0)).current;

  // Page 4: Distinct Countdown Animations
  const p4Scale3 = useRef(new Animated.Value(0.3)).current;
  const p4Pulse2 = useRef(new Animated.Value(1)).current;
  const p4Contract1 = useRef(new Animated.Value(1.4)).current;
  const p4RippleGO = useRef(new Animated.Value(0.8)).current;
  const p4RippleOpacity = useRef(new Animated.Value(1)).current;

  // Page 5: Progress ring & pulse
  const p5Pulse = useRef(new Animated.Value(1)).current;

  // Page 6: Split Screen Convergence
  const p6LeftSlide = useRef(new Animated.Value(-SCREEN_WIDTH * 0.4)).current;
  const p6RightSlide = useRef(new Animated.Value(SCREEN_WIDTH * 0.4)).current;

  // Page 7: Boundary Expansion
  const p7BeforeCircle = useRef(new Animated.Value(45)).current;
  const p7AfterCircle = useRef(new Animated.Value(45)).current;
  const p7GrowthNumber = useRef(new Animated.Value(0)).current;

  // Page 8: Mission Stamp Sequence
  const p8StampScale = useRef(new Animated.Value(2.2)).current;
  const p8StampOpacity = useRef(new Animated.Value(0)).current;
  const p8RingExpand = useRef(new Animated.Value(0.4)).current;
  const p8PointsPop = useRef(new Animated.Value(0.7)).current;

  // ── INITIAL PAGE 1 ANIMATIONS ───────────────────────────────────────────────
  useEffect(() => {
    // Stagger word reveals
    Animated.stagger(220, [
      Animated.timing(p1Word1, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(p1Word2, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(p1Word3, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
    ]).start();

    // Infinite scanline loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(p1ScanLineX, {
          toValue: SCREEN_WIDTH,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(p1ScanLineX, {
          toValue: -SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(p1BtnGlow, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(p1BtnGlow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── PAGE 4 COUNTDOWN CONTROLLER ─────────────────────────────────────────────
  useEffect(() => {
    if (currentPage !== 4) return;

    setIsCountingDown(true);
    setLaunchCountdown(3);

    // Number 3 animation: Scale in with overshoot
    p4Scale3.setValue(0.2);
    Animated.spring(p4Scale3, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}

    // Transition to 2 after 1000ms
    const t2 = setTimeout(() => {
      setLaunchCountdown(2);
      p4Pulse2.setValue(1);
      Animated.sequence([
        Animated.timing(p4Pulse2, { toValue: 1.4, duration: 250, useNativeDriver: true }),
        Animated.timing(p4Pulse2, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]).start();
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}
    }, 1000);

    // Transition to 1 after 2000ms
    const t1 = setTimeout(() => {
      setLaunchCountdown(1);
      p4Contract1.setValue(1.8);
      Animated.timing(p4Contract1, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}
    }, 2000);

    // Transition to GO after 3000ms
    const tGO = setTimeout(() => {
      setLaunchCountdown('GO');
      p4RippleGO.setValue(0.5);
      p4RippleOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(p4RippleGO, { toValue: 2.5, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(p4RippleOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
    }, 3000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tGO);
    };
  }, [currentPage]);

  // ── PAGE 5 TIMER LOOP ───────────────────────────────────────────────────────
  useEffect(() => {
    if (currentPage !== 5 || !isTimerRunning) return;

    // Pulse animation while active
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(p5Pulse, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(p5Pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    const interval = setInterval(() => {
      setMissionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          pulseLoop.stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulseLoop.stop();
    };
  }, [currentPage, isTimerRunning]);

  // ── PAGE 6 ENTRANCE: SLIDE PANELS TOGETHER ──────────────────────────────────
  useEffect(() => {
    if (currentPage === 6) {
      p6LeftSlide.setValue(-SCREEN_WIDTH * 0.3);
      p6RightSlide.setValue(SCREEN_WIDTH * 0.3);

      Animated.parallel([
        Animated.timing(p6LeftSlide, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p6RightSlide, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [currentPage]);

  // ── PAGE 7 BOUNDARY EXPANSION & GROWTH SIGNAL ───────────────────────────────
  const growthSignalScore = useMemo(() => {
    let score = 72;
    // Calculate difference between before & after
    const anxietyDelta = Math.max(0, beforeAnxiety - afterAnxiety);
    const resistanceDelta = Math.max(0, beforeResistance - afterResistance);
    const confidenceGain = Math.max(0, afterConfidence - beforeConfidence);

    score += anxietyDelta * 2 + resistanceDelta * 2 + confidenceGain * 2;
    score += selectedOutcomes.length * 3;
    return Math.min(99, Math.max(68, score));
  }, [beforeAnxiety, afterAnxiety, beforeResistance, afterResistance, afterConfidence, beforeConfidence, selectedOutcomes]);

  useEffect(() => {
    if (currentPage === 7) {
      p7BeforeCircle.setValue(40);
      p7AfterCircle.setValue(40);

      Animated.sequence([
        Animated.timing(p7BeforeCircle, { toValue: 48, duration: 400, useNativeDriver: false }),
        Animated.timing(p7AfterCircle, {
          toValue: 95,
          duration: 1200,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [currentPage]);

  // ── PAGE 8 MISSION STAMP ANIMATION & 0 -> 600 POINTS ────────────────────────
  useEffect(() => {
    if (currentPage === 8) {
      // Phase 1: MISSION
      setStampPhase('MISSION');
      p8StampScale.setValue(2.2);
      p8StampOpacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(p8StampScale, { toValue: 1, friction: 6, useNativeDriver: true }),
          Animated.timing(p8StampOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ]).start(() => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
        setStampPhase('VERIFIED');

        setTimeout(() => {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}
          setStampPhase('COMPLETE');

          // Ring expansion
          Animated.parallel([
            Animated.timing(p8RingExpand, { toValue: 2, duration: 800, useNativeDriver: true }),
            Animated.spring(p8PointsPop, { toValue: 1, friction: 5, useNativeDriver: true }),
          ]).start();

          // Animate points 0 -> 600
          let curr = 0;
          const inc = 25;
          const pTimer = setInterval(() => {
            curr += inc;
            if (curr >= TASK_POINTS) {
              setPointsDisplay(TASK_POINTS);
              clearInterval(pTimer);
            } else {
              setPointsDisplay(curr);
            }
          }, 32);
        }, 500);
      });
    }
  }, [currentPage]);

  // ── PAGE TRANSITION DISPATCHER ──────────────────────────────────────────────
  const transitionToPage = (target: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}

    // 1 -> 2: Diagonal Slide
    if (currentPage === 1 && target === 2) {
      Animated.parallel([
        Animated.timing(pageSlideX, { toValue: -SCREEN_WIDTH, duration: 400, useNativeDriver: true }),
        Animated.timing(pageSlideY, { toValue: -SCREEN_HEIGHT * 0.3, duration: 400, useNativeDriver: true }),
        Animated.timing(pageFade, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        setCurrentPage(2);
        pageSlideX.setValue(0);
        pageSlideY.setValue(0);
        Animated.timing(pageFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
      return;
    }

    // Standard cross-fade
    Animated.timing(pageFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setCurrentPage(target);
      Animated.timing(pageFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  // ── REAL-WORLD ACTION STRING RESOLVER ───────────────────────────────────────
  const resolvedActionString = useMemo(() => {
    if (customAction.trim().length > 0) return customAction.trim();
    if (selectedCategory) return selectedCategory.defaultAction;
    return 'take one real-world uncomfortable action';
  }, [customAction, selectedCategory]);

  // ── SAFETY VALIDATOR (PAGE 3) ────────────────────────────────────────────────
  const handleActionTextChange = (text: string) => {
    setCustomAction(text);
    const lower = text.toLowerCase();
    const hasUnsafe = UNSAFE_KEYWORDS.some((kw) => lower.includes(kw));
    setIsSafetyWarning(hasUnsafe);
  };

  // ── AUTHENTICATED COMPLETION (PAGE 8) ────────────────────────────────────────
  const handleFinalTaskCompletion = async () => {
    if (isSubmitting || hasClaimed) return;
    setIsSubmitting(true);
    setClaimError(null);

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setClaimError('Authorization token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: TASK_ID,
          task_name: TASK_NAME,
          difficulty: 'Hard',
          category: selectedCategory?.id || 'social',
          action: resolvedActionString,
          context: contextInput.trim(),
          discomfort_level: DISCOMFORT_LEVELS[discomfortIndex].id,
          self_confirmed: true,
          outcomes: selectedOutcomes,
          growth_score: growthSignalScore,
          reflection: surpriseNote.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok && !data.success) {
        throw new Error(data.error || data.message || 'Failed to submit task completion.');
      }

      setHasClaimed(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}

      const pointsEarned = data.pointsEarned ?? data.pointsAdded ?? data.points_rewarded ?? TASK_POINTS;
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? '0';

      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsEarned),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: 'Do One Uncomfortable Thing',
          difficulty: 'Hard',
          message: 'You stepped outside your comfort zone.',
        },
      } as any);
    } catch (err: any) {
      console.error('Do One Uncomfortable Thing claim error:', err);
      setClaimError(err?.message || 'Network request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── FORMAT TIME MM:SS ───────────────────────────────────────────────────────
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 1 — THE MISSION
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage1TheMission = () => (
    <View style={styles.p1Container}>
      {/* Top Protocol Label */}
      <View style={styles.p1TopLabelRow}>
        <View style={styles.p1DotIndicator} />
        <Text style={styles.p1TopLabel}>PERSONAL GROWTH MISSION</Text>
      </View>

      {/* Huge Typography with Individual Word Entrances */}
      <View style={styles.p1TypographyBlock}>
        <Animated.View style={{ opacity: p1Word1, transform: [{ translateY: p1Word1.interpolate({ inputRange: [0, 1], outputRange: [25, 0] }) }] }}>
          <Text style={styles.p1HugeWord}>Do One</Text>
        </Animated.View>
        <Animated.View style={{ opacity: p1Word2, transform: [{ translateY: p1Word2.interpolate({ inputRange: [0, 1], outputRange: [35, 0] }) }] }}>
          <Text style={[styles.p1HugeWord, styles.p1WordAccent]}>Uncomfortable</Text>
        </Animated.View>
        <Animated.View style={{ opacity: p1Word3, transform: [{ translateY: p1Word3.interpolate({ inputRange: [0, 1], outputRange: [45, 0] }) }] }}>
          <Text style={styles.p1HugeWord}>Thing</Text>
        </Animated.View>
      </View>

      {/* Badges */}
      <View style={styles.p1BadgeRow}>
        <View style={styles.hardBadge}>
          <Text style={styles.hardBadgeText}>HARD</Text>
        </View>
        <View style={styles.pointsBadge}>
          <MaterialCommunityIcons name="shield-star-outline" size={14} color="#38bdf8" />
          <Text style={styles.pointsBadgeText}>+600 Points</Text>
        </View>
      </View>

      {/* Animated Radar/Scan Line */}
      <View style={styles.scanLineTrack}>
        <Animated.View style={[styles.scanLine, { transform: [{ translateX: p1ScanLineX }] }]} />
      </View>

      {/* Mission Description */}
      <View style={styles.p1DescBlock}>
        <Text style={styles.p1DescHeadline}>Growth usually starts where comfort ends.</Text>
        <Text style={styles.p1DescBody}>
          Choose one small action you would normally avoid — and actually do it in the real world today.
        </Text>

        <View style={styles.p1SafetyCard}>
          <Feather name="shield" size={15} color="#38bdf8" />
          <Text style={styles.p1SafetyText}>
            Choose something safe, respectful, and realistically manageable.
          </Text>
        </View>
      </View>

      {/* CTA Button */}
      <Animated.View style={{ transform: [{ scale: p1BtnGlow }] }}>
        <TouchableOpacity
          style={styles.missionLaunchBtn}
          onPress={() => transitionToPage(2)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#0284c7', '#0369a1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={styles.missionLaunchBtnText}>Accept Mission</Text>
            <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 10 }} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 2 — CHOOSE YOUR EDGE
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage2ChooseYourEdge = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.pageHeaderBlock}>
        <Text style={styles.pageHeaderPre}>EXPLORE BOUNDARIES</Text>
        <Text style={styles.pageHeaderTitle}>Where Will You Push Your Edge?</Text>
      </View>

      {/* Interactive Comfort Zone Vector Map */}
      <View style={styles.p2MapWrapper}>
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Defs>
            <RadialGradient id="edgeGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#0369a1" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
            </RadialGradient>
          </Defs>

          {/* Outer Edge Zone */}
          <Circle cx="120" cy="120" r="105" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" fill="url(#edgeGrad)" />
          {/* Middle Familiar Zone */}
          <Circle cx="120" cy="120" r="70" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" fill="rgba(30, 41, 59, 0.4)" />
          {/* Inner Comfort Zone */}
          <Circle cx="120" cy="120" r="38" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" fill="rgba(15, 23, 42, 0.8)" />
        </Svg>

        <View style={styles.p2MapLabels}>
          <Text style={styles.mapLabelComfort}>COMFORT</Text>
          <Text style={styles.mapLabelFamiliar}>FAMILIAR</Text>
          <Text style={styles.mapLabelEdge}>EDGE</Text>
        </View>
      </View>

      {/* Action Categories */}
      <View style={styles.p2CategoriesGrid}>
        {ACTION_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChipCard,
                isSelected && { borderColor: cat.accent, backgroundColor: 'rgba(30, 41, 59, 0.9)' },
              ]}
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                setSelectedCategory(cat);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: `${cat.accent}20` }]}>
                <MaterialCommunityIcons name={cat.icon} size={20} color={cat.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.categoryTag, { color: cat.accent }]}>{cat.tag}</Text>
                <Text style={styles.categoryTitle}>{cat.title}</Text>
              </View>
              {isSelected && <Feather name="check" size={18} color={cat.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Confirmation Banner */}
      {selectedCategory && (
        <View style={styles.p2SelectedBanner}>
          <Text style={styles.p2SelectedEdgeText}>This is your edge.</Text>
          <Text style={styles.p2SelectedActionText}>“{selectedCategory.title}”</Text>
        </View>
      )}

      {/* CTA Button */}
      <View style={styles.bottomBtnWrap}>
        <TouchableOpacity
          style={[styles.missionLaunchBtn, !selectedCategory && styles.btnDisabled]}
          onPress={() => {
            if (selectedCategory) transitionToPage(3);
          }}
          disabled={!selectedCategory}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selectedCategory ? ['#0284c7', '#0369a1'] : ['#334155', '#1e293b']}
            style={styles.btnGradient}
          >
            <Text style={styles.missionLaunchBtnText}>Choose This</Text>
            <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 10 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 3 — MAKE IT SPECIFIC (SENTENCE BUILDER)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage3MakeItSpecific = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.pageHeaderBlock}>
          <Text style={styles.pageHeaderPre}>MISSION SPECIFICATION</Text>
          <Text style={styles.pageHeaderTitle}>Turn It Into One Action</Text>
        </View>

        {/* Interactive Sentence Builder Display */}
        <View style={styles.sentenceBuilderCard}>
          <Text style={styles.sentenceStatic}>I will</Text>
          <Text style={styles.sentenceDynamicAction}>{resolvedActionString}</Text>
          <Text style={styles.sentenceStatic}>with</Text>
          <Text style={styles.sentenceDynamicContext}>{contextInput || '...'}</Text>
          <Text style={styles.sentenceStatic}>before</Text>
          <Text style={styles.sentenceDynamicTime}>{timeInput || 'today'}</Text>
        </View>

        {/* Customizable Action Input */}
        <View style={styles.specInputCard}>
          <Text style={styles.specInputTitle}>What exactly will you do?</Text>
          <TextInput
            style={styles.specTextInput}
            placeholder="Write the specific action you will actually take…"
            placeholderTextColor="#64748b"
            value={customAction}
            onChangeText={handleActionTextChange}
            multiline
            numberOfLines={2}
          />

          {/* Safety Alert if Unsafe Word Detected */}
          {isSafetyWarning && (
            <View style={styles.safetyAlertBanner}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.safetyAlertTitle}>Choose a safer version of this challenge.</Text>
                <TouchableOpacity onPress={() => setCustomAction('')}>
                  <Text style={styles.safetyAlertAction}>Make It Smaller</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subInputLabel}>Context / With Whom</Text>
              <TextInput
                style={styles.specSubInput}
                placeholder="e.g. at the coffee shop"
                placeholderTextColor="#64748b"
                value={contextInput}
                onChangeText={setContextInput}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subInputLabel}>Timeframe</Text>
              <TextInput
                style={styles.specSubInput}
                placeholder="e.g. before 6 PM"
                placeholderTextColor="#64748b"
                value={timeInput}
                onChangeText={setTimeInput}
              />
            </View>
          </View>
        </View>

        {/* Discomfort Visual Meter */}
        <View style={styles.discomfortMeterCard}>
          <Text style={styles.discomfortMeterTitle}>How uncomfortable does this feel?</Text>
          <View style={styles.discomfortPillsRow}>
            {DISCOMFORT_LEVELS.map((level, idx) => {
              const isSelected = discomfortIndex === idx;

              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.discomfortPill,
                    isSelected && { borderColor: level.color, backgroundColor: `${level.color}25` },
                  ]}
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                    setDiscomfortIndex(idx);
                  }}
                >
                  <Text style={[styles.discomfortPillText, isSelected && { color: level.color, fontWeight: '700' }]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.discomfortTargetNote}>
            Target: <Text style={{ color: '#38bdf8', fontWeight: '600' }}>Noticeably uncomfortable, but manageable.</Text>
          </Text>
        </View>

        {/* CTA Button */}
        <View style={styles.bottomBtnWrap}>
          <TouchableOpacity
            style={[styles.missionLaunchBtn, isSafetyWarning && styles.btnDisabled]}
            onPress={() => {
              if (!isSafetyWarning) transitionToPage(4);
            }}
            disabled={isSafetyWarning}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#0284c7', '#0369a1']} style={styles.btnGradient}>
              <Feather name="lock" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.missionLaunchBtnText}>Lock My Mission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 4 — 3...2...1... GO
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage4LaunchSequence = () => (
    <View style={styles.p4Container}>
      {/* Target Mission Brief Display */}
      <View style={styles.p4MissionBrief}>
        <Text style={styles.p4MissionLabel}>YOUR LOCKED MISSION</Text>
        <Text style={styles.p4MissionText}>“{resolvedActionString}”</Text>
      </View>

      {/* Countdown Visual Center */}
      <View style={styles.p4CenterStage}>
        <Text style={styles.p4ReadyPrompt}>Are you ready?</Text>

        {launchCountdown === 3 && (
          <Animated.View style={{ transform: [{ scale: p4Scale3 }] }}>
            <Text style={styles.countdownDigit}>3</Text>
          </Animated.View>
        )}

        {launchCountdown === 2 && (
          <Animated.View style={{ transform: [{ scale: p4Pulse2 }] }}>
            <Text style={[styles.countdownDigit, { color: '#38bdf8' }]}>2</Text>
          </Animated.View>
        )}

        {launchCountdown === 1 && (
          <Animated.View style={{ transform: [{ scale: p4Contract1 }] }}>
            <Text style={[styles.countdownDigit, { color: '#f59e0b' }]}>1</Text>
          </Animated.View>
        )}

        {launchCountdown === 'GO' && (
          <View style={styles.goRippleContainer}>
            <Animated.View
              style={[
                styles.goRippleRing,
                { transform: [{ scale: p4RippleGO }], opacity: p4RippleOpacity },
              ]}
            />
            <Text style={styles.countdownDigitGO}>GO</Text>
          </View>
        )}
      </View>

      {/* Message */}
      <View style={styles.p4BottomBlock}>
        <Text style={styles.p4Headline}>Your comfort zone ends here.</Text>
        <Text style={styles.p4SubText}>
          You don't need to feel ready.{'\n'}You only need to take the first step.
        </Text>

        <TouchableOpacity
          style={styles.missionLaunchBtn}
          onPress={() => transitionToPage(5)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
            <Text style={styles.missionLaunchBtnText}>I'M GOING</Text>
            <Feather name="zap" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 5 — DO IT (LIVE MISSION DASHBOARD)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage5DoIt = () => {
    const checkpoints = [
      { num: 1, label: 'Approach' },
      { num: 2, label: 'Start' },
      { num: 3, label: 'Stay' },
      { num: 4, label: 'Finish' },
    ];

    return (
      <View style={styles.p5Container}>
        {/* Top Header */}
        <View style={styles.p5Header}>
          <View style={styles.p5LiveDot} />
          <Text style={styles.p5HeaderStatus}>MISSION ACTIVE</Text>
        </View>

        {/* Active Mission Display */}
        <View style={styles.p5MissionCard}>
          <Text style={styles.p5CardAction}>“{resolvedActionString}”</Text>
          <Text style={styles.p5CardContext}>
            {contextInput} · {timeInput}
          </Text>

          <View style={[styles.p5StatusTag, missionStatus === 'IN PROGRESS' && styles.statusInProgress]}>
            <Text style={styles.p5StatusTagText}>{missionStatus}</Text>
          </View>
        </View>

        {/* 4 Action Checkpoints */}
        <View style={styles.checkpointRow}>
          {checkpoints.map((cp) => {
            const isPassed = activeCheckpoint >= cp.num;
            return (
              <TouchableOpacity
                key={cp.num}
                style={[styles.checkpointNode, isPassed && styles.checkpointNodePassed]}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                  setActiveCheckpoint(cp.num as any);
                }}
              >
                <Text style={[styles.checkpointNum, isPassed && styles.checkpointNumPassed]}>{cp.num}</Text>
                <Text style={[styles.checkpointLabel, isPassed && styles.checkpointLabelPassed]}>{cp.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Accountability Focus Window / Timer */}
        <View style={styles.accountabilityBox}>
          <Text style={styles.accountabilityLabel}>ACCOUNTABILITY WINDOW</Text>
          <Text style={styles.timerDigits}>{formatTimer(missionTimer)}</Text>
          <Text style={styles.timerSubNote}>Take real action in the real world now.</Text>
        </View>

        {/* Live Action Controls */}
        <View style={styles.p5Controls}>
          {missionStatus === 'NOT DONE' ? (
            <TouchableOpacity
              style={styles.missionLaunchBtn}
              onPress={() => {
                setMissionStatus('IN PROGRESS');
                setIsTimerRunning(true);
                setActiveCheckpoint(2);
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
              }}
            >
              <LinearGradient colors={['#0284c7', '#0369a1']} style={styles.btnGradient}>
                <Text style={styles.missionLaunchBtnText}>I'm doing it now</Text>
                <Feather name="play" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={styles.missionDoneBtn}
                onPress={() => setShowConfirmModal(true)}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
                  <Feather name="check-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.missionLaunchBtnText}>I DID IT</Text>
                </LinearGradient>
              </TouchableOpacity>

              {!hasExtendedTimer && (
                <TouchableOpacity
                  style={styles.needTimeBtn}
                  onPress={() => {
                    setMissionTimer((prev) => prev + EXTENSION_SECONDS);
                    setHasExtendedTimer(true);
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                  }}
                >
                  <Text style={styles.needTimeText}>+3 Min Extension (I NEED MORE TIME)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Confirmation Modal */}
        <Modal visible={showConfirmModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalCard}>
              <Feather name="help-circle" size={36} color="#38bdf8" />
              <Text style={styles.confirmModalTitle}>Genuine Completion</Text>
              <Text style={styles.confirmModalDesc}>
                Did you genuinely step outside your comfort zone and complete the action?
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalCancelText}>Not yet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalYesBtn}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setIsTimerRunning(false);
                    transitionToPage(6);
                  }}
                >
                  <Text style={styles.modalYesText}>Yes, I did it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 6 — CHECK BACK IN (BEFORE VS AFTER SPLIT-SCREEN)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage6CheckBackIn = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeaderBlock}>
        <Text style={styles.pageHeaderPre}>SELF-CONFIRMED ACCOUNTABILITY</Text>
        <Text style={styles.pageHeaderTitle}>Check Back In</Text>
      </View>

      {/* Before vs After Split Sliders */}
      <View style={styles.splitPanelsWrapper}>
        {/* Left Side: BEFORE */}
        <Animated.View style={[styles.splitPanelHalf, { transform: [{ translateX: p6LeftSlide }] }]}>
          <Text style={styles.splitPanelTitle}>BEFORE</Text>
          <Text style={styles.splitPanelSub}>How did this feel before?</Text>

          <View style={styles.sliderUnit}>
            <Text style={styles.sliderLabel}>Anxiety: {beforeAnxiety}/10</Text>
            <View style={styles.sliderPipsTrack}>
              {[2, 4, 6, 8, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniPip, beforeAnxiety >= v && styles.miniPipActiveBefore]}
                  onPress={() => setBeforeAnxiety(v)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sliderUnit}>
            <Text style={styles.sliderLabel}>Resistance: {beforeResistance}/10</Text>
            <View style={styles.sliderPipsTrack}>
              {[2, 4, 6, 8, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniPip, beforeResistance >= v && styles.miniPipActiveBefore]}
                  onPress={() => setBeforeResistance(v)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sliderUnit}>
            <Text style={styles.sliderLabel}>Confidence: {beforeConfidence}/10</Text>
            <View style={styles.sliderPipsTrack}>
              {[2, 4, 6, 8, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniPip, beforeConfidence >= v && styles.miniPipActiveBefore]}
                  onPress={() => setBeforeConfidence(v)}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Right Side: AFTER */}
        <Animated.View style={[styles.splitPanelHalf, styles.splitPanelRight, { transform: [{ translateX: p6RightSlide }] }]}>
          <Text style={[styles.splitPanelTitle, { color: '#10b981' }]}>AFTER</Text>
          <Text style={styles.splitPanelSub}>How do you feel now?</Text>

          <View style={styles.sliderUnit}>
            <Text style={styles.sliderLabel}>Anxiety: {afterAnxiety}/10</Text>
            <View style={styles.sliderPipsTrack}>
              {[2, 4, 6, 8, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniPip, afterAnxiety >= v && styles.miniPipActiveAfter]}
                  onPress={() => setAfterAnxiety(v)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sliderUnit}>
            <Text style={styles.sliderLabel}>Resistance: {afterResistance}/10</Text>
            <View style={styles.sliderPipsTrack}>
              {[2, 4, 6, 8, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniPip, afterResistance >= v && styles.miniPipActiveAfter]}
                  onPress={() => setAfterResistance(v)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sliderUnit}>
            <Text style={styles.sliderLabel}>Confidence: {afterConfidence}/10</Text>
            <View style={styles.sliderPipsTrack}>
              {[2, 4, 6, 8, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniPip, afterConfidence >= v && styles.miniPipActiveAfter]}
                  onPress={() => setAfterConfidence(v)}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Outcome Checkboxes */}
      <View style={styles.outcomeSection}>
        <Text style={styles.outcomeSectionTitle}>What happened?</Text>
        {OUTCOME_OPTIONS.map((opt) => {
          const isSelected = selectedOutcomes.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.outcomeRow, isSelected && styles.outcomeRowSelected]}
              onPress={() => {
                if (isSelected) {
                  setSelectedOutcomes(selectedOutcomes.filter((o) => o !== opt));
                } else {
                  setSelectedOutcomes([...selectedOutcomes, opt]);
                }
              }}
            >
              <View style={[styles.outcomeCheck, isSelected && styles.outcomeCheckSelected]}>
                {isSelected && <Feather name="check" size={12} color="#ffffff" />}
              </View>
              <Text style={styles.outcomeText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Optional Note */}
      <View style={styles.specInputCard}>
        <Text style={styles.specInputTitle}>What surprised you? (Optional)</Text>
        <TextInput
          style={styles.specSubInput}
          placeholder="One realization from doing this…"
          placeholderTextColor="#64748b"
          value={surpriseNote}
          onChangeText={setSurpriseNote}
        />
      </View>

      {/* Save CTA */}
      <View style={styles.bottomBtnWrap}>
        <TouchableOpacity
          style={styles.missionLaunchBtn}
          onPress={() => transitionToPage(7)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#0284c7', '#0369a1']} style={styles.btnGradient}>
            <Text style={styles.missionLaunchBtnText}>Save My Experience</Text>
            <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 10 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 7 — WHAT CHANGED? (COMFORT BOUNDARY EXPANSION)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage7WhatChanged = () => {
    // Generate authentic insights
    let personalizedMessage = 'You acted despite the discomfort. That conscious action is what builds courage.';
    if (afterConfidence > beforeConfidence + 3) {
      personalizedMessage = 'You discovered that anticipation was far harder than the action itself.';
    } else if (afterAnxiety >= beforeAnxiety) {
      personalizedMessage = 'The discomfort remained, but your ability to act alongside it visibly expanded.';
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeaderBlock}>
          <Text style={styles.pageHeaderPre}>BOUNDARY TRANSFORMATION</Text>
          <Text style={styles.pageHeaderTitle}>What Changed?</Text>
        </View>

        {/* Visual Boundary Expansion */}
        <View style={styles.boundaryGraphicBox}>
          <Svg width={220} height={220} viewBox="0 0 220 220">
            {/* Expanded After Boundary */}
            <Circle cx="110" cy="110" r="90" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" fill="rgba(16, 185, 129, 0.12)" />
            {/* Original Before Boundary */}
            <Circle cx="110" cy="110" r="45" stroke="#38bdf8" strokeWidth="2" fill="rgba(56, 189, 248, 0.2)" />
          </Svg>
          <View style={styles.boundaryBadgeCenter}>
            <Text style={styles.growthSignalLabel}>GROWTH SIGNAL</Text>
            <Text style={styles.growthSignalValue}>{growthSignalScore}%</Text>
          </View>
        </View>

        {/* 3 Core Insights */}
        <View style={styles.threeInsightsRow}>
          <View style={styles.insightBox}>
            <Text style={styles.insightTag}>COURAGE</Text>
            <Text style={styles.insightScore}>High</Text>
            <Text style={styles.insightSub}>Action completed</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightTag}>AWARENESS</Text>
            <Text style={styles.insightScore}>Direct</Text>
            <Text style={styles.insightSub}>Edge acknowledged</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightTag}>EXPANSION</Text>
            <Text style={styles.insightScore}>+{(afterConfidence - beforeConfidence) >= 0 ? `+${afterConfidence - beforeConfidence}` : '1'}</Text>
            <Text style={styles.insightSub}>Confidence delta</Text>
          </View>
        </View>

        {/* Personalized Message Card */}
        <View style={styles.personalizedCard}>
          <Feather name="check-circle" size={18} color="#10b981" />
          <Text style={styles.personalizedText}>{personalizedMessage}</Text>
        </View>

        {/* CTA */}
        <View style={styles.bottomBtnWrap}>
          <TouchableOpacity
            style={styles.missionLaunchBtn}
            onPress={() => transitionToPage(8)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#0284c7', '#0369a1']} style={styles.btnGradient}>
              <Text style={styles.missionLaunchBtnText}>See My Achievement</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 8 — MISSION COMPLETE (STAMP & +600 CLAIM)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage8MissionComplete = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeaderBlock}>
        <Text style={styles.pageHeaderPre}>MISSION CERTIFIED</Text>
        <Text style={styles.pageHeaderTitle}>YOU DID IT</Text>
      </View>

      {/* Mission Stamp Graphic */}
      <View style={styles.p8StampCenter}>
        <Animated.View
          style={[
            styles.missionStampBadge,
            stampPhase === 'COMPLETE' && styles.stampCompleteStyle,
            { transform: [{ scale: p8StampScale }], opacity: p8StampOpacity },
          ]}
        >
          <Text style={styles.stampPreText}>PERSONAL GROWTH</Text>
          <Text style={styles.stampMainText}>{stampPhase}</Text>
          <Text style={styles.stampDateText}>SELF-CONFIRMED</Text>
        </Animated.View>
      </View>

      {/* Completed Mission Card */}
      <View style={styles.completedMissionCard}>
        <Text style={styles.completedCardLabel}>COMPLETED ACTION</Text>
        <Text style={styles.completedCardAction}>“{resolvedActionString}”</Text>
        <Text style={styles.completedCardSub}>Comfort Zone Expanded</Text>
      </View>

      {/* Animated +600 Points */}
      <Animated.View style={[styles.p8PointsPill, { transform: [{ scale: p8PointsPop }] }]}>
        <MaterialCommunityIcons name="trophy-award" size={26} color="#fbbf24" />
        <Text style={styles.p8PointsNumber}>+{pointsDisplay} Points</Text>
      </Animated.View>

      {/* Closing Quote */}
      <Text style={styles.p8ClosingQuote}>
        “You don't need to eliminate discomfort to grow.{'\n'}You just need to stop letting it make every decision.”
      </Text>

      {/* Error Notice if any */}
      {claimError && (
        <View style={styles.safetyAlertBanner}>
          <Feather name="alert-triangle" size={16} color="#ef4444" />
          <Text style={[styles.safetyAlertTitle, { marginLeft: 8 }]}>{claimError}</Text>
        </View>
      )}

      {/* Complete Mission CTA */}
      <View style={styles.bottomBtnWrap}>
        <TouchableOpacity
          style={[styles.missionLaunchBtn, (isSubmitting || hasClaimed) && styles.btnDisabled]}
          onPress={handleFinalTaskCompletion}
          disabled={isSubmitting || hasClaimed}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGradient}>
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.missionLaunchBtnText}>
                  {hasClaimed ? 'Completed' : 'Complete Mission'}
                </Text>
                <Feather name="check" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER WRAPPER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />

      {/* Atmospheric Dark Mission Control Background */}
      <LinearGradient
        colors={['#050810', '#0a101d', '#080d19', '#03050a']}
        locations={[0, 0.4, 0.8, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (currentPage === 1) {
                router.back();
              } else {
                transitionToPage((currentPage - 1) as any);
              }
            }}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>MISSION STAGE {currentPage}/8</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Animated Page Container */}
        <Animated.View
          style={[
            styles.pageWrapper,
            {
              opacity: pageFade,
              transform: [{ translateX: pageSlideX }, { translateY: pageSlideY }],
            },
          ]}
        >
          {currentPage === 1 && renderPage1TheMission()}
          {currentPage === 2 && renderPage2ChooseYourEdge()}
          {currentPage === 3 && renderPage3MakeItSpecific()}
          {currentPage === 4 && renderPage4LaunchSequence()}
          {currentPage === 5 && renderPage5DoIt()}
          {currentPage === 6 && renderPage6CheckBackIn()}
          {currentPage === 7 && renderPage7WhatChanged()}
          {currentPage === 8 && renderPage8MissionComplete()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#050810',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  pageWrapper: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pageHeaderBlock: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  pageHeaderPre: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionLaunchBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  missionLaunchBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  bottomBtnWrap: {
    width: '100%',
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.45,
  },

  // ── PAGE 1 STYLES
  p1Container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  p1TopLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  p1DotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  p1TopLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  p1TypographyBlock: {
    marginVertical: 14,
  },
  p1HugeWord: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  p1WordAccent: {
    color: '#38bdf8',
  },
  p1BadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  hardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  hardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 1,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  scanLineTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  scanLine: {
    width: SCREEN_WIDTH * 0.4,
    height: 2,
    backgroundColor: '#38bdf8',
  },
  p1DescBlock: {
    gap: 8,
  },
  p1DescHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 22,
  },
  p1DescBody: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  p1SafetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  p1SafetyText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 16,
  },

  // ── PAGE 2 STYLES
  p2MapWrapper: {
    width: 240,
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  p2MapLabels: {
    position: 'absolute',
    alignItems: 'center',
  },
  mapLabelComfort: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  mapLabelFamiliar: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginTop: 22,
  },
  mapLabelEdge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.2,
    marginTop: 28,
  },
  p2CategoriesGrid: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  categoryChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  p2SelectedBanner: {
    width: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
    marginTop: 14,
  },
  p2SelectedEdgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  p2SelectedActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },

  // ── PAGE 3 STYLES
  sentenceBuilderCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 16,
  },
  sentenceStatic: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  sentenceDynamicAction: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
    marginVertical: 2,
  },
  sentenceDynamicContext: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginVertical: 2,
  },
  sentenceDynamicTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
    marginVertical: 2,
  },
  specInputCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  specInputTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  specTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subInputLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  specSubInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  safetyAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  safetyAlertTitle: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '600',
  },
  safetyAlertAction: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
    marginTop: 2,
  },
  discomfortMeterCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  discomfortMeterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  discomfortPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  discomfortPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  discomfortPillText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  discomfortTargetNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },

  // ── PAGE 4 STYLES
  p4Container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  p4MissionBrief: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginTop: 10,
  },
  p4MissionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  p4MissionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 6,
  },
  p4CenterStage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  p4ReadyPrompt: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 10,
  },
  countdownDigit: {
    fontSize: 90,
    fontWeight: '900',
    color: '#ffffff',
  },
  countdownDigitGO: {
    fontSize: 78,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 2,
  },
  goRippleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  goRippleRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#10b981',
  },
  p4BottomBlock: {
    alignItems: 'center',
    gap: 8,
  },
  p4Headline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  p4SubText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },

  // ── PAGE 5 STYLES
  p5Container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  p5Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  p5LiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  p5HeaderStatus: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 1.5,
  },
  p5MissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginTop: 10,
  },
  p5CardAction: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  p5CardContext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  p5StatusTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  statusInProgress: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  p5StatusTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  checkpointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  checkpointNode: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkpointNodePassed: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  checkpointNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  checkpointNumPassed: {
    color: '#38bdf8',
  },
  checkpointLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  checkpointLabelPassed: {
    color: '#ffffff',
  },
  accountabilityBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  accountabilityLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  timerDigits: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  timerSubNote: {
    fontSize: 12,
    color: '#64748b',
  },
  p5Controls: {
    width: '100%',
  },
  missionDoneBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  needTimeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  needTimeText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 10,
  },
  confirmModalDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 16,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalYesBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  modalYesText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },

  // ── PAGE 6 STYLES
  splitPanelsWrapper: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  splitPanelHalf: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  splitPanelRight: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  splitPanelTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  splitPanelSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10,
  },
  sliderUnit: {
    marginVertical: 6,
  },
  sliderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  sliderPipsTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  miniPip: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniPipActiveBefore: {
    backgroundColor: '#38bdf8',
  },
  miniPipActiveAfter: {
    backgroundColor: '#10b981',
  },
  outcomeSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  outcomeSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  outcomeRowSelected: {
    opacity: 1,
  },
  outcomeCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outcomeCheckSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  outcomeText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },

  // ── PAGE 7 STYLES
  boundaryGraphicBox: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  boundaryBadgeCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  growthSignalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  growthSignalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10b981',
  },
  threeInsightsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginVertical: 14,
  },
  insightBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  insightTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  insightScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 2,
  },
  insightSub: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
  },
  personalizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
    width: '100%',
  },
  personalizedText: {
    fontSize: 13,
    color: '#a7f3d0',
    flex: 1,
    lineHeight: 18,
  },

  // ── PAGE 8 STYLES
  p8StampCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  missionStampBadge: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
  },
  stampCompleteStyle: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  stampPreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  stampMainText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginVertical: 2,
  },
  stampDateText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  completedMissionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  completedCardAction: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 6,
  },
  completedCardSub: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  p8PointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    gap: 8,
    marginBottom: 16,
  },
  p8PointsNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fbbf24',
  },
  p8ClosingQuote: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
});
