import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  Alert,
  AppState,
  ScrollView,
  Platform,
  DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 12 * 60; // 12 minutes (720 seconds)

export default function EvolutionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Flow steps:
  // 0 = Luxury Dashboard (Intro)
  // 1 = Evolution Gate (Butterfly flying)
  // 2 = Before vs Now (Split comparison)
  // 3 = Evolution Tree (3 leaf blooms)
  // 4 = Strength Mirror (Selection)
  // 5 = Silent Reflection (12-min meditative timer)
  // 6 = Final Celebration (Full blossom & certificate)
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2 - BEFORE VS NOW STATE
  const beforeOptions = [
    { label: 'Easily distracted', emoji: '😟' },
    { label: 'Shy', emoji: '😶' },
    { label: 'Overthinking', emoji: '😩' },
    { label: 'Unmotivated', emoji: '😴' },
    { label: 'Impatient', emoji: '😤' },
  ];

  const nowOptions = [
    { label: 'Calm', emoji: '😊' },
    { label: 'Confident', emoji: '💪' },
    { label: 'Consistent', emoji: '🌱' },
    { label: 'Kind', emoji: '❤️' },
    { label: 'Mindful', emoji: '🧘' },
  ];

  const [selectedBefore, setSelectedBefore] = useState<string | null>(null);
  const [selectedNow, setSelectedNow] = useState<string | null>(null);

  // STEP 3 - EVOLUTION TREE STATE
  const [mindsetChange, setMindsetChange] = useState('');
  const [habitChange, setHabitChange] = useState('');
  const [emotionChange, setEmotionChange] = useState('');
  const [activeLeafIdx, setActiveLeafIdx] = useState<number | null>(null);

  // STEP 4 - STRENGTH MIRROR STATE
  const strengthCards = [
    { label: 'Courage', emoji: '💪', color: '#F59E0B' },
    { label: 'Patience', emoji: '🧘', color: '#10B981' },
    { label: 'Compassion', emoji: '❤️', color: '#EC4899' },
    { label: 'Positivity', emoji: '🌞', color: '#FBBF24' },
    { label: 'Discipline', emoji: '🔥', color: '#EF4444' },
    { label: 'Calmness', emoji: '🌊', color: '#06B6D4' },
    { label: 'Consistency', emoji: '🌱', color: '#34D399' },
    { label: 'Self-Belief', emoji: '✨', color: '#A78BFA' },
  ];
  const [selectedStrength, setSelectedStrength] = useState<string | null>(null);

  // STEP 5 - SILENT REFLECTION TIMER STATE
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);

  const natureReminders = [
    '🌱 "Growth happens quietly."',
    '🦋 "Small changes become lifelong transformations."',
    '🌿 "Honor the person you\'re becoming."',
    '💚 "Progress is worth celebrating."',
    '✨ "Transformation is an inner journey."',
  ];

  // ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Screen 1 Flying Butterfly animation
  const butterflyX = useRef(new Animated.Value(-60)).current;
  const butterflyY = useRef(new Animated.Value(height * 0.4)).current;
  const butterflyScale = useRef(new Animated.Value(1)).current;

  // Screen 2 Split Transformation animation
  const transformGlow = useRef(new Animated.Value(0)).current;

  // Screen 3 Tree Leaves Bloom animations (3 main leaves)
  const leafBloomAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Screen 4 Mirror Shine animation
  const mirrorShine = useRef(new Animated.Value(0)).current;

  // Screen 5 Forest Floating Leaves & Ambient Butterflies
  const floatingLeaves = useRef(
    Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(-40),
      scale: Math.random() * 0.6 + 0.4,
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const ambientButterflyX = useRef(new Animated.Value(-50)).current;
  const ambientButterflyY = useRef(new Animated.Value(height * 0.5)).current;

  // Screen 6 Final Upward Butterflies
  const upwardButterflies = useRef(
    Array.from({ length: 8 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(height + 20),
      scale: Math.random() * 0.6 + 0.4,
      opacity: new Animated.Value(0),
    }))
  ).current;

  // AppState for background timer tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Fade in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Sync background timer updates on app resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 5 && isTimerActive && !isTimerPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            handleTimerComplete();
          }
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [step, isTimerActive, isTimerPaused]);

  // Step transitions handler
  const transitionToStep = (nextStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      if (nextStep === 1) {
        animateGateButterfly();
      } else if (nextStep === 5) {
        startFloatingLeaves();
        startAmbientButterfly();
      } else if (nextStep === 6) {
        triggerFinalUpwardButterflies();
      }
    });
  };

  // SCREEN 1 - BUTTERFLY FLYING ANIMATION
  const animateGateButterfly = () => {
    butterflyX.setValue(-60);
    butterflyY.setValue(height * 0.45);
    butterflyScale.setValue(0.8);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(butterflyX, { toValue: width * 0.4, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(butterflyY, { toValue: height * 0.35, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(butterflyScale, { toValue: 1.2, duration: 2500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(butterflyX, { toValue: width + 80, duration: 2500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(butterflyY, { toValue: height * 0.25, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(butterflyScale, { toValue: 0.9, duration: 2500, useNativeDriver: true }),
      ]),
    ]).start();
  };

  // SCREEN 2 - BEFORE VS NOW SAVE & ANIMATION
  const handleSaveBeforeNow = async () => {
    if (!selectedBefore || !selectedNow) {
      Alert.alert('Selection Required', 'Please choose one option for both "Before" and "Now".');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(transformGlow, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch('/api/tasks/evolution/save-before-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Write 3 Internal Changes',
          before: selectedBefore,
          now: selectedNow,
        }),
      });

      if (res.ok) {
        setTimeout(() => transitionToStep(3), 800);
      } else {
        Alert.alert('Save Error', 'Could not save selections. Please try again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // SCREEN 3 - TREE LEAF BLOOM & SAVE
  const triggerLeafBloom = (index: number) => {
    Animated.spring(leafBloomAnims[index], { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const handleSaveTreeChanges = async () => {
    if (mindsetChange.trim().length < 5 || habitChange.trim().length < 5 || emotionChange.trim().length < 5) {
      Alert.alert('Incomplete Reflections', 'Please write a brief response (at least 5 chars) for all three internal changes.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch('/api/tasks/evolution/save-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Write 3 Internal Changes',
          mindset_change: mindsetChange,
          habit_change: habitChange,
          emotion_change: emotionChange,
        }),
      });

      if (res.ok) {
        transitionToStep(4);
      } else {
        Alert.alert('Save Error', 'Unable to save responses. Please try again.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // SCREEN 4 - STRENGTH MIRROR SELECTION & SAVE
  const handleSelectStrength = (strengthName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStrength(strengthName);
    mirrorShine.setValue(0);
    Animated.sequence([
      Animated.timing(mirrorShine, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(mirrorShine, { toValue: 0.3, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleSaveStrength = async () => {
    if (!selectedStrength) {
      Alert.alert('Selection Required', 'Please select one personal strength that has grown the most.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch('/api/tasks/evolution/save-strength', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Write 3 Internal Changes',
          strength: selectedStrength,
        }),
      });

      if (res.ok) {
        transitionToStep(5);
      } else {
        Alert.alert('Save Error', 'Could not save strength selection.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // SCREEN 5 - SILENT REFLECTION TIMER
  const startFloatingLeaves = () => {
    floatingLeaves.forEach((leaf) => {
      leaf.y.setValue(-40);
      leaf.opacity.setValue(0);
      leaf.rotation.setValue(0);
      const duration = Math.random() * 8000 + 5000;
      const delay = Math.random() * 4000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(leaf.y, { toValue: height + 40, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(leaf.rotation, { toValue: 360, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(leaf.opacity, { toValue: Math.random() * 0.7 + 0.3, duration: duration * 0.2, useNativeDriver: true }),
              Animated.timing(leaf.opacity, { toValue: 0, duration: duration * 0.8, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  const startAmbientButterfly = () => {
    ambientButterflyX.setValue(-50);
    ambientButterflyY.setValue(height * 0.5);

    Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.parallel([
          Animated.timing(ambientButterflyX, { toValue: width + 60, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(ambientButterflyY, { toValue: height * 0.3, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.timing(ambientButterflyX, { toValue: -60, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next > 0 && next % 144 === 0) {
            setCurrentReminderIdx((idx) => (idx + 1) % natureReminders.length);
          }
          if (next <= 0) {
            clearInterval(interval);
            handleTimerComplete();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isTimerPaused, timeLeft]);

  const handleStartTimer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsTimerActive(true);
    endTimeRef.current = Date.now() + timeLeft * 1000;
  };

  const handlePauseTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTimerPaused(!isTimerPaused);
    if (isTimerPaused) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    transitionToStep(6);
  };

  const devSkipTimer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeLeft(5);
    endTimeRef.current = Date.now() + 5000;
  };

  // SCREEN 6 - FINAL CELEBRATION
  const triggerFinalUpwardButterflies = () => {
    upwardButterflies.forEach((b) => {
      b.y.setValue(height + 20);
      b.opacity.setValue(0);
      const duration = Math.random() * 5000 + 3000;
      const delay = Math.random() * 2000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(b.y, { toValue: -60, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(b.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(b.opacity, { toValue: 0, duration: duration - 400, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  const handleCompleteTask = async () => {
    setIsLoading(true);
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ task_name: 'Write 3 Internal Changes' }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.points_rewarded?.toString() || '300',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      router.replace({
        pathname: '/task-success',
        params: { points: pointsData.pointsAdded, totalPoints: pointsData.totalPoints, streak: pointsData.streak },
      } as any);
    }
  };

  const handleStartTask = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      await apiFetch('/api/tasks/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task_name: 'Write 3 Internal Changes' }),
      });
      transitionToStep(1);
    } catch (err) {
      transitionToStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // BACKGROUND PALETTE RENDERER
  const renderBackground = () => {
    if (step === 5) {
      // Peaceful Forest Clearing
      return (
        <LinearGradient
          colors={['#042F2E', '#064E3B', '#0F766E']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    if (step === 6) {
      // Transformation Sunlight
      return (
        <LinearGradient
          colors={['#0F766E', '#14B8A6', '#047857']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    // Default Personal Evolution Lab palette (Emerald/Turquoise/Dark Green)
    return (
      <LinearGradient
        colors={['#022C22', '#064E3B', '#0F766E']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    );
  };

  // Tree leaf positioning array
  const treeLeafPositions: { left: DimensionValue; top: DimensionValue }[] = [
    { left: '28%', top: '22%' }, // Left Leaf
    { left: '46%', top: '14%' }, // Center Top Leaf
    { left: '64%', top: '22%' }, // Right Leaf
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}

      {/* Screen 1 Gate Flying Butterfly */}
      {step === 1 && (
        <Animated.View
          style={[
            styles.flyingButterfly,
            {
              transform: [
                { translateX: butterflyX },
                { translateY: butterflyY },
                { scale: butterflyScale },
              ],
            },
          ]}
        >
          <Text style={styles.butterflyEmoji}>🦋</Text>
        </Animated.View>
      )}

      {/* Screen 5 Floating Leaves */}
      {step === 5 &&
        floatingLeaves.map((leaf, idx) => (
          <Animated.View
            key={`leaf-${idx}`}
            style={[
              styles.floatingLeaf,
              {
                left: leaf.x,
                transform: [
                  { translateY: leaf.y },
                  { scale: leaf.scale },
                  {
                    rotate: leaf.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: leaf.opacity,
              },
            ]}
          >
            <Text style={styles.leafEmojiText}>🍃</Text>
          </Animated.View>
        ))}

      {/* Screen 5 Ambient Butterfly */}
      {step === 5 && (
        <Animated.View
          style={[
            styles.flyingButterfly,
            {
              transform: [
                { translateX: ambientButterflyX },
                { translateY: ambientButterflyY },
              ],
            },
          ]}
        >
          <Text style={styles.butterflyEmoji}>🦋</Text>
        </Animated.View>
      )}

      {/* Screen 6 Upward Flying Butterflies */}
      {step === 6 &&
        upwardButterflies.map((b, idx) => (
          <Animated.View
            key={`up-b-${idx}`}
            style={[
              styles.flyingButterfly,
              {
                left: b.x,
                transform: [{ translateY: b.y }, { scale: b.scale }],
                opacity: b.opacity,
              },
            ]}
          >
            <Text style={styles.butterflyEmoji}>🦋</Text>
          </Animated.View>
        ))}

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={[styles.hudHeader, { marginTop: insets.top > 0 ? 0 : 10 }]}>
          {step > 0 && step < 6 ? (
            <TouchableOpacity
              onPress={() => {
                if (step === 5) {
                  Alert.alert('Abort Session', 'Are you sure you want to stop this personal evolution task?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Abort', style: 'destructive', onPress: () => router.back() },
                  ]);
                } else {
                  transitionToStep(step - 1);
                }
              }}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={24} color="#FFF" />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          ) : (
            step === 0 && (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Feather name="x" size={20} color="#A7F3D0" />
                <Text style={styles.backText}>ABORT</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                step === 6 && { backgroundColor: '#FBBF24', shadowColor: '#FBBF24' },
              ]}
            />
            <Text style={styles.statusText}>
              {step === 0
                ? 'EVOLUTION LAB'
                : step === 6
                ? 'EVOLVED'
                : `STAGE.0${step}`}
            </Text>
          </View>

          {step === 5 && (
            <TouchableOpacity onPress={devSkipTimer} activeOpacity={0.8} style={styles.devSkipBtn}>
              <Feather name="chevrons-right" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View style={[styles.stepWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* ======================================================== */}
          {/* STEP 0 - LUXURY DASHBOARD (TASK DETAIL PAGE)             */}
          {/* ======================================================== */}
          {step === 0 && (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.dashboardIllustrationWrap}>
                <View style={styles.butterflyHalo}>
                  <Text style={styles.largeButterflyEmoji}>🦋</Text>
                </View>
              </View>

              <View style={styles.dashboardGlassCard}>
                <Text style={styles.dashboardKicker}>⭐⭐⭐ HARD PERSONAL GROWTH</Text>
                <Text style={styles.dashboardTitle}>Write 3 Internal Changes</Text>
                <View style={styles.dashboardBadgesRow}>
                  <View style={styles.dashBadge}>
                    <Feather name="clock" size={14} color="#A7F3D0" />
                    <Text style={styles.dashBadgeText}>12 Mins</Text>
                  </View>
                  <View style={styles.dashBadge}>
                    <Feather name="award" size={14} color="#A7F3D0" />
                    <Text style={styles.dashBadgeText}>+300 Points</Text>
                  </View>
                </View>
                <Text style={styles.dashboardDescription}>
                  Real growth often happens quietly. Discover three internal shifts in your thoughts, habits, or emotions.
                </Text>
              </View>

              <View style={styles.growthProgressRingWrap}>
                <View style={styles.growthRingOuter}>
                  <LinearGradient
                    colors={['#14B8A6', '#A7F3D0']}
                    style={styles.growthRingGradient}
                  >
                    <View style={styles.growthRingInner}>
                      <Text style={styles.growthRingText}>3</Text>
                      <Text style={styles.growthRingLabel}>SHIFTS WITHIN</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>
                  "You don't become someone new overnight. You become someone stronger every day."
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStartTask}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#14B8A6', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>ENTER EVOLUTION LAB</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* SCREEN 1 — EVOLUTION GATE                                */}
          {/* ======================================================== */}
          {step === 1 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.centerGateContent}>
                <View style={styles.cocoonSunlightWrap}>
                  <LinearGradient
                    colors={['rgba(167,243,208,0.2)', 'rgba(20,184,166,0.1)']}
                    style={styles.cocoonGlow}
                  >
                    <Text style={styles.cocoonEmoji}>🌿</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.gateTitle}>Growth isn't always visible until you look back.</Text>
                <Text style={styles.gateSubtext}>
                  "Today, you'll discover how you've changed from within."
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(2)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#A7F3D0', '#14B8A6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={[styles.actionBtnText, { color: '#022C22' }]}>🦋 Enter Evolution Lab</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2 — BEFORE VS NOW                                 */}
          {/* ======================================================== */}
          {step === 2 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>TRANSFORMATION COMPASS</Text>
                <Text style={styles.stepTitle}>Before vs Now</Text>
              </View>

              <ScrollView contentContainerStyle={styles.splitCardsContainer} showsVerticalScrollIndicator={false}>
                {/* Left Card: Before */}
                <View style={styles.splitCardLeft}>
                  <Text style={styles.splitCardHeaderTitle}>BEFORE</Text>
                  <Text style={styles.splitPrompt}>What describes the old you?</Text>
                  <View style={styles.optionsList}>
                    {beforeOptions.map((opt, idx) => {
                      const isPicked = selectedBefore === opt.label;
                      return (
                        <TouchableOpacity
                          key={`before-${idx}`}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedBefore(opt.label);
                          }}
                          style={[styles.optionChip, isPicked && styles.optionChipBeforePicked]}
                        >
                          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.optionLabel, isPicked && styles.optionLabelPicked]}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Right Card: Now */}
                <View style={styles.splitCardRight}>
                  <Text style={styles.splitCardHeaderTitle}>NOW</Text>
                  <Text style={styles.splitPrompt}>How are you changing?</Text>
                  <View style={styles.optionsList}>
                    {nowOptions.map((opt, idx) => {
                      const isPicked = selectedNow === opt.label;
                      return (
                        <TouchableOpacity
                          key={`now-${idx}`}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedNow(opt.label);
                          }}
                          style={[styles.optionChip, isPicked && styles.optionChipNowPicked]}
                        >
                          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.optionLabel, isPicked && styles.optionLabelPicked]}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveBeforeNow}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#14B8A6', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>TRANSFORM PROTOCOL</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3 — EVOLUTION TREE                                */}
          {/* ======================================================== */}
          {step === 3 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>INTERNAL SHIFTS</Text>
                <Text style={styles.stepTitle}>The Evolution Tree</Text>
              </View>

              <ScrollView contentContainerStyle={styles.treeSectionContent} showsVerticalScrollIndicator={false}>
                {/* Visual Tree */}
                <View style={styles.evolutionTreeCanvas}>
                  <View style={styles.evolutionTrunk} />
                  {/* 3 Blooming Leaf Nodes */}
                  {[mindsetChange, habitChange, emotionChange].map((ans, idx) => {
                    const isBloomed = ans.trim().length >= 5;
                    const scaleVal = leafBloomAnims[idx];

                    return (
                      <Animated.View
                        key={`leaf-node-${idx}`}
                        style={[
                          styles.treeLeafNode,
                          treeLeafPositions[idx],
                          {
                            transform: [{ scale: isBloomed ? scaleVal : 1 }],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={isBloomed ? ['#A7F3D0', '#14B8A6'] : ['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.2)']}
                          style={styles.leafNodeGradient}
                        >
                          <Text style={styles.leafNodeEmoji}>{isBloomed ? '🌿' : '🌱'}</Text>
                        </LinearGradient>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* 3 Change Inputs */}
                <View style={styles.leafInputsContainer}>
                  {/* Leaf 1: Mindset */}
                  <View style={styles.leafCard}>
                    <Text style={styles.leafCardTitle}>🍃 Leaf 1: Mindset Shift</Text>
                    <Text style={styles.leafCardQuestion}>"What mindset has changed?"</Text>
                    <TextInput
                      style={styles.leafTextInput}
                      placeholder="e.g. I stopped expecting perfection from myself..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={mindsetChange}
                      onChangeText={(txt) => {
                        setMindsetChange(txt);
                        if (txt.trim().length >= 5) triggerLeafBloom(0);
                      }}
                    />
                  </View>

                  {/* Leaf 2: Habit */}
                  <View style={styles.leafCard}>
                    <Text style={styles.leafCardTitle}>🍃 Leaf 2: Habit Improvement</Text>
                    <Text style={styles.leafCardQuestion}>"What habit has improved?"</Text>
                    <TextInput
                      style={styles.leafTextInput}
                      placeholder="e.g. I pause before checking my phone in the morning..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={habitChange}
                      onChangeText={(txt) => {
                        setHabitChange(txt);
                        if (txt.trim().length >= 5) triggerLeafBloom(1);
                      }}
                    />
                  </View>

                  {/* Leaf 3: Emotion */}
                  <View style={styles.leafCard}>
                    <Text style={styles.leafCardTitle}>🍃 Leaf 3: Emotional Growth</Text>
                    <Text style={styles.leafCardQuestion}>"What emotion do you handle better now?"</Text>
                    <TextInput
                      style={styles.leafTextInput}
                      placeholder="e.g. I stay calmer during frustrating moments..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={emotionChange}
                      onChangeText={(txt) => {
                        setEmotionChange(txt);
                        if (txt.trim().length >= 5) triggerLeafBloom(2);
                      }}
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveTreeChanges}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#14B8A6', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>BLOOM THE TREE</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4 — STRENGTH MIRROR                               */}
          {/* ======================================================== */}
          {step === 4 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>STRENGTH REFLECTION</Text>
                <Text style={styles.stepTitle}>The Strength Mirror</Text>
              </View>

              <View style={styles.mirrorContainer}>
                {/* Glowing Mirror Frame */}
                <Animated.View
                  style={[
                    styles.mirrorFrame,
                    {
                      borderColor: selectedStrength ? '#A7F3D0' : 'rgba(255,255,255,0.1)',
                      shadowOpacity: mirrorShine,
                    },
                  ]}
                >
                  <Text style={styles.mirrorQuestion}>
                    "Which strength do you believe has grown the most?"
                  </Text>
                  {selectedStrength && (
                    <Text style={styles.mirrorReflectedStrength}>
                      ✨ Reflected: {selectedStrength}
                    </Text>
                  )}
                </Animated.View>

                {/* 8 Cards Selection */}
                <View style={styles.strengthCardsGrid}>
                  {strengthCards.map((card, idx) => {
                    const isSelected = selectedStrength === card.label;

                    return (
                      <TouchableOpacity
                        key={`str-${idx}`}
                        onPress={() => handleSelectStrength(card.label)}
                        activeOpacity={0.8}
                        style={[
                          styles.strengthCard,
                          isSelected && styles.strengthCardSelected,
                        ]}
                      >
                        <Text style={styles.strengthEmoji}>{card.emoji}</Text>
                        <Text style={styles.strengthLabel}>{card.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveStrength}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#14B8A6', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>PROCEED TO SILENCE</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5 — SILENT REFLECTION                             */}
          {/* ======================================================== */}
          {step === 5 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>SILENT CLEARING</Text>
                <Text style={styles.stepTitle}>12 Minute Silent Reflection</Text>
              </View>

              <View style={styles.forestTimerScene}>
                {/* Timer Circle */}
                <View style={styles.forestTimerRing}>
                  <LinearGradient
                    colors={['rgba(167,243,208,0.15)', 'rgba(20,184,166,0.25)']}
                    style={styles.forestTimerGradient}
                  >
                    <Text style={styles.forestTimerDigits}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.forestTimerLabel}>MINDFUL DURATION</Text>
                  </LinearGradient>
                </View>

                {/* Rotating Nature Reminders */}
                <View style={styles.natureRemindersWrap}>
                  <Text style={styles.natureReminderText}>
                    {natureReminders[currentReminderIdx]}
                  </Text>
                </View>
              </View>

              <View style={styles.timerControls}>
                {isTimerActive ? (
                  <TouchableOpacity
                    onPress={handlePauseTimer}
                    activeOpacity={0.8}
                    style={styles.timerPauseBtn}
                  >
                    <Text style={styles.timerPauseText}>
                      {isTimerPaused ? 'CONTINUE' : 'PAUSE'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleStartTimer}
                    activeOpacity={0.9}
                    style={styles.actionBtnWrap}
                  >
                    <LinearGradient
                      colors={['#A7F3D0', '#14B8A6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionBtnText, { color: '#022C22' }]}>
                        🌿 BEGIN SILENT REFLECTION
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6 — FINAL CELEBRATION                             */}
          {/* ======================================================== */}
          {step === 6 && (
            <View style={styles.fullscreenStep}>
              <ScrollView contentContainerStyle={styles.celebrationScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.celebrationHeader}>
                  <Text style={styles.celebrationEmoji}>🦋</Text>
                  <Text style={styles.celebrationKicker}>EVOLUTION COMPLETE</Text>
                  <Text style={styles.celebrationTitle}>The strongest transformations happen inside.</Text>
                </View>

                {/* Certificate */}
                <View style={styles.evolutionCertCard}>
                  <View style={styles.certBorderInner}>
                    <Text style={styles.certBadgeKicker}>ANTISOCIAL EVOLUTION</Text>
                    <Text style={styles.certMainTitle}>Award of Personal Growth</Text>

                    <View style={styles.certButterflyBadge}>
                      <Text style={styles.badgeButterflyIcon}>🦋</Text>
                    </View>

                    <Text style={styles.certSummaryText}>
                      You recognized your shift from <Text style={{ color: '#A7F3D0', fontWeight: 'bold' }}>{selectedBefore || 'old self'}</Text> to <Text style={{ color: '#A7F3D0', fontWeight: 'bold' }}>{selectedNow || 'new self'}</Text> and bloomed three internal changes.
                    </Text>

                    {selectedStrength && (
                      <View style={styles.certStrengthPill}>
                        <Text style={styles.certStrengthPillText}>Primary Strength: {selectedStrength}</Text>
                      </View>
                    )}

                    <Text style={styles.certCompletionQuote}>"You evolved."</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCompleteTask}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.actionBtnWrap, { marginTop: 30 }]}
                >
                  <LinearGradient
                    colors={['#A7F3D0', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={[styles.actionBtnText, { color: '#022C22' }]}>
                      {isLoading ? 'UPDATING EVOLUTION...' : 'COMPLETE TASK (+600 PTS)'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
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
    backgroundColor: '#022C22',
  },
  safeArea: {
    flex: 1,
  },
  stepWrapper: {
    flex: 1,
  },
  fullscreenStep: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 50,
    zIndex: 100,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#14B8A6',
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  devSkipBtn: {
    padding: 6,
  },

  // AMBIENT ANIMATED ELEMENTS
  flyingButterfly: {
    position: 'absolute',
    zIndex: 99,
  },
  butterflyEmoji: {
    fontSize: 36,
  },
  floatingLeaf: {
    position: 'absolute',
    zIndex: 2,
  },
  leafEmojiText: {
    fontSize: 20,
  },

  // STEP 0 - DASHBOARD
  dashboardIllustrationWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  butterflyHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167,243,208,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14B8A6',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  largeButterflyEmoji: {
    fontSize: 54,
  },
  dashboardGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    marginBottom: 20,
  },
  dashboardKicker: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  dashboardTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  dashboardBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,184,166,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  dashBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  growthProgressRingWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  growthRingOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
  },
  growthRingGradient: {
    flex: 1,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#022C22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthRingText: {
    color: '#A7F3D0',
    fontSize: 32,
    fontWeight: '900',
  },
  growthRingLabel: {
    color: '#8A94A6',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  quoteCard: {
    backgroundColor: 'rgba(20,184,166,0.06)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.15)',
    marginVertical: 15,
  },
  quoteText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtnWrap: {
    width: '100%',
    shadowColor: '#14B8A6',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  actionBtnIcon: {
    marginLeft: 8,
  },

  // STEP 1 - EVOLUTION GATE
  centerGateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cocoonSunlightWrap: {
    marginBottom: 30,
  },
  cocoonGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cocoonEmoji: {
    fontSize: 48,
  },
  gateTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
  },
  gateSubtext: {
    color: '#A7F3D0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontStyle: 'italic',
  },

  // STEP 2 - BEFORE VS NOW
  stepHeaderSection: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  stepKicker: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  splitCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  splitCardLeft: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  splitCardRight: {
    flex: 1,
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    padding: 14,
  },
  splitCardHeaderTitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  splitPrompt: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
  },
  optionChipBeforePicked: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  optionChipNowPicked: {
    backgroundColor: 'rgba(167,243,208,0.2)',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  optionLabelPicked: {
    color: '#A7F3D0',
  },

  // STEP 3 - EVOLUTION TREE
  treeSectionContent: {
    paddingBottom: 20,
  },
  evolutionTreeCanvas: {
    height: 140,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 15,
  },
  evolutionTrunk: {
    width: 16,
    height: 70,
    backgroundColor: '#047857',
    borderRadius: 4,
  },
  treeLeafNode: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
  },
  leafNodeGradient: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafNodeEmoji: {
    fontSize: 22,
  },
  leafInputsContainer: {
    gap: 12,
  },
  leafCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  leafCardTitle: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  leafCardQuestion: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 10,
  },
  leafTextInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#FFF',
    padding: 12,
    fontSize: 13,
  },

  // STEP 4 - STRENGTH MIRROR
  mirrorContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 10,
  },
  mirrorFrame: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#A7F3D0',
    shadowRadius: 20,
  },
  mirrorQuestion: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mirrorReflectedStrength: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  strengthCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  strengthCard: {
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthCardSelected: {
    backgroundColor: 'rgba(20,184,166,0.25)',
    borderColor: '#A7F3D0',
  },
  strengthEmoji: {
    fontSize: 20,
  },
  strengthLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // STEP 5 - SILENT REFLECTION TIMER
  forestTimerScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  forestTimerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    padding: 4,
    backgroundColor: 'rgba(167,243,208,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forestTimerGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 106,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forestTimerDigits: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '300',
  },
  forestTimerLabel: {
    color: '#A7F3D0',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  natureRemindersWrap: {
    marginTop: 40,
    paddingHorizontal: 30,
    minHeight: 50,
    justifyContent: 'center',
  },
  natureReminderText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerControls: {
    width: '100%',
  },
  timerPauseBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  timerPauseText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  // STEP 6 - FINAL CELEBRATION
  celebrationScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginVertical: 15,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  celebrationKicker: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  celebrationTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  evolutionCertCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    padding: 6,
    marginVertical: 10,
  },
  certBorderInner: {
    borderWidth: 2,
    borderColor: 'rgba(167,243,208,0.2)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  certBadgeKicker: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  certMainTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  certButterflyBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  badgeButterflyIcon: {
    fontSize: 30,
  },
  certSummaryText: {
    color: '#D1D5DB',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  certStrengthPill: {
    backgroundColor: 'rgba(20,184,166,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#14B8A6',
  },
  certStrengthPillText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  certCompletionQuote: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
