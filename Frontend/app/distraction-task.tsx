import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Rect, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Confetti particle configuration for completion screen
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#ec4899', '#8b5cf6'][i % 6],
  size: 6 + Math.random() * 8,
  delay: (i % 8) * 140,
  duration: 2200 + Math.random() * 800,
}));

export default function DistractionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 3 PAGES: 1 (intro), 2 (write distraction), 3 (completion)
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Input state for Page 2
  const [distractionText, setDistractionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend points & completion states for Page 3
  const [rewardStatus, setRewardStatus] = useState<'pending' | 'success' | 'already_claimed' | 'error'>('pending');
  const [userTotalPoints, setUserTotalPoints] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);

  // Guard ref ensuring backend submission runs strictly once per session
  const hasAwardedRef = useRef(false);

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  // Page crossfade transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Ambient breathing background aura
  const ambientBreathAnim = useRef(new Animated.Value(1)).current;
  const ambientGlowAnim = useRef(new Animated.Value(0.4)).current;

  // Page 1 Floating Notepad Mascot & Ripple Waves
  const notepadFloatAnim = useRef(new Animated.Value(0)).current;
  const notepadPulseScale = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  // Page 3 Trophy / Confetti Celebration Animations
  const trophyScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationAuraAnim = useRef(new Animated.Value(0)).current;
  const rewardCardSlideAnim = useRef(new Animated.Value(30)).current;
  const rewardCardOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiFallAnims = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;

  // Safe Haptics helper
  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Ignore if haptics are unsupported
    }
  };

  // ----------------------------------------------------
  // AMBIENT BACKGROUND & CONTINUOUS ANIMATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Ambient Background Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBreathAnim, {
          toValue: 1.08,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientBreathAnim, {
          toValue: 1.0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Ambient Glow Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlowAnim, {
          toValue: 0.85,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientGlowAnim, {
          toValue: 0.35,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Notepad Mascot Floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(notepadFloatAnim, {
          toValue: -12,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(notepadFloatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Soft Scale Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(notepadPulseScale, {
          toValue: 1.05,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(notepadPulseScale, {
          toValue: 0.96,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. Radiating Relaxation Waves
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1500);
  }, []);

  // ----------------------------------------------------
  // PAGE TRANSITIONS
  // ----------------------------------------------------
  const transitionToPage = useCallback((nextPage: 1 | 2 | 3) => {
    triggerHaptic('medium');

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -20,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(nextPage);
      pageSlideAnim.setValue(20);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // PAGE 1 -> PAGE 2: User taps "Start Task"
  const handleStartTask = () => {
    transitionToPage(2);
  };

  // PAGE 2: User taps "Complete Task"
  const handleCompleteTask = async () => {
    const trimmed = distractionText.trim();
    if (!trimmed) {
      triggerHaptic('warning');
      Alert.alert('Input Required', 'Please write down one distraction before continuing.');
      return;
    }

    if (isSubmitting || hasAwardedRef.current) return;
    hasAwardedRef.current = true;
    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const token = await SecureStore.getItemAsync('token');

      if (token) {
        // Submit distraction and complete task through existing backend points system
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Write one distraction',
            distraction_text: trimmed,
          }),
        });

        const data = await response.json();

        if (response.ok || data.success) {
          if (data.rewardClaimed === false || data.message === 'Reward already claimed') {
            setRewardStatus('already_claimed');
          } else {
            setRewardStatus('success');
            triggerHaptic('success');
          }

          const totalPts = data.totalPoints ?? data.total_points ?? null;
          const streakNum = data.currentStreak ?? data.current_streak ?? data.streak ?? null;
          if (totalPts !== null) setUserTotalPoints(Number(totalPts));
          if (streakNum !== null) setCurrentStreak(Number(streakNum));
        } else {
          console.error('Task completion error response:', data);
          setRewardStatus('error');
        }

        // Refresh user summary from backend
        try {
          const summaryRes = await apiFetch('/api/user/summary', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            if (summaryData.points !== undefined || summaryData.totalPoints !== undefined) {
              setUserTotalPoints(Number(summaryData.points ?? summaryData.totalPoints ?? 0));
            }
            if (summaryData.streak !== undefined || summaryData.currentStreak !== undefined) {
              setCurrentStreak(Number(summaryData.streak ?? summaryData.currentStreak ?? 0));
            }
          }
        } catch (sumErr) {
          console.log('Summary sync optional refresh:', sumErr);
        }
      } else {
        console.warn('⚠️ No auth token available for task reward');
        setRewardStatus('error');
      }
    } catch (e) {
      console.error('Failed to award points via backend:', e);
      setRewardStatus('error');
    } finally {
      setIsSubmitting(false);
      // Navigate to Page 3
      transitionToPage(3);
    }
  };

  // PAGE 3: Start celebratory animations
  useEffect(() => {
    if (page === 3) {
      // Pop-in Medallion
      Animated.spring(trophyScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();

      // Celebration aura expansion
      Animated.timing(celebrationAuraAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Reward card entrance
      Animated.parallel([
        Animated.timing(rewardCardOpacityAnim, {
          toValue: 1,
          duration: 700,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rewardCardSlideAnim, {
          toValue: 0,
          duration: 700,
          delay: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Falling confetti
      confettiFallAnims.forEach((anim, i) => {
        Animated.sequence([
          Animated.delay(CONFETTI_PARTICLES[i].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: CONFETTI_PARTICLES[i].duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [page]);

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="light" />

      {/* ---------------------------------------------------- */}
      {/* AMBIENT BACKGROUND SYSTEM */}
      {/* ---------------------------------------------------- */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: ambientBreathAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#030712', '#111827', '#02050a']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Radiant Glowing Nebula Orbs */}
      <Animated.View
        style={[
          styles.ambientOrbAmber,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrbCyan,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />

      <SafeAreaView style={styles.safeAreaLayer} edges={['top', 'bottom']}>
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          {page !== 3 ? (
            <TouchableOpacity
              style={styles.circleNavButton}
              onPress={() => {
                if (page === 2) {
                  transitionToPage(1);
                } else {
                  if (router.canGoBack()) router.back();
                  else router.replace('/(tabs)');
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="arrow-left" size={20} color="#e2e8f0" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <View style={styles.headerPill}>
            <View style={styles.headerPillDot} />
            <Text style={styles.headerPillText}>
              {page === 1 ? 'TASK INTRO' : page === 2 ? 'WRITE DISTRACTION' : 'COMPLETE'}
            </Text>
          </View>

          <View style={styles.pageIndicatorContainer}>
            <Text style={styles.pageIndicatorText}>
              {page} <Text style={{ color: '#64748b' }}>/ 3</Text>
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* ANIMATED PAGE CONTAINER */}
        {/* ---------------------------------------------------- */}
        <Animated.View
          style={[
            styles.pageAnimatedContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {/* ==================================================== */}
          {/* PAGE 1 — INTRODUCTION                                */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Premium Floating Notepad Stage */}
              <View style={styles.mascotStage}>
                {/* Concentric Awareness Ripple 1 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: waveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: waveAnim1.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.25, 0],
                      }),
                    },
                  ]}
                />

                {/* Concentric Awareness Ripple 2 */}
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      borderColor: 'rgba(245, 158, 11, 0.45)',
                      transform: [
                        {
                          scale: waveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.2],
                          }),
                        },
                      ],
                      opacity: waveAnim2.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.6, 0.25, 0],
                      }),
                    },
                  ]}
                />

                {/* Floating Notepad Center */}
                <Animated.View
                  style={[
                    styles.notepadMascotCard,
                    {
                      transform: [
                        { translateY: notepadFloatAnim },
                        { scale: notepadPulseScale },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(217, 119, 6, 0.25)', 'rgba(180, 83, 9, 0.4)']}
                    style={styles.notepadMascotGradient}
                  >
                    <Svg width={90} height={90} viewBox="0 0 90 90">
                      <Defs>
                        <SvgLinearGradient id="penGrad" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                          <Stop offset="100%" stopColor="#d97706" stopOpacity="1" />
                        </SvgLinearGradient>
                      </Defs>
                      {/* Document Sheet */}
                      <Rect
                        x="18"
                        y="14"
                        width="54"
                        height="62"
                        rx="8"
                        fill="rgba(30, 41, 59, 0.9)"
                        stroke="rgba(251, 191, 36, 0.45)"
                        strokeWidth="2"
                      />
                      {/* Document Lines */}
                      <Path d="M28 28 L62 28" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                      <Path d="M28 38 L54 38" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                      <Path d="M28 48 L46 48" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Stylized Pencil */}
                      <Path
                        d="M58 56 L68 46 L74 52 L64 62 Z"
                        fill="url(#penGrad)"
                      />
                      <Path d="M58 56 L55 65 L64 62 Z" fill="#fef3c7" />
                    </Svg>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Task Title & Badges */}
              <View style={styles.introContentSection}>
                <Text style={styles.taskTitle}>Write One Distraction</Text>

                {/* Task Information Pills */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="bar-chart-2" size={13} color="#34d399" />
                    <Text style={[styles.badgeText, { color: '#34d399' }]}>Easy</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Feather name="award" size={13} color="#fbbf24" />
                    <Text style={[styles.badgeText, { color: '#fbbf24' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* EXACTLY 2-LINE INTRODUCTION */}
                <View style={styles.twoLineCard}>
                  <Text style={styles.explanationLine1} numberOfLines={1}>
                    Pause for a moment and notice what is pulling your attention away.
                  </Text>
                  <Text style={styles.explanationLine2} numberOfLines={1}>
                    Writing it down is the first step toward becoming more aware of it.
                  </Text>
                </View>

                {/* Subtle Mindful Note */}
                <View style={styles.mindfulNoteContainer}>
                  <Feather name="edit-3" size={14} color="#94a3b8" />
                  <Text style={styles.mindfulNoteText}>
                    Naming an impulse removes its unconscious hold over you.
                  </Text>
                </View>
              </View>

              {/* Clear Primary Button: "Start Task" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartTask}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Start Task</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — WRITE ONE DISTRACTION                       */}
          {/* ==================================================== */}
          {page === 2 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={styles.page2Scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {/* Header & Prompt Section */}
                <View style={styles.page2HeaderSection}>
                  <View style={styles.page2IconBubble}>
                    <Feather name="edit-2" size={26} color="#fbbf24" />
                  </View>
                  <Text style={styles.page2Heading}>What's distracting you right now?</Text>
                  <Text style={styles.page2Subtitle}>
                    Write down one thing that is pulling your attention away.
                  </Text>
                </View>

                {/* Single Premium Text Input Area */}
                <View style={styles.inputCard}>
                  <TextInput
                    style={styles.textInputArea}
                    placeholder="e.g. I keep checking my phone..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    maxLength={160}
                    value={distractionText}
                    onChangeText={setDistractionText}
                    textAlignVertical="top"
                    autoFocus
                  />
                  <View style={styles.charCountRow}>
                    <Text style={styles.charCountText}>
                      {distractionText.trim().length > 0 ? '✓ Ready to note' : 'Minimum 1 word required'}
                    </Text>
                    <Text style={styles.charCountNumber}>
                      {distractionText.length} / 160
                    </Text>
                  </View>
                </View>

                {/* Thoughtful Tip Card */}
                <View style={styles.writingTipCard}>
                  <Feather name="shield" size={16} color="#06b6d4" style={{ marginRight: 10, marginTop: 2 }} />
                  <Text style={styles.writingTipText}>
                    Be honest without judging yourself. Merely identifying the distraction gives you the space to refocus.
                  </Text>
                </View>

                {/* Primary Button: "Complete Task" */}
                <View style={styles.bottomCtaContainer}>
                  <TouchableOpacity
                    style={[
                      styles.primaryActionButton,
                      !distractionText.trim() && styles.disabledActionButton,
                    ]}
                    onPress={handleCompleteTask}
                    disabled={isSubmitting || !distractionText.trim()}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={
                        distractionText.trim()
                          ? ['#10b981', '#059669']
                          : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryGradient}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          !distractionText.trim() && { color: '#64748b' },
                        ]}
                      >
                        {isSubmitting ? 'Recording Distraction...' : 'Complete Task'}
                      </Text>
                      <Feather
                        name="check"
                        size={19}
                        color={distractionText.trim() ? '#ffffff' : '#64748b'}
                        style={{ marginLeft: 8 }}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — COMPLETION / REWARD                         */}
          {/* ==================================================== */}
          {page === 3 && (
            <ScrollView
              contentContainerStyle={styles.page3Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Confetti Particle Overlay */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CONFETTI_PARTICLES.map((particle, idx) => {
                  const anim = confettiFallAnims[idx];
                  const translateY = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, height * 0.75],
                  });
                  const opacity = anim.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 1, 0.9, 0],
                  });
                  const rotate = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(idx % 2 === 0 ? 1 : -1) * 720}deg`],
                  });

                  return (
                    <Animated.View
                      key={particle.id}
                      style={{
                        position: 'absolute',
                        left: particle.x,
                        top: 0,
                        width: particle.size,
                        height: particle.size * 1.3,
                        backgroundColor: particle.color,
                        borderRadius: 3,
                        opacity,
                        transform: [{ translateY }, { rotate }],
                      }}
                    />
                  );
                })}
              </View>

              {/* Satisfying Celebration Centerpiece */}
              <View style={styles.celebrationStage}>
                {/* Expanding Glowing Aura Ring */}
                <Animated.View
                  style={[
                    styles.celebrationAura,
                    {
                      transform: [
                        {
                          scale: celebrationAuraAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.6, 1.4],
                          }),
                        },
                      ],
                      opacity: celebrationAuraAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.8, 0.4],
                      }),
                    },
                  ]}
                />

                {/* Pop-in Trophy / Check Medallion */}
                <Animated.View
                  style={[
                    styles.medallionWrapper,
                    {
                      transform: [{ scale: trophyScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#047857']}
                    style={styles.medallionCircle}
                  >
                    <Feather name="check" size={54} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Completion Heading */}
              <View style={styles.completionTextGroup}>
                <Text style={styles.completionHeading}>Distraction Noted</Text>
                <Text style={styles.completionSubHeading}>
                  Awareness is the first step toward taking back your attention.
                </Text>
              </View>

              {/* Prominent +100 Points Reward Card */}
              <Animated.View
                style={[
                  styles.prominentRewardCard,
                  {
                    opacity: rewardCardOpacityAnim,
                    transform: [{ translateY: rewardCardSlideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.16)', 'rgba(5, 150, 105, 0.08)']}
                  style={styles.rewardCardGradient}
                >
                  <View style={styles.rewardSparkleRow}>
                    <Feather name="star" size={18} color="#fbbf24" />
                    <Text style={styles.rewardLabel}>OFFICIAL REWARD</Text>
                    <Feather name="star" size={18} color="#fbbf24" />
                  </View>

                  <Text style={styles.giantPointsText}>+100 Points</Text>

                  {/* Live Backend Synchronization Status Badge */}
                  <View style={styles.backendStatusBadge}>
                    <Ionicons
                      name={
                        rewardStatus === 'error'
                          ? 'alert-circle'
                          : 'shield-checkmark'
                      }
                      size={15}
                      color={
                        rewardStatus === 'error'
                          ? '#f87171'
                          : rewardStatus === 'already_claimed'
                          ? '#fbbf24'
                          : '#34d399'
                      }
                    />
                    <Text style={styles.backendStatusText}>
                      {rewardStatus === 'already_claimed'
                        ? 'Session reward already claimed (+100 banked)'
                        : rewardStatus === 'error'
                        ? 'Completed (Check network connection)'
                        : 'Added to your backend points balance'}
                    </Text>
                  </View>

                  {userTotalPoints !== null && (
                    <View style={styles.userSummaryRow}>
                      <Text style={styles.totalBalanceText}>
                        Total Balance: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{userTotalPoints}</Text> pts
                      </Text>
                      {currentStreak !== null && currentStreak > 0 && (
                        <Text style={styles.streakText}>
                          🔥 {currentStreak} day streak
                        </Text>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* Recorded Distraction Confirmation Card */}
              <View style={styles.recordedDistractionCard}>
                <View style={styles.recordedDistractionHeader}>
                  <Feather name="file-text" size={15} color="#fbbf24" />
                  <Text style={styles.recordedDistractionTitle}>Your Distraction Entry</Text>
                </View>
                <Text style={styles.recordedDistractionContent} numberOfLines={3}>
                  "{distractionText.trim()}"
                </Text>
              </View>

              {/* Primary Action Button: "Return to Home" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.doneActionButton}
                  onPress={() => {
                    triggerHaptic('medium');
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(tabs)');
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Return to Home</Text>
                    <Feather name="check" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ----------------------------------------------------
// STYLESHEET (PREMIUM ANTISOCIALS OBSIDIAN DESIGN SYSTEM)
// ----------------------------------------------------
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#02050a',
  },
  safeAreaLayer: {
    flex: 1,
  },

  // Ambient Nebula Glow Orbs
  ambientOrbAmber: {
    position: 'absolute',
    top: height * 0.12,
    left: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  ambientOrbCyan: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },

  // Navigation Header
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    zIndex: 10,
  },
  circleNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  headerPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  pageIndicatorContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pageIndicatorText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },

  pageAnimatedContainer: {
    flex: 1,
  },

  // ==========================================
  // PAGE 1 STYLES
  // ==========================================
  page1Scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mascotStage: {
    width: width * 0.85,
    height: height * 0.36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  rippleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'transparent',
  },
  notepadMascotCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 10,
  },
  notepadMascotGradient: {
    flex: 1,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  introContentSection: {
    width: '100%',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  badgeReward: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // EXACTLY 2-LINE INTRODUCTION
  twoLineCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  explanationLine1: {
    color: '#f1f5f9',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  explanationLine2: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 2,
  },

  mindfulNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  mindfulNoteText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  bottomCtaContainer: {
    width: '100%',
    paddingTop: 16,
  },
  primaryActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledActionButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // ==========================================
  // PAGE 2 STYLES
  // ==========================================
  page2Scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  page2HeaderSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  page2IconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  page2Heading: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  page2Subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  inputCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginVertical: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  textInputArea: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  charCountText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  charCountNumber: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  writingTipCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  writingTipText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '400',
    lineHeight: 18,
  },

  // ==========================================
  // PAGE 3 STYLES
  // ==========================================
  page3Scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  celebrationStage: {
    width: width * 0.85,
    height: height * 0.26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  celebrationAura: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  medallionWrapper: {
    width: 106,
    height: 106,
    borderRadius: 53,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 12,
  },
  medallionCircle: {
    flex: 1,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completionTextGroup: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  completionHeading: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  completionSubHeading: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  prominentRewardCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    marginVertical: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  rewardCardGradient: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rewardSparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rewardLabel: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  giantPointsText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginVertical: 4,
    textShadowColor: 'rgba(16, 185, 129, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  backendStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    marginTop: 6,
  },
  backendStatusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  userSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  totalBalanceText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  streakText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },

  recordedDistractionCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  recordedDistractionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recordedDistractionTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  recordedDistractionContent: {
    color: '#e2e8f0',
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
    fontStyle: 'italic',
  },

  doneActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
});
