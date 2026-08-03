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
  PanResponder,
  DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 10 * 60; // 10 minutes (600 seconds)

export default function CommitmentTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Flow steps:
  // 0 = Luxury Dashboard (Intro)
  // 1 = The Hall of Promises Gate
  // 2 = Habit Discovery (Selection)
  // 3 = Habit Contract & Digital Signature
  // 4 = Future Milestone Selection
  // 5 = 10-Minute Commitment Timer
  // 6 = Final Ceremony (Commitment Vault)
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2 - HABIT DISCOVERY STATE
  const habitTokens = [
    { label: 'Drink More Water', emoji: '💧' },
    { label: 'Read Daily', emoji: '📚' },
    { label: 'Exercise', emoji: '🏃' },
    { label: 'Meditation', emoji: '🧘' },
    { label: 'Better Sleep', emoji: '😴' },
    { label: 'Less Screen Time', emoji: '📵' },
    { label: 'Gratitude', emoji: '🙏' },
    { label: 'Journaling', emoji: '📖' },
    { label: 'Healthy Eating', emoji: '🌿' },
    { label: 'Custom Habit', emoji: '✨' },
  ];
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [customHabitText, setCustomHabitText] = useState('');

  // STEP 3 - CONTRACT & DIGITAL SIGNATURE STATE
  const [whyMatters, setWhyMatters] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [solution, setSolution] = useState('');
  const [isContractSealed, setIsContractSealed] = useState(false);

  // Touch signature drawing path points
  const [paths, setPaths] = useState<string[]>([]);
  const currentPathRef = useRef<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => [...prev, currentPathRef.current]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = currentPathRef.current;
          return updated;
        });
      },
    })
  ).current;

  const clearSignature = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths([]);
    currentPathRef.current = '';
  };

  // STEP 4 - MILESTONE STATE
  const milestoneOptions = [
    { days: 7, label: '7 Days', emoji: '📅' },
    { days: 14, label: '14 Days', emoji: '📅' },
    { days: 21, label: '21 Days', emoji: '📅' },
    { days: 30, label: '30 Days', emoji: '📅' },
  ];
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);

  // STEP 5 - TIMER STATE
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);

  const commitmentMessages = [
    '🌱 "Consistency creates transformation."',
    '📜 "A promise gains meaning through action."',
    '💛 "Small habits shape great lives."',
    '✨ "Your future begins with today\'s decision."',
    '🥇 "Show up, especially on difficult days."',
  ];

  // ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Scroll Unroll animation (Step 1)
  const scrollUnrollAnim = useRef(new Animated.Value(0)).current;

  // Wax Seal animation (Step 3)
  const waxSealAnim = useRef(new Animated.Value(0)).current;

  // Candle Flicker & Floating Dust (Step 5)
  const candleFlickerAnim = useRef(new Animated.Value(1)).current;

  const floatingDust = useRef(
    Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(height + 20),
      scale: Math.random() * 0.5 + 0.3,
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
        Animated.timing(scrollUnrollAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
      } else if (nextStep === 5) {
        startCandleFlicker();
        startFloatingDust();
      }
    });
  };

  // STEP 2 - SAVE HABIT SELECTION
  const handleSaveHabit = async () => {
    const habitToSave = selectedHabit === 'Custom Habit' ? customHabitText.trim() : selectedHabit;
    if (!habitToSave) {
      Alert.alert('Selection Required', 'Please select a habit token or type a custom habit.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/commitment/save-habit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Commit to Habit',
          habit: selectedHabit,
          custom_habit: selectedHabit === 'Custom Habit' ? customHabitText : undefined,
        }),
      });

      if (res.ok) {
        transitionToStep(3);
      } else {
        Alert.alert('Save Error', 'Could not save habit choice.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3 - SAVE CONTRACT & SIGNATURE
  const handleSealContract = async () => {
    if (whyMatters.trim().length < 5) {
      Alert.alert('Reflection Required', 'Please state why this habit matters to you.');
      return;
    }

    if (paths.length === 0) {
      Alert.alert('Signature Required', 'Please draw your digital signature on the parchment pad to sign your contract.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Wax seal stamp animation
    Animated.spring(waxSealAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start(() => {
      setIsContractSealed(true);
    });

    const signatureSvgData = paths.join(' ');

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/commitment/save-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Commit to Habit',
          why_matters: whyMatters,
          obstacle: obstacle,
          solution: solution,
          signature_svg: signatureSvgData,
        }),
      });

      if (res.ok) {
        setTimeout(() => transitionToStep(4), 1000);
      } else {
        Alert.alert('Save Error', 'Could not save contract details.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4 - SAVE MILESTONE
  const handleSaveMilestone = async () => {
    if (!selectedMilestone) {
      Alert.alert('Milestone Required', 'Please select a check-in milestone duration.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/commitment/save-milestone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Commit to Habit',
          milestone_days: selectedMilestone,
        }),
      });

      if (res.ok) {
        transitionToStep(5);
      } else {
        Alert.alert('Save Error', 'Could not save milestone selection.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 5 - TIMER & AMBIENT ANIMATIONS
  const startCandleFlicker = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(candleFlickerAnim, { toValue: 0.75, duration: 1300, useNativeDriver: true }),
        Animated.timing(candleFlickerAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(candleFlickerAnim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const startFloatingDust = () => {
    floatingDust.forEach((d) => {
      d.y.setValue(height + 20);
      d.opacity.setValue(0);
      const duration = Math.random() * 6000 + 4000;
      const delay = Math.random() * 3000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(d.y, { toValue: -40, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(d.opacity, { toValue: 0.7, duration: duration * 0.3, useNativeDriver: true }),
              Animated.timing(d.opacity, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next > 0 && next % 120 === 0) {
            setCurrentReminderIdx((idx) => (idx + 1) % commitmentMessages.length);
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

  // STEP 6 - FINAL COMPLETION API
  const handleCompleteTask = async () => {
    setIsLoading(true);
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ task_name: 'Commit to Habit' }),
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
      await fetch(`${API_BASE_URL}/api/tasks/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task_name: 'Commit to Habit' }),
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

  // BACKGROUND PALETTE RENDERER (Parchment Beige / Walnut Brown / Antique Gold)
  const renderBackground = () => {
    return (
      <LinearGradient
        colors={['#2A1810', '#4A2E1B', '#6D4C41']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}

      {/* Step 5 Ambient Floating Dust */}
      {step === 5 &&
        floatingDust.map((d, idx) => (
          <Animated.View
            key={`dust-${idx}`}
            style={[
              styles.floatingDust,
              {
                left: d.x,
                transform: [{ translateY: d.y }, { scale: d.scale }],
                opacity: d.opacity,
              },
            ]}
          >
            <Text style={styles.dustEmojiText}>✨</Text>
          </Animated.View>
        ))}

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={[styles.hudHeader, { marginTop: insets.top > 0 ? 0 : 10 }]}>
          {step > 0 && step < 6 ? (
            <TouchableOpacity
              onPress={() => {
                if (step === 5) {
                  Alert.alert('Abort Contract', 'Are you sure you want to stop this commitment session?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Abort', style: 'destructive', onPress: () => router.back() },
                  ]);
                } else {
                  transitionToStep(step - 1);
                }
              }}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={24} color="#F5E6C8" />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          ) : (
            step === 0 && (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Feather name="x" size={20} color="#F5E6C8" />
                <Text style={styles.backText}>ABORT</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                step === 6 && { backgroundColor: '#C9A227', shadowColor: '#C9A227' },
              ]}
            />
            <Text style={styles.statusText}>
              {step === 0
                ? 'HALL OF PROMISES'
                : step === 6
                ? 'LOCKED IN VAULT'
                : `CONTRACT.0${step}`}
            </Text>
          </View>

          {step === 5 && (
            <TouchableOpacity onPress={devSkipTimer} activeOpacity={0.8} style={styles.devSkipBtn}>
              <Feather name="chevrons-right" size={16} color="rgba(245,230,200,0.4)" />
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
                <View style={styles.scrollHalo}>
                  <Text style={styles.largeScrollEmoji}>📜</Text>
                </View>
              </View>

              <View style={styles.dashboardParchmentCard}>
                <Text style={styles.dashboardKicker}>⭐⭐⭐ HARD COMMITMENT</Text>
                <Text style={styles.dashboardTitle}>Commit to Habit</Text>
                <View style={styles.dashboardBadgesRow}>
                  <View style={styles.dashBadge}>
                    <Feather name="clock" size={14} color="#C9A227" />
                    <Text style={styles.dashBadgeText}>10 Mins</Text>
                  </View>
                  <View style={styles.dashBadge}>
                    <Feather name="award" size={14} color="#C9A227" />
                    <Text style={styles.dashBadgeText}>+300 Points</Text>
                  </View>
                </View>
                <Text style={styles.dashboardDescription}>
                  Real change happens when you keep showing up. Choose one habit you genuinely want to continue and make a commitment to your future self.
                </Text>
              </View>

              <View style={styles.waxSealBadgeWrap}>
                <View style={styles.waxSealBadgeCircle}>
                  <Text style={styles.waxSealEmoji}>🥇</Text>
                </View>
                <Text style={styles.waxSealBadgeText}>SEALED COMMITMENT</Text>
              </View>

              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>
                  "Motivation starts the journey. Commitment keeps it alive."
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStartTask}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#C9A227', '#8C6D1F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>UNROLL MY SCROLL</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* SCREEN 1 — THE HALL OF PROMISES                          */}
          {/* ======================================================== */}
          {step === 1 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.centerGateContent}>
                <Animated.View
                  style={[
                    styles.hallScrollWrap,
                    {
                      transform: [
                        {
                          scaleY: scrollUnrollAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#F5E6C8', '#E6D3B1']}
                    style={styles.hallScrollGradient}
                  >
                    <Text style={styles.hallScrollEmoji}>📜</Text>
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.gateTitle}>"One promise kept can change your future."</Text>
                <Text style={styles.gateSubtext}>
                  "Commit to the habit you want to carry forward."
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(2)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#C9A227', '#8C6D1F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>📜 Make My Commitment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2 — HABIT DISCOVERY                               */}
          {/* ======================================================== */}
          {step === 2 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>HABIT DISCOVERY</Text>
                <Text style={styles.stepTitle}>Select Your Promise</Text>
              </View>

              <ScrollView contentContainerStyle={styles.habitsGridContent} showsVerticalScrollIndicator={false}>
                <View style={styles.habitsGrid}>
                  {habitTokens.map((token, idx) => {
                    const isSelected = selectedHabit === token.label;
                    return (
                      <TouchableOpacity
                        key={`habit-${idx}`}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedHabit(token.label);
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.habitTokenCard,
                          isSelected && styles.habitTokenCardSelected,
                        ]}
                      >
                        <Text style={styles.habitEmoji}>{token.emoji}</Text>
                        <Text style={[styles.habitLabel, isSelected && styles.habitLabelSelected]}>
                          {token.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedHabit === 'Custom Habit' && (
                  <View style={styles.customHabitInputWrap}>
                    <Text style={styles.customHabitTitle}>Custom Habit Name:</Text>
                    <TextInput
                      style={styles.customHabitInput}
                      placeholder="e.g. 15 minutes of evening stretching..."
                      placeholderTextColor="rgba(245,230,200,0.4)"
                      value={customHabitText}
                      onChangeText={setCustomHabitText}
                    />
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveHabit}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#C9A227', '#8C6D1F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>DRAFT CONTRACT</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3 — HABIT CONTRACT & DIGITAL SIGNATURE            */}
          {/* ======================================================== */}
          {step === 3 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>PARCHMENT CONTRACT</Text>
                <Text style={styles.stepTitle}>Personal Commitment</Text>
              </View>

              <ScrollView contentContainerStyle={styles.contractScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.parchmentContractPaper}>
                  <Text style={styles.contractHeaderHeading}>CONTRACT OF CONTINUITY</Text>

                  {/* Field 1: Chosen Habit */}
                  <View style={styles.contractFieldGroup}>
                    <Text style={styles.contractFieldLabel}>My Chosen Habit:</Text>
                    <Text style={styles.contractFieldValueText}>
                      {selectedHabit === 'Custom Habit' ? customHabitText || 'Custom Habit' : selectedHabit}
                    </Text>
                  </View>

                  {/* Field 2: Why it matters */}
                  <View style={styles.contractFieldGroup}>
                    <Text style={styles.contractFieldLabel}>Why this habit matters to me:</Text>
                    <TextInput
                      style={styles.contractTextInput}
                      placeholder="e.g. It keeps me grounded and gives me energy..."
                      placeholderTextColor="#8C6D1F"
                      value={whyMatters}
                      onChangeText={setWhyMatters}
                    />
                  </View>

                  {/* Field 3: Expected Obstacle */}
                  <View style={styles.contractFieldGroup}>
                    <Text style={styles.contractFieldLabel}>One obstacle I expect:</Text>
                    <TextInput
                      style={styles.contractTextInput}
                      placeholder="e.g. Feeling tired after long work days..."
                      placeholderTextColor="#8C6D1F"
                      value={obstacle}
                      onChangeText={setObstacle}
                    />
                  </View>

                  {/* Field 4: Solution Strategy */}
                  <View style={styles.contractFieldGroup}>
                    <Text style={styles.contractFieldLabel}>How I will overcome it:</Text>
                    <TextInput
                      style={styles.contractTextInput}
                      placeholder="e.g. Starting with just 2 minutes if needed..."
                      placeholderTextColor="#8C6D1F"
                      value={solution}
                      onChangeText={setSolution}
                    />
                  </View>

                  <Text style={styles.contractPledgeText}>
                    "I commit to showing up, even on difficult days."
                  </Text>

                  {/* Digital Signature Drawing Canvas */}
                  <View style={styles.signatureSectionWrap}>
                    <View style={styles.signatureHeaderRow}>
                      <Text style={styles.signatureFieldLabel}>Digital Signature:</Text>
                      <TouchableOpacity onPress={clearSignature}>
                        <Text style={styles.clearSigText}>Clear</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.signatureCanvasFrame} {...panResponder.panHandlers}>
                      <Svg style={StyleSheet.absoluteFill}>
                        {paths.map((p, i) => (
                          <Path key={`path-${i}`} d={p} stroke="#6D4C41" strokeWidth={3} fill="none" />
                        ))}
                      </Svg>
                      {paths.length === 0 && (
                        <Text style={styles.signatureWatermark}>Draw signature with finger here</Text>
                      )}
                    </View>
                  </View>
                </View>

                {isContractSealed && (
                  <Animated.View style={[styles.waxSealView, { transform: [{ scale: waxSealAnim }] }]}>
                    <Text style={styles.waxSealIcon}>🥇</Text>
                    <Text style={styles.waxSealLabel}>SEALED WITH GOLDEN WAX</Text>
                  </Animated.View>
                )}
              </ScrollView>

              <TouchableOpacity
                onPress={handleSealContract}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#C9A227', '#8C6D1F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>SEAL CONTRACT WITH WAX</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4 — FUTURE MILESTONE                              */}
          {/* ======================================================== */}
          {step === 4 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>FUTURE CHECK-IN</Text>
                <Text style={styles.stepTitle}>Calendar Milestone</Text>
                <Text style={styles.stepSubtitle}>"When will you check back on this commitment?"</Text>
              </View>

              <View style={styles.milestoneGridContainer}>
                {milestoneOptions.map((opt, idx) => {
                  const isSelected = selectedMilestone === opt.days;
                  return (
                    <TouchableOpacity
                      key={`m-${idx}`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedMilestone(opt.days);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.milestoneCard,
                        isSelected && styles.milestoneCardSelected,
                      ]}
                    >
                      <Text style={styles.milestoneEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.milestoneLabel, isSelected && styles.milestoneLabelSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={handleSaveMilestone}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#C9A227', '#8C6D1F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>ENTER CANDLELIT STUDY</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5 — COMMITMENT TIMER                              */}
          {/* ======================================================== */}
          {step === 5 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>CANDLELIT STUDY</Text>
                <Text style={styles.stepTitle}>10 Minute Commitment</Text>
              </View>

              <View style={styles.studyTimerScene}>
                <Animated.View style={[styles.candleLightWrap, { opacity: candleFlickerAnim }]}>
                  <Text style={styles.candleEmoji}>🕯️</Text>
                </Animated.View>

                {/* Timer Ring */}
                <View style={styles.studyTimerRing}>
                  <LinearGradient
                    colors={['rgba(245,230,200,0.15)', 'rgba(201,162,39,0.3)']}
                    style={styles.studyTimerGradient}
                  >
                    <Text style={styles.studyTimerDigits}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.studyTimerLabel}>HONORING PROMISE</Text>
                  </LinearGradient>
                </View>

                {/* Rotating Reminders */}
                <View style={styles.commitmentMessagesWrap}>
                  <Text style={styles.commitmentMessageText}>
                    {commitmentMessages[currentReminderIdx]}
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
                      colors={['#C9A227', '#8C6D1F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionBtnText}>
                        📜 BEGIN 10-MIN COMMITMENT
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6 — FINAL CEREMONY                                */}
          {/* ======================================================== */}
          {step === 6 && (
            <View style={styles.fullscreenStep}>
              <ScrollView contentContainerStyle={styles.celebrationScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.celebrationHeader}>
                  <Text style={styles.celebrationEmoji}>🏆</Text>
                  <Text style={styles.celebrationKicker}>COMMITMENT LOCKED</Text>
                  <Text style={styles.celebrationTitle}>"The promise is made. Now let your actions honor it."</Text>
                </View>

                {/* Commitment Vault Certificate */}
                <View style={styles.vaultCertCard}>
                  <View style={styles.certInnerBorder}>
                    <Text style={styles.certKicker}>COMMITMENT VAULT</Text>
                    <Text style={styles.certTitle}>Sealed Contract of Continuity</Text>

                    <View style={styles.certRibbonBadge}>
                      <Text style={styles.badgeRibbonIcon}>🥇</Text>
                    </View>

                    <Text style={styles.certHabitTitle}>
                      Habit: <Text style={{ color: '#C9A227', fontWeight: 'bold' }}>{selectedHabit === 'Custom Habit' ? customHabitText : selectedHabit}</Text>
                    </Text>

                    <Text style={styles.certMilestoneSub}>
                      Check-in Milestone: {selectedMilestone} Days
                    </Text>

                    <Text style={styles.certCompletionMessage}>"You chose continuity."</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCompleteTask}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.actionBtnWrap, { marginTop: 30 }]}
                >
                  <LinearGradient
                    colors={['#C9A227', '#8C6D1F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionBtnText}>
                      {isLoading ? 'LOCKING IN VAULT...' : 'COMPLETE TASK (+300 PTS)'}
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
    backgroundColor: '#2A1810',
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
    color: '#F5E6C8',
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
    borderColor: 'rgba(201,162,39,0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A227',
    marginRight: 8,
  },
  statusText: {
    color: '#F5E6C8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  devSkipBtn: {
    padding: 6,
  },

  // AMBIENT PARTICLES
  floatingDust: {
    position: 'absolute',
    zIndex: 2,
  },
  dustEmojiText: {
    fontSize: 14,
  },

  // STEP 0 - DASHBOARD
  dashboardIllustrationWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  scrollHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,162,39,0.15)',
    borderWidth: 1,
    borderColor: '#C9A227',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A227',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  largeScrollEmoji: {
    fontSize: 54,
  },
  dashboardParchmentCard: {
    backgroundColor: 'rgba(245,230,200,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.2)',
    padding: 24,
    marginBottom: 20,
  },
  dashboardKicker: {
    color: '#C9A227',
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
    backgroundColor: 'rgba(201,162,39,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  dashBadgeText: {
    color: '#F5E6C8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardDescription: {
    color: '#E6D3B1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  waxSealBadgeWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  waxSealBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C9A227',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  waxSealEmoji: {
    fontSize: 30,
  },
  waxSealBadgeText: {
    color: '#F5E6C8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  quoteCard: {
    backgroundColor: 'rgba(201,162,39,0.06)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.2)',
    marginVertical: 15,
  },
  quoteText: {
    color: '#F5E6C8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtnWrap: {
    width: '100%',
    shadowColor: '#C9A227',
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

  // STEP 1 - HALL OF PROMISES
  centerGateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  hallScrollWrap: {
    width: 120,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
  },
  hallScrollGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C9A227',
    borderRadius: 20,
  },
  hallScrollEmoji: {
    fontSize: 54,
  },
  gateTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
  },
  gateSubtext: {
    color: '#F5E6C8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontStyle: 'italic',
  },

  // STEP 2 - HABIT DISCOVERY
  stepHeaderSection: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  stepKicker: {
    color: '#C9A227',
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
  stepSubtitle: {
    color: '#F5E6C8',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  habitsGridContent: {
    paddingBottom: 20,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  habitTokenCard: {
    width: '45%',
    backgroundColor: 'rgba(245,230,200,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitTokenCardSelected: {
    backgroundColor: 'rgba(201,162,39,0.25)',
    borderColor: '#C9A227',
  },
  habitEmoji: {
    fontSize: 22,
  },
  habitLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  habitLabelSelected: {
    color: '#F5E6C8',
  },
  customHabitInputWrap: {
    marginTop: 20,
    backgroundColor: 'rgba(245,230,200,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9A227',
    padding: 16,
  },
  customHabitTitle: {
    color: '#C9A227',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customHabitInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.2)',
    color: '#FFF',
    padding: 12,
    fontSize: 13,
  },

  // STEP 3 - CONTRACT & SIGNATURE
  contractScrollContent: {
    paddingBottom: 20,
  },
  parchmentContractPaper: {
    backgroundColor: '#F5E6C8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C9A227',
    padding: 20,
  },
  contractHeaderHeading: {
    color: '#6D4C41',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  contractFieldGroup: {
    marginBottom: 14,
  },
  contractFieldLabel: {
    color: '#6D4C41',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contractFieldValueText: {
    color: '#8C6D1F',
    fontSize: 15,
    fontWeight: 'bold',
  },
  contractTextInput: {
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(109,76,65,0.3)',
    color: '#4A2E1B',
    padding: 12,
    fontSize: 13,
  },
  contractPledgeText: {
    color: '#6D4C41',
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 14,
  },
  signatureSectionWrap: {
    marginTop: 10,
  },
  signatureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  signatureFieldLabel: {
    color: '#6D4C41',
    fontSize: 11,
    fontWeight: 'bold',
  },
  clearSigText: {
    color: '#C9A227',
    fontSize: 11,
    fontWeight: 'bold',
  },
  signatureCanvasFrame: {
    height: 100,
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(109,76,65,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureWatermark: {
    color: '#C4B59D',
    fontSize: 12,
    fontStyle: 'italic',
  },
  waxSealView: {
    alignItems: 'center',
    marginTop: 20,
  },
  waxSealIcon: {
    fontSize: 48,
  },
  waxSealLabel: {
    color: '#F5E6C8',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1.5,
  },

  // STEP 4 - FUTURE MILESTONE
  milestoneGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 30,
  },
  milestoneCard: {
    width: '42%',
    backgroundColor: 'rgba(245,230,200,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.15)',
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  milestoneCardSelected: {
    backgroundColor: 'rgba(201,162,39,0.25)',
    borderColor: '#C9A227',
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneLabelSelected: {
    color: '#F5E6C8',
  },

  // STEP 5 - COMMITMENT TIMER
  studyTimerScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  candleLightWrap: {
    marginBottom: 15,
  },
  candleEmoji: {
    fontSize: 40,
  },
  studyTimerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    padding: 4,
    backgroundColor: 'rgba(201,162,39,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyTimerGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 106,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyTimerDigits: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '300',
  },
  studyTimerLabel: {
    color: '#F5E6C8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  commitmentMessagesWrap: {
    marginTop: 40,
    paddingHorizontal: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  commitmentMessageText: {
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

  // STEP 6 - FINAL CEREMONY
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
    color: '#C9A227',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  celebrationTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 28,
  },
  vaultCertCard: {
    backgroundColor: 'rgba(245,230,200,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.15)',
    width: '100%',
    padding: 6,
    marginVertical: 10,
  },
  certInnerBorder: {
    borderWidth: 2,
    borderColor: 'rgba(201,162,39,0.4)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  certKicker: {
    color: '#C9A227',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  certTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  certRibbonBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201,162,39,0.2)',
    borderWidth: 1,
    borderColor: '#C9A227',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeRibbonIcon: {
    fontSize: 30,
  },
  certHabitTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  certMilestoneSub: {
    color: '#E6D3B1',
    fontSize: 12,
    marginTop: 6,
  },
  certCompletionMessage: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
