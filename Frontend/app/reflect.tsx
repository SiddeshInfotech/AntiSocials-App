import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
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
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Local Image Asset
const LANTERN_IMAGE = require('../assets/images/reflect_insights_lantern.png');

// Page 2: 5 Vertical Timeline Milestones
const TIMELINE_MILESTONES = [
  {
    id: 'start',
    emoji: '🌱',
    title: 'A Fresh Start',
    desc: 'Something you began or tried this week.',
    color: '#34d399',
  },
  {
    id: 'win',
    emoji: '⚡',
    title: 'A Small Win',
    desc: 'Something you accomplished.',
    color: '#fbbf24',
  },
  {
    id: 'connection',
    emoji: '💬',
    title: 'A Meaningful Connection',
    desc: 'Someone or something that mattered.',
    color: '#f472b6',
  },
  {
    id: 'quiet',
    emoji: '🌤️',
    title: 'A Quiet Moment',
    desc: 'A moment when you slowed down.',
    color: '#38bdf8',
  },
  {
    id: 'unexpected',
    emoji: '✨',
    title: 'Something Unexpected',
    desc: 'Something that surprised you.',
    color: '#c084fc',
  },
];

// Page 3: 5 Interactive Categories
const MOMENT_CATEGORIES = [
  { id: 'proud', emoji: '🌟', title: 'A proud moment', desc: 'An obstacle overcome or personal high point' },
  { id: 'meaningful', emoji: '❤️', title: 'A meaningful moment', desc: 'Heartfelt connection or deep gratitude' },
  { id: 'laugh', emoji: '😂', title: 'A moment that made you laugh', desc: 'Lighthearted joy and shared smiles' },
  { id: 'growth', emoji: '🌱', title: 'A moment of growth', desc: 'A lesson learned or habit strengthened' },
  { id: 'unexpected', emoji: '✨', title: "A moment I didn't expect", desc: 'A pleasant surprise or fortunate spark' },
];

// Atmospheric Star Particles
const ATMOSPHERIC_STARS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 30) + 15,
  size: 2 + Math.random() * 4,
  duration: 4000 + Math.random() * 3500,
  delay: (i % 6) * 320,
  color: ['#e2e8f0', '#93c5fd', '#c4b5fd', '#fef08a', '#86efac'][i % 5],
}));

export default function ReflectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Exactly 5 Pages/Chapters: 1 -> 2 -> 3 -> 4 -> 5
  const [page, setPage] = useState<1 | 2 | 3 | 4 | 5>(1);

  // State across chapters
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [writtenReflection, setWrittenReflection] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Page Transition Animations (Slide + Fade)
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Page 1 Animations
  const orbPulseAnim = useRef(new Animated.Value(1)).current;
  const orbAuraAnim = useRef(new Animated.Value(0.5)).current;
  const headlineFadeAnim = useRef(new Animated.Value(0)).current;
  const subheadlineFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSpringAnim = useRef(new Animated.Value(0)).current;

  // Page 2 Timeline Sequential Reveal
  const timelineDrawAnim = useRef(new Animated.Value(0)).current;
  const timelineItemAnims = useRef(TIMELINE_MILESTONES.map(() => new Animated.Value(0))).current;

  // Page 5 Completion Animations
  const lanternScaleAnim = useRef(new Animated.Value(0.85)).current;
  const lanternGlowAnim = useRef(new Animated.Value(0.4)).current;
  const pointsSpringAnim = useRef(new Animated.Value(0)).current;
  const celebrationGlowSweep = useRef(new Animated.Value(0)).current;

  // Star Particles
  const starAnims = useRef(ATMOSPHERIC_STARS.map(() => new Animated.Value(0))).current;

  // Continuous background ambient loops
  useEffect(() => {
    // Gentle breathing for central element
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulseAnim, {
          toValue: 1.08,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulseAnim, {
          toValue: 0.95,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Soft aura glow pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAuraAnim, {
          toValue: 0.9,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbAuraAnim, {
          toValue: 0.45,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating particles
    starAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(ATMOSPHERIC_STARS[idx].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: ATMOSPHERIC_STARS[idx].duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Page 1 Staggered Entrance
    Animated.sequence([
      Animated.timing(headlineFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(subheadlineFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(buttonSpringAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Timeline Animation Trigger for Page 2
  useEffect(() => {
    if (page === 2) {
      timelineDrawAnim.setValue(0);
      timelineItemAnims.forEach((anim) => anim.setValue(0));

      Animated.timing(timelineDrawAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();

      const staggered = timelineItemAnims.map((anim, idx) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: idx * 110,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        })
      );
      Animated.stagger(90, staggered).start();
    }
  }, [page]);

  // Page 5 Completion Animation Sequence
  useEffect(() => {
    if (page === 5) {
      lanternScaleAnim.setValue(0.85);
      pointsSpringAnim.setValue(0);
      celebrationGlowSweep.setValue(0);

      // Sequence: 1. Screen enters -> 2. Lantern scales -> 3. Glow expands -> 4. Points spring -> 5. Glow sweep
      Animated.sequence([
        Animated.parallel([
          Animated.timing(lanternScaleAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(lanternGlowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(pointsSpringAnim, {
          toValue: 1,
          friction: 4,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationGlowSweep, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [page]);

  // Cinematic Horizontal Page Transition Helper
  const navigateToPage = (newPage: 1 | 2 | 3 | 4 | 5, direction: 'forward' | 'backward' = 'forward') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    const slideOutValue = direction === 'forward' ? -35 : 35;
    const slideInValue = direction === 'forward' ? 35 : -35;

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: slideOutValue,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(newPage);
      pageSlideAnim.setValue(slideInValue);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Back Navigation Handler
  const handleBackNavigation = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    if (page > 1) {
      navigateToPage((page - 1) as 1 | 2 | 3 | 4 | 5, 'backward');
    } else {
      router.back();
    }
  };

  // Page 4 Validation & Submission to Page 5
  const handleContinueWriting = () => {
    const trimmed = writtenReflection.trim();
    if (trimmed.length < 2) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (_) {}
      Alert.alert('Your Reflection', 'Please write a sentence or a few words about what made you smile.');
      return;
    }
    navigateToPage(5);
  };

  // Page 5 Authenticated Points Completion
  const handleDoneClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_) {}

    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to record your completion.');
        setIsClaiming(false);
        return;
      }

      const selectedCategory = MOMENT_CATEGORIES.find((c) => c.id === selectedMomentId)?.title || 'A Meaningful Moment';

      // Authenticated task completion (matches backend task ID 30, Medium difficulty => 300 points)
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 30,
          task_name: 'Reflect on Week',
          best_moment_category: selectedCategory,
          what_made_me_smile: writtenReflection.trim(),
          reflection_text: `Best moment: ${selectedCategory}. Smile reflection: ${writtenReflection.trim()}`,
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        pointsData = {
          pointsAdded: (data.pointsEarned ?? data.pointsAdded ?? data.points_earned ?? 300).toString(),
          totalPoints: (data.totalPoints ?? data.total_points ?? 0).toString(),
          streak: (data.currentStreak ?? data.streak ?? data.current_streak ?? 0).toString(),
        };

        router.replace({
          pathname: '/task-success',
          params: {
            points: pointsData.pointsAdded,
            totalPoints: pointsData.totalPoints,
            streak: pointsData.streak,
            taskName: 'Reflect on Your Week',
            difficulty: 'Medium',
            message: 'You made space to reflect.',
          },
        } as any);
      } else {
        Alert.alert('Unable to Record Completion', data.error || data.message || 'Please try again.');
        setIsClaiming(false);
      }
    } catch (err) {
      console.error('Reflect on Week completion error:', err);
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaiming(false);
    }
  };

  const isWritingActive = writtenReflection.trim().length >= 2;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Midnight Atmospheric Gradient */}
      <LinearGradient
        colors={['#060b17', '#0a0f24', '#0f172a', '#171433']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blue-Violet Atmospheric Lighting */}
      <View style={styles.ambientLightingContainer} pointerEvents="none">
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowBottom} />
      </View>

      {/* Floating Glowing Particle Stars */}
      <View style={styles.particleContainer} pointerEvents="none">
        {ATMOSPHERIC_STARS.map((p, idx) => (
          <Animated.View
            key={p.id}
            style={[
              styles.starParticle,
              {
                left: p.x,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: starAnims[idx].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.85, 0],
                }),
                transform: [
                  {
                    translateY: starAnims[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.9, height * 0.08],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Minimal Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={handleBackNavigation}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={18} color="#e2e8f0" />
          </TouchableOpacity>

          {/* Chapter Indicator */}
          <View style={styles.chapterBadge}>
            <View style={styles.chapterDotActive} />
            <Text style={styles.chapterText}>Chapter {page} of 5</Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* Dynamic Animated Chapter Container */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateX: pageSlideAnim }],
            },
          ]}
        >
          {/* ====================================================== */}
          {/* PAGE 1 — INTRO / OPENING JOURNEY                       */}
          {/* ====================================================== */}
          {page === 1 && (
            <View style={styles.chapterContent}>
              <View style={styles.introVisualStage}>
                {/* Central Glowing Circular Element Representing Passing Week */}
                <View style={styles.centralCircleWrapper}>
                  {/* Outer Breathing Aura */}
                  <Animated.View
                    style={[
                      styles.centralAuraHalo,
                      {
                        transform: [{ scale: orbPulseAnim }],
                        opacity: orbAuraAnim,
                      },
                    ]}
                  />

                  {/* Glassmorphic Luminous Core Ring */}
                  <Animated.View
                    style={[
                      styles.centralGlowingDisc,
                      { transform: [{ scale: orbPulseAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['rgba(99, 102, 241, 0.45)', 'rgba(168, 85, 247, 0.25)', 'rgba(15, 23, 42, 0.6)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.centralDiscGradient}
                    >
                      <View style={styles.centralSymbolContainer}>
                        <MaterialCommunityIcons name="compass-rose" size={48} color="#c4b5fd" />
                        <Text style={styles.weekLabelText}>7 DAYS</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* Typography Card */}
                <View style={styles.introTypographyCard}>
                  <Animated.Text style={[styles.headlineText, { opacity: headlineFadeAnim }]}>
                    Reflect on Your Week
                  </Animated.Text>
                  <Animated.Text style={[styles.subheadlineText, { opacity: subheadlineFadeAnim }]}>
                    Pause for a moment. Look back at the little things that made this week yours.
                  </Animated.Text>
                </View>
              </View>

              {/* Bottom CTA */}
              <Animated.View style={[styles.bottomActionArea, { opacity: buttonSpringAnim }]}>
                <TouchableOpacity
                  style={styles.primaryGradientButton}
                  onPress={() => navigateToPage(2)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5', '#4338ca']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    <Text style={styles.buttonLabelText}>Begin Journey →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 2 — YOUR WEEK TIMELINE                            */}
          {/* ====================================================== */}
          {page === 2 && (
            <View style={styles.chapterContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.timelineScrollWrapper}
              >
                <View style={styles.headerSection}>
                  <Text style={styles.chapterTitle}>Your Week, in Moments</Text>
                  <Text style={styles.chapterSubtitle}>
                    Every week leaves behind a few moments worth remembering.
                  </Text>
                </View>

                {/* Vertical Timeline with Exactly 5 Points */}
                <View style={styles.timelineWrapper}>
                  {/* Illuminated Connecting Line */}
                  <View style={styles.timelineLineBase} />

                  {TIMELINE_MILESTONES.map((item, idx) => (
                    <Animated.View
                      key={item.id}
                      style={[
                        styles.timelineRow,
                        {
                          opacity: timelineItemAnims[idx],
                          transform: [
                            {
                              translateY: timelineItemAnims[idx].interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {/* Animated Glowing Node */}
                      <View style={[styles.timelineNodeCapsule, { borderColor: item.color }]}>
                        <Text style={styles.timelineNodeEmoji}>{item.emoji}</Text>
                      </View>

                      {/* Translucent Glass Surface Card */}
                      <View style={styles.timelineGlassCard}>
                        <Text style={[styles.timelineItemTitle, { color: item.color }]}>
                          {item.title}
                        </Text>
                        <Text style={styles.timelineItemDesc}>{item.desc}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </ScrollView>

              {/* Bottom CTA */}
              <View style={styles.bottomActionArea}>
                <TouchableOpacity
                  style={styles.primaryGradientButton}
                  onPress={() => navigateToPage(3)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5', '#4338ca']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    <Text style={styles.buttonLabelText}>Begin Journey →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 3 — BEST MOMENT                                   */}
          {/* ====================================================== */}
          {page === 3 && (
            <View style={styles.chapterContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.choicesScrollWrapper}
              >
                <View style={styles.headerSection}>
                  <Text style={styles.chapterTitle}>Your Best Moment</Text>
                  <Text style={styles.chapterSubtitle}>
                    Which moment from this week would you want to remember?
                  </Text>
                </View>

                {/* 5 Selectable Moment Categories */}
                <View style={styles.choicesList}>
                  {MOMENT_CATEGORIES.map((cat) => {
                    const isSelected = selectedMomentId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.momentSelectionCard,
                          isSelected && styles.momentSelectionCardActive,
                          selectedMomentId !== null && !isSelected && styles.momentSelectionCardDimmed,
                        ]}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          } catch (_) {}
                          setSelectedMomentId(cat.id);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.momentEmojiBadge}>
                          <Text style={styles.momentEmojiText}>{cat.emoji}</Text>
                        </View>
                        <View style={styles.momentInfoBox}>
                          <Text style={[styles.momentTitleText, isSelected && styles.momentTitleTextActive]}>
                            {cat.title}
                          </Text>
                          <Text style={styles.momentDescText}>{cat.desc}</Text>
                        </View>
                        <View style={[styles.momentCheckCapsule, isSelected && styles.momentCheckCapsuleActive]}>
                          {isSelected && <Feather name="check" size={13} color="#ffffff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.promptHintWrapper}>
                  <Text style={styles.promptHintText}>Want to put it into words?</Text>
                </View>
              </ScrollView>

              {/* Large CTA Button: Write My Moment */}
              <View style={styles.bottomActionArea}>
                <TouchableOpacity
                  style={[styles.primaryGradientButton, !selectedMomentId && styles.buttonDisabled]}
                  onPress={() => {
                    if (selectedMomentId) {
                      navigateToPage(4);
                    }
                  }}
                  disabled={!selectedMomentId}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={selectedMomentId ? ['#8b5cf6', '#7c3aed', '#6d28d9'] : ['#334155', '#1e293b', '#0f172a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    <Text style={styles.buttonLabelText}>Write My Moment</Text>
                    <Feather name="arrow-right" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ====================================================== */}
          {/* PAGE 4 — WHAT MADE YOU SMILE?                          */}
          {/* ====================================================== */}
          {page === 4 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.chapterContent}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.writingScrollWrapper}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.headerSection}>
                    <Text style={styles.chapterTitle}>What made you smile?</Text>
                    <Text style={styles.chapterSubtitle}>
                      It doesn't have to be a big thing. The little moments count too.
                    </Text>
                  </View>

                  {/* Large Premium Multiline Writing Box */}
                  <View
                    style={[
                      styles.writingGlassCard,
                      isInputFocused && styles.writingGlassCardFocused,
                    ]}
                  >
                    <View style={styles.writingHeaderRow}>
                      <Feather name="feather" size={14} color="#a78bfa" />
                      <Text style={styles.writingFieldLabel}>Personal Reflection</Text>
                      <Text style={styles.writingCharCount}>{writtenReflection.length} characters</Text>
                    </View>

                    <TextInput
                      style={styles.multilineTextInput}
                      multiline
                      numberOfLines={6}
                      placeholder="Write about a moment that made you smile this week..."
                      placeholderTextColor="#64748b"
                      value={writtenReflection}
                      onChangeText={setWrittenReflection}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Small Encouraging Text */}
                  <View style={styles.encouragingNoteBox}>
                    <Ionicons name="sparkles" size={14} color="#38bdf8" />
                    <Text style={styles.encouragingNoteText}>
                      There is no right answer. Just write what feels true.
                    </Text>
                  </View>
                </ScrollView>

                {/* Bottom CTA: Continue -> */}
                <View style={styles.bottomActionArea}>
                  <TouchableOpacity
                    style={[styles.primaryGradientButton, !isWritingActive && styles.buttonSubtle]}
                    onPress={handleContinueWriting}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={
                        isWritingActive
                          ? ['#6366f1', '#4f46e5', '#4338ca']
                          : ['rgba(51, 65, 85, 0.6)', 'rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.6)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buttonGradientLayer}
                    >
                      <Text
                        style={[
                          styles.buttonLabelText,
                          !isWritingActive && { color: '#94a3b8' },
                        ]}
                      >
                        Continue →
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* ====================================================== */}
          {/* PAGE 5 — COMPLETION / REWARD                           */}
          {/* ====================================================== */}
          {page === 5 && (
            <View style={styles.chapterContent}>
              <View style={styles.completionStage}>
                {/* Lantern Visual Asset with Soft Expanding Light & Aura */}
                <View style={styles.lanternAssetContainer}>
                  <Animated.View
                    style={[
                      styles.lanternExpandingAura,
                      {
                        transform: [{ scale: lanternScaleAnim }],
                        opacity: lanternGlowAnim,
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      styles.lanternImageWrapper,
                      { transform: [{ scale: lanternScaleAnim }] },
                    ]}
                  >
                    <Image
                      source={LANTERN_IMAGE}
                      style={styles.lanternVisualImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                {/* Completion Messages */}
                <View style={styles.completionMessagesCard}>
                  <Text style={styles.completionHeadline}>You made space to reflect.</Text>
                  <Text style={styles.completionSubheadline}>
                    The moments we notice are the moments we remember.
                  </Text>

                  {/* Reward: +300 POINTS (Visual Focus) */}
                  <Animated.View
                    style={[
                      styles.pointsMedallionContainer,
                      { transform: [{ scale: pointsSpringAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['rgba(251, 191, 36, 0.15)', 'rgba(217, 119, 6, 0.25)', 'rgba(15, 23, 42, 0.8)']}
                      style={styles.pointsMedallionGradient}
                    >
                      <View style={styles.pointsAwardIconBadge}>
                        <Feather name="award" size={26} color="#fbbf24" />
                      </View>
                      <Text style={styles.pointsNumberText}>+300 POINTS</Text>
                      <Text style={styles.pointsSubtitleText}>Mindful Reflection Logged</Text>
                    </LinearGradient>
                  </Animated.View>

                  <Text style={styles.reflectionCompleteHint}>Reflection complete</Text>
                </View>
              </View>

              {/* Bottom CTA: Done */}
              <View style={styles.bottomActionArea}>
                <TouchableOpacity
                  style={[styles.primaryGradientButton, isClaiming && styles.buttonDisabled]}
                  onPress={handleDoneClaim}
                  disabled={isClaiming}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradientLayer}
                  >
                    {isClaiming ? (
                      <View style={styles.loadingFlexRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.buttonLabelText}>Recording Journey...</Text>
                      </View>
                    ) : (
                      <Text style={styles.buttonLabelText}>Done</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#060b17',
  },
  safeArea: {
    flex: 1,
  },
  ambientLightingContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starParticle: {
    position: 'absolute',
  },

  // Minimal Navigation Bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  chapterDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818cf8',
  },
  chapterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    letterSpacing: 0.3,
  },

  // Content Container
  contentContainer: {
    flex: 1,
  },
  chapterContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  // Page 1 — Intro
  introVisualStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralCircleWrapper: {
    width: Math.min(width * 0.6, 230),
    height: Math.min(width * 0.6, 230),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  centralAuraHalo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
  },
  centralGlowingDisc: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(165, 180, 252, 0.45)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  centralDiscGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralSymbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e0e7ff',
    letterSpacing: 2,
    marginTop: 6,
  },
  introTypographyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    width: '100%',
  },
  headlineText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subheadlineText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '400',
  },

  // Page 2 — Timeline
  timelineScrollWrapper: {
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  chapterTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  chapterSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 8,
  },
  timelineLineBase: {
    position: 'absolute',
    left: 27,
    top: 18,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  timelineNodeCapsule: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  timelineNodeEmoji: {
    fontSize: 18,
  },
  timelineGlassCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  timelineItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  timelineItemDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },

  // Page 3 — Best Moment
  choicesScrollWrapper: {
    paddingBottom: 20,
  },
  choicesList: {
    gap: 10,
  },
  momentSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    gap: 12,
  },
  momentSelectionCardActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  momentSelectionCardDimmed: {
    opacity: 0.55,
  },
  momentEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentEmojiText: {
    fontSize: 20,
  },
  momentInfoBox: {
    flex: 1,
  },
  momentTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  momentTitleTextActive: {
    color: '#e9d5ff',
  },
  momentDescText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  momentCheckCapsule: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentCheckCapsuleActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  promptHintWrapper: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  promptHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Page 4 — What Made You Smile?
  writingScrollWrapper: {
    paddingBottom: 20,
  },
  writingGlassCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  writingGlassCardFocused: {
    borderColor: '#818cf8',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  writingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  writingFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c4b5fd',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  writingCharCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  multilineTextInput: {
    minHeight: 160,
    fontSize: 15,
    color: '#f8fafc',
    lineHeight: 22,
  },
  encouragingNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  encouragingNoteText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7dd3fc',
    flex: 1,
  },

  // Page 5 — Completion / Reward
  completionStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lanternAssetContainer: {
    width: Math.min(width * 0.65, 230),
    height: Math.min(width * 0.65, 230),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  lanternExpandingAura: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(251, 191, 36, 0.22)',
  },
  lanternImageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lanternVisualImage: {
    width: '100%',
    height: '100%',
  },
  completionMessagesCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    width: '100%',
  },
  completionHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  completionSubheadline: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  pointsMedallionContainer: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    marginBottom: 12,
  },
  pointsMedallionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pointsAwardIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pointsNumberText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  pointsSubtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fde68a',
  },
  reflectionCompleteHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    letterSpacing: 0.5,
  },

  // Action Buttons
  bottomActionArea: {
    width: '100%',
    paddingBottom: 4,
  },
  primaryGradientButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonGradientLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSubtle: {
    opacity: 0.7,
  },
  loadingFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
