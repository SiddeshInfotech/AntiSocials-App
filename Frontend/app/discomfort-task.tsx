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
  Path,
  Circle,
  G,
  Line,
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── TASK CONSTANTS ─────────────────────────────────────────────────────────────
const TASK_ID = 67;
const TASK_NAME = 'Sit with Discomfort';
const TASK_POINTS = 600;
const PAGE_5_STAY_DURATION = 120; // 2 minutes (120s)
const PAGE_6_URGE_DURATION = 90;  // 90 seconds

// ── PAGE 2: MOMENT OPTIONS ─────────────────────────────────────────────────────
interface MomentOption {
  id: string;
  label: string;
  angle: number; // For radial distribution in degrees
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const MOMENT_OPTIONS: MomentOption[] = [
  { id: 'waiting', label: 'Waiting', angle: 270, icon: 'timer-sand' },
  { id: 'ignored', label: 'Being Ignored', angle: 320, icon: 'account-off-outline' },
  { id: 'mistake', label: 'Making a Mistake', angle: 10, icon: 'alert-circle-outline' },
  { id: 'speaking', label: 'Speaking Up', angle: 60, icon: 'microphone-outline' },
  { id: 'uncertainty', label: 'Uncertainty', angle: 120, icon: 'help-circle-outline' },
  { id: 'boredom', label: 'Boredom', angle: 180, icon: 'clock-outline' },
  { id: 'other', label: 'Something Else', angle: 225, icon: 'dots-horizontal' },
];

// ── PAGE 3: EMOTION CONSTELLATION ──────────────────────────────────────────────
interface EmotionNode {
  id: string;
  name: string;
  x: number; // percentage of container width
  y: number; // percentage of container height
  size: number;
}

const EMOTION_NODES: EmotionNode[] = [
  { id: 'tension', name: 'Tension', x: 22, y: 18, size: 76 },
  { id: 'restlessness', name: 'Restlessness', x: 74, y: 16, size: 84 },
  { id: 'uncertainty', name: 'Uncertainty', x: 48, y: 35, size: 86 },
  { id: 'frustration', name: 'Frustration', x: 18, y: 52, size: 80 },
  { id: 'embarrassment', name: 'Embarrassment', x: 78, y: 48, size: 88 },
  { id: 'impatience', name: 'Impatience', x: 28, y: 78, size: 80 },
  { id: 'worry', name: 'Worry', x: 54, y: 64, size: 74 },
  { id: 'irritation', name: 'Irritation', x: 76, y: 80, size: 76 },
];

// ── PAGE 4: BODY REGIONS & SENSATIONS ──────────────────────────────────────────
type BodyRegionId = 'head' | 'chest' | 'shoulders' | 'hands' | 'stomach' | 'legs';

interface BodyRegionDef {
  id: BodyRegionId;
  label: string;
  cx: number;
  cy: number;
  r: number;
  description: string;
}

const BODY_REGIONS: BodyRegionDef[] = [
  { id: 'head', label: 'Head', cx: 150, cy: 56, r: 28, description: 'Mental pressure, racing thoughts, forehead tension' },
  { id: 'shoulders', label: 'Shoulders', cx: 150, cy: 110, r: 36, description: 'Heaviness, tight posture, elevated neck muscles' },
  { id: 'chest', label: 'Chest', cx: 150, cy: 156, r: 30, description: 'Constriction, shallow breathing, racing pulse' },
  { id: 'stomach', label: 'Stomach', cx: 150, cy: 224, r: 30, description: 'Sinking sensation, fluttering knots, gut tightness' },
  { id: 'hands', label: 'Hands', cx: 80, cy: 236, r: 24, description: 'Cold tremors, clamminess, urge to fidget' },
  { id: 'legs', label: 'Legs', cx: 150, cy: 330, r: 36, description: 'Restlessness, trembling, impulse to stand or escape' },
];

const SENSATION_OPTIONS = [
  'Tight',
  'Heavy',
  'Warm',
  'Restless',
  'Fluttering',
  'Numb',
  'Other',
];

// ── PAGE 5: ROTATING GUIDANCE PROMPTS ──────────────────────────────────────────
const STAY_GUIDANCE_PROMPTS = [
  'Notice it.',
  "Don't push it away.",
  'Where is it strongest?',
  'Can you observe without fixing?',
  'Let the sensation change.',
  'You are safe to simply notice.',
  'Nothing needs to happen right now.',
];

// ── PAGE 6: URGE SITUATIONS ───────────────────────────────────────────────────
const URGE_SITUATIONS = [
  'Check your phone',
  'Change your thought',
  'Get distracted',
  'Fix the feeling',
  'Stay and observe',
];

// ── AMBIENT PARTICLES DEFINITION ───────────────────────────────────────────────
const AMBIENT_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  startX: (i * 21) % 100,
  startY: (i * 37) % 100,
  size: 3 + (i % 4),
  duration: 6000 + (i % 5) * 1500,
  delay: (i * 450) % 2500,
  opacity: 0.15 + (i % 4) * 0.12,
}));

export default function SitWithDiscomfortScreen() {
  const router = useRouter();

  // ── NAVIGATION & STATE ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // ── PAGE DATA STATE ──────────────────────────────────────────────────────────
  // Page 2
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);
  const [momentDescription, setMomentDescription] = useState('');

  // Page 3
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [emotionIntensity, setEmotionIntensity] = useState(6); // 1-10

  // Page 4
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId | null>(null);
  const [selectedSensation, setSelectedSensation] = useState<string | null>(null);

  // Page 5 (The Stay)
  const [stayStarted, setStayStarted] = useState(false);
  const [stayTimeLeft, setStayTimeLeft] = useState(PAGE_5_STAY_DURATION);
  const [stayGuidanceIndex, setStayGuidanceIndex] = useState(0);
  const [isStayPaused, setIsStayPaused] = useState(false);

  // Page 6 (The Urge)
  const [urgeTimeLeft, setUrgeTimeLeft] = useState(PAGE_6_URGE_DURATION);
  const [urgeIndex, setUrgeIndex] = useState(0);
  const [urgeChoices, setUrgeChoices] = useState<Array<'react' | 'observe'>>([]);
  const [isUrgePaused, setIsUrgePaused] = useState(false);
  const [urgeCompleted, setUrgeCompleted] = useState(false);

  // Page 8 (Release & Complete)
  const [reflectionText, setReflectionText] = useState('');
  const [pointsDisplay, setPointsDisplay] = useState(0);

  // ── CORE ANIMATION VALUES ───────────────────────────────────────────────────
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Page 1: Abstract Breathing Sphere
  const p1SphereScale = useRef(new Animated.Value(0.94)).current;
  const p1SphereGlow = useRef(new Animated.Value(0.4)).current;
  const p1TitleFade = useRef(new Animated.Value(0)).current;
  const p1RewardFade = useRef(new Animated.Value(0)).current;
  const p1BtnPulse = useRef(new Animated.Value(1)).current;
  const p1SphereExpand = useRef(new Animated.Value(1)).current;

  // Page 2: Floating Circular Wheel
  const p2WheelRotation = useRef(new Animated.Value(0)).current;
  const p2CenterScale = useRef(new Animated.Value(1)).current;

  // Page 3: Emotion Constellation
  const p3ConstellationPulse = useRef(new Animated.Value(1)).current;
  const p3CollapseAnim = useRef(new Animated.Value(1)).current;

  // Page 4: Body Map Ripple & Glow
  const p4GlowPulse = useRef(new Animated.Value(0.5)).current;
  const p4RippleScale = useRef(new Animated.Value(1)).current;

  // Page 5: Immersive Breathing Guide (4s inhale / 6s exhale)
  const p5BreathAnim = useRef(new Animated.Value(1)).current;
  const p5PromptFade = useRef(new Animated.Value(1)).current;

  // Page 6: Dynamic Urge Wave
  const p6WavePhase = useRef(new Animated.Value(0)).current;
  const p6WaveHeight = useRef(new Animated.Value(1)).current;
  const p6ChoiceFlash = useRef(new Animated.Value(0)).current;

  // Page 7: Neural Analysis & Metrics
  const p7NeuralSpin = useRef(new Animated.Value(0)).current;
  const p7MetricAwareness = useRef(new Animated.Value(0)).current;
  const p7MetricStay = useRef(new Animated.Value(0)).current;
  const p7MetricResponse = useRef(new Animated.Value(0)).current;

  // Page 8: Transformation & Release
  const p8CalmFade = useRef(new Animated.Value(0)).current;
  const p8Statement1Fade = useRef(new Animated.Value(0)).current;
  const p8Statement2Fade = useRef(new Animated.Value(0)).current;
  const p8Statement3Fade = useRef(new Animated.Value(0)).current;
  const p8PointsScale = useRef(new Animated.Value(0.8)).current;

  // ── AMBIENT BACKGROUND LOOPS ────────────────────────────────────────────────
  useEffect(() => {
    // Page 1 Sphere breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(p1SphereScale, {
          toValue: 1.08,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(p1SphereScale, {
          toValue: 0.94,
          duration: 4600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Page 1 Sphere glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(p1SphereGlow, {
          toValue: 0.85,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(p1SphereGlow, {
          toValue: 0.35,
          duration: 4600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Page 1 Button pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(p1BtnPulse, {
          toValue: 1.04,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(p1BtnPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Page 1 Staggered Entrance
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(p1TitleFade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(p1RewardFade, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle continuous wheel drift for Page 2
    Animated.loop(
      Animated.timing(p2WheelRotation, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Body map region glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(p4GlowPulse, {
          toValue: 0.95,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(p4GlowPulse, {
          toValue: 0.45,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Neural processing rotation for Page 7
    Animated.loop(
      Animated.timing(p7NeuralSpin, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ── PAGE 5: 2-MINUTE STAY TIMER & BREATHING LOOP ─────────────────────────────
  useEffect(() => {
    if (currentPage !== 5 || !stayStarted || isStayPaused) return;

    // Synchronized breathing loop (4s inhale -> 6s exhale)
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(p5BreathAnim, {
          toValue: 1.34,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(p5BreathAnim, {
          toValue: 0.92,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathLoop.start();

    // 1-second countdown interval
    const interval = setInterval(() => {
      setStayTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          breathLoop.stop();
          transitionToPage(6);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Dynamic rotating guidance interval (every 17s)
    const guidanceInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(p5PromptFade, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(p5PromptFade, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();

      setStayGuidanceIndex((prev) => (prev + 1) % STAY_GUIDANCE_PROMPTS.length);
    }, 17000);

    return () => {
      clearInterval(interval);
      clearInterval(guidanceInterval);
      breathLoop.stop();
    };
  }, [currentPage, stayStarted, isStayPaused]);

  // ── PAGE 6: 90-SECOND URGE TIMER & WAVE ANIMATION ────────────────────────────
  useEffect(() => {
    if (currentPage !== 6 || isUrgePaused || urgeCompleted) return;

    // Wave phase animation loop
    const waveLoop = Animated.loop(
      Animated.timing(p6WavePhase, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    waveLoop.start();

    // Countdown interval
    const timer = setInterval(() => {
      setUrgeTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setUrgeCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Rotate urge prompt every 18 seconds
    const urgeRotation = setInterval(() => {
      setUrgeIndex((prev) => (prev + 1) % URGE_SITUATIONS.length);
    }, 18000);

    return () => {
      clearInterval(timer);
      clearInterval(urgeRotation);
      waveLoop.stop();
    };
  }, [currentPage, isUrgePaused, urgeCompleted]);

  // ── PAGE 6: URGE CHOICE HANDLER ──────────────────────────────────────────────
  const handleUrgeChoice = (choice: 'react' | 'observe') => {
    try {
      Haptics.impactAsync(
        choice === 'observe'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_) {}

    setUrgeChoices((prev) => [...prev, choice]);

    // Animate wave reaction based on choice
    Animated.sequence([
      Animated.parallel([
        Animated.timing(p6WaveHeight, {
          toValue: choice === 'react' ? 1.6 : 0.75,
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(p6ChoiceFlash, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(p6WaveHeight, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(p6ChoiceFlash, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Advance to next prompt situation
    setUrgeIndex((prev) => (prev + 1) % URGE_SITUATIONS.length);
  };

  // ── DETERMINISTIC METRIC CALCULATIONS FOR PAGE 7 ─────────────────────────────
  const analyticsData = useMemo(() => {
    // 1. Awareness Metric (Granularity of Moment + Emotion + Somatic Region)
    let awarenessScore = 70;
    if (selectedMoment && selectedMoment !== 'other') awarenessScore += 10;
    if (momentDescription.trim().length > 5) awarenessScore += 6;
    if (selectedEmotion) awarenessScore += 8;
    if (selectedRegion && selectedSensation) awarenessScore += 6;
    awarenessScore = Math.min(98, Math.max(72, awarenessScore));

    // 2. Staying Power (Based on completing the 2-minute stay)
    const stayingPowerScore = stayTimeLeft === 0 ? 100 : Math.round(((120 - stayTimeLeft) / 120) * 100);

    // 3. Response Space (Calculated from Observe vs React choices in Page 6)
    const totalChoices = urgeChoices.length;
    const observeCount = urgeChoices.filter((c) => c === 'observe').length;
    const reactCount = urgeChoices.filter((c) => c === 'react').length;
    let responseSpaceScore = 80;
    if (totalChoices > 0) {
      const observeRatio = observeCount / totalChoices;
      responseSpaceScore = Math.round(55 + observeRatio * 43);
    } else {
      responseSpaceScore = 88;
    }

    // Determine personalized pattern insight
    let patternTitle = 'Somatic Observer';
    let patternSummary =
      'You identified discomfort in your body, stayed present without escaping, and created conscious space before reacting.';

    if (observeCount >= reactCount && totalChoices > 0) {
      patternTitle = 'Conscious Anchoring';
      patternSummary =
        'When the urge to escape arose, you chose observation over impulse. This conscious hesitation is how psychological flexibility is built.';
    } else if (reactCount > observeCount && totalChoices > 0) {
      patternTitle = 'Honest Awareness';
      patternSummary =
        'Your initial impulse was often to react. Noticing that urge honestly is the essential foundation of sitting with discomfort.';
    } else if (selectedRegion === 'head' || selectedRegion === 'chest') {
      patternTitle = 'Visceral Presence';
      patternSummary =
        `You anchored the mental urge into your ${selectedRegion}, transforming abstract discomfort into neutral, observable energy.`;
    }

    return {
      awarenessScore,
      stayingPowerScore,
      responseSpaceScore,
      patternTitle,
      patternSummary,
      observeCount,
      reactCount,
    };
  }, [
    selectedMoment,
    momentDescription,
    selectedEmotion,
    selectedRegion,
    selectedSensation,
    stayTimeLeft,
    urgeChoices,
  ]);

  // Trigger metric bar animations on entering Page 7
  useEffect(() => {
    if (currentPage === 7) {
      p7MetricAwareness.setValue(0);
      p7MetricStay.setValue(0);
      p7MetricResponse.setValue(0);

      Animated.stagger(280, [
        Animated.timing(p7MetricAwareness, {
          toValue: analyticsData.awarenessScore / 100,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(p7MetricStay, {
          toValue: analyticsData.stayingPowerScore / 100,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(p7MetricResponse, {
          toValue: analyticsData.responseSpaceScore / 100,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [currentPage, analyticsData]);

  // ── PAGE 8: CALM ENTRANCE & POINTS COUNTER ──────────────────────────────────
  useEffect(() => {
    if (currentPage === 8) {
      Animated.sequence([
        Animated.timing(p8CalmFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.stagger(650, [
          Animated.timing(p8Statement1Fade, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(p8Statement2Fade, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(p8Statement3Fade, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [currentPage]);

  // Points counter animation on Page 8 (runs once reflection text is valid or ready)
  const animatePoints = () => {
    Animated.spring(p8PointsScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();

    let current = 0;
    const increment = 20;
    const interval = setInterval(() => {
      current += increment;
      if (current >= TASK_POINTS) {
        setPointsDisplay(TASK_POINTS);
        clearInterval(interval);
      } else {
        setPointsDisplay(current);
      }
    }, 28);
  };

  useEffect(() => {
    if (currentPage === 8 && reflectionText.trim().length >= 3 && pointsDisplay === 0) {
      animatePoints();
    }
  }, [currentPage, reflectionText, pointsDisplay]);

  // ── PAGE TRANSITION HELPER ──────────────────────────────────────────────────
  const transitionToPage = (newPage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    // Special animation for Page 1 -> Page 2 (expanding sphere transition)
    if (currentPage === 1 && newPage === 2) {
      Animated.timing(p1SphereExpand, {
        toValue: 8,
        duration: 700,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(2);
        p1SphereExpand.setValue(1);
        pageFadeAnim.setValue(0);
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    // Special collapse animation for Page 3 -> Page 4
    if (currentPage === 3 && newPage === 4) {
      Animated.timing(p3CollapseAnim, {
        toValue: 0.1,
        duration: 500,
        easing: Easing.in(Easing.back(1.5)),
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(4);
        p3CollapseAnim.setValue(1);
        pageFadeAnim.setValue(0);
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    // Standard smooth cross-fade transition
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -20,
        duration: 260,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPage(newPage);
      pageSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ── AUTHENTICATED REWARD CLAIM (PAGE 8) ──────────────────────────────────────
  const handleCompleteTask = async () => {
    if (isSubmitting || hasClaimed) return;

    if (reflectionText.trim().length === 0) {
      Alert.alert(
        'Reflection Required',
        'Please write one thing you noticed about sitting with discomfort to complete the challenge.'
      );
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
          moment: selectedMoment,
          moment_desc: momentDescription.trim(),
          emotion: selectedEmotion,
          intensity: emotionIntensity,
          region: selectedRegion,
          sensation: selectedSensation,
          stay_completed: true,
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
        TASK_POINTS;
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '0';

      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsEarned),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: 'Sit with Discomfort',
          difficulty: 'Hard',
          message: "You didn't escape.",
        },
      } as any);
    } catch (err: any) {
      console.error('Sit With Discomfort claim error:', err);
      setClaimError(err?.message || 'Network request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SAFE EXIT (NO REWARD) ───────────────────────────────────────────────────
  const handleExitSafely = () => {
    setIsPauseModalVisible(false);
    setIsStayPaused(false);
    setIsUrgePaused(false);
    router.back();
  };

  // ── HEADER BACK BUTTON HANDLER ──────────────────────────────────────────────
  const handleHeaderBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    if (currentPage === 1) {
      router.back();
    } else if (currentPage === 5 || currentPage === 6) {
      setIsStayPaused(true);
      setIsUrgePaused(true);
      setIsPauseModalVisible(true);
    } else {
      transitionToPage((currentPage - 1) as any);
    }
  };

  // ── FORMAT TIME MM:SS ───────────────────────────────────────────────────────
  const formatMMSS = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── DEV FAST FORWARD (TRIPLE TAP) ───────────────────────────────────────────
  const devTapCount = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      devTapCount.current += 1;
      if (devTapCount.current >= 3) {
        devTapCount.current = 0;
        if (currentPage === 5) setStayTimeLeft(2);
        if (currentPage === 6) setUrgeTimeLeft(2);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 1 — ARRIVE
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage1Arrive = () => (
    <View style={styles.p1Container}>
      {/* Abstract Breathing Sphere */}
      <View style={styles.p1SphereWrapper}>
        <Animated.View
          style={[
            styles.p1SphereGlowRing,
            {
              opacity: p1SphereGlow,
              transform: [{ scale: p1SphereScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.p1SphereCore,
            {
              transform: [
                { scale: p1SphereScale },
                { scale: p1SphereExpand },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#3b82f6', '#1e3a8a', '#0f172a']}
            style={styles.p1SphereGradient}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
          />
        </Animated.View>
      </View>

      {/* Title & Badges */}
      <Animated.View style={[styles.p1TextBlock, { opacity: p1TitleFade }]}>
        <Text style={styles.p1Title}>Sit With Discomfort</Text>

        <View style={styles.badgeRow}>
          <View style={styles.hardBadge}>
            <Text style={styles.hardBadgeText}>HARD</Text>
          </View>
          <View style={styles.pointsBadge}>
            <MaterialCommunityIcons name="star-four-points" size={14} color="#60a5fa" />
            <Text style={styles.pointsBadgeText}>+600 Points</Text>
          </View>
        </View>

        <Text style={styles.p1IntroText}>
          Some feelings become stronger when we immediately try to escape them.
        </Text>
        <Text style={styles.p1SubIntroText}>
          Today, you’ll practice staying present with a manageable moment of discomfort.
        </Text>

        <View style={styles.safetyBox}>
          <Feather name="shield" size={14} color="#94a3b8" />
          <Text style={styles.safetyBoxText}>
            Choose something mildly uncomfortable — not overwhelming or traumatic.
          </Text>
        </View>
      </Animated.View>

      {/* Primary CTA */}
      <Animated.View style={[styles.p1BtnWrap, { opacity: p1RewardFade }]}>
        <Animated.View style={{ transform: [{ scale: p1BtnPulse }] }}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => transitionToPage(2)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Begin</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 2 — CHOOSE YOUR MOMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage2ChooseMoment = () => {
    const wheelRadius = SCREEN_WIDTH * 0.38;

    return (
      <ScrollView
        contentContainerStyle={styles.scrollPageContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Choose A Moment</Text>
          <Text style={styles.pageSubtitle}>
            Think of one ordinary situation that feels uncomfortable.
          </Text>
        </View>

        {/* Floating Circular Selection Wheel */}
        <View style={styles.wheelContainer}>
          {/* Central Hub Circle */}
          <Animated.View
            style={[
              styles.wheelCenterHub,
              selectedMoment ? styles.wheelCenterHubActive : null,
              { transform: [{ scale: p2CenterScale }] },
            ]}
          >
            <LinearGradient
              colors={
                selectedMoment
                  ? ['#1e40af', '#172554']
                  : ['#1e293b', '#0f172a']
              }
              style={styles.wheelCenterGradient}
            >
              <MaterialCommunityIcons
                name={
                  selectedMoment
                    ? (MOMENT_OPTIONS.find((m) => m.id === selectedMoment)?.icon ?? 'check-bold')
                    : 'target'
                }
                size={32}
                color={selectedMoment ? '#60a5fa' : '#64748b'}
              />
              <Text style={styles.wheelCenterText} numberOfLines={1}>
                {selectedMoment
                  ? MOMENT_OPTIONS.find((m) => m.id === selectedMoment)?.label
                  : 'Select'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Orbiting Options */}
          {MOMENT_OPTIONS.map((opt) => {
            const rad = (opt.angle * Math.PI) / 180;
            const x = Math.cos(rad) * wheelRadius;
            const y = Math.sin(rad) * wheelRadius;
            const isSelected = selectedMoment === opt.id;
            const isAnySelected = selectedMoment !== null;

            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.wheelNode,
                  {
                    transform: [{ translateX: x }, { translateY: y }],
                    opacity: isSelected ? 1 : isAnySelected ? 0.35 : 0.95,
                  },
                  isSelected && styles.wheelNodeSelected,
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  setSelectedMoment(opt.id);

                  // Animate center pop
                  Animated.sequence([
                    Animated.timing(p2CenterScale, {
                      toValue: 1.15,
                      duration: 180,
                      useNativeDriver: true,
                    }),
                    Animated.timing(p2CenterScale, {
                      toValue: 1,
                      duration: 220,
                      useNativeDriver: true,
                    }),
                  ]).start();
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={18}
                  color={isSelected ? '#60a5fa' : '#cbd5e1'}
                />
                <Text
                  style={[
                    styles.wheelNodeLabel,
                    isSelected && styles.wheelNodeLabelSelected,
                  ]}
                  numberOfLines={2}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Optional Context Input */}
        {selectedMoment && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>What makes this uncomfortable?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe it in a few words… (optional)"
              placeholderTextColor="#64748b"
              value={momentDescription}
              onChangeText={setMomentDescription}
              maxLength={120}
            />
          </View>
        )}

        {/* Continue CTA */}
        <View style={styles.pageBottomBtnWrap}>
          <TouchableOpacity
            style={[styles.primaryBtn, !selectedMoment && styles.btnDisabled]}
            onPress={() => {
              if (selectedMoment) transitionToPage(3);
            }}
            disabled={!selectedMoment}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={selectedMoment ? ['#2563eb', '#1d4ed8'] : ['#334155', '#1e293b']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 3 — NAME THE FEELING
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage3NameFeeling = () => {
    return (
      <View style={styles.p3Container}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Name The Feeling</Text>
          <Text style={styles.pageSubtitle}>What is closest to what you feel?</Text>
        </View>

        {/* Constellation Canvas */}
        <Animated.View
          style={[
            styles.constellationCanvas,
            { transform: [{ scale: p3CollapseAnim }] },
          ]}
        >
          {/* Background Connecting Constellation Lines */}
          <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Line x1="22%" y1="18%" x2="48%" y2="35%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            <Line x1="74%" y1="16%" x2="48%" y2="35%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            <Line x1="48%" y1="35%" x2="18%" y2="52%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            <Line x1="48%" y1="35%" x2="78%" y2="48%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            <Line x1="18%" y1="52%" x2="28%" y2="78%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            <Line x1="48%" y1="35%" x2="54%" y2="64%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            <Line x1="78%" y1="48%" x2="76%" y2="80%" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
          </Svg>

          {/* Floating Emotion Nodes */}
          {EMOTION_NODES.map((node) => {
            const isSelected = selectedEmotion === node.id;

            return (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.emotionNode,
                  {
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: node.size,
                    height: node.size,
                    borderRadius: node.size / 2,
                    marginLeft: -node.size / 2,
                    marginTop: -node.size / 2,
                  },
                  isSelected && styles.emotionNodeSelected,
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (_) {}
                  setSelectedEmotion(node.id);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isSelected
                      ? ['#3b82f6', '#1d4ed8']
                      : ['rgba(30, 41, 59, 0.85)', 'rgba(15, 23, 42, 0.85)']
                  }
                  style={styles.emotionNodeGradient}
                >
                  <Text
                    style={[
                      styles.emotionNodeText,
                      isSelected && styles.emotionNodeTextSelected,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {node.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Intensity Scale 1 - 10 */}
        <View style={styles.intensityCard}>
          <View style={styles.intensityHeader}>
            <Text style={styles.intensityTitle}>How strong is it right now?</Text>
            <View style={styles.intensityBadge}>
              <Text style={styles.intensityBadgeText}>{emotionIntensity} / 10</Text>
            </View>
          </View>

          <View style={styles.intensitySliderTrack}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
              const isActive = val <= emotionIntensity;
              const isSelectedVal = val === emotionIntensity;

              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.intensityPip,
                    isActive && styles.intensityPipActive,
                    isSelectedVal && styles.intensityPipSelected,
                  ]}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (_) {}
                    setEmotionIntensity(val);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.intensityPipText,
                      isActive && styles.intensityPipTextActive,
                    ]}
                  >
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.intensityLabels}>
            <Text style={styles.intensityLow}>Low</Text>
            <Text style={styles.intensityHigh}>Strong</Text>
          </View>
        </View>

        {/* Button */}
        <View style={styles.pageBottomBtnWrap}>
          <TouchableOpacity
            style={[styles.primaryBtn, !selectedEmotion && styles.btnDisabled]}
            onPress={() => {
              if (selectedEmotion) transitionToPage(4);
            }}
            disabled={!selectedEmotion}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={selectedEmotion ? ['#2563eb', '#1d4ed8'] : ['#334155', '#1e293b']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>I’ve Named It</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 4 — FIND IT IN THE BODY
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage4FindInBody = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollPageContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Where Do You Feel It?</Text>
          <Text style={styles.pageSubtitle}>
            Don't change the sensation. Just notice where it lives.
          </Text>
        </View>

        {/* Anatomical Silhouette & Interactive Touch Hotspots */}
        <View style={styles.bodyMapWrapper}>
          <Svg width={300} height={400} viewBox="0 0 300 400">
            <Defs>
              <RadialGradient id="bodyGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Silhouette Outline */}
            <G fill="none" stroke="#334155" strokeWidth="2.5" opacity={0.65}>
              {/* Head */}
              <Circle cx="150" cy="56" r="26" />
              {/* Neck */}
              <Path d="M142,82 L142,94 M158,82 L158,94" />
              {/* Torso & Shoulders */}
              <Path d="M110,105 C125,98 175,98 190,105 L180,240 C175,255 125,255 120,240 Z" />
              {/* Arms */}
              <Path d="M110,105 L80,180 L76,245" />
              <Path d="M190,105 L220,180 L224,245" />
              {/* Legs */}
              <Path d="M130,250 L126,380 M170,250 L174,380" />
            </G>

            {/* Active Glow for Selected Region */}
            {selectedRegion && (
              <Circle
                cx={BODY_REGIONS.find((r) => r.id === selectedRegion)?.cx || 150}
                cy={BODY_REGIONS.find((r) => r.id === selectedRegion)?.cy || 150}
                r={55}
                fill="url(#bodyGlow)"
              />
            )}
          </Svg>

          {/* Interactive Touch Overlay Circles */}
          {BODY_REGIONS.map((region) => {
            const isSelected = selectedRegion === region.id;

            return (
              <TouchableOpacity
                key={region.id}
                style={[
                  styles.bodyHotspot,
                  {
                    left: region.cx - 28,
                    top: region.cy - 28,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                  },
                  isSelected && styles.bodyHotspotSelected,
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (_) {}
                  setSelectedRegion(region.id);
                }}
                activeOpacity={0.75}
              >
                <Animated.View
                  style={[
                    styles.hotspotInnerCircle,
                    isSelected && styles.hotspotInnerCircleSelected,
                    isSelected && { opacity: p4GlowPulse },
                  ]}
                />
                <Text
                  style={[
                    styles.hotspotLabel,
                    isSelected && styles.hotspotLabelSelected,
                  ]}
                >
                  {region.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Region Description Callout */}
        {selectedRegion && (
          <View style={styles.regionInfoCard}>
            <Feather name="info" size={16} color="#60a5fa" />
            <Text style={styles.regionInfoText}>
              {BODY_REGIONS.find((r) => r.id === selectedRegion)?.description}
            </Text>
          </View>
        )}

        {/* Sensation Descriptors */}
        {selectedRegion && (
          <View style={styles.sensationSection}>
            <Text style={styles.sensationQuestion}>What does it feel like?</Text>
            <View style={styles.sensationChipsWrap}>
              {SENSATION_OPTIONS.map((sens) => {
                const isSensSelected = selectedSensation === sens;

                return (
                  <TouchableOpacity
                    key={sens}
                    style={[
                      styles.sensationChip,
                      isSensSelected && styles.sensationChipSelected,
                    ]}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch (_) {}
                      setSelectedSensation(sens);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.sensationChipText,
                        isSensSelected && styles.sensationChipTextSelected,
                      ]}
                    >
                      {sens}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.pageBottomBtnWrap}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!selectedRegion || !selectedSensation) && styles.btnDisabled,
            ]}
            onPress={() => {
              if (selectedRegion && selectedSensation) transitionToPage(5);
            }}
            disabled={!selectedRegion || !selectedSensation}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                selectedRegion && selectedSensation
                  ? ['#2563eb', '#1d4ed8']
                  : ['#334155', '#1e293b']
              }
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 5 — THE STAY (CORE 2-MINUTE IMMERSIVE BREATHING)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage5TheStay = () => {
    return (
      <View style={styles.p5Container}>
        {/* Top Minimalist Header */}
        <View style={styles.p5Header}>
          <Text style={styles.p5Title}>Stay With It</Text>
          <Text style={styles.p5Sub1}>You don't need to solve the feeling.</Text>
          <Text style={styles.p5Sub2}>Just stay curious about it.</Text>
        </View>

        {/* Center Breathing Orb Environment */}
        <View style={styles.p5OrbCenter}>
          <Animated.View
            style={[
              styles.p5BreathHalo,
              {
                transform: [{ scale: p5BreathAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.p5BreathOrb,
              {
                transform: [{ scale: p5BreathAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#1e3a8a', '#1e40af', '#0f172a']}
              style={styles.p5OrbGradient}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
            >
              {/* Countdown Timer (Triple-tap skips in __DEV__) */}
              <Pressable onPress={handleDevSkip} style={styles.timerTapArea}>
                <Text style={styles.p5TimerDigits}>{formatMMSS(stayTimeLeft)}</Text>
                <Text style={styles.p5TimerLabel}>
                  {stayStarted ? 'OBSERVING DISCOMFORT' : 'READY WHEN YOU ARE'}
                </Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Rotating Mindfulness Guidance */}
        <View style={styles.p5GuidanceContainer}>
          {stayStarted ? (
            <Animated.View style={{ opacity: p5PromptFade }}>
              <Text style={styles.p5GuidanceText}>
                {STAY_GUIDANCE_PROMPTS[stayGuidanceIndex]}
              </Text>
            </Animated.View>
          ) : (
            <Text style={styles.p5GuidanceTextMuted}>
              Press Start to begin the 2-minute observation.
            </Text>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.p5Controls}>
          {!stayStarted ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch (_) {}
                setStayStarted(true);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryBtnText}>Start</Text>
                <Feather name="play" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.p5ActiveRow}>
              <TouchableOpacity
                style={styles.p5PauseBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  setIsStayPaused(true);
                  setIsPauseModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <Feather name="pause" size={18} color="#94a3b8" />
                <Text style={styles.p5PauseBtnText}>Pause</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 6 — THE URGE (DYNAMIC URGE WAVE & 90s CHALLENGE)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage6TheUrge = () => {
    const currentUrge = URGE_SITUATIONS[urgeIndex];

    return (
      <View style={styles.p6Container}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Notice The Urge To Escape</Text>
          <Text style={styles.pageSubtitle}>
            When discomfort appears, the mind often wants to do something immediately.
          </Text>
        </View>

        {/* Timer Bar & Dev Skip */}
        <Pressable onPress={handleDevSkip} style={styles.p6TimerRow}>
          <View style={styles.p6TimerBadge}>
            <Feather name="clock" size={14} color="#60a5fa" />
            <Text style={styles.p6TimerText}>{formatMMSS(urgeTimeLeft)}</Text>
          </View>
          <Text style={styles.p6TimerNote}>90s Challenge</Text>
        </Pressable>

        {/* Dynamic Urge Wave Graphic */}
        <View style={styles.p6WaveCard}>
          <Animated.View
            style={[
              styles.waveGraphicWrap,
              { transform: [{ scaleY: p6WaveHeight }] },
            ]}
          >
            <Svg width="100%" height="90" viewBox="0 0 300 90">
              <Defs>
                <RadialGradient id="waveGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect width="100%" height="90" fill="url(#waveGlow)" />
              {/* Sinusoidal Wave lines */}
              <Path
                d="M 0 45 Q 75 10 150 45 T 300 45"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="3.5"
              />
              <Path
                d="M 0 45 Q 75 80 150 45 T 300 45"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity={0.4}
                strokeDasharray="6 6"
              />
            </Svg>
          </Animated.View>

          {/* Prompt Situation Card */}
          <View style={styles.urgePromptBox}>
            <Text style={styles.urgePromptQuestion}>What is your first impulse?</Text>
            <Text style={styles.urgePromptSituation}>“{currentUrge}”</Text>
          </View>

          {/* Flash Feedback */}
          <Animated.View
            style={[styles.p6FlashOverlay, { opacity: p6ChoiceFlash }]}
            pointerEvents="none"
          />
        </View>

        {/* Dual Large Choices: REACT vs OBSERVE */}
        {!urgeCompleted ? (
          <View style={styles.urgeChoicesRow}>
            {/* React Target */}
            <TouchableOpacity
              style={styles.urgeChoiceBtn}
              onPress={() => handleUrgeChoice('react')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(244, 63, 94, 0.2)', 'rgba(159, 18, 57, 0.3)']}
                style={styles.choiceGradient}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={28} color="#fb7185" />
                <Text style={styles.reactBtnTitle}>React</Text>
                <Text style={styles.choiceBtnSub}>Impulse to fix/escape</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Observe Target */}
            <TouchableOpacity
              style={styles.urgeChoiceBtn}
              onPress={() => handleUrgeChoice('observe')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(30, 58, 138, 0.3)']}
                style={styles.choiceGradient}
              >
                <Feather name="eye" size={26} color="#60a5fa" />
                <Text style={styles.observeBtnTitle}>Observe</Text>
                <Text style={styles.choiceBtnSub}>Stay with the feeling</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.urgeCompletedBanner}>
            <Feather name="check-circle" size={24} color="#34d399" />
            <Text style={styles.urgeCompletedTitle}>Your urge was observed.</Text>
            <Text style={styles.urgeCompletedSub}>
              You tracked {urgeChoices.length} responses without judging yourself.
            </Text>
          </View>
        )}

        {/* Pause or Continue */}
        <View style={styles.pageBottomBtnWrap}>
          {urgeCompleted ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => transitionToPage(7)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.p6PauseSubtleBtn}
              onPress={() => {
                setIsUrgePaused(true);
                setIsPauseModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.p6PauseSubtleText}>Pause Challenge</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 7 — UNDERSTAND (AI NEURAL ANALYSIS DASHBOARD)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage7Understand = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollPageContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>What Happened?</Text>
          <Text style={styles.pageSubtitle}>Connecting your observations…</Text>
        </View>

        {/* Neural Processing Graphic */}
        <View style={styles.neuralVisualCard}>
          <Animated.View
            style={[
              styles.neuralOrb,
              {
                transform: [
                  {
                    rotate: p7NeuralSpin.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={110} height={110} viewBox="0 0 110 110">
              <Circle cx="55" cy="55" r="48" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="2" strokeDasharray="6 4" fill="none" />
              <Circle cx="55" cy="55" r="32" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1.5" fill="none" />
              <Circle cx="55" cy="18" r="5" fill="#60a5fa" />
              <Circle cx="88" cy="68" r="6" fill="#38bdf8" />
              <Circle cx="24" cy="74" r="5" fill="#818cf8" />
            </Svg>
          </Animated.View>
          <View style={styles.neuralHeaderWrap}>
            <Text style={styles.neuralHeaderTitle}>Emotional Synapse Active</Text>
            <Text style={styles.neuralHeaderSub}>
              Mapped from your choices, somatic signals & 2-min stay.
            </Text>
          </View>
        </View>

        {/* 3 Dynamic Metric Bars */}
        <View style={styles.metricsCard}>
          {/* Metric 1: Awareness */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabels}>
              <Text style={styles.metricName}>AWARENESS</Text>
              <Text style={styles.metricPercent}>{analyticsData.awarenessScore}%</Text>
            </View>
            <View style={styles.metricTrack}>
              <Animated.View
                style={[
                  styles.metricFill,
                  {
                    width: p7MetricAwareness.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#60a5fa',
                  },
                ]}
              />
            </View>
            <Text style={styles.metricDesc}>
              Clear identification of {selectedEmotion || 'emotion'} in the {selectedRegion || 'body'}.
            </Text>
          </View>

          {/* Metric 2: Staying Power */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabels}>
              <Text style={styles.metricName}>STAYING POWER</Text>
              <Text style={styles.metricPercent}>{analyticsData.stayingPowerScore}%</Text>
            </View>
            <View style={styles.metricTrack}>
              <Animated.View
                style={[
                  styles.metricFill,
                  {
                    width: p7MetricStay.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#34d399',
                  },
                ]}
              />
            </View>
            <Text style={styles.metricDesc}>
              Completed full 2-minute non-reactive observation.
            </Text>
          </View>

          {/* Metric 3: Response Space */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabels}>
              <Text style={styles.metricName}>RESPONSE SPACE</Text>
              <Text style={styles.metricPercent}>{analyticsData.responseSpaceScore}%</Text>
            </View>
            <View style={styles.metricTrack}>
              <Animated.View
                style={[
                  styles.metricFill,
                  {
                    width: p7MetricResponse.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#a78bfa',
                  },
                ]}
              />
            </View>
            <Text style={styles.metricDesc}>
              Conscious hesitation created between impulse and reaction.
            </Text>
          </View>
        </View>

        {/* Personalized Pattern Insight */}
        <View style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Feather name="compass" size={16} color="#60a5fa" />
            <Text style={styles.patternHeaderTitle}>YOUR PATTERN</Text>
          </View>
          <Text style={styles.patternArchetype}>{analyticsData.patternTitle}</Text>
          <Text style={styles.patternSummaryText}>{analyticsData.patternSummary}</Text>
        </View>

        {/* Reflect CTA */}
        <View style={styles.pageBottomBtnWrap}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => transitionToPage(8)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Reflect</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAGE 8 — RELEASE & COMPLETE
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPage8ReleaseComplete = () => {
    const isReadyToClaim = reflectionText.trim().length >= 3;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollPageContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Calming Tranquil Header */}
          <Animated.View style={[styles.p8Header, { opacity: p8CalmFade }]}>
            <Text style={styles.p8Title}>You Stayed</Text>
            <Text style={styles.p8Sub}>
              The discomfort was allowed to exist without taking over.
            </Text>
          </Animated.View>

          {/* 3 Sequential Animated Statements */}
          <View style={styles.statementsContainer}>
            <Animated.View style={[styles.statementRow, { opacity: p8Statement1Fade }]}>
              <View style={styles.statementCheck}>
                <Feather name="check" size={14} color="#34d399" />
              </View>
              <Text style={styles.statementText}>I noticed it.</Text>
            </Animated.View>

            <Animated.View style={[styles.statementRow, { opacity: p8Statement2Fade }]}>
              <View style={styles.statementCheck}>
                <Feather name="check" size={14} color="#34d399" />
              </View>
              <Text style={styles.statementText}>I stayed with it.</Text>
            </Animated.View>

            <Animated.View style={[styles.statementRow, { opacity: p8Statement3Fade }]}>
              <View style={styles.statementCheck}>
                <Feather name="check" size={14} color="#34d399" />
              </View>
              <Text style={styles.statementText}>I chose my response.</Text>
            </Animated.View>
          </View>

          {/* Mandatory Reflection Box */}
          <View style={styles.reflectionCard}>
            <Text style={styles.reflectionPrompt}>
              What did you learn about sitting with discomfort?
            </Text>
            <TextInput
              style={styles.reflectionInput}
              placeholder="Write one thing you noticed…"
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={reflectionText}
              onChangeText={setReflectionText}
            />
            <Text style={styles.charCount}>
              {reflectionText.trim().length} characters (required)
            </Text>
          </View>

          {/* Awareness Complete Banner & Points Animate */}
          {isReadyToClaim && (
            <Animated.View
              style={[
                styles.completionMedallion,
                { transform: [{ scale: p8PointsScale }] },
              ]}
            >
              <Text style={styles.completionSubTitle}>Awareness Complete</Text>
              <View style={styles.pointsHighlightPill}>
                <MaterialCommunityIcons name="trophy-award" size={24} color="#fbbf24" />
                <Text style={styles.pointsHighlightNumber}>+{pointsDisplay} Points</Text>
              </View>
              <Text style={styles.p8Quote}>
                “Discomfort doesn't always need to disappear.{'\n'}Sometimes it only needs to be noticed.”
              </Text>
            </Animated.View>
          )}

          {/* Error Banner */}
          {claimError && (
            <View style={styles.claimErrorBox}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <Text style={styles.claimErrorText}>{claimError}</Text>
            </View>
          )}

          {/* Final Submit Button */}
          <View style={styles.pageBottomBtnWrap}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (!isReadyToClaim || isSubmitting || hasClaimed) && styles.btnDisabled,
              ]}
              onPress={handleCompleteTask}
              disabled={!isReadyToClaim || isSubmitting || hasClaimed}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  isReadyToClaim && !isSubmitting && !hasClaimed
                    ? ['#2563eb', '#1d4ed8']
                    : ['#334155', '#1e293b']
                }
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {hasClaimed ? 'Completed' : 'Complete Task'}
                    </Text>
                    <Feather name="check" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />

      {/* Deep Navy / Charcoal Wellness Gradient Background */}
      <LinearGradient
        colors={['#070a13', '#0d1424', '#080d19', '#050810']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Moving Particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {AMBIENT_PARTICLES.map((p) => (
          <View
            key={p.id}
            style={[
              styles.ambientParticle,
              {
                left: `${p.startX}%`,
                top: `${p.startY}%`,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                opacity: p.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* Safe Area View */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Navigation */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Stage Tracker Pill: STAGE X OF 8 */}
          <View style={styles.stageIndicator}>
            <Text style={styles.stageIndicatorText}>STAGE {currentPage} OF 8</Text>
            <View style={styles.stageTrack}>
              <View
                style={[
                  styles.stageFill,
                  { width: `${(currentPage / 8) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Right Header Action (Pause on page 5/6) */}
          {(currentPage === 5 || currentPage === 6) ? (
            <TouchableOpacity
              style={styles.headerPauseBtn}
              onPress={() => {
                setIsStayPaused(true);
                setIsUrgePaused(true);
                setIsPauseModalVisible(true);
              }}
            >
              <Feather name="pause" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Dynamic Page Container */}
        <Animated.View
          style={[
            styles.pageAnimatedWrapper,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {currentPage === 1 && renderPage1Arrive()}
          {currentPage === 2 && renderPage2ChooseMoment()}
          {currentPage === 3 && renderPage3NameFeeling()}
          {currentPage === 4 && renderPage4FindInBody()}
          {currentPage === 5 && renderPage5TheStay()}
          {currentPage === 6 && renderPage6TheUrge()}
          {currentPage === 7 && renderPage7Understand()}
          {currentPage === 8 && renderPage8ReleaseComplete()}
        </Animated.View>
      </SafeAreaView>

      {/* Pause / Exit Safety Modal */}
      <Modal
        visible={isPauseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsPauseModalVisible(false);
          setIsStayPaused(false);
          setIsUrgePaused(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Feather name="pause" size={28} color="#60a5fa" />
            </View>
            <Text style={styles.modalTitle}>Challenge Paused</Text>
            <Text style={styles.modalDesc}>
              Take a breath. You can resume observing whenever you're ready, or exit safely without penalty.
            </Text>

            <TouchableOpacity
              style={styles.modalResumeBtn}
              onPress={() => {
                setIsPauseModalVisible(false);
                setIsStayPaused(false);
                setIsUrgePaused(false);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.btnGradient}
              >
                <Text style={styles.primaryBtnText}>Resume</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalExitBtn}
              onPress={handleExitSafely}
              activeOpacity={0.7}
            >
              <Text style={styles.modalExitBtnText}>Exit Challenge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── STYLESHEET ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  safeArea: {
    flex: 1,
  },
  ambientParticle: {
    position: 'absolute',
    backgroundColor: '#60a5fa',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageIndicator: {
    alignItems: 'center',
  },
  stageIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  stageTrack: {
    width: 100,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  stageFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  pageAnimatedWrapper: {
    flex: 1,
  },
  scrollPageContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
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
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  pageBottomBtnWrap: {
    width: '100%',
    marginTop: 24,
  },

  // ── PAGE 1 STYLES
  p1Container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  p1SphereWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SCREEN_HEIGHT * 0.05,
    height: 180,
  },
  p1SphereGlowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  p1SphereCore: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  p1SphereGradient: {
    flex: 1,
  },
  p1TextBlock: {
    alignItems: 'center',
  },
  p1Title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  p1IntroText: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  p1SubIntroText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  safetyBoxText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 16,
  },
  p1BtnWrap: {
    width: '100%',
  },

  // ── PAGE 2 STYLES (WHEEL)
  wheelContainer: {
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_WIDTH * 0.88,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  wheelCenterHub: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  wheelCenterHubActive: {
    borderColor: '#60a5fa',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.6,
  },
  wheelCenterGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  wheelCenterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  wheelNode: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  wheelNodeSelected: {
    backgroundColor: '#1e3a8a',
    borderColor: '#60a5fa',
    transform: [{ scale: 1.1 }],
  },
  wheelNodeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 2,
  },
  wheelNodeLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  inputCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // ── PAGE 3 STYLES (CONSTELLATION)
  p3Container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  constellationCanvas: {
    flex: 1,
    position: 'relative',
    marginVertical: 10,
  },
  emotionNode: {
    position: 'absolute',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emotionNodeGradient: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 6,
  },
  emotionNodeSelected: {
    transform: [{ scale: 1.15 }],
    shadowOpacity: 0.8,
  },
  emotionNodeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
  },
  emotionNodeTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  intensityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  intensityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  intensityBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  intensityBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60a5fa',
  },
  intensitySliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityPip: {
    width: 26,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityPipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
  },
  intensityPipSelected: {
    backgroundColor: '#3b82f6',
    transform: [{ scale: 1.15 }],
  },
  intensityPipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  intensityPipTextActive: {
    color: '#ffffff',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  intensityLow: {
    fontSize: 11,
    color: '#94a3b8',
  },
  intensityHigh: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '600',
  },

  // ── PAGE 4 STYLES (BODY MAP)
  bodyMapWrapper: {
    width: 300,
    height: 400,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  bodyHotspot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bodyHotspotSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#60a5fa',
    borderWidth: 2,
  },
  hotspotInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#60a5fa',
  },
  hotspotInnerCircleSelected: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#38bdf8',
  },
  hotspotLabel: {
    position: 'absolute',
    bottom: -18,
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  hotspotLabelSelected: {
    color: '#60a5fa',
  },
  regionInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  regionInfoText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
    lineHeight: 18,
  },
  sensationSection: {
    width: '100%',
    marginTop: 20,
  },
  sensationQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  sensationChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sensationChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sensationChipSelected: {
    backgroundColor: '#1d4ed8',
    borderColor: '#60a5fa',
  },
  sensationChipText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  sensationChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // ── PAGE 5 STYLES (THE STAY)
  p5Container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  p5Header: {
    alignItems: 'center',
    marginTop: 10,
  },
  p5Title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  p5Sub1: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  p5Sub2: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  p5OrbCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_HEIGHT * 0.4,
  },
  p5BreathHalo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  p5BreathOrb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 12,
  },
  p5OrbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  p5TimerDigits: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  p5TimerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  p5GuidanceContainer: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  p5GuidanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#93c5fd',
    textAlign: 'center',
    lineHeight: 24,
  },
  p5GuidanceTextMuted: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  p5Controls: {
    width: '100%',
  },
  p5ActiveRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  p5PauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  p5PauseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // ── PAGE 6 STYLES (THE URGE)
  p6Container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  p6TimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  p6TimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  p6TimerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#60a5fa',
    fontVariant: ['tabular-nums'],
  },
  p6TimerNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  p6WaveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  waveGraphicWrap: {
    width: '100%',
    alignItems: 'center',
  },
  urgePromptBox: {
    marginTop: 14,
    alignItems: 'center',
  },
  urgePromptQuestion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  urgePromptSituation: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  p6FlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  urgeChoicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  urgeChoiceBtn: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  choiceGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  reactBtnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f87171',
    marginTop: 6,
  },
  observeBtnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#60a5fa',
    marginTop: 6,
  },
  choiceBtnSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  urgeCompletedBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    gap: 6,
  },
  urgeCompletedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
  },
  urgeCompletedSub: {
    fontSize: 13,
    color: '#a7f3d0',
    textAlign: 'center',
  },
  p6PauseSubtleBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  p6PauseSubtleText: {
    fontSize: 13,
    color: '#64748b',
  },

  // ── PAGE 7 STYLES (UNDERSTAND)
  neuralVisualCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
    marginBottom: 16,
  },
  neuralOrb: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuralHeaderWrap: {
    flex: 1,
  },
  neuralHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  neuralHeaderSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },
  metricsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
    marginBottom: 16,
  },
  metricRow: {
    gap: 6,
  },
  metricLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 1,
  },
  metricPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  metricTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricDesc: {
    fontSize: 11,
    color: '#94a3b8',
  },
  patternCard: {
    width: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  patternHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 1.2,
  },
  patternArchetype: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  patternSummaryText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },

  // ── PAGE 8 STYLES (RELEASE & COMPLETE)
  p8Header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  p8Title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  p8Sub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  statementsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
    marginBottom: 16,
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statementCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statementText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  reflectionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  reflectionPrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    lineHeight: 20,
  },
  reflectionInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  charCount: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'right',
  },
  completionMedallion: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    marginBottom: 16,
  },
  completionSubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  pointsHighlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    marginBottom: 12,
  },
  pointsHighlightNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fbbf24',
  },
  p8Quote: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  claimErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  claimErrorText: {
    fontSize: 12,
    color: '#fca5a5',
    flex: 1,
  },

  // ── MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalResumeBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  modalExitBtn: {
    paddingVertical: 10,
  },
  modalExitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
