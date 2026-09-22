import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width } = Dimensions.get('window');

const TASK_ID = 138;
const TASK_NAME = '90 Minutes Unplugged';
const TASK_POINTS = 600;

// 90 Minutes = 5400 seconds
const TASK_DURATION_SECONDS = 5400;

// SVG Circular Timer Dimensions
const TIMER_SIZE = width * 0.65;
const STROKE_WIDTH = 10;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Page 2: Setup Checklist
const SETUP_CHECKLIST = [
  { id: 's1', label: 'Put phone in another room, drawer, or silent DND mode.' },
  { id: 's2', label: 'Close laptop, TV, and any entertainment screens.' },
  { id: 's3', label: 'Inform anyone essential that you are unplugged for 90 min.' },
  { id: 's4', label: 'Set out physical materials (book, journal, craft, etc.).' },
];

// Page 3: Offline Activities
const OFFLINE_ACTIVITIES = [
  { id: 'reading', label: 'Physical Book Reading', emoji: '📖', desc: 'Immerse in deep, distraction-free prose.' },
  { id: 'journaling', label: 'Pen & Paper Journaling', emoji: '✍️', desc: 'Clarify thoughts, ideas, or long-term vision.' },
  { id: 'nature_walk', label: 'Nature Walk (No Audio)', emoji: '🌲', desc: 'Observe sights, sounds, and physical surroundings.' },
  { id: 'physical_space', label: 'Deep Space Reset', emoji: '🧹', desc: 'Declutter room, desk, or living environment.' },
  { id: 'creative_craft', label: 'Creative / Hands-On Craft', emoji: '🎨', desc: 'Drawing, cooking, instrument practice, or building.' },
];

// Rotating mindfulness quotes during the 90-minute session
const UNPLUGGED_QUOTES = [
  'Notice the silence. It is not emptiness; it is space for your mind to breathe.',
  'When you remove digital stimulation, your natural baseline dopamine restores.',
  'The urge to check a screen is just a sensation. Watch it crest and fade away.',
  'Real reality is tactile, unhurried, and grounding. Savor this rare unplugged block.',
  'You are taking back 90 minutes of your life from the attention economy.',
];

// Page 6: Feelings after session
const REFLECTION_FEELINGS = [
  { id: 'grounded', label: 'Deeply Grounded', emoji: '🌿' },
  { id: 'clear', label: 'Mind Decluttered', emoji: '🧠' },
  { id: 'calm', label: 'Peaceful & Rested', emoji: '🕊️' },
  { id: 'energized', label: 'Creative Energy', emoji: '⚡' },
  { id: 'free', label: 'Free from Urges', emoji: '🔓' },
];

export default function Unplugged90mScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Page 2 State
  const [checkedSetup, setCheckedSetup] = useState<string[]>([]);

  // Page 3 State
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Page 4: 90-Minute Timer State
  const [timeLeft, setTimeLeft] = useState<number>(TASK_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);
  const endTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  // Dev tap fast-forward
  const devTapCountRef = useRef<number>(0);
  const devTapTimerRef = useRef<any>(null);

  // Page 5 State
  const [activityNotes, setActivityNotes] = useState<string>('');

  // Page 6 State
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animations
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // Timer Tick & AppState Handling
  useEffect(() => {
    if (currentPage === 4 && !isTimerRunning && !timerCompleted) {
      // Start timer on page 4
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsTimerRunning(true);
    }

    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const now = Date.now();
        const diffMs = endTimeRef.current - now;
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          setIsTimerRunning(false);
          setTimerCompleted(true);
          Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
        }
      }, 500);

      // Rotate quotes every 25 seconds
      const quoteInterval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % UNPLUGGED_QUOTES.length);
      }, 25000);

      return () => {
        clearInterval(timerIntervalRef.current);
        clearInterval(quoteInterval);
      };
    }
  }, [currentPage, isTimerRunning, timerCompleted]);

  // AppState listener for background tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isTimerRunning && endTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setIsTimerRunning(false);
          setTimerCompleted(true);
          Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
        }
      }
    });
    return () => subscription.remove();
  }, [isTimerRunning]);

  const goToPage = (page: 1 | 2 | 3 | 4 | 5 | 6) => {
    Haptics.selectionAsync?.();
    Animated.timing(pageFadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(page);
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleHeaderBack = () => {
    Haptics.selectionAsync?.();
    if (currentPage > 1) {
      goToPage((currentPage - 1) as any);
    } else {
      router.back();
    }
  };

  const toggleSetupItem = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedSetup((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Dev shortcut: Triple tap timer to fast forward in test environment
  const handleTimerTripleTap = () => {
    if (!__DEV__) return;
    devTapCountRef.current += 1;
    clearTimeout(devTapTimerRef.current);
    devTapTimerRef.current = setTimeout(() => {
      devTapCountRef.current = 0;
    }, 600);

    if (devTapCountRef.current >= 3) {
      devTapCountRef.current = 0;
      endTimeRef.current = Date.now() + 2000;
      setTimeLeft(2);
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  // Format time MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressRatio = (TASK_DURATION_SECONDS - timeLeft) / TASK_DURATION_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  // Authenticated Completion
  const handleCompleteTask = async () => {
    if (isSubmitting || hasClaimed) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setErrorMessage('Authentication token not found. Please log in again.');
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
          task_name: TASK_NAME,
          taskId: TASK_ID,
          difficulty: 'Hard',
          activity: selectedActivity,
          activity_notes: activityNotes.trim(),
          reflection_emotion: selectedFeeling,
          reflection_sentence: reflectionText.trim(),
          duration_completed_minutes: 90,
        }),
      });

      const responseText = await response.text();
      console.log(`[90 Minutes Unplugged] POST /api/tasks/complete status: ${response.status}`);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[90m Unplugged JSON Parse Error] HTTP ${response.status}:`, responseText.slice(0, 300));
        throw new Error(
          response.status === 503
            ? 'Backend service is currently unavailable (HTTP 503).'
            : `Server returned non-JSON response (HTTP ${response.status}).`
        );
      }

      if (!response.ok && !data?.success) {
        throw new Error(data?.error || data?.message || `Task completion failed (HTTP ${response.status})`);
      }

      setHasClaimed(true);
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

      const isDuplicate = data.rewardClaimed === false || (data.pointsEarned === 0 && data.points_earned === 0);
      const pointsAwarded = isDuplicate ? 0 : (
        data.pointsEarned ??
        data.pointsAdded ??
        data.points_earned ??
        data.points_rewarded ??
        TASK_POINTS
      );
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '1';

      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsAwarded),
          pointsAdded: String(pointsAwarded),
          pointsEarned: String(pointsAwarded),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: TASK_NAME,
          difficulty: 'hard',
          message: 'You disconnected from digital noise and reclaimed your mental stillness.',
          rewardClaimed: isDuplicate ? 'false' : 'true',
        },
      } as any);
    } catch (err: any) {
      console.error('90 Minutes Unplugged completion error:', err);
      setErrorMessage(err?.message || 'Network request failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Midnight Deep Space Gradient */}
      <LinearGradient
        colors={['#070d18', '#0c172a', '#050912']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.stageTag}>DAY MASTERY • STAGE 15</Text>
            <Text style={styles.headerTitle}>90 Minutes Unplugged</Text>
          </View>

          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>+600</Text>
          </View>
        </View>

        {/* 6-Step Progress Dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5, 6].map((p) => (
            <View
              key={p}
              style={[
                styles.progressDot,
                currentPage >= p && styles.progressDotActive,
                currentPage === p && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>

        {/* Content Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: pageFadeAnim, flex: 1 }}>
              {/* PAGE 1: HERO INTRO */}
              {currentPage === 1 && (
                <View style={styles.pageCard}>
                  <Animated.View
                    style={[
                      styles.heroIconWrapper,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#0ea5e9', '#0284c7']}
                      style={styles.heroIconGradient}
                    >
                      <Feather name="slash" size={44} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>

                  <View style={styles.hardPill}>
                    <Ionicons name="flame" size={14} color="#38bdf8" />
                    <Text style={styles.hardPillText}>HARD MASTERY CHALLENGE</Text>
                  </View>

                  <Text style={styles.pageTitle}>90 Minutes Total Disconnect</Text>
                  <Text style={styles.pageBody}>
                    Modern screens fragment our focus every few minutes. Spending 90 continuous minutes completely offline resets your neural baseline and restores deep, sustained attention.
                  </Text>

                  <View style={styles.highlightBox}>
                    <Feather name="clock" size={18} color="#38bdf8" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={styles.highlightText}>
                      No phone, no social feeds, no entertainment screens. You will engage in an enriching offline pursuit while the session timer runs.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => goToPage(2)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#0284c7', '#0369a1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Setup Offline Space</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 2: SETUP CHECKLIST */}
              {currentPage === 2 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 1: ENVIRONMENT SETUP</Text>
                  <Text style={styles.pageTitle}>Prepare Your Perimeter</Text>
                  <Text style={styles.pageBody}>
                    Remove friction before starting. Confirm all 4 environmental boundaries below:
                  </Text>

                  <View style={styles.checklistContainer}>
                    {SETUP_CHECKLIST.map((item) => {
                      const isChecked = checkedSetup.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.checklistItem,
                            isChecked && styles.checklistItemChecked,
                          ]}
                          onPress={() => toggleSetupItem(item.id)}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isChecked && styles.checkboxChecked,
                            ]}
                          >
                            {isChecked && <Feather name="check" size={14} color="#ffffff" />}
                          </View>
                          <Text style={styles.checklistLabel}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      checkedSetup.length < SETUP_CHECKLIST.length && styles.btnDisabled,
                    ]}
                    disabled={checkedSetup.length < SETUP_CHECKLIST.length}
                    onPress={() => goToPage(3)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedSetup.length === SETUP_CHECKLIST.length
                          ? ['#0284c7', '#0369a1']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Choose Offline Activity</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 3: CHOOSE ACTIVITY */}
              {currentPage === 3 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 2: CHOOSE PURSUIT</Text>
                  <Text style={styles.pageTitle}>What will you dive into?</Text>
                  <Text style={styles.pageBody}>
                    Pick your primary offline focus to channel your creative or physical energy:
                  </Text>

                  <View style={styles.activityList}>
                    {OFFLINE_ACTIVITIES.map((act) => {
                      const isSelected = selectedActivity === act.id;
                      return (
                        <TouchableOpacity
                          key={act.id}
                          style={[
                            styles.activityCard,
                            isSelected && styles.activityCardSelected,
                          ]}
                          onPress={() => setSelectedActivity(act.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.activityEmoji}>{act.emoji}</Text>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.activityTitle}>{act.label}</Text>
                            <Text style={styles.activityDesc}>{act.desc}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !selectedActivity && styles.btnDisabled,
                    ]}
                    disabled={!selectedActivity}
                    onPress={() => goToPage(4)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedActivity
                          ? ['#0284c7', '#0369a1']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Start 90-Min Session</Text>
                      <Feather name="play" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 4: 90-MINUTE COUNTDOWN */}
              {currentPage === 4 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 3: ACTIVE UNPLUGGED BLOCK</Text>
                  <Text style={styles.pageTitle}>90 Minutes in the Real World</Text>
                  <Text style={styles.pageBody}>
                    Put your device down now. Step away and immerse in your activity.
                  </Text>

                  {/* Circular Timer Display */}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleTimerTripleTap}
                    style={styles.timerCircleContainer}
                  >
                    <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
                      <Circle
                        cx={TIMER_SIZE / 2}
                        cy={TIMER_SIZE / 2}
                        r={RADIUS}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth={STROKE_WIDTH}
                        fill="none"
                      />
                      <Circle
                        cx={TIMER_SIZE / 2}
                        cy={TIMER_SIZE / 2}
                        r={RADIUS}
                        stroke="#38bdf8"
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                        transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
                      />
                    </Svg>

                    <View style={styles.timerInner}>
                      <Text style={styles.timerTime}>{formatTime(timeLeft)}</Text>
                      <Text style={styles.timerStatus}>
                        {timerCompleted ? 'Session Complete!' : 'Unplugged & Present'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Rotating Quote Card */}
                  <View style={styles.quoteBox}>
                    <Feather name="compass" size={18} color="#38bdf8" style={{ marginBottom: 6 }} />
                    <Text style={styles.quoteText}>{UNPLUGGED_QUOTES[quoteIndex]}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !timerCompleted && styles.btnDisabled,
                    ]}
                    disabled={!timerCompleted}
                    onPress={() => goToPage(5)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        timerCompleted
                          ? ['#0284c7', '#0369a1']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>
                        {timerCompleted ? 'Continue to Verification' : 'Timer in Progress...'}
                      </Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 5: OFFLINE VERIFICATION */}
              {currentPage === 5 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 4: VERIFY ACTIVITY</Text>
                  <Text style={styles.pageTitle}>What Did You Experience?</Text>
                  <Text style={styles.pageBody}>
                    Record a concrete summary of what you did and how your attention held up during the 90 minutes.
                  </Text>

                  <Text style={styles.fieldLabel}>Session notes & accomplishments:</Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., Read 35 pages of my book without looking at the time once, or cleaned my entire desk and felt a huge sense of calm..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={4}
                    value={activityNotes}
                    onChangeText={setActivityNotes}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      activityNotes.trim().length < 8 && styles.btnDisabled,
                    ]}
                    disabled={activityNotes.trim().length < 8}
                    onPress={() => goToPage(6)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        activityNotes.trim().length >= 8
                          ? ['#0284c7', '#0369a1']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Proceed to Final Reflection</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 6: REFLECTION & COMPLETION */}
              {currentPage === 6 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 5: DEBRIEF & REWARD</Text>
                  <Text style={styles.pageTitle}>Cognitive Baseline Restored</Text>
                  <Text style={styles.pageBody}>
                    Select your current mental state after 90 continuous unplugged minutes:
                  </Text>

                  <View style={styles.feelingsGrid}>
                    {REFLECTION_FEELINGS.map((item) => {
                      const isSelected = selectedFeeling === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.feelingChip,
                            isSelected && styles.feelingChipSelected,
                          ]}
                          onPress={() => setSelectedFeeling(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.feelingEmoji}>{item.emoji}</Text>
                          <Text
                            style={[
                              styles.feelingLabel,
                              isSelected && styles.feelingLabelSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                    What will you do differently with your screen habits?
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., I realized how often I reach for the phone out of pure boredom, not necessity..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    value={reflectionText}
                    onChangeText={setReflectionText}
                  />

                  {errorMessage ? (
                    <View style={styles.errorBox}>
                      <Feather name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  ) : null}

                  {/* Reward Summary Pill */}
                  <View style={styles.rewardBox}>
                    <Ionicons name="trophy" size={24} color="#fbbf24" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.rewardTitle}>Day Mastery Reward</Text>
                      <Text style={styles.rewardPoints}>+600 Points • High Focus Mastery</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!selectedFeeling || reflectionText.trim().length < 5 || isSubmitting) && styles.btnDisabled,
                    ]}
                    disabled={!selectedFeeling || reflectionText.trim().length < 5 || isSubmitting}
                    onPress={handleCompleteTask}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedFeeling && reflectionText.trim().length >= 5 && !isSubmitting
                          ? ['#0284c7', '#0369a1']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.btnText}>Complete Task (+600 Pts)</Text>
                          <Feather name="check-circle" size={18} color="#ffffff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d18',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stageTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#38bdf8',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  progressDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.5)',
  },
  progressDotCurrent: {
    backgroundColor: '#38bdf8',
    width: 34,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    paddingTop: 8,
  },
  pageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 22,
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    marginBottom: 12,
    gap: 4,
  },
  hardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.6,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.2,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  pageBody: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 19,
  },
  checklistContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 22,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 14,
    padding: 14,
  },
  checklistItemChecked: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 18,
  },
  activityList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 14,
  },
  activityCardSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: '#38bdf8',
  },
  activityEmoji: {
    fontSize: 26,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  activityDesc: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  timerCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  timerInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTime: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerStatus: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
    marginTop: 4,
  },
  quoteBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
    width: '100%',
  },
  quoteText: {
    fontSize: 13,
    color: '#e0f2fe',
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  multilineInput: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 22,
  },
  feelingsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  feelingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  feelingChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38bdf8',
  },
  feelingEmoji: {
    fontSize: 16,
  },
  feelingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  feelingLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  rewardPoints: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    width: '100%',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#fca5a5',
    flex: 1,
  },
});
