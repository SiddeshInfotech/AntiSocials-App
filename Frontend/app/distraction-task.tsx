import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  TextInput,
  useWindowDimensions,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, apiFetch } from '../constants/Api';

const TASK_DURATION = 60; // 60 seconds observation timer

// Observation options for Screen 2
const OBSERVATION_OPTIONS = [
  { id: 'notice', label: 'Notice', icon: 'settings' }, // Ring of dots icon
  { id: 'observe', label: 'Observe', icon: 'eye' }, // Eye icon
  { id: 'let_it_be', label: 'Let it be', icon: 'circle' }, // Outline circle icon
];

export default function DistractionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Step state: 1: Intro | 2: Write Your Distraction | 3: Completed
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Input states
  const [distractionText, setDistractionText] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('observe');

  // Timer states
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TASK_DURATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const lastPress = useRef<number>(0);
  const endTimeRef = useRef<number>(0);

  // Haptic Feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  }, []);

  // Screen 1 Breathing Circle Animation
  const breathingScale = useSharedValue(1);
  const breathingOpacity = useSharedValue(0.7);
  const orbitingRotation = useSharedValue(0);

  useEffect(() => {
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.92, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    breathingOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbitingRotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedBreathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
    opacity: breathingOpacity.value,
  }));

  const animatedOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${orbitingRotation.value}deg` }],
  }));

  // Screen 3 Sunburst Rays Rotation
  const sunburstRotation = useSharedValue(0);
  useEffect(() => {
    sunburstRotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedSunburstStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${sunburstRotation.value}deg` }],
  }));

  // 60-Second Timer Tick Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && isActive && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            triggerHaptic('success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, timeLeft]);

  const handleStartJourney = () => {
    triggerHaptic('medium');
    setStep(2);
    setIsActive(true);
  };

  const handleNoticeClick = () => {
    if (!distractionText.trim()) {
      Alert.alert("Input Required", "Please write down your distraction first.");
      return;
    }
    triggerHaptic('medium');
    setStep(3);
  };

  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 350) {
        triggerHaptic('warning');
        if (step === 2) setTimeLeft(3);
        else if (step < 3) setStep((step + 1) as any);
      }
    }
  };

  // Complete Task Backend Integration (REUSING EXISTING ARCHITECTURE)
  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerHaptic('medium');

    let pointsData = { pointsAdded: '10', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Write one distraction',
            distraction_text: distractionText.trim(),
            observation_option: selectedOption,
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '10',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error('Backend completion error:', e);
    } finally {
      setIsLoading(false);
    }

    router.replace('/(tabs)');
  };

  const formatTimerDigits = (seconds: number) => {
    const s = seconds % 60;
    return `00:${s < 10 ? '0' : ''}${s}`;
  };

  // Circular Timer calculations for Screen 2
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = timeLeft / TASK_DURATION;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Pure Black Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />

      {/* Screen Wrapper */}
      <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
        {/* ========================================================
            TOP HEADER WITH PROGRESS BAR (1 / 3, 2 / 3, 3 / 3)
           ======================================================== */}
        <View style={styles.topHeaderContainer}>
          <View style={styles.headerBarRow}>
            <TouchableOpacity
              style={styles.backCircleBtn}
              onPress={() => {
                if (step === 1) router.back();
                else setStep((step - 1) as any);
              }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.stepProgressText}>{step} / 3</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* 3-Segment Progress Bar */}
          <View style={styles.segmentProgressBarRow}>
            <View style={[styles.barSegment, step >= 1 ? styles.barActive : styles.barDim]} />
            <View style={[styles.barSegment, step >= 2 ? styles.barActive : styles.barDim]} />
            <View style={[styles.barSegment, step >= 3 ? styles.barActive : styles.barDim]} />
          </View>
        </View>

        {/* ========================================================
            SCREEN 1 — INTRODUCTION
           ======================================================== */}
        {step === 1 && (
          <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)} style={styles.flexContentWrapper}>
            <View style={styles.screen1TextWrapper}>
              <Text style={styles.screen1MainTitle}>One Distraction</Text>
              <View style={styles.titleDividerLine} />

              <Text style={styles.screen1Subtitle}>
                In every moment, something tries{"\n"}to pull you away.
              </Text>

              <Text style={styles.screen1HighlightText}>
                Today, just notice <Text style={{ fontWeight: '700' }}>one.</Text>
              </Text>

              <Text style={styles.screen1FooterText}>
                No judgement.{"\n"}Just awareness.
              </Text>
            </View>

            {/* Abstract Awareness Visual */}
            <View style={styles.heroAbstractContainer}>
              {/* Flowing Vector Waves background */}
              <Svg width={280} height={200} viewBox="0 0 280 200" style={StyleSheet.absoluteFillObject}>
                <Path
                  d="M0,100 C70,160 140,40 280,100 M0,120 C70,180 140,60 280,120 M0,80 C70,140 140,20 280,80"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={1}
                  fill="none"
                />
              </Svg>

              {/* Orbiting Ring with Node Dots */}
              <Animated.View style={[styles.orbitingRingWrapper, animatedOrbitStyle]}>
                <Svg width={180} height={180} viewBox="0 0 180 180">
                  <Circle cx={90} cy={90} r={80} stroke="rgba(255, 255, 255, 0.25)" strokeWidth={1} fill="none" />
                  <Circle cx={90} cy={10} r={5} stroke="#FFFFFF" strokeWidth={1.5} fill="#000000" />
                  <Circle cx={170} cy={90} r={5} stroke="#FFFFFF" strokeWidth={1.5} fill="#000000" />
                  <Circle cx={90} cy={170} r={5} stroke="#FFFFFF" strokeWidth={1.5} fill="#000000" />
                  <Circle cx={10} cy={90} r={5} stroke="#FFFFFF" strokeWidth={1.5} fill="#000000" />
                </Svg>
              </Animated.View>

              {/* Center Breathing Glowing Circle */}
              <Animated.View style={[styles.breathingCircleCore, animatedBreathingStyle]}>
                <View style={styles.innerDotCore} />
              </Animated.View>
            </View>

            {/* Bottom Action */}
            <View style={styles.bottomBarArea}>
              <TouchableOpacity style={styles.primaryWhitePillBtn} onPress={handleStartJourney} activeOpacity={0.88}>
                <Text style={styles.primaryWhiteBtnText}>Let's Begin</Text>
              </TouchableOpacity>
              <View style={styles.pageDotsRow}>
                <View style={[styles.pageDot, styles.dotActive]} />
                <View style={styles.pageDot} />
                <View style={styles.pageDot} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* ========================================================
            SCREEN 2 — WRITE YOUR DISTRACTION
           ======================================================== */}
        {step === 2 && (
          <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)} style={styles.flexContentWrapper}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollContentInner} showsVerticalScrollIndicator={false}>
                {/* Header Title & Question */}
                <Text style={styles.screen2MainTitle}>One Distraction</Text>
                <Text style={styles.screen2Question}>
                  What pulled your attention{"\n"}away just now?
                </Text>

                {/* Writing Glass Card */}
                <View style={styles.writingGlassCard}>
                  <View style={styles.editIconBadge}>
                    <Feather name="edit-2" size={14} color="#FFFFFF" />
                  </View>
                  <TextInput
                    style={styles.distractionTextInput}
                    placeholder="Write it down..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    maxLength={100}
                    value={distractionText}
                    onChangeText={setDistractionText}
                    autoFocus
                  />
                  <Text style={styles.charLimitCounter}>{distractionText.length} / 100</Text>
                </View>

                {/* Guidance Label */}
                <Text style={styles.observationGuidanceText}>Take a moment to observe.</Text>

                {/* Minimal Icon Buttons */}
                <View style={styles.observationButtonsRow}>
                  {OBSERVATION_OPTIONS.map((item) => {
                    const isSelected = selectedOption === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.optionColumn}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedOption(item.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.optionIconCircle, isSelected && styles.optionIconSelected]}>
                          {item.id === 'notice' ? (
                            <MaterialCommunityIcons name="dots-circle" size={20} color="#FFFFFF" />
                          ) : item.id === 'observe' ? (
                            <Feather name="eye" size={20} color="#FFFFFF" />
                          ) : (
                            <Feather name="circle" size={20} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Thin Divider with Lotus Icon */}
                <View style={styles.dividerLotusRow}>
                  <View style={styles.dividerLine} />
                  <Text style={{ fontSize: 16, marginHorizontal: 12 }}>🪷</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* 60-Second Timer Section */}
                <View style={styles.timerSectionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.observeForLabel}>Observe for</Text>
                    <Text style={styles.secondsValueText}>60 seconds</Text>
                  </View>

                  <View style={styles.circularTimerWrapper}>
                    <Svg width={80} height={80} viewBox="0 0 80 80">
                      <Circle cx={40} cy={40} r={radius} stroke="rgba(255, 255, 255, 0.15)" strokeWidth={4} fill="transparent" />
                      <Circle
                        cx={40}
                        cy={40}
                        r={radius}
                        stroke="#FFFFFF"
                        strokeWidth={4}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        transform="rotate(-90 40 40)"
                      />
                    </Svg>
                    <Pressable onPress={handleDevSkip} style={styles.timerDigitsCenter}>
                      <Text style={styles.timerDigitsText}>{formatTimerDigits(timeLeft)}</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Action */}
              <View style={styles.bottomBarArea}>
                <TouchableOpacity style={styles.primaryWhitePillBtn} onPress={handleNoticeClick} activeOpacity={0.88}>
                  <Text style={styles.primaryWhiteBtnText}>I noticed it</Text>
                </TouchableOpacity>
                <Text style={styles.screen2FooterQuote}>No judgement, just awareness.</Text>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}

        {/* ========================================================
            SCREEN 3 — COMPLETION
           ======================================================== */}
        {step === 3 && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.flexContentWrapper}>
            <View style={styles.completionCenterContent}>
              {/* Sunburst Rays Checkmark Hero Visual */}
              <View style={styles.sunburstHeroWrapper}>
                <Animated.View style={[StyleSheet.absoluteFillObject, animatedSunburstStyle]}>
                  <Svg width={180} height={180} viewBox="0 0 180 180">
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const angle = (idx * 30 * Math.PI) / 180;
                      const x1 = 90 + Math.cos(angle) * 62;
                      const y1 = 90 + Math.sin(angle) * 62;
                      const x2 = 90 + Math.cos(angle) * 78;
                      const y2 = 90 + Math.sin(angle) * 78;
                      return (
                        <Line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
                      );
                    })}
                  </Svg>
                </Animated.View>

                {/* Checkmark Core Circle */}
                <Animated.View entering={ZoomIn.duration(600)} style={styles.checkCircleCore}>
                  <Feather name="check" size={36} color="#FFFFFF" />
                </Animated.View>
              </View>

              {/* Title & Message */}
              <Text style={styles.wellNoticedTitle}>Well Noticed!</Text>
              <Text style={styles.completionSubMessage}>
                You stayed aware and observed{"\n"}your distraction.
              </Text>

              {/* Reward Card */}
              <View style={styles.rewardGlassCard}>
                <View style={styles.rewardHeaderRow}>
                  <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.youEarnedLabel}>You earned</Text>
                </View>
                <Text style={styles.pointsValueText}>10 Points</Text>
                <View style={styles.glowingUnderline} />
              </View>

              {/* Reflection Quote Card */}
              <View style={styles.quoteGlassCard}>
                <Text style={styles.quoteMarks}>“</Text>
                <Text style={styles.quoteBodyText}>
                  Awareness is the first step{"\n"}to freedom.
                </Text>
                <Text style={styles.quoteMarksRight}>”</Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomBarArea}>
              <TouchableOpacity
                style={styles.primaryWhitePillBtn}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.primaryWhiteBtnText}>Continue Your Journey</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryHomeBtn}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryHomeText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenWrapper: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  topHeaderContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepProgressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  segmentProgressBarRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  barSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  barActive: {
    backgroundColor: '#FFFFFF',
  },
  barDim: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  flexContentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Screen 1: Intro
  screen1TextWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  screen1MainTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  titleDividerLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  screen1Subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  screen1HighlightText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  screen1FooterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  heroAbstractContainer: {
    width: 280,
    height: 200,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 'auto',
  },
  orbitingRingWrapper: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircleCore: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  innerDotCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },

  // Screen 2: Write Distraction
  scrollContentInner: {
    paddingBottom: 20,
  },
  screen2MainTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  screen2Question: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  writingGlassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    marginBottom: 20,
  },
  editIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  distractionTextInput: {
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charLimitCounter: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
    marginTop: 6,
  },
  observationGuidanceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 14,
  },
  observationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  optionColumn: {
    alignItems: 'center',
    width: '30%',
  },
  optionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFFFFF',
  },
  optionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dividerLotusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  timerSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  observeForLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  secondsValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circularTimerWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerDigitsCenter: {
    position: 'absolute',
  },
  timerDigitsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  screen2FooterQuote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 10,
  },

  // Screen 3: Completion
  completionCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  sunburstHeroWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkCircleCore: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  wellNoticedTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  rewardGlassCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  youEarnedLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  pointsValueText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  glowingUnderline: {
    width: 100,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  quoteGlassCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    position: 'relative',
    alignItems: 'center',
  },
  quoteMarks: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.4)',
    position: 'absolute',
    top: 8,
    left: 12,
  },
  quoteMarksRight: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.4)',
    position: 'absolute',
    bottom: 4,
    right: 12,
  },
  quoteBodyText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // Bottom Actions
  bottomBarArea: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  primaryWhitePillBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryWhiteBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  pageDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  secondaryHomeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryHomeText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
});
