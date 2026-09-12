import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Modal,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// 5 Awareness Categories for Page 2
interface AwarenessCategory {
  id: 'see' | 'hear' | 'feel' | 'breathe' | 'space';
  title: 'SEE' | 'HEAR' | 'FEEL' | 'BREATHE' | 'SPACE';
  description: string;
  iconName: string;
  iconFamily: 'feather' | 'ionicons' | 'material';
  panelPrompt1: string;
  panelPrompt2: string;
  buttonLabel: string;
}

const CATEGORIES: AwarenessCategory[] = [
  {
    id: 'see',
    title: 'SEE',
    description: 'Notice something you can see.',
    iconName: 'eye',
    iconFamily: 'feather',
    panelPrompt1: 'Look around slowly.',
    panelPrompt2: 'Choose one thing that catches your attention.',
    buttonLabel: 'I Noticed It',
  },
  {
    id: 'hear',
    title: 'HEAR',
    description: 'Notice a sound around you.',
    iconName: 'volume-2',
    iconFamily: 'feather',
    panelPrompt1: 'Pause and listen.',
    panelPrompt2: 'Notice one sound without judging it.',
    buttonLabel: 'I Heard It',
  },
  {
    id: 'feel',
    title: 'FEEL',
    description: 'Notice one physical sensation.',
    iconName: 'hand-left-outline',
    iconFamily: 'ionicons',
    panelPrompt1: 'Notice how your body feels right now.',
    panelPrompt2: 'Feel the contact of your feet, seat, or the air on your skin.',
    buttonLabel: 'I Felt It',
  },
  {
    id: 'breathe',
    title: 'BREATHE',
    description: 'Notice one natural breath.',
    iconName: 'weather-windy',
    iconFamily: 'material',
    panelPrompt1: 'Notice one natural breath.',
    panelPrompt2: "Don't change it. Just notice it.",
    buttonLabel: 'I Noticed My Breath',
  },
  {
    id: 'space',
    title: 'SPACE',
    description: 'Notice something about the space around you.',
    iconName: 'compass-outline',
    iconFamily: 'material',
    panelPrompt1: 'Look at the space around you.',
    panelPrompt2: 'Notice one detail you normally overlook.',
    buttonLabel: 'I Noticed My Surroundings',
  },
];

// Inward Floating Particles for Page 1 Presence Core
const INWARD_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 2 * Math.PI;
  const dist = 75 + Math.random() * 25;
  return {
    id: i,
    initialX: Math.cos(angle) * dist,
    initialY: Math.sin(angle) * dist,
    size: 4 + (i % 3) * 2,
    color: i % 2 === 0 ? '#10b981' : '#0284c7',
  };
});

// Celebration Particles for Page 3
const CELEBRATION_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#0284c7', '#34d399', '#38bdf8', '#f59e0b', '#ec4899'][i % 6],
  size: 5 + Math.random() * 7,
  delay: (i % 7) * 140,
  duration: 2200 + Math.random() * 800,
}));

export default function ConfirmPresenceTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 3 PAGES (NO COUNTDOWN TIMER ANYWHERE)
  // 1: "Be Here" (Introduction)
  // 2: Interactive Presence Check (5 awareness categories)
  // 3: Completion + 100 Points
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3>(1);

  // Safe Haptics
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
    } catch {}
  };

  // ----------------------------------------------------
  // PAGE 2: 5 AWARENESS CATEGORIES COMPLETION STATE
  // ----------------------------------------------------
  const [completedCategories, setCompletedCategories] = useState<Record<string, boolean>>({
    see: false,
    hear: false,
    feel: false,
    breathe: false,
    space: false,
  });
  const [activeModalCategory, setActiveModalCategory] = useState<AwarenessCategory | null>(null);

  // Count completed
  const completedCount = Object.values(completedCategories).filter(Boolean).length;
  const allCategoriesCompleted = completedCount === 5;

  // ----------------------------------------------------
  // PAGE 3: SUBMISSION STATES
  // ----------------------------------------------------
  const [isClaimingPoints, setIsClaimingPoints] = useState(false);
  const hasClaimedRef = useRef(false);

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  // Page Transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Page 1 Sequential Entrance
  const bgFadeAnim = useRef(new Animated.Value(0)).current;
  const centralGlowScale = useRef(new Animated.Value(0.8)).current;
  const centralGlowOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.7)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const inwardDriftAnim = useRef(new Animated.Value(1)).current; // 1 = outer, 0 = center
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(24)).current;
  const startButtonSpringAnim = useRef(new Animated.Value(0)).current;
  const buttonBreathAnim = useRef(new Animated.Value(1)).current;

  // Page 2 Progress Bar Animation
  const progressBarAnim = useRef(new Animated.Value(0)).current;

  // Page 3 Celebration Animations
  const celebrationMedallionScale = useRef(new Animated.Value(0)).current;
  const celebrationAuraAnim = useRef(new Animated.Value(0)).current;
  const rewardCardSlideAnim = useRef(new Animated.Value(30)).current;
  const rewardCardOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiFallAnims = useRef(CELEBRATION_PARTICLES.map(() => new Animated.Value(0))).current;

  // ----------------------------------------------------
  // PAGE 1: SEQUENTIAL ENTRANCE ANIMATION
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Background softly fades in
    Animated.timing(bgFadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 2. Central glow appears
    Animated.parallel([
      Animated.timing(centralGlowOpacity, {
        toValue: 1,
        duration: 900,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(centralGlowScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 3. Rings expand slowly
      Animated.parallel([
        Animated.timing(ring1Opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(ring1Scale, { toValue: 1.25, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0.35, duration: 1100, useNativeDriver: true }),
        Animated.timing(ring2Scale, { toValue: 1.55, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      // 4. Floating particles move toward center
      Animated.timing(inwardDriftAnim, {
        toValue: 0,
        duration: 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // 5. Title & Description slide and fade upward
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 700,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 700,
          delay: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 6. Start button enters with smooth spring
        Animated.spring(startButtonSpringAnim, {
          toValue: 1,
          friction: 6,
          tension: 55,
          useNativeDriver: true,
        }).start();
      });
    });

    // Continuous presence ripple breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Scale, {
          toValue: 1.35,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Scale, {
          toValue: 1.2,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button subtle breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonBreathAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonBreathAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // PROGRESS BAR SYNC ON PAGE 2
  // ----------------------------------------------------
  useEffect(() => {
    Animated.timing(progressBarAnim, {
      toValue: completedCount / 5,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // width animation
    }).start();
  }, [completedCount]);

  // ----------------------------------------------------
  // PAGE TRANSITION HELPER
  // ----------------------------------------------------
  const transitionToPage = useCallback((nextPage: 1 | 2 | 3) => {
    triggerHaptic('light');
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -12,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(nextPage);
      pageSlideAnim.setValue(12);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // ----------------------------------------------------
  // PAGE 1 -> PAGE 2
  // ----------------------------------------------------
  const handleBegin = () => {
    transitionToPage(2);
  };

  // ----------------------------------------------------
  // PAGE 2: INTERACTION PANEL HANDLING
  // ----------------------------------------------------
  const handleOpenCategory = (cat: AwarenessCategory) => {
    triggerHaptic('light');
    setActiveModalCategory(cat);
  };

  const handleConfirmCategory = (id: string) => {
    triggerHaptic('success');
    setCompletedCategories((prev) => ({
      ...prev,
      [id]: true,
    }));
    setActiveModalCategory(null);
  };

  // ----------------------------------------------------
  // PAGE 2 -> PAGE 3
  // ----------------------------------------------------
  const handleCompletePresenceCheck = () => {
    if (!allCategoriesCompleted) {
      triggerHaptic('warning');
      Alert.alert('Notice Remaining', 'Please take a moment to notice all 5 awareness categories.');
      return;
    }
    transitionToPage(3);
  };

  // ----------------------------------------------------
  // PAGE 3: CELEBRATION & AUTHENTICATED POINTS CLAIM
  // ----------------------------------------------------
  useEffect(() => {
    if (page === 3) {
      Animated.spring(celebrationMedallionScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();

      Animated.timing(celebrationAuraAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.timing(rewardCardOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rewardCardSlideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Cascading celebratory confetti particles
      confettiFallAnims.forEach((anim, i) => {
        anim.setValue(0);
        Animated.sequence([
          Animated.delay(CELEBRATION_PARTICLES[i].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: CELEBRATION_PARTICLES[i].duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [page]);

  const handleClaimPoints = async () => {
    if (isClaimingPoints || hasClaimedRef.current) return;
    hasClaimedRef.current = true;
    setIsClaimingPoints(true);
    triggerHaptic('medium');

    let pointsData = {
      pointsAdded: '100',
      totalPoints: '0',
      streak: '0',
    };

    try {
      const token = await SecureStore.getItemAsync('token');

      if (token) {
        // Authenticated task completion request
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Confirm Presence',
          }),
        });

        const data = await response.json();

        if (response.ok || data.success) {
          triggerHaptic('success');
          const earned = data.pointsEarned ?? data.pointsAdded ?? data.points_earned ?? 100;
          const total = data.totalPoints ?? data.total_points ?? 0;
          const streakNum = data.currentStreak ?? data.current_streak ?? data.streak ?? 0;

          pointsData = {
            pointsAdded: earned.toString(),
            totalPoints: total.toString(),
            streak: streakNum.toString(),
          };
        } else {
          hasClaimedRef.current = false;
          Alert.alert('Error', data.error || 'Failed to submit task completion. Please try again.');
          setIsClaimingPoints(false);
          return;
        }
      } else {
        hasClaimedRef.current = false;
        Alert.alert('Authorization Error', 'No authorization token found. Please log in again.');
        setIsClaimingPoints(false);
        return;
      }
    } catch (e) {
      console.error('Error claiming points:', e);
      hasClaimedRef.current = false;
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaimingPoints(false);
      return;
    } finally {
      setIsClaimingPoints(false);
    }

    // Navigate to existing task-success route
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Confirm Presence',
        task_name: 'Confirm Presence',
        difficulty: 'Easy',
        message: 'You took a moment to notice the world around you.',
      },
    } as any);
  };

  const renderIcon = (cat: AwarenessCategory, color = '#10b981', size = 22) => {
    if (cat.iconFamily === 'feather') {
      return <Feather name={cat.iconName as any} size={size} color={color} />;
    } else if (cat.iconFamily === 'ionicons') {
      return <Ionicons name={cat.iconName as any} size={size} color={color} />;
    }
    return <MaterialCommunityIcons name={cat.iconName as any} size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Clean White/Light Gradient Background */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: bgFadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#f0fdf4', '#f0f9ff']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              if (page > 1) {
                transitionToPage((page - 1) as 1 | 2);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)');
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>

          {/* Step Pill */}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Page {page} of 3</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Dynamic Animated Content Container */}
        <Animated.View
          style={[
            styles.pageContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {/* ==================================================== */}
          {/* PAGE 1 — "BE HERE" (INTRODUCTION) */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Abstract Presence Centerpiece Animation */}
              <View style={styles.presenceCenterpieceWrapper}>
                {/* Outer Ripple Ring 2 */}
                <Animated.View
                  style={[
                    styles.presenceRing2,
                    {
                      transform: [{ scale: ring2Scale }],
                      opacity: ring2Opacity,
                    },
                  ]}
                />

                {/* Concentric Ripple Ring 1 */}
                <Animated.View
                  style={[
                    styles.presenceRing1,
                    {
                      transform: [{ scale: ring1Scale }],
                      opacity: ring1Opacity,
                    },
                  ]}
                />

                {/* Central Glowing Presence Core */}
                <Animated.View
                  style={[
                    styles.presenceCore,
                    {
                      opacity: centralGlowOpacity,
                      transform: [{ scale: centralGlowScale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.presenceCoreGradient}
                  >
                    <Ionicons name="sparkles" size={28} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>

                {/* Floating Dots drifting toward center */}
                {INWARD_PARTICLES.map((p) => (
                  <Animated.View
                    key={p.id}
                    style={{
                      position: 'absolute',
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: p.color,
                      transform: [
                        {
                          translateX: inwardDriftAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, p.initialX],
                          }),
                        },
                        {
                          translateY: inwardDriftAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, p.initialY],
                          }),
                        },
                      ],
                      opacity: inwardDriftAnim.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [0, 0.8, 0.5],
                      }),
                    }}
                  />
                ))}
              </View>

              {/* Title, Subtitle, & Descriptions */}
              <Animated.View
                style={[
                  styles.page1ContentWrapper,
                  {
                    opacity: contentFadeAnim,
                    transform: [{ translateY: contentSlideAnim }],
                  },
                ]}
              >
                {/* Small category label */}
                <View style={styles.categoryPill}>
                  <Feather name="compass" size={13} color="#059669" />
                  <Text style={styles.categoryPillText}>Mindful Break</Text>
                </View>

                <Text style={styles.mainTitle}>Confirm Presence</Text>
                <Text style={styles.subtitle}>
                  Pause for a moment. Notice that you are here.
                </Text>

                {/* Description Card */}
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>
                    Instead of rushing to the next thing, take a moment to reconnect with the place, sounds and sensations around you.
                  </Text>
                </View>

                {/* Badges: Mindfulness, Easy, +100 Points */}
                <View style={styles.badgeRow}>
                  <View style={[styles.badgePill, styles.badgeCategory]}>
                    <Feather name="shield" size={13} color="#0284c7" />
                    <Text style={[styles.badgeText, { color: '#0284c7' }]}>Mindfulness</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="feather" size={13} color="#059669" />
                    <Text style={[styles.badgeText, { color: '#059669' }]}>Easy</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Ionicons name="sparkles" size={13} color="#d97706" />
                    <Text style={[styles.badgeText, { color: '#d97706' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* Small Animated Message */}
                <View style={styles.promptCueRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.promptCueText}>Nothing to achieve. Just notice.</Text>
                </View>
              </Animated.View>

              {/* Bottom Primary Action Button: "Begin" */}
              <Animated.View
                style={[
                  styles.ctaContainer,
                  {
                    transform: [{ scale: startButtonSpringAnim }, { scale: buttonBreathAnim }],
                    opacity: startButtonSpringAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleBegin}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Begin</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — INTERACTIVE PRESENCE CHECK (NO TIMER) */}
          {/* ==================================================== */}
          {page === 2 && (
            <ScrollView
              contentContainerStyle={styles.page2Scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.page2Header}>
                <Text style={styles.page2Title}>Be Present</Text>
                <Text style={styles.page2Subtitle}>
                  Look around you and notice what is actually here.
                </Text>

                {/* Progress Header & Animated Progress Bar */}
                <View style={styles.progressHeaderCard}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>Presence Check</Text>
                    <Text style={styles.progressCountText}>{completedCount} / 5</Text>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: progressBarAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* 5 Awareness Category Cards */}
              <View style={styles.categoriesContainer}>
                {CATEGORIES.map((cat, idx) => {
                  const isDone = completedCategories[cat.id];
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        isDone && styles.categoryCardCompleted,
                      ]}
                      onPress={() => handleOpenCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.categoryIconCircle,
                          isDone && styles.categoryIconCircleCompleted,
                        ]}
                      >
                        {renderIcon(cat, isDone ? '#ffffff' : '#059669', 20)}
                      </View>

                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.categoryIndexText}>{idx + 1}. </Text>
                          <Text style={styles.categoryTitleText}>{cat.title}</Text>
                        </View>
                        <Text style={styles.categoryDescText}>{cat.description}</Text>
                      </View>

                      {/* Completed State Checkmark or Open Cue */}
                      {isDone ? (
                        <View style={styles.checkDoneBadge}>
                          <Feather name="check" size={15} color="#ffffff" />
                        </View>
                      ) : (
                        <View style={styles.openCueBadge}>
                          <Feather name="chevron-right" size={16} color="#94a3b8" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Completed State Banner (Visible when all 5 are done) */}
              {allCategoriesCompleted && (
                <View style={styles.allDoneBanner}>
                  <LinearGradient
                    colors={['#f0fdf4', '#ecfdf5']}
                    style={styles.allDoneGradient}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.allDoneTitle}>You're Here.</Text>
                      <Text style={styles.allDoneSubtitle}>
                        You just gave your attention to the moment you're living.
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Bottom Button: "Complete Presence Check" */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    !allCategoriesCompleted && styles.disabledActionButton,
                  ]}
                  onPress={handleCompletePresenceCheck}
                  activeOpacity={allCategoriesCompleted ? 0.88 : 1}
                  disabled={!allCategoriesCompleted}
                >
                  <LinearGradient
                    colors={
                      allCategoriesCompleted
                        ? ['#10b981', '#059669']
                        : ['#cbd5e1', '#94a3b8']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Complete Presence Check</Text>
                    <Feather
                      name={allCategoriesCompleted ? 'arrow-right' : 'lock'}
                      size={18}
                      color="#ffffff"
                      style={{ marginLeft: 8 }}
                    />
                  </LinearGradient>
                </TouchableOpacity>

                {!allCategoriesCompleted && (
                  <Text style={styles.remainingHintText}>
                    Notice all 5 categories above to complete your presence check ({5 - completedCount} remaining)
                  </Text>
                )}
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — COMPLETION & 100 POINTS CLAIM */}
          {/* ==================================================== */}
          {page === 3 && (
            <ScrollView
              contentContainerStyle={styles.page3Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Falling Celebration Particles */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CELEBRATION_PARTICLES.map((particle, i) => (
                  <Animated.View
                    key={particle.id}
                    style={{
                      position: 'absolute',
                      left: particle.x,
                      top: -20,
                      width: particle.size,
                      height: particle.size * 1.4,
                      borderRadius: particle.size / 2,
                      backgroundColor: particle.color,
                      transform: [
                        {
                          translateY: confettiFallAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, height * 0.75],
                          }),
                        },
                        {
                          rotate: confettiFallAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                      opacity: confettiFallAnims[i].interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [1, 0.9, 0],
                      }),
                    }}
                  />
                ))}
              </View>

              {/* Expanding Glowing Circle Medallion */}
              <View style={styles.celebrationCenter}>
                <Animated.View
                  style={[
                    styles.celebrationAuraRing,
                    {
                      transform: [
                        {
                          scale: celebrationAuraAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.6, 1.45],
                          }),
                        },
                      ],
                      opacity: celebrationAuraAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.7, 0.2],
                      }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.celebrationMedallion,
                    {
                      transform: [{ scale: celebrationMedallionScale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.medallionGradient}
                  >
                    <Ionicons name="checkmark-sharp" size={48} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Completion Headlines */}
              <View style={styles.completionHeaders}>
                <Text style={styles.completionTitle}>Presence Confirmed</Text>
                <Text style={styles.completionSubtitle}>
                  You took a moment to notice the world around you.
                </Text>

                <View style={styles.calmMessagePill}>
                  <Ionicons name="sparkles" size={13} color="#059669" />
                  <Text style={styles.calmMessageText}>
                    Sometimes being present is the most productive thing you can do.
                  </Text>
                </View>
              </View>

              {/* Prominent +100 Points Reward Card */}
              <Animated.View
                style={[
                  styles.rewardCardContainer,
                  {
                    opacity: rewardCardOpacityAnim,
                    transform: [{ translateY: rewardCardSlideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#ffffff', '#fdfcf7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rewardCardGradient}
                >
                  <View style={styles.rewardTrophyCircle}>
                    <Ionicons name="trophy" size={28} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.rewardLabel}>AUTHENTIC REWARD</Text>
                    <Text style={styles.rewardPointsAmount}>+100 Points</Text>
                  </View>
                  <View style={styles.rewardVerifiedPill}>
                    <Feather name="shield" size={13} color="#10b981" />
                    <Text style={styles.rewardVerifiedText}>Backend Verified</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Accomplishment Highlights */}
              <View style={styles.accomplishmentSummaryCard}>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Anchored attention in real-time environment</Text>
                </View>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Practiced 5 distinct sensory awareness modalities</Text>
                </View>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Stepped out of autopilot into conscious presence</Text>
                </View>
              </View>

              {/* Authenticated Claim Button */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    isClaimingPoints && styles.disabledActionButton,
                  ]}
                  onPress={handleClaimPoints}
                  activeOpacity={0.88}
                  disabled={isClaimingPoints}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    {isClaimingPoints ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={[styles.primaryButtonText, { marginLeft: 10 }]}>
                          Verifying with Backend...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Claim +100 Points</Text>
                        <Ionicons name="sparkles" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* ==================================================== */}
      {/* FOCUSED INTERACTION MODAL PANEL (PAGE 2) */}
      {/* ==================================================== */}
      {activeModalCategory && (
        <Modal
          visible={!!activeModalCategory}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModalCategory(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setActiveModalCategory(null)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalIconCircle}>
                  {renderIcon(activeModalCategory, '#059669', 24)}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalCategoryTitle}>{activeModalCategory.title}</Text>
                  <Text style={styles.modalCategorySubtitle}>Conscious Awareness</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveModalCategory(null)}
                  style={styles.modalCloseBtn}
                >
                  <Feather name="x" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Guided Sensory Prompts */}
              <View style={styles.modalPromptsBox}>
                <Text style={styles.modalPrompt1}>{activeModalCategory.panelPrompt1}</Text>
                <Text style={styles.modalPrompt2}>{activeModalCategory.panelPrompt2}</Text>
              </View>

              {/* Confirm Action Button */}
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => handleConfirmCategory(activeModalCategory.id)}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>{activeModalCategory.buttonLabel}</Text>
                  <Feather name="check" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  pageContainer: {
    flex: 1,
  },

  // PAGE 1 STYLES
  page1Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  presenceCenterpieceWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
  },
  presenceRing2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: 'rgba(2, 132, 199, 0.35)',
    backgroundColor: 'rgba(240, 249, 255, 0.25)',
  },
  presenceRing1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(240, 253, 244, 0.4)',
  },
  presenceCore: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  presenceCoreGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  page1ContentWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 5,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  descriptionCard: {
    width: '100%',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeCategory: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  badgeDifficulty: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  badgeReward: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  promptCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 7,
  },
  promptCueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  ctaContainer: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  primaryActionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledActionButton: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // PAGE 2 STYLES
  page2Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  page2Header: {
    marginBottom: 16,
  },
  page2Title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  page2Subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  progressHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  categoriesContainer: {
    marginTop: 6,
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryCardCompleted: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconCircleCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  categoryIndexText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  categoryTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  categoryDescText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  checkDoneBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openCueBadge: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allDoneBanner: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  allDoneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  allDoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065f46',
  },
  allDoneSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
    lineHeight: 18,
  },
  remainingHintText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },

  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCategoryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCategorySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPromptsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginVertical: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalPrompt1: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 23,
  },
  modalPrompt2: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
    lineHeight: 20,
  },
  modalConfirmBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },

  // PAGE 3 STYLES
  page3Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  celebrationCenter: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    position: 'relative',
  },
  celebrationAuraRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  celebrationMedallion: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  medallionGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionHeaders: {
    alignItems: 'center',
    marginTop: 18,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  calmMessagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  calmMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
    textAlign: 'center',
  },
  rewardCardContainer: {
    width: '100%',
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardTrophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    letterSpacing: 0.8,
  },
  rewardPointsAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  rewardVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  rewardVerifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  accomplishmentSummaryCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accomplishmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  accomplishmentText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 10,
  },
});
