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
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const TASK_ID = 50;
const TASK_NAME = 'Meet one friend in real life';
const TASK_POINTS = 600;
const MISSION_DURATION_SECONDS = 7200; // 2 Hours = 7200 seconds
const STORAGE_KEY = '@antisocials_meet_task_state_v2';

// ── PERSON CATEGORIES (SCREEN 2) ───────────────────────────────────────────────
interface PersonOption {
  id: 'friend' | 'family' | 'close';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  tag: string;
  subtitle: string;
  accent: string;
  gradient: [string, string];
}

const PERSON_OPTIONS: PersonOption[] = [
  {
    id: 'friend',
    icon: 'account-group-outline',
    title: 'Friend',
    tag: 'Reconnection',
    subtitle: "Someone you haven't properly talked to lately.",
    accent: '#38bdf8',
    gradient: ['rgba(56, 189, 248, 0.18)', 'rgba(15, 23, 42, 0.7)'],
  },
  {
    id: 'family',
    icon: 'heart-outline',
    title: 'Family',
    tag: 'Deep Roots',
    subtitle: 'Someone at home or nearby who matters to you.',
    accent: '#f43f5e',
    gradient: ['rgba(244, 63, 94, 0.18)', 'rgba(15, 23, 42, 0.7)'],
  },
  {
    id: 'close',
    icon: 'white-balance-sunny',
    title: 'Someone Close',
    tag: 'Safe Space',
    subtitle: 'A person you feel comfortable being yourself around.',
    accent: '#fbbf24',
    gradient: ['rgba(251, 191, 36, 0.18)', 'rgba(15, 23, 42, 0.7)'],
  },
];

// ── SCREEN 3: PLAN CHOICES ─────────────────────────────────────────────────────
const WHEN_OPTIONS = [
  { id: 'now', label: 'Right Now', sub: 'Spontaneous 2 hours' },
  { id: 'afternoon', label: 'This Afternoon', sub: 'Golden hour window' },
  { id: 'evening', label: 'Tonight', sub: 'After work / dinner' },
  { id: 'tomorrow', label: 'Tomorrow', sub: 'Locked on calendar' },
];

const WHERE_OPTIONS = [
  { id: 'cafe', icon: 'coffee-outline', label: 'Café' },
  { id: 'park', icon: 'tree-outline', label: 'Park' },
  { id: 'home', icon: 'home-outline', label: 'Home' },
  { id: 'walk', icon: 'walk', label: 'Walk' },
  { id: 'sports', icon: 'basketball', label: 'Sports' },
  { id: 'place', icon: 'compass-outline', label: 'Any Place' },
];

const WHAT_OPTIONS = [
  { id: 'talk', icon: 'message-outline', label: 'Talk' },
  { id: 'walk_together', icon: 'map-marker-distance', label: 'Walk together' },
  { id: 'coffee', icon: 'cup-outline', label: 'Have coffee' },
  { id: 'play', icon: 'gamepad-variant-outline', label: 'Play something' },
  { id: 'eat', icon: 'silverware-fork-knife', label: 'Eat together' },
  { id: 'catchup', icon: 'heart-pulse', label: 'Sit and catch up' },
];

// ── SCREEN 5: ROTATING MINDFULNESS PROMPTS ─────────────────────────────────────
const ROTATING_PROMPTS = [
  '“Ask them something you’ve never asked before.”',
  '“Listen without planning your reply.”',
  '“Tell them something you’ve been thinking about.”',
  '“Put your phone away and notice the moment.”',
  '“Let the conversation wander.”',
  '“Notice the expression in their eyes when they speak.”',
  '“Be where your feet are right now.”',
];

// ── SCREEN 6: EMOTIONAL CONNECTION CHOICES ─────────────────────────────────────
const CONNECTION_CHOICES = [
  { id: 'laughed', label: 'We laughed.', icon: 'emoticon-outline', color: '#fbbf24' },
  { id: 'real_talk', label: 'We talked about something real.', icon: 'message-text-outline', color: '#38bdf8' },
  { id: 'enjoyed_together', label: 'We simply enjoyed being together.', icon: 'heart-outline', color: '#f43f5e' },
];

// Ambient Floating Dust/Stars
const AMBIENT_DUST = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i * 29) % 100,
  y: (i * 47) % 100,
  size: 2 + (i % 3),
  opacity: 0.2 + (i % 4) * 0.12,
}));

export default function MeetTaskScreen() {
  const router = useRouter();

  // ── SCREEN NAVIGATION (1 through 8) ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);

  // ── TASK CHOICES & REASONING ─────────────────────────────────────────────────
  const [selectedPerson, setSelectedPerson] = useState<PersonOption['id'] | null>('friend');
  const [personCustomName, setPersonCustomName] = useState('');

  // Plan State (Screen 3)
  const [selectedWhen, setSelectedWhen] = useState('now');
  const [selectedWhere, setSelectedWhere] = useState('cafe');
  const [selectedWhat, setSelectedWhat] = useState<string[]>(['talk', 'coffee']);
  const [planLockedToast, setPlanLockedToast] = useState(false);

  // Timer State (Screen 5)
  const [secondsRemaining, setSecondsRemaining] = useState(MISSION_DURATION_SECONDS);
  const [missionActive, setMissionActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);

  // Reflection State (Screen 6)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(['laughed', 'real_talk']);
  const [reflectionSentence, setReflectionSentence] = useState('');

  // Reward points display (Screen 8)
  const [pointsCounter, setPointsCounter] = useState(0);

  // ── CORE ANIMATED VALUES ─────────────────────────────────────────────────────
  const pageFade = useRef(new Animated.Value(1)).current;
  const pageSlide = useRef(new Animated.Value(0)).current;

  // Screen 1: Cinematic Opening Sequence
  const s1DarkFade = useRef(new Animated.Value(0)).current; // 0 = dark, 1 = reveal
  const s1LightPointScale = useRef(new Animated.Value(0.1)).current;
  const s1LightPointOpacity = useRef(new Animated.Value(0)).current;
  const s1Silhouette1X = useRef(new Animated.Value(-60)).current;
  const s1Silhouette2X = useRef(new Animated.Value(60)).current;
  const s1SilhouettesOpacity = useRef(new Animated.Value(0)).current;
  const s1TextFade = useRef(new Animated.Value(0)).current;
  const s1Badge2H = useRef(new Animated.Value(0)).current;
  const s1BadgeConn = useRef(new Animated.Value(0)).current;
  const s1Badge600 = useRef(new Animated.Value(0)).current;
  const s1CtaSpring = useRef(new Animated.Value(0)).current;
  const s1AmbientPulse = useRef(new Animated.Value(1)).current;

  // Screen 2: Person Cards
  const s2CardGlow = useRef(new Animated.Value(1)).current;

  // Screen 3: Timeline Pulse
  const s3TimelineProg = useRef(new Animated.Value(0)).current;

  // Screen 4: Phone Dim & Descent
  const s4PhoneY = useRef(new Animated.Value(0)).current;
  const s4PhoneOpacity = useRef(new Animated.Value(1)).current;
  const s4PhoneScreenBrightness = useRef(new Animated.Value(1)).current;

  // Screen 5: Timer Ring Breathing & Prompt Fade
  const s5Breathing = useRef(new Animated.Value(1)).current;
  const s5PromptFade = useRef(new Animated.Value(1)).current;

  // Screen 7: Glass Memory Border Glow
  const s7BorderGlow = useRef(new Animated.Value(0.4)).current;

  // Screen 8: Reward Reveal
  const s8LightExpand = useRef(new Animated.Value(0.2)).current;
  const s8TextFade = useRef(new Animated.Value(0)).current;
  const s8PointsSpring = useRef(new Animated.Value(0.2)).current;
  const s8PointsGlow = useRef(new Animated.Value(1)).current;
  const s8CtaFade = useRef(new Animated.Value(0)).current;

  // ── LOAD & PERSIST TASK PROGRESS ─────────────────────────────────────────────
  useEffect(() => {
    const restoreSavedProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const data = JSON.parse(saved);

        if (data.hasClaimed) {
          // Already finished in a previous session
          return;
        }

        if (data.currentPage && data.currentPage > 1) {
          setCurrentPage(data.currentPage);
        }
        if (data.selectedPerson) setSelectedPerson(data.selectedPerson);
        if (data.personCustomName) setPersonCustomName(data.personCustomName);
        if (data.selectedWhen) setSelectedWhen(data.selectedWhen);
        if (data.selectedWhere) setSelectedWhere(data.selectedWhere);
        if (data.selectedWhat) setSelectedWhat(data.selectedWhat);
        if (data.selectedEmotions) setSelectedEmotions(data.selectedEmotions);
        if (data.reflectionSentence) setReflectionSentence(data.reflectionSentence);

        // Resume timer if active
        if (data.targetEndTime && data.missionActive) {
          const now = Date.now();
          const rem = Math.max(0, Math.floor((data.targetEndTime - now) / 1000));
          setTargetEndTime(data.targetEndTime);
          setSecondsRemaining(rem);
          setMissionActive(true);
          if (rem <= 0) {
            // Finished while away! Jump to reflection checkpoint
            setCurrentPage(6);
          }
        } else if (typeof data.secondsRemaining === 'number') {
          setSecondsRemaining(data.secondsRemaining);
        }
      } catch (err) {
        console.warn('Failed to load saved task progress:', err);
      }
    };

    restoreSavedProgress();
  }, []);

  // Save progress on key state changes
  useEffect(() => {
    const saveState = async () => {
      if (hasClaimed) {
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        return;
      }
      const data = {
        currentPage,
        selectedPerson,
        personCustomName,
        selectedWhen,
        selectedWhere,
        selectedWhat,
        secondsRemaining,
        missionActive,
        targetEndTime,
        selectedEmotions,
        reflectionSentence,
        hasClaimed,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    };

    saveState();
  }, [
    currentPage,
    selectedPerson,
    personCustomName,
    selectedWhen,
    selectedWhere,
    selectedWhat,
    secondsRemaining,
    missionActive,
    targetEndTime,
    selectedEmotions,
    reflectionSentence,
    hasClaimed,
  ]);

  // ── APP STATE LISTENER (SYNC TIMER ON RETURN FROM LOCK SCREEN) ────────────────
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && missionActive && targetEndTime && !isTimerPaused) {
        const now = Date.now();
        const rem = Math.max(0, Math.floor((targetEndTime - now) / 1000));
        setSecondsRemaining(rem);
        if (rem <= 0 && currentPage === 5) {
          transitionToPage(6);
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [missionActive, targetEndTime, isTimerPaused, currentPage]);

  // ── SCREEN 1: SPECIAL 2-3s CINEMATIC OPENING ANIMATION ───────────────────────
  useEffect(() => {
    if (currentPage === 1) {
      // Reset opening values
      s1DarkFade.setValue(0);
      s1LightPointScale.setValue(0.1);
      s1LightPointOpacity.setValue(0);
      s1Silhouette1X.setValue(-70);
      s1Silhouette2X.setValue(70);
      s1SilhouettesOpacity.setValue(0);
      s1TextFade.setValue(0);
      s1Badge2H.setValue(0);
      s1BadgeConn.setValue(0);
      s1Badge600.setValue(0);
      s1CtaSpring.setValue(0);

      // Sequence:
      // 1. Point of light expands in center
      Animated.sequence([
        Animated.parallel([
          Animated.timing(s1DarkFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(s1LightPointOpacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
          Animated.spring(s1LightPointScale, { toValue: 1.5, friction: 6, useNativeDriver: true }),
        ]),
        // 2. Silhouettes appear & move toward each other
        Animated.parallel([
          Animated.timing(s1SilhouettesOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(s1Silhouette1X, { toValue: -22, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(s1Silhouette2X, { toValue: 22, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        // 3. Text headline and subtitle
        Animated.timing(s1TextFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        // 4. Badges fade & float in
        Animated.stagger(220, [
          Animated.spring(s1Badge2H, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(s1BadgeConn, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(s1Badge600, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        // 5. CTA springs up from bottom
        Animated.spring(s1CtaSpring, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
      ]).start();

      // Ambient background pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(s1AmbientPulse, { toValue: 1.08, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(s1AmbientPulse, { toValue: 1.0, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [currentPage]);

  // ── SCREEN 4: PHONE DIM & DESCENT ANIMATION ──────────────────────────────────
  useEffect(() => {
    if (currentPage === 4) {
      s4PhoneY.setValue(0);
      s4PhoneOpacity.setValue(1);
      s4PhoneScreenBrightness.setValue(1);

      // Subtle initial pause, then phone descends and dims into darkness
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(s4PhoneScreenBrightness, {
            toValue: 0.15,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(s4PhoneY, {
            toValue: 45,
            duration: 2200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(s4PhoneOpacity, {
            toValue: 0.45,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]).start();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  // ── SCREEN 5: 2-HOUR TIMER ENGINE ────────────────────────────────────────────
  useEffect(() => {
    if (currentPage !== 5 || !missionActive || isTimerPaused) return;

    const now = Date.now();
    const end = targetEndTime ?? now + secondsRemaining * 1000;
    if (!targetEndTime) setTargetEndTime(end);

    // Subtle breathing animation on timer ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(s5Breathing, { toValue: 1.03, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(s5Breathing, { toValue: 1.0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // 1-second interval checking
    const timerInterval = setInterval(() => {
      const remainingMs = Math.max(0, end - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(timerInterval);
        setMissionActive(false);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
        transitionToPage(6);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [currentPage, missionActive, isTimerPaused, targetEndTime]);

  // Rotating prompts every 150 seconds (or on user tap)
  useEffect(() => {
    if (currentPage !== 5) return;
    const interval = setInterval(() => {
      rotatePrompt();
    }, 150000);
    return () => clearInterval(interval);
  }, [currentPage, currentPromptIdx]);

  const rotatePrompt = () => {
    Animated.timing(s5PromptFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setCurrentPromptIdx((prev) => (prev + 1) % ROTATING_PROMPTS.length);
      Animated.timing(s5PromptFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  };

  // ── SCREEN 7: MEMORY BORDER GLOW LOOP ────────────────────────────────────────
  useEffect(() => {
    if (currentPage === 7) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(s7BorderGlow, { toValue: 0.9, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(s7BorderGlow, { toValue: 0.4, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [currentPage]);

  // ── SCREEN 8: FINAL REWARD CINEMATIC CELEBRATION ─────────────────────────────
  useEffect(() => {
    if (currentPage === 8) {
      s8LightExpand.setValue(0.2);
      s8TextFade.setValue(0);
      s8PointsSpring.setValue(0.2);
      s8CtaFade.setValue(0);

      Animated.sequence([
        // 1. Light expands
        Animated.timing(s8LightExpand, { toValue: 1.8, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        // 2. "You showed up" text
        Animated.timing(s8TextFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        // 3. +600 POINTS hero spring
        Animated.spring(s8PointsSpring, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        // 4. CTA button
        Animated.timing(s8CtaFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();

      // Counter animation 0 -> 600
      let cur = 0;
      const step = 25;
      const counterInterval = setInterval(() => {
        cur += step;
        if (cur >= TASK_POINTS) {
          setPointsCounter(TASK_POINTS);
          clearInterval(counterInterval);
        } else {
          setPointsCounter(cur);
        }
      }, 35);

      // Points pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(s8PointsGlow, { toValue: 1.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(s8PointsGlow, { toValue: 1.0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      return () => clearInterval(counterInterval);
    }
  }, [currentPage]);

  // ── PAGE TRANSITION HELPER ──────────────────────────────────────────────────
  const transitionToPage = (target: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}

    Animated.parallel([
      Animated.timing(pageFade, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(pageSlide, { toValue: -18, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setCurrentPage(target);
      pageSlide.setValue(22);
      Animated.parallel([
        Animated.timing(pageFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(pageSlide, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    });
  };

  // ── DEV FAST-SKIP (TRIPLE-TAP IN __DEV__) ────────────────────────────────────
  const devTapCount = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      devTapCount.current += 1;
      if (devTapCount.current >= 3) {
        devTapCount.current = 0;
        setSecondsRemaining(3);
        setTargetEndTime(Date.now() + 3000);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (_) {}
      }
    }
  };

  // ── TIME FORMATTER (HH:MM:SS) ───────────────────────────────────────────────
  const formatTimeHHMMSS = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── LOCK IN THE PLAN (SCREEN 3) ──────────────────────────────────────────────
  const handleLockPlan = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    setPlanLockedToast(true);
    setTimeout(() => {
      setPlanLockedToast(false);
      transitionToPage(4);
    }, 900);
  };

  // ── START MISSION TIMER (SCREEN 4 -> SCREEN 5) ──────────────────────────────
  const handleStartTimer = () => {
    const end = Date.now() + MISSION_DURATION_SECONDS * 1000;
    setTargetEndTime(end);
    setSecondsRemaining(MISSION_DURATION_SECONDS);
    setMissionActive(true);
    setIsTimerPaused(false);
    transitionToPage(5);
  };

  // ── COMPLETE MISSION & AWARD 600 POINTS (SCREEN 8) ──────────────────────────
  const handleFinalCompletion = async () => {
    if (isSubmitting || hasClaimed) return;
    setIsSubmitting(true);
    setClaimError(null);

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setClaimError('Session expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const res = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: TASK_ID,
          task_name: TASK_NAME,
          difficulty: 'Hard',
          person_type: selectedPerson,
          person_name: personCustomName.trim(),
          plan_when: selectedWhen,
          plan_where: selectedWhere,
          plan_what: selectedWhat,
          reflection_emotions: selectedEmotions,
          reflection_sentence: reflectionSentence.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || data.message || 'Unable to register task completion.');
      }

      setHasClaimed(true);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}

      // Smooth exit back to journey/home
      setTimeout(() => {
        router.replace('/');
      }, 1200);
    } catch (err: any) {
      console.error('Task claim error:', err);
      setClaimError(err.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── COMPUTED PERSON METADATA ────────────────────────────────────────────────
  const activePersonMeta = useMemo(() => {
    return (
      PERSON_OPTIONS.find((p) => p.id === selectedPerson) || PERSON_OPTIONS[0]
    );
  }, [selectedPerson]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* ── CINEMATIC DEEP NAVY / MIDNIGHT BACKGROUND ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={['#050811', '#090d1a', '#03050a']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />

        {/* Ambient Atmospheric Orb */}
        <Animated.View
          style={[
            styles.ambientGlowOrb,
            {
              transform: [{ scale: s1AmbientPulse }],
              opacity: currentPage === 8 ? 0.9 : 0.45,
            },
          ]}
        >
          <LinearGradient
            colors={
              currentPage === 8
                ? ['rgba(251, 191, 36, 0.25)', 'rgba(245, 158, 11, 0.05)', 'transparent']
                : ['rgba(56, 189, 248, 0.16)', 'rgba(99, 102, 241, 0.06)', 'transparent']
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Soft floating dust particles */}
        {AMBIENT_DUST.map((d) => (
          <View
            key={d.id}
            style={[
              styles.particle,
              {
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: d.size,
                height: d.size,
                borderRadius: d.size / 2,
                opacity: d.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* ── TOP MISSION STATUS BAR ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
            if (currentPage > 1 && currentPage < 8 && !missionActive) {
              transitionToPage((currentPage - 1) as any);
            } else {
              router.back();
            }
          }}
        >
          <Feather name="arrow-left" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Mission Badges */}
        <View style={styles.headerCenterTrack}>
          <View style={styles.hardBadge}>
            <Text style={styles.hardBadgeText}>HARD MISSION</Text>
          </View>
          <View style={styles.pointsPillSmall}>
            <MaterialCommunityIcons name="star-four-points" size={12} color="#fbbf24" />
            <Text style={styles.pointsPillSmallText}>+600 PTS</Text>
          </View>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepCounterBadge}>
          <Text style={styles.stepCounterText}>
            {currentPage}/8
          </Text>
        </View>
      </View>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: pageFade,
            transform: [{ translateY: pageSlide }],
          },
        ]}
      >
        {/* =========================================================================
            SCREEN 1 — THE INVITATION
            ========================================================================= */}
        {currentPage === 1 && (
          <View style={styles.s1Container}>
            {/* Abstract Cinematic Scene: 2 human silhouettes moving toward each other */}
            <View style={styles.s1VisualWrapper}>
              {/* Expanding Central Light Point */}
              <Animated.View
                style={[
                  styles.s1CenterLightPoint,
                  {
                    opacity: s1LightPointOpacity,
                    transform: [{ scale: s1LightPointScale }],
                  },
                ]}
              >
                <RadialGradientLight />
              </Animated.View>

              {/* Light Silhouette Left */}
              <Animated.View
                style={[
                  styles.silhouetteShape,
                  {
                    opacity: s1SilhouettesOpacity,
                    transform: [{ translateX: s1Silhouette1X }],
                  },
                ]}
              >
                <HumanSilhouette color="#38bdf8" isFacingRight={true} />
              </Animated.View>

              {/* Center Energy Thread */}
              <Animated.View
                style={[
                  styles.s1ConnectionBeam,
                  { opacity: s1SilhouettesOpacity },
                ]}
              >
                <LinearGradient
                  colors={['rgba(56, 189, 248, 0)', 'rgba(251, 191, 36, 0.6)', 'rgba(56, 189, 248, 0)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </Animated.View>

              {/* Light Silhouette Right */}
              <Animated.View
                style={[
                  styles.silhouetteShape,
                  {
                    opacity: s1SilhouettesOpacity,
                    transform: [{ translateX: s1Silhouette2X }],
                  },
                ]}
              >
                <HumanSilhouette color="#fbbf24" isFacingRight={false} />
              </Animated.View>
            </View>

            {/* Headline & Subtitle */}
            <Animated.View style={[styles.s1TextBlock, { opacity: s1TextFade }]}>
              <Text style={styles.s1SuperHeading}>REAL-LIFE MISSION</Text>
              <Text style={styles.s1Headline}>Meet Someone.{'\n'}Be There.</Text>
              <Text style={styles.s1Subtitle}>
                For the next 2 hours, trade screen time for real time.
              </Text>
            </Animated.View>

            {/* Elegant Floating Elements */}
            <View style={styles.s1BadgesRow}>
              <Animated.View
                style={[
                  styles.s1BadgeFloating,
                  { transform: [{ scale: s1Badge2H }], opacity: s1Badge2H },
                ]}
              >
                <MaterialCommunityIcons name="clock-outline" size={16} color="#38bdf8" />
                <Text style={styles.s1BadgeValue}>2 HOURS</Text>
                <Text style={styles.s1BadgeLabel}>Undivided</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.s1BadgeFloating,
                  { transform: [{ scale: s1BadgeConn }], opacity: s1BadgeConn },
                ]}
              >
                <MaterialCommunityIcons name="account-heart-outline" size={16} color="#a855f7" />
                <Text style={styles.s1BadgeValue}>1 REAL</Text>
                <Text style={styles.s1BadgeLabel}>Connection</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.s1BadgeFloating,
                  styles.s1BadgeFloatingGold,
                  { transform: [{ scale: s1Badge600 }], opacity: s1Badge600 },
                ]}
              >
                <MaterialCommunityIcons name="crown-outline" size={16} color="#fbbf24" />
                <Text style={[styles.s1BadgeValue, { color: '#fbbf24' }]}>600 PTS</Text>
                <Text style={[styles.s1BadgeLabel, { color: '#fed7aa' }]}>Hard Tier</Text>
              </Animated.View>
            </View>

            {/* Spring CTA Button */}
            <Animated.View
              style={[
                styles.s1CtaWrapper,
                {
                  transform: [
                    {
                      translateY: s1CtaSpring.interpolate({
                        inputRange: [0, 1],
                        outputRange: [60, 0],
                      }),
                    },
                    { scale: s1CtaSpring },
                  ],
                  opacity: s1CtaSpring,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primarySpringBtn}
                activeOpacity={0.88}
                onPress={() => transitionToPage(2)}
              >
                <LinearGradient
                  colors={['#0284c7', '#2563eb', '#4f46e5']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryBtnText}>Start the Mission</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.s1Footnote}>Family or friend · Put phone away · Show up</Text>
            </Animated.View>
          </View>
        )}

        {/* =========================================================================
            SCREEN 2 — CHOOSE YOUR PERSON
            ========================================================================= */}
        {currentPage === 2 && (
          <ScrollView
            style={styles.scrollScreen}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.sectionEyebrow}>STEP 01</Text>
              <Text style={styles.pageTitle}>Who will you meet?</Text>
              <Text style={styles.pageSubtitle}>
                Choose someone you genuinely want to spend time with.
              </Text>
            </View>

            {/* 3 Large Premium Selection Cards */}
            <View style={styles.cardsColumn}>
              {PERSON_OPTIONS.map((opt) => {
                const isSelected = selectedPerson === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.personCard,
                      isSelected && styles.personCardSelected,
                      isSelected && { borderColor: opt.accent },
                    ]}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
                      setSelectedPerson(opt.id);
                    }}
                  >
                    <LinearGradient
                      colors={isSelected ? opt.gradient : ['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.2)']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />

                    <View style={styles.personCardContent}>
                      <View style={[styles.personIconCircle, { backgroundColor: `${opt.accent}20` }]}>
                        <MaterialCommunityIcons name={opt.icon} size={28} color={opt.accent} />
                      </View>

                      <View style={styles.personCardTextWrapper}>
                        <View style={styles.personCardRowTop}>
                          <Text style={styles.personCardTitle}>{opt.title}</Text>
                          <View style={[styles.personTagBadge, { backgroundColor: `${opt.accent}22` }]}>
                            <Text style={[styles.personTagText, { color: opt.accent }]}>{opt.tag}</Text>
                          </View>
                        </View>
                        <Text style={styles.personCardSub}>{opt.subtitle}</Text>
                      </View>

                      {/* Selected Indicator */}
                      <View style={[styles.personSelectRadio, isSelected && { borderColor: opt.accent, backgroundColor: opt.accent }]}>
                        {isSelected && <Feather name="check" size={14} color="#090d1a" />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Optional Name Personalization */}
            <View style={styles.optionalNameCard}>
              <Text style={styles.inputSectionLabel}>THEIR NAME (OPTIONAL)</Text>
              <TextInput
                style={styles.nameTextInput}
                placeholder="e.g. Alex, Mom, Cousin Liam..."
                placeholderTextColor="#475569"
                value={personCustomName}
                onChangeText={setPersonCustomName}
                maxLength={40}
              />
            </View>

            {/* Allowed Clarification Notice */}
            <View style={styles.allowedNoteBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#38bdf8" />
              <Text style={styles.allowedNoteText}>
                Friend, sibling, parent, cousin, or neighbor — anyone you feel comfortable being yourself around.
              </Text>
            </View>

            {/* Next CTA */}
            <View style={styles.bottomCtaPadding}>
              <TouchableOpacity
                style={styles.primarySpringBtn}
                activeOpacity={0.88}
                onPress={() => transitionToPage(3)}
              >
                <LinearGradient
                  colors={['#0284c7', '#2563eb']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>They’re the one</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* =========================================================================
            SCREEN 3 — MAKE THE PLAN
            ========================================================================= */}
        {currentPage === 3 && (
          <ScrollView
            style={styles.scrollScreen}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.sectionEyebrow}>STEP 02</Text>
              <Text style={styles.pageTitle}>Make it real.</Text>
              <Text style={styles.pageSubtitle}>
                A real meeting starts with a real plan.
              </Text>
            </View>

            {/* WHEN SECTION */}
            <View style={styles.blueprintSection}>
              <View style={styles.blueprintHeaderRow}>
                <MaterialCommunityIcons name="calendar-clock" size={18} color="#38bdf8" />
                <Text style={styles.blueprintTitle}>WHEN</Text>
                <Text style={styles.blueprintSub}>Choose your 2-hour window</Text>
              </View>

              <View style={styles.pillsGrid2Col}>
                {WHEN_OPTIONS.map((w) => {
                  const isSel = selectedWhen === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.whenCard, isSel && styles.whenCardSelected]}
                      activeOpacity={0.8}
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                        setSelectedWhen(w.id);
                      }}
                    >
                      <Text style={[styles.whenLabel, isSel && styles.whenLabelSelected]}>{w.label}</Text>
                      <Text style={styles.whenSub}>{w.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* WHERE SECTION */}
            <View style={styles.blueprintSection}>
              <View style={styles.blueprintHeaderRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#a855f7" />
                <Text style={styles.blueprintTitle}>WHERE</Text>
                <Text style={styles.blueprintSub}>Any comfortable setting</Text>
              </View>

              <View style={styles.pillsRowWrap}>
                {WHERE_OPTIONS.map((wh) => {
                  const isSel = selectedWhere === wh.id;
                  return (
                    <TouchableOpacity
                      key={wh.id}
                      style={[styles.pillBtn, isSel && styles.pillBtnSelected]}
                      activeOpacity={0.8}
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                        setSelectedWhere(wh.id);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={wh.icon as any}
                        size={15}
                        color={isSel ? '#ffffff' : '#94a3b8'}
                      />
                      <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextSelected]}>
                        {wh.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* WHAT SECTION */}
            <View style={styles.blueprintSection}>
              <View style={styles.blueprintHeaderRow}>
                <MaterialCommunityIcons name="coffee-to-go-outline" size={18} color="#fbbf24" />
                <Text style={styles.blueprintTitle}>WHAT</Text>
                <Text style={styles.blueprintSub}>Select activities you'll do</Text>
              </View>

              <View style={styles.pillsRowWrap}>
                {WHAT_OPTIONS.map((wt) => {
                  const isSel = selectedWhat.includes(wt.id);
                  return (
                    <TouchableOpacity
                      key={wt.id}
                      style={[styles.pillBtn, isSel && styles.pillBtnSelectedGold]}
                      activeOpacity={0.8}
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                        if (isSel) {
                          if (selectedWhat.length > 1) {
                            setSelectedWhat(selectedWhat.filter((x) => x !== wt.id));
                          }
                        } else {
                          setSelectedWhat([...selectedWhat, wt.id]);
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name={wt.icon as any}
                        size={15}
                        color={isSel ? '#fbbf24' : '#94a3b8'}
                      />
                      <Text style={[styles.pillBtnText, isSel && styles.pillBtnTextGold]}>
                        {wt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ANIMATED TIMELINE ARCHITECTURE */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>THE 2-HOUR TIMELINE</Text>
              <View style={styles.timelineRow}>
                <View style={styles.timelineNode}>
                  <View style={[styles.nodeDot, styles.nodeDotActive]} />
                  <Text style={styles.nodeLabel}>START</Text>
                  <Text style={styles.nodeSub}>Arrive & unhook</Text>
                </View>

                <View style={styles.timelineLine} />

                <View style={styles.timelineNode}>
                  <View style={[styles.nodeDot, styles.nodeDotActive]} />
                  <Text style={styles.nodeLabel}>1 HOUR</Text>
                  <Text style={styles.nodeSub}>Flow of talk</Text>
                </View>

                <View style={styles.timelineLine} />

                <View style={styles.timelineNode}>
                  <View style={[styles.nodeDot, styles.nodeDotGold]} />
                  <Text style={[styles.nodeLabel, { color: '#fbbf24' }]}>2 HOURS</Text>
                  <Text style={styles.nodeSub}>Memory locked</Text>
                </View>
              </View>
            </View>

            {/* Lock Plan CTA */}
            <View style={styles.bottomCtaPadding}>
              {planLockedToast ? (
                <View style={styles.planLockedFeedback}>
                  <Feather name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.planLockedFeedbackText}>Plan locked.</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.primarySpringBtn}
                  activeOpacity={0.88}
                  onPress={handleLockPlan}
                >
                  <LinearGradient
                    colors={['#0284c7', '#2563eb']}
                    style={styles.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.primaryBtnText}>Lock In The Plan</Text>
                    <Feather name="lock" size={16} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}

        {/* =========================================================================
            SCREEN 4 — LEAVE THE PHONE BEHIND (STRONG ANTI-PHONE MOMENT)
            ========================================================================= */}
        {currentPage === 4 && (
          <ScrollView
            style={styles.scrollScreen}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.sectionEyebrow}>STEP 03</Text>
              <Text style={styles.pageTitle}>Now comes the hard part.</Text>
              <Text style={styles.pageSubtitle}>Be where your feet are.</Text>
            </View>

            {/* Animated Phone Disappearing into Darkness */}
            <View style={styles.phoneVisualContainer}>
              <Animated.View
                style={[
                  styles.phoneFrame,
                  {
                    transform: [{ translateY: s4PhoneY }],
                    opacity: s4PhoneOpacity,
                  },
                ]}
              >
                {/* Phone Notch */}
                <View style={styles.phoneSpeaker} />

                {/* Glowing Screen fading out */}
                <Animated.View
                  style={[
                    styles.phoneInnerScreen,
                    { opacity: s4PhoneScreenBrightness },
                  ]}
                >
                  <MaterialCommunityIcons name="bell-off-outline" size={32} color="#94a3b8" />
                  <Text style={styles.phoneScreenStatus}>OFFLINE</Text>
                  <Text style={styles.phoneScreenSub}>Digital noise suspended</Text>
                </Animated.View>
              </Animated.View>

              {/* Floor Shadow / Darkness Void */}
              <View style={styles.phoneVoidBase} />
            </View>

            {/* Guidelines Card */}
            <View style={styles.phoneRulesCard}>
              <Text style={styles.rulesCardHeader}>FOR THESE 2 HOURS:</Text>

              <View style={styles.ruleLine}>
                <View style={styles.checkPill}>
                  <Feather name="check" size={12} color="#38bdf8" />
                </View>
                <Text style={styles.ruleText}>Keep your phone away whenever possible.</Text>
              </View>

              <View style={styles.ruleLine}>
                <View style={styles.checkPill}>
                  <Feather name="check" size={12} color="#38bdf8" />
                </View>
                <Text style={styles.ruleText}>Don’t scroll through social media.</Text>
              </View>

              <View style={styles.ruleLine}>
                <View style={styles.checkPill}>
                  <Feather name="check" size={12} color="#38bdf8" />
                </View>
                <Text style={styles.ruleText}>Don’t constantly check notifications.</Text>
              </View>

              <View style={styles.ruleLine}>
                <View style={styles.checkPill}>
                  <Feather name="check" size={12} color="#38bdf8" />
                </View>
                <Text style={styles.ruleText}>Give the person your undivided presence.</Text>
              </View>
            </View>

            {/* Emotional Anchor Motto */}
            <View style={styles.mottoContainer}>
              <Text style={styles.mottoText}>
                “Your phone can wait.{'\n'}This moment can’t.”
              </Text>
            </View>

            {/* CTA */}
            <View style={styles.bottomCtaPadding}>
              <TouchableOpacity
                style={styles.primarySpringBtn}
                activeOpacity={0.88}
                onPress={handleStartTimer}
              >
                <LinearGradient
                  colors={['#0284c7', '#059669']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>I’m Present</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* =========================================================================
            SCREEN 5 — THE 2-HOUR MISSION (CORE TIMER)
            ========================================================================= */}
        {currentPage === 5 && (
          <View style={styles.s5Container}>
            <View style={styles.pageHeaderCompact}>
              <Text style={styles.sectionEyebrow}>REAL TIME MISSION</Text>
              <Text style={styles.s5MainTitle}>Be here.</Text>
              <Text style={styles.s5Subtitle}>
                You don’t need to force a perfect conversation. Just be present.
              </Text>
            </View>

            {/* Hero 2:00:00 Progress Ring Timer (Tap 3x in DEV to skip) */}
            <Pressable onPress={handleDevSkip} style={styles.s5TimerCenter}>
              <Animated.View
                style={[
                  styles.timerRingWrapper,
                  { transform: [{ scale: s5Breathing }] },
                ]}
              >
                <Svg width={250} height={250} viewBox="0 0 250 250">
                  <Defs>
                    <RadialGradient id="timerGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="65%" stopColor="rgba(56, 189, 248, 0.08)" />
                      <Stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx="125" cy="125" r="110" fill="url(#timerGlow)" />

                  {/* Base Track */}
                  <Circle
                    cx="125"
                    cy="125"
                    r="96"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                    fill="none"
                  />

                  {/* Animated Progress Ring */}
                  <Circle
                    cx="125"
                    cy="125"
                    r="96"
                    stroke="#38bdf8"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 96}
                    strokeDashoffset={
                      (1 - secondsRemaining / MISSION_DURATION_SECONDS) * (2 * Math.PI * 96)
                    }
                    transform="rotate(-90 125 125)"
                  />
                </Svg>

                {/* Inner Time Display */}
                <View style={styles.timerDigitsCenter}>
                  <Text style={styles.timerDigits}>{formatTimeHHMMSS(secondsRemaining)}</Text>
                  <View style={styles.liveIndicatorRow}>
                    <View style={styles.liveGreenDot} />
                    <Text style={styles.liveStatusText}>
                      {isTimerPaused ? 'PAUSED' : 'SESSION IN PROGRESS'}
                    </Text>
                  </View>
                  <Text style={styles.timerWithLabel}>
                    With {personCustomName.trim() || activePersonMeta.title}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            {/* Mission Statement */}
            <View style={styles.s5MissionStatement}>
              <Text style={styles.s5MissionLabel}>YOUR ONLY MISSION</Text>
              <Text style={styles.s5MissionWords}>
                Talk. Listen. Laugh. Walk. Sit. Be yourself.
              </Text>
            </View>

            {/* Rotating Mindful Prompts (Tap to cycle) */}
            <TouchableOpacity
              style={styles.rotatingPromptCard}
              activeOpacity={0.8}
              onPress={rotatePrompt}
            >
              <View style={styles.promptHeader}>
                <MaterialCommunityIcons name="thought-bubble-outline" size={14} color="#38bdf8" />
                <Text style={styles.promptHeaderTitle}>PRESENCE CUE · TAP FOR NEXT</Text>
              </View>
              <Animated.Text style={[styles.promptBodyText, { opacity: s5PromptFade }]}>
                {ROTATING_PROMPTS[currentPromptIdx]}
              </Animated.Text>
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.s5ControlsRow}>
              <TouchableOpacity
                style={styles.s5PauseBtn}
                activeOpacity={0.8}
                onPress={() => setIsPauseModalVisible(true)}
              >
                <Feather name="pause" size={16} color="#94a3b8" />
                <Text style={styles.s5PauseBtnText}>Pause</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.s5CompleteBtn}
                activeOpacity={0.88}
                onPress={() => {
                  if (secondsRemaining > 60 && !__DEV__) {
                    setIsPauseModalVisible(true);
                  } else {
                    transitionToPage(6);
                  }
                }}
              >
                <LinearGradient
                  colors={['#0284c7', '#2563eb']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>
                    {secondsRemaining <= 0 ? 'Reflect on Connection' : 'Finished Meeting'}
                  </Text>
                  <Feather name="arrow-right" size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            SCREEN 6 — BE PRESENT (REFLECTION CHECKPOINT)
            ========================================================================= */}
        {currentPage === 6 && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.scrollScreen}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pageHeader}>
                <Text style={styles.sectionEyebrow}>REFLECTION</Text>
                <Text style={styles.pageTitle}>Did you actually connect?</Text>
                <Text style={styles.pageSubtitle}>
                  Choose what felt true during these 2 hours together.
                </Text>
              </View>

              {/* 3 Emotional Multi-Select Choices */}
              <View style={styles.cardsColumn}>
                {CONNECTION_CHOICES.map((c) => {
                  const isSel = selectedEmotions.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.emotionChoiceCard,
                        isSel && styles.emotionChoiceCardActive,
                        isSel && { borderColor: c.color },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                        if (isSel) {
                          if (selectedEmotions.length > 1) {
                            setSelectedEmotions(selectedEmotions.filter((x) => x !== c.id));
                          }
                        } else {
                          setSelectedEmotions([...selectedEmotions, c.id]);
                        }
                      }}
                    >
                      <View style={[styles.emotionIconWrap, { backgroundColor: `${c.color}22` }]}>
                        <MaterialCommunityIcons name={c.icon as any} size={22} color={c.color} />
                      </View>
                      <Text style={[styles.emotionChoiceText, isSel && { color: '#ffffff' }]}>
                        {c.label}
                      </Text>
                      <View style={[styles.checkboxSquare, isSel && { backgroundColor: c.color, borderColor: c.color }]}>
                        {isSel && <Feather name="check" size={13} color="#090d1a" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* One Sentence Reflection Prompt */}
              <View style={styles.reflectionInputCard}>
                <Text style={styles.reflectionInputLabel}>WHAT WAS THE BEST PART?</Text>
                <TextInput
                  style={styles.reflectionTextInput}
                  placeholder="Write one sentence..."
                  placeholderTextColor="#475569"
                  value={reflectionSentence}
                  onChangeText={setReflectionSentence}
                  multiline
                  maxLength={180}
                />
                <Text style={styles.charCountText}>
                  {reflectionSentence.length}/180
                </Text>
              </View>

              {/* CTA */}
              <View style={styles.bottomCtaPadding}>
                <TouchableOpacity
                  style={styles.primarySpringBtn}
                  activeOpacity={0.88}
                  onPress={() => transitionToPage(7)}
                >
                  <LinearGradient
                    colors={['#0284c7', '#2563eb']}
                    style={styles.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.primaryBtnText}>Keep The Memory</Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* =========================================================================
            SCREEN 7 — THE MEMORY
            ========================================================================= */}
        {currentPage === 7 && (
          <ScrollView
            style={styles.scrollScreen}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.sectionEyebrow}>SAVED MOMENT</Text>
              <Text style={styles.pageTitle}>Keep this one.</Text>
              <Text style={styles.pageSubtitle}>
                Some moments don’t need a photo to matter.
              </Text>
            </View>

            {/* Glass Memory Card */}
            <View style={styles.memoryCardOuter}>
              {/* Animated glowing border effect */}
              <Animated.View
                style={[
                  styles.memoryGlowBorder,
                  { opacity: s7BorderGlow },
                ]}
              />

              <View style={styles.glassMemoryBody}>
                {/* Header Tag */}
                <View style={styles.memoryCardTopRow}>
                  <View style={styles.memoryTagPill}>
                    <Text style={styles.memoryTagPillText}>MEETUP · 2 HOURS</Text>
                  </View>
                  <MaterialCommunityIcons name="heart-pulse" size={18} color="#f43f5e" />
                </View>

                {/* Person Hero */}
                <View style={styles.memoryPersonSection}>
                  <View style={styles.memoryAvatarCircle}>
                    <MaterialCommunityIcons
                      name={activePersonMeta.icon}
                      size={32}
                      color={activePersonMeta.accent}
                    />
                  </View>
                  <Text style={styles.memoryPersonTitle}>
                    {personCustomName.trim() || activePersonMeta.title}
                  </Text>
                  <Text style={styles.memoryPersonType}>
                    {activePersonMeta.title} ({activePersonMeta.tag})
                  </Text>
                </View>

                {/* Memory Quote Box */}
                <View style={styles.memoryQuoteBox}>
                  <MaterialCommunityIcons name="format-quote-open" size={24} color="#38bdf8" />
                  <Text style={styles.memoryQuoteText}>
                    {reflectionSentence.trim()
                      ? `“${reflectionSentence.trim()}”`
                      : '“Today we spent 2 real hours together, and I forgot to check my phone.”'}
                  </Text>
                </View>

                {/* Highlights tags */}
                <View style={styles.memoryHighlightsRow}>
                  {selectedEmotions.map((id) => {
                    const c = CONNECTION_CHOICES.find((x) => x.id === id);
                    if (!c) return null;
                    return (
                      <View key={id} style={styles.memoryHighlightPill}>
                        <Feather name="check" size={11} color="#38bdf8" />
                        <Text style={styles.memoryHighlightText}>{c.label}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Subtle reassurance message */}
                <View style={styles.memoryPresenceNote}>
                  <MaterialCommunityIcons name="shield-star-outline" size={16} color="#fbbf24" />
                  <Text style={styles.memoryPresenceNoteText}>
                    You chose presence over distraction.
                  </Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <View style={styles.bottomCtaPadding}>
              <TouchableOpacity
                style={styles.primarySpringBtn}
                activeOpacity={0.88}
                onPress={() => transitionToPage(8)}
              >
                <LinearGradient
                  colors={['#2563eb', '#7c3aed']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>Complete Mission</Text>
                  <Feather name="award" size={18} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* =========================================================================
            SCREEN 8 — FINAL REWARD (+600 POINTS HERO)
            ========================================================================= */}
        {currentPage === 8 && (
          <View style={styles.s8Container}>
            {/* Circular Expanding Light Animation */}
            <Animated.View
              style={[
                styles.s8ExpandLight,
                {
                  transform: [{ scale: s8LightExpand }],
                  opacity: s8LightExpand.interpolate({
                    inputRange: [0.2, 1.8],
                    outputRange: [0.8, 0.15],
                  }),
                },
              ]}
            >
              <RadialGradientLight />
            </Animated.View>

            {/* Text Reveal */}
            <Animated.View style={[styles.s8TextBlock, { opacity: s8TextFade }]}>
              <Text style={styles.s8PreTitle}>MISSION ACCOMPLISHED</Text>
              <Text style={styles.s8MainHeadline}>You showed up.</Text>
              <Text style={styles.s8SubHeadline}>
                Not online. Not through a screen.{'\n'}In real life.
              </Text>
            </Animated.View>

            {/* HERO +600 POINTS SPRING */}
            <Animated.View
              style={[
                styles.s8HeroPointsContainer,
                {
                  transform: [
                    { scale: s8PointsSpring },
                    { scale: s8PointsGlow },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.25)', 'rgba(245, 158, 11, 0.08)']}
                style={styles.s8HeroPointsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.pointsStarRow}>
                  <MaterialCommunityIcons name="star-four-points" size={24} color="#fbbf24" />
                  <MaterialCommunityIcons name="crown-outline" size={28} color="#fbbf24" />
                  <MaterialCommunityIcons name="star-four-points" size={24} color="#fbbf24" />
                </View>
                <Text style={styles.s8HeroPointsNumber}>+{pointsCounter}</Text>
                <Text style={styles.s8HeroPointsLabel}>HARD REWARD POINTS</Text>
              </LinearGradient>
            </Animated.View>

            {/* Summary details */}
            <View style={styles.s8SummaryPill}>
              <MaterialCommunityIcons name="clock-check-outline" size={14} color="#10b981" />
              <Text style={styles.s8SummaryPillText}>2 hours · One real connection</Text>
            </View>

            {/* Error banner if submission fails */}
            {claimError && (
              <View style={styles.errorNoticeCard}>
                <Feather name="alert-triangle" size={16} color="#ef4444" />
                <Text style={styles.errorNoticeText}>{claimError}</Text>
              </View>
            )}

            {/* Final CTA Button */}
            <Animated.View style={[styles.s8CtaWrapper, { opacity: s8CtaFade }]}>
              <TouchableOpacity
                style={styles.primarySpringBtn}
                activeOpacity={0.88}
                disabled={isSubmitting || hasClaimed}
                onPress={handleFinalCompletion}
              >
                <LinearGradient
                  colors={hasClaimed ? ['#059669', '#10b981'] : ['#f59e0b', '#d97706', '#b45309']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : hasClaimed ? (
                    <>
                      <Feather name="check" size={20} color="#ffffff" />
                      <Text style={styles.primaryBtnText}>Mission Complete</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Mission Complete</Text>
                      <Feather name="arrow-right" size={20} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.s8Footnote}>2 hours. One real connection.</Text>
            </Animated.View>
          </View>
        )}
      </Animated.View>

      {/* ── PAUSE / RESUME MODAL (SCREEN 5) ── */}
      <Modal
        visible={isPauseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPauseModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="clock-alert-outline" size={36} color="#38bdf8" />
            <Text style={styles.modalTitle}>Mission in Progress</Text>
            <Text style={styles.modalDesc}>
              This is a 2-hour real-life connection task. Are you taking a quick break or ready to wrap up your meeting?
            </Text>

            <TouchableOpacity
              style={styles.modalResumeBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsPauseModalVisible(false);
                setIsTimerPaused(false);
              }}
            >
              <Text style={styles.modalResumeText}>Keep Being Present</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalFinishEarlyBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsPauseModalVisible(false);
                transitionToPage(6);
              }}
            >
              <Text style={styles.modalFinishEarlyText}>I Finished Meeting · Go To Reflection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalExitBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsPauseModalVisible(false);
                router.back();
              }}
            >
              <Text style={styles.modalExitText}>Save & Exit For Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── SUB-COMPONENT: ABSTRACT HUMAN SILHOUETTE ───────────────────────────────────
function HumanSilhouette({ color, isFacingRight }: { color: string; isFacingRight: boolean }) {
  return (
    <Svg width={70} height={120} viewBox="0 0 70 120">
      <Defs>
        <RadialGradient id={`silGlow-${color}`} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <Stop offset="85%" stopColor={color} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Head */}
      <Circle cx="35" cy="22" r="14" fill={color} opacity="0.85" />
      <Circle cx="35" cy="22" r="18" fill={`url(#silGlow-${color})`} />

      {/* Torso & Arms Curve */}
      <Path
        d={
          isFacingRight
            ? 'M 20 50 C 20 40, 50 40, 50 50 C 52 68, 48 95, 42 118 L 28 118 C 22 95, 18 68, 20 50 Z'
            : 'M 20 50 C 20 40, 50 40, 50 50 C 52 68, 48 95, 42 118 L 28 118 C 22 95, 18 68, 20 50 Z'
        }
        fill={color}
        opacity="0.75"
      />
    </Svg>
  );
}

// ── SUB-COMPONENT: RADIAL GRADIENT LIGHT POINT ─────────────────────────────────
function RadialGradientLight() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="pointLight" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <Stop offset="30%" stopColor="#38bdf8" stopOpacity="0.5" />
          <Stop offset="70%" stopColor="#6366f1" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#03050a" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="100" cy="100" r="95" fill="url(#pointLight)" />
    </Svg>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050811',
  },
  ambientGlowOrb: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.3,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: (SCREEN_WIDTH * 1.3) / 2,
    top: -SCREEN_WIDTH * 0.3,
    left: -SCREEN_WIDTH * 0.15,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCenterTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  hardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 1,
  },
  pointsPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    gap: 4,
  },
  pointsPillSmallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
  },
  stepCounterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  mainContent: {
    flex: 1,
  },
  scrollScreen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 10,
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageHeaderCompact: {
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },

  // ── SCREEN 1 STYLES
  s1Container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  s1VisualWrapper: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
  },
  s1CenterLightPoint: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteShape: {
    position: 'absolute',
  },
  s1ConnectionBeam: {
    position: 'absolute',
    width: 70,
    height: 3,
    borderRadius: 2,
  },
  s1TextBlock: {
    alignItems: 'center',
    marginVertical: 10,
  },
  s1SuperHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 2,
    marginBottom: 8,
  },
  s1Headline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  s1Subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
  },
  s1BadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
  },
  s1BadgeFloating: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  s1BadgeFloatingGold: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
  },
  s1BadgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 2,
  },
  s1BadgeLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  s1CtaWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  s1Footnote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 10,
  },

  // ── SCREEN 2 STYLES
  cardsColumn: {
    gap: 14,
    marginBottom: 20,
  },
  personCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  personCardSelected: {
    borderWidth: 2,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  personCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  personIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCardTextWrapper: {
    flex: 1,
  },
  personCardRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  personCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  personTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  personTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personCardSub: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  personSelectRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalNameCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  inputSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  nameTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  allowedNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 20,
  },
  allowedNoteText: {
    fontSize: 12,
    color: '#bae6fd',
    flex: 1,
    lineHeight: 17,
  },

  // ── SCREEN 3 STYLES
  blueprintSection: {
    marginBottom: 22,
  },
  blueprintHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  blueprintTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  blueprintSub: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  pillsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  whenCard: {
    width: (SCREEN_WIDTH - 44 - 10) / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  whenCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  whenLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#cbd5e1',
    marginBottom: 2,
  },
  whenLabelSelected: {
    color: '#ffffff',
  },
  whenSub: {
    fontSize: 11,
    color: '#64748b',
  },
  pillsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillBtnSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  pillBtnSelectedGold: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  pillBtnTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pillBtnTextGold: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineNode: {
    alignItems: 'center',
    flex: 1,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 6,
  },
  nodeDotActive: {
    backgroundColor: '#38bdf8',
  },
  nodeDotGold: {
    backgroundColor: '#fbbf24',
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  nodeSub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  timelineLine: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flex: 0.6,
    marginBottom: 16,
  },
  planLockedFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 8,
  },
  planLockedFeedbackText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },

  // ── SCREEN 4 STYLES
  phoneVisualContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  phoneFrame: {
    width: 140,
    height: 160,
    backgroundColor: '#090d1a',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#334155',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  phoneSpeaker: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    marginBottom: 12,
  },
  phoneInnerScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  phoneScreenStatus: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  phoneScreenSub: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  phoneVoidBase: {
    position: 'absolute',
    bottom: 0,
    width: 180,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  phoneRulesCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  rulesCardHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  ruleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    fontSize: 13,
    color: '#e2e8f0',
    flex: 1,
    lineHeight: 18,
  },
  mottoContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    marginBottom: 24,
  },
  mottoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fef3c7',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── SCREEN 5 STYLES
  s5Container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  s5MainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  s5Subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  s5TimerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timerRingWrapper: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerDigitsCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerDigits: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  timerWithLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  s5MissionStatement: {
    alignItems: 'center',
    marginVertical: 4,
  },
  s5MissionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  s5MissionWords: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  rotatingPromptCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  promptHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  promptBodyText: {
    fontSize: 14,
    color: '#ffffff',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  s5ControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  s5PauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  s5PauseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  s5CompleteBtn: {
    flex: 1,
  },

  // ── SCREEN 6 STYLES
  emotionChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  emotionChoiceCardActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  emotionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionChoiceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionInputCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  reflectionInputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  reflectionTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    padding: 14,
    color: '#ffffff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  charCountText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 6,
  },

  // ── SCREEN 7 STYLES
  memoryCardOuter: {
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  memoryGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  glassMemoryBody: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  memoryCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  memoryTagPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  memoryTagPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  memoryPersonSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  memoryAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  memoryPersonTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
  },
  memoryPersonType: {
    fontSize: 13,
    color: '#94a3b8',
  },
  memoryQuoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  memoryQuoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#e2e8f0',
    lineHeight: 22,
    marginTop: 4,
  },
  memoryHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  memoryHighlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  memoryHighlightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#bae6fd',
  },
  memoryPresenceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  memoryPresenceNoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },

  // ── SCREEN 8 STYLES
  s8Container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  s8ExpandLight: {
    position: 'absolute',
    width: 260,
    height: 260,
    top: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  s8TextBlock: {
    alignItems: 'center',
    marginTop: 14,
  },
  s8PreTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 2,
    marginBottom: 6,
  },
  s8MainHeadline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  s8SubHeadline: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  s8HeroPointsContainer: {
    width: '100%',
    marginVertical: 12,
  },
  s8HeroPointsGradient: {
    borderRadius: 30,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  pointsStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  s8HeroPointsNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: -1,
  },
  s8HeroPointsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fed7aa',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  s8SummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  s8SummaryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  s8CtaWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  s8Footnote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 10,
  },

  // ── COMMON BUTTONS & HELPERS
  primarySpringBtn: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  bottomCtaPadding: {
    marginTop: 12,
    marginBottom: 10,
  },
  errorNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  errorNoticeText: {
    fontSize: 12,
    color: '#fca5a5',
    flex: 1,
  },

  // ── MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#090d1a',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
    marginVertical: 14,
  },
  modalResumeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalResumeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalFinishEarlyBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modalFinishEarlyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
  modalExitBtn: {
    paddingVertical: 8,
  },
  modalExitText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
});
