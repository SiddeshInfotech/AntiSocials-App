import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
  Pressable,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, apiFetch } from '../constants/Api';

const VIDEO_PATH = require('../assets/videos/i_want_focus_on_one_thing_vide.mp4');
const ALARM_SOUND = require('../assets/videos/mixkit-relaxation-05-749.mp3');
const TASK_DURATION = 600; // 10 minutes (600 seconds)

export interface FocusCategory {
  id: string;
  title: string;
  emoji: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
  color: string;
  glowColor: string;
  gradient: [string, string];
}

const CATEGORIES: FocusCategory[] = [
  {
    id: 'study',
    title: 'Study',
    emoji: '📚',
    iconName: 'book-open-page-variant',
    description: 'Focus on learning, reading, or improving skills.',
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    gradient: ['#38BDF8', '#8B5CF6'],
  },
  {
    id: 'playing',
    title: 'Playing',
    emoji: '🎮',
    iconName: 'controller-classic',
    description: 'Enjoy a game or activity with complete presence.',
    color: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    gradient: ['#F43F5E', '#FB923C'],
  },
  {
    id: 'meditation',
    title: 'Meditation',
    emoji: '🧘',
    iconName: 'spa',
    description: 'Spend time calming your mind and being present.',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: 'work',
    title: 'Work',
    emoji: '💼',
    iconName: 'briefcase-check',
    description: 'Complete an important task or responsibility.',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    gradient: ['#8B5CF6', '#C084FC'],
  },
  {
    id: 'parents',
    title: 'Spend Time With Parents',
    emoji: '❤️',
    iconName: 'heart-pulse',
    description: 'Give meaningful attention to family.',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    gradient: ['#F59E0B', '#FBBF24'],
  },
];

const MOTIVATIONAL_QUOTES = [
  "Stay present.",
  "Protect this moment.",
  "Your attention matters.",
  "Breathe deeply and focus.",
  "One moment at a time.",
];

const COLORS = {
  bgOverlay: 'rgba(7, 8, 20, 0.45)',
  glassBg: 'rgba(15, 18, 38, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.25)',
  purple: '#8B5CF6',
  blue: '#38BDF8',
  amber: '#F59E0B',
  emerald: '#10B981',
  textWhite: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.85)',
};

const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {
    // Haptics fallback
  }
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

// Ambient Floating Particles
const FloatingParticles = ({ width, height, count = 22, activeColor }: { width: number; height: number; count?: number; activeColor?: string }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(count)].map((_, i) => {
        const posX = useSharedValue(Math.random() * width);
        const posY = useSharedValue(height + Math.random() * 80);
        const pScale = useSharedValue(Math.random() * 0.5 + 0.3);
        const pOpacity = useSharedValue(Math.random() * 0.4 + 0.2);

        useEffect(() => {
          const duration = 12000 + Math.random() * 8000;
          const delay = Math.random() * 4000;

          posY.value = withRepeat(
            withSequence(
              withTiming(height + 20, { duration: delay }),
              withTiming(-40, { duration, easing: Easing.linear })
            ),
            -1,
            false
          );

          posX.value = withRepeat(
            withSequence(
              withTiming(posX.value + (Math.random() * 30 - 15), {
                duration: 3500 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(posX.value - (Math.random() * 30 - 15), {
                duration: 3500 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            -1,
            true
          );
        }, []);

        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: posX.value },
            { translateY: posY.value },
            { scale: pScale.value },
          ],
          opacity: pOpacity.value,
        }));

        const color = activeColor || (i % 3 === 0 ? COLORS.blue : i % 3 === 1 ? COLORS.purple : COLORS.amber);

        return (
          <Animated.View
            key={i}
            style={[
              styles.ambientParticle,
              style,
              { backgroundColor: color, shadowColor: color },
            ]}
          />
        );
      })}
    </View>
  );
};

// Animated Focus Timer Ring & Symbol
const FocusTimerSymbol = ({ activeCategory, isPaused }: { activeCategory: FocusCategory | null; isPaused?: boolean }) => {
  const pulseAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const themeColor = activeCategory ? activeCategory.color : COLORS.purple;
  const themeGlow = activeCategory ? activeCategory.glowColor : 'rgba(139, 92, 246, 0.45)';

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    shadowColor: themeColor,
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  return (
    <View style={styles.symbolWrapper}>
      <Animated.View style={[styles.symbolOuterRing, animatedRingStyle, { borderColor: themeColor }]} />
      <Animated.View style={[styles.symbolGlowCircle, animatedOrbStyle, { backgroundColor: themeGlow, shadowColor: themeColor }]}>
        <MaterialCommunityIcons
          name={activeCategory ? activeCategory.iconName : 'shield-star-outline'}
          size={46}
          color="#FFF"
        />
      </Animated.View>
    </View>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function FocusTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Full Screen Video Background Controller
  const videoPlayer = useVideoPlayer(VIDEO_PATH, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Step Workflow: 1 = Intro, 2 = Category Selection, 3 = 10-Min Session, 4 = Completion & Reward
  const [step, setStep] = useState<number>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Timer Session State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TASK_DURATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Motivational Quote Index
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  // Dev Skip Double-Tap Ref
  const lastPress = useRef<number>(0);

  // Audio Alarm Refs
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const alarmHasPlayedRef = useRef<boolean>(false);

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId]);

  // Clean up completion alarm sound on unmount
  useEffect(() => {
    return () => {
      if (alarmSoundRef.current) {
        alarmSoundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Play Completion Alarm Helper Function
  const playCompletionAlarm = useCallback(async () => {
    if (alarmHasPlayedRef.current) return;
    alarmHasPlayedRef.current = true;

    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      }
      const { sound } = await Audio.Sound.createAsync(
        ALARM_SOUND,
        { shouldPlay: true, volume: 0.85 }
      );
      alarmSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          alarmSoundRef.current = null;
        }
      });
    } catch (err) {
      console.warn('[FocusTask] Alarm audio error:', err);
    }
  }, []);

  // Quote rotation during focus session
  useEffect(() => {
    if (step === 3 && isActive && !isPaused) {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [step, isActive, isPaused]);

  // Timer Tick Loop & Automatic Completion Alarm Trigger
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      triggerHaptic('success');
      playCompletionAlarm();
      setStep(4);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, isPaused, timeLeft, playCompletionAlarm]);

  // Handlers
  const handleBeginJourney = () => {
    triggerHaptic('medium');
    setStep(2);
  };

  const handleSelectCategory = (id: string) => {
    triggerHaptic('light');
    setSelectedCategoryId(id);
  };

  const handleContinueToSession = () => {
    if (!selectedCategoryId) return;
    triggerHaptic('medium');
    setStep(3);
    setIsActive(true);
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    triggerHaptic('light');
    setIsPaused(!isPaused);
  };

  const handleFinishEarly = () => {
    triggerHaptic('medium');
    setIsActive(false);
    playCompletionAlarm();
    setStep(4);
  };

  const handleAbortSession = () => {
    triggerHaptic('warning');
    Alert.alert(
      "Exit Focus Session?",
      "Are you sure you want to stop focusing? Your current session progress will be lost.",
      [
        { text: "Stay & Focus", style: "cancel" },
        { text: "Exit Session", style: "destructive", onPress: () => router.back() }
      ]
    );
  };

  // Developer Double-Tap Skip Helper
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3); // Skip to 3 seconds remaining
      }
    }
  };

  // Backend Task Completion Logic (CONTRACT UNTOUCHED)
  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '20', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ task_name: 'Focus on one task (10 min)' }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || "20",
            totalPoints: data.totalPoints?.toString() || "0",
            streak: data.streak?.toString() || "0",
          };
        } else {
          Alert.alert("Error", data.error || "Failed to submit task completion");
        }
      } else {
        Alert.alert("Authorization Error", "No authorization token found. Please log in again.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Connection Error", "Network request failed. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }

    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
      },
    } as any);
  };

  // Time format helper
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Progress percentage (0 to 100%)
  const progressPercent = Math.min(100, Math.max(0, ((TASK_DURATION - timeLeft) / TASK_DURATION) * 100));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* FULL-SCREEN VIDEO BACKGROUND (BRIGHTER, IMMERSIVE CINEMATIC OVERLAY) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        {/* Soft Warm Cinematic Overlay for High Video Brightness & UI Clarity */}
        <LinearGradient
          colors={['rgba(7, 8, 20, 0.38)', 'rgba(11, 13, 27, 0.48)', 'rgba(7, 8, 20, 0.42)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Ambient Floating Dust Particles Canvas */}
      <FloatingParticles width={width} height={height} activeColor={activeCategory?.color} />

      <SafeAreaView style={styles.safeArea}>
        {/* TOP NAVBAR (Steps 1 to 3) */}
        {step < 4 && (
          <View style={styles.navHeader}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                if (step > 1) setStep((prev) => prev - 1);
                else router.back();
              }}
              style={styles.navBackBtn}
              activeOpacity={0.7}
            >
              <Feather name={step === 1 ? 'x' : 'arrow-left'} size={20} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.navTitleCenter}>
              <Text style={styles.navBadgeText}>FOCUS JOURNEY</Text>
              {step === 3 && activeCategory && (
                <Text style={styles.navTaskSubtitle}>{activeCategory.title}</Text>
              )}
            </View>

            <View style={{ width: 40 }} />
          </View>
        )}

        {/* SCREEN 1: INTRODUCTION */}
        {step === 1 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.screenBody}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Glowing Focus Symbol */}
              <View style={styles.heroSymbolSpace}>
                <FocusTimerSymbol activeCategory={null} />
              </View>

              {/* Title & Subtitle */}
              <View style={styles.heroTextSection}>
                <Text style={styles.heroTitle}>Focus on One Task</Text>
                <Text style={styles.heroSubtitle}>
                  "Your attention is your most powerful tool.{'\n'}Give one thing your full presence for the next 10 minutes."
                </Text>

                {/* Session Spec Badge */}
                <View style={styles.specBadgePill}>
                  <Feather name="clock" size={14} color={COLORS.blue} />
                  <Text style={styles.specBadgeText}>10 MINUTES OF DEEP FOCUS</Text>
                </View>
              </View>

              {/* Begin Journey Button */}
              <TouchableOpacity
                onPress={handleBeginJourney}
                activeOpacity={0.85}
                style={styles.primaryGradientBtn}
              >
                <LinearGradient
                  colors={['#38BDF8', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Begin Journey →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* SCREEN 2: CHOOSE YOUR FOCUS CATEGORY */}
        {step === 2 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.screenBody}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>What deserves your attention?</Text>
              <Text style={styles.sectionSubheading}>
                Choose one area where you want to spend your next 10 minutes.
              </Text>

              {/* 5 Premium Category Cards List */}
              <View style={styles.categoriesWrap}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => handleSelectCategory(cat.id)}
                      activeOpacity={0.82}
                      style={[
                        styles.categoryCard,
                        isSelected && {
                          borderColor: cat.color,
                          backgroundColor: cat.glowColor,
                          transform: [{ scale: 1.02 }],
                          shadowColor: cat.color,
                          shadowOpacity: 0.7,
                          shadowRadius: 16,
                          elevation: 8,
                        },
                      ]}
                    >
                      <View style={[styles.categoryIconBadge, { backgroundColor: isSelected ? cat.color : 'rgba(255,255,255,0.12)' }]}>
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      </View>

                      <View style={styles.categoryTextContent}>
                        <Text style={[styles.categoryTitleText, isSelected && { color: COLORS.textWhite }]}>
                          {cat.title}
                        </Text>
                        <Text style={styles.categoryDescText}>{cat.description}</Text>
                      </View>

                      {isSelected && (
                        <Feather name="check-circle" size={20} color={COLORS.textWhite} style={{ marginLeft: 8 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinueToSession}
                disabled={!selectedCategoryId}
                activeOpacity={0.85}
                style={[
                  styles.primaryGradientBtn,
                  !selectedCategoryId && styles.btnDisabled,
                ]}
              >
                <LinearGradient
                  colors={
                    selectedCategoryId && activeCategory
                      ? activeCategory.gradient
                      : [COLORS.glassBorder, COLORS.glassBg]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* SCREEN 3: 10 MINUTE FOCUS SESSION */}
        {step === 3 && activeCategory && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.screenBody}>
            <View style={styles.sessionCenterSpace}>
              {/* Category Pill Tag */}
              <View style={[styles.currentCategoryPill, { borderColor: activeCategory.color, backgroundColor: activeCategory.glowColor }]}>
                <Text style={styles.currentCategoryEmoji}>{activeCategory.emoji}</Text>
                <Text style={styles.currentCategoryTitle}>Current Focus: {activeCategory.title}</Text>
              </View>

              {/* Animated Symbol Graphic */}
              <View style={{ marginVertical: 12 }}>
                <FocusTimerSymbol activeCategory={activeCategory} isPaused={isPaused} />
              </View>

              {/* Circular Progress & Countdown Digits */}
              <Pressable onPress={handleDevSkip}>
                <Text style={styles.timerDigitsText}>
                  {formatTime(timeLeft)}
                </Text>
              </Pressable>

              {/* Progress Track */}
              <View style={styles.timerTrackBase}>
                <View style={[styles.timerTrackFill, { width: `${progressPercent}%`, backgroundColor: activeCategory.color }]} />
              </View>

              {/* Motivational Quote Banner */}
              <Text style={styles.motivationalQuoteText}>
                "{MOTIVATIONAL_QUOTES[quoteIndex]}"
              </Text>

              {/* Session Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  onPress={handleTogglePause}
                  activeOpacity={0.8}
                  style={styles.controlGlassBtn}
                >
                  <Feather name={isPaused ? "play" : "pause"} size={18} color={COLORS.textWhite} />
                  <Text style={styles.controlBtnText}>{isPaused ? "Resume" : "Pause"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFinishEarly}
                  activeOpacity={0.8}
                  style={[styles.controlGlassBtn, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.5)' }]}
                >
                  <Feather name="check-circle" size={18} color={COLORS.emerald} />
                  <Text style={[styles.controlBtnText, { color: COLORS.emerald }]}>Finish</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleAbortSession}
                activeOpacity={0.7}
                style={styles.abortLink}
              >
                <Text style={styles.abortLinkText}>Exit Session</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* SCREEN 4: COMPLETION & REWARD */}
        {step === 4 && (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.completionBody}>
            <ScrollView contentContainerStyle={styles.completionScrollContent} showsVerticalScrollIndicator={false}>
              {/* Badge Celebration Frame */}
              <View style={styles.completionBadgeFrame}>
                <LinearGradient
                  colors={activeCategory ? activeCategory.gradient : ['#38BDF8', '#8B5CF6']}
                  style={styles.badgeGradientInner}
                >
                  <Text style={styles.completionBadgeEmoji}>🎯</Text>
                </LinearGradient>
              </View>

              <Text style={styles.completionTitle}>Focus Complete</Text>

              <View style={styles.completionQuoteGlass}>
                <Text style={styles.completionQuoteText}>
                  "You gave your full attention to something meaningful."
                </Text>
              </View>

              {/* Summary Card */}
              {activeCategory && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>SESSION SUMMARY</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryEmoji}>{activeCategory.emoji}</Text>
                    <Text style={styles.summaryCategoryName}>{activeCategory.title}</Text>
                  </View>
                  <View style={styles.summaryFooterRow}>
                    <Feather name="clock" size={13} color={COLORS.textDim} />
                    <Text style={styles.summaryFooterText}>10 Minutes Completed</Text>
                  </View>
                </View>
              )}

              {/* Rewards Row */}
              <View style={styles.rewardsRow}>
                <View style={styles.rewardPill}>
                  <Ionicons name="sparkles" size={16} color={COLORS.amber} />
                  <Text style={styles.rewardPillText}>+20 Mind Points</Text>
                </View>

                <View style={styles.achievementPill}>
                  <Feather name="award" size={15} color={COLORS.blue} />
                  <Text style={styles.achievementPillText}>🎯 Focus Master</Text>
                </View>
              </View>

              {/* Backend Completion Action Button */}
              <TouchableOpacity
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
                style={styles.primaryGradientBtn}
              >
                <LinearGradient
                  colors={activeCategory ? activeCategory.gradient : ['#38BDF8', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Continue →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070814',
  },
  safeArea: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitleCenter: {
    alignItems: 'center',
  },
  navBadgeText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  navTaskSubtitle: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  screenBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // DUST
  ambientParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // HERO SYMBOL
  heroSymbolSpace: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolWrapper: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolOuterRing: {
    position: 'absolute',
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  symbolGlowCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 8,
  },

  // HERO TEXT (SCREEN 1)
  heroTextSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  specBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginBottom: 16,
  },
  specBadgeText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 8,
  },

  // BUTTONS
  primaryGradientBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  btnDisabled: {
    opacity: 0.45,
  },

  // SCREEN 2 CATEGORIES
  sectionHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSubheading: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  categoriesWrap: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    borderRadius: 24,
    padding: 16,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  categoryIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryTextContent: {
    flex: 1,
  },
  categoryTitleText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryDescText: {
    color: COLORS.textDim,
    fontSize: 12,
    lineHeight: 17,
  },

  // SCREEN 3 SESSION
  sessionCenterSpace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  currentCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  currentCategoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  currentCategoryTitle: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  timerDigitsText: {
    fontSize: 60,
    fontWeight: '200',
    color: COLORS.textWhite,
    letterSpacing: 2,
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  timerTrackBase: {
    width: 160,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 12,
  },
  timerTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  motivationalQuoteText: {
    color: COLORS.textDim,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  controlGlassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  controlBtnText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  abortLink: {
    padding: 10,
    marginTop: 10,
  },
  abortLinkText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '600',
  },

  // SCREEN 4 COMPLETION
  completionBody: {
    flex: 1,
    justifyContent: 'center',
  },
  completionScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  completionBadgeFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 20,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  badgeGradientInner: {
    flex: 1,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionBadgeEmoji: {
    fontSize: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 14,
  },
  completionQuoteGlass: {
    width: '100%',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  completionQuoteText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    marginBottom: 18,
  },
  summaryCardTitle: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  summaryCategoryName: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryFooterText: {
    color: COLORS.textDim,
    fontSize: 12,
    marginLeft: 6,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rewardPillText: {
    color: COLORS.amber,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  achievementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  achievementPillText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});
