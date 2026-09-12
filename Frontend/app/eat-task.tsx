import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Local Asset Imports
const HERO_IMAGE_SOURCE = require('../assets/images/make_it_9_16_image_2K_202608051427.jpeg');
const VIDEO_SOURCE = require('../assets/videos/Eating_food_consciously_202608051401.mp4');

// 7 Mindful Eating Steps for Page 2
const MINDFUL_STEPS = [
  { emoji: '👀', text: 'Look at your bite' },
  { emoji: '👃', text: 'Notice the smell' },
  { emoji: '🥄', text: 'Take a small bite' },
  { emoji: '👅', text: 'Feel the texture' },
  { emoji: '😋', text: 'Notice the taste' },
  { emoji: '🧘', text: 'Slow down and chew' },
  { emoji: '❤️', text: 'Notice how you feel' },
];

// Confetti particle configuration for completion screen
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#f59e0b', '#06b6d4', '#3b82f6', '#ec4899', '#8b5cf6'][i % 6],
  size: 6 + Math.random() * 8,
  delay: (i % 8) * 140,
  duration: 2200 + Math.random() * 800,
}));

export default function EatTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 4 PAGES: 1 (intro), 2 (video/steps), 3 (write/upload), 4 (completion)
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3 | 4>(1);

  // Reflection & photo states for Page 3
  const [reflectionText, setReflectionText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend points & completion states for Page 4
  const [rewardStatus, setRewardStatus] = useState<'pending' | 'success' | 'already_claimed' | 'error'>('pending');
  const [userTotalPoints, setUserTotalPoints] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);

  // Guard ref ensuring backend submission runs strictly once per session
  const hasAwardedRef = useRef(false);

  // ----------------------------------------------------
  // VIDEO PLAYER SETUP FOR PAGE 2
  // Inline, Autoplay, Looping, No controls, Aspect ratio preserved
  // ----------------------------------------------------
  const videoPlayer = useVideoPlayer(VIDEO_SOURCE, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    if (page === 2) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [page, videoPlayer]);

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Ambient breathing background aura
  const ambientBreathAnim = useRef(new Animated.Value(1)).current;
  const ambientGlowAnim = useRef(new Animated.Value(0.4)).current;

  // Page 4 Trophy / Confetti Celebration Animations
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
      // Ignore if unsupported
    }
  };

  // ----------------------------------------------------
  // AMBIENT BACKGROUND ANIMATION
  // ----------------------------------------------------
  useEffect(() => {
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
  }, []);

  // ----------------------------------------------------
  // PAGE TRANSITIONS
  // ----------------------------------------------------
  const transitionToPage = useCallback((nextPage: 1 | 2 | 3 | 4) => {
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

  // PAGE 2 -> PAGE 3: User taps "Continue"
  const handleContinueToReflection = () => {
    transitionToPage(3);
  };

  // PAGE 3: Image Picker
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required to upload a food photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        triggerHaptic('light');
      }
    } catch (e) {
      console.error('Image picker error:', e);
    }
  };

  // PAGE 3: User taps "Complete Task"
  const handleCompleteTask = async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed) {
      triggerHaptic('warning');
      Alert.alert('Reflection Required', 'Please write what you noticed about your bite before continuing.');
      return;
    }

    if (isSubmitting || hasAwardedRef.current) return;
    hasAwardedRef.current = true;
    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const token = await SecureStore.getItemAsync('token');

      if (token) {
        // Complete task through existing backend points system
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Eat one bite consciously',
            reflection_sentence: trimmed,
            journal_entry: trimmed,
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
      // Advance to Page 4
      transitionToPage(4);
    }
  };

  // PAGE 4: Start celebration animation
  useEffect(() => {
    if (page === 4) {
      Animated.spring(trophyScaleAnim, {
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
          colors={['#030712', '#0f172a', '#02050a']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Radiant Glowing Nebula Orbs */}
      <Animated.View
        style={[
          styles.ambientOrbEmerald,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrbAmber,
          {
            opacity: ambientGlowAnim,
          },
        ]}
      />

      <SafeAreaView style={styles.safeAreaLayer} edges={['top', 'bottom']}>
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          {page !== 4 ? (
            <TouchableOpacity
              style={styles.circleNavButton}
              onPress={() => {
                if (page === 3) {
                  transitionToPage(2);
                } else if (page === 2) {
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
              {page === 1
                ? 'TASK INTRO'
                : page === 2
                ? 'MINDFUL BITE'
                : page === 3
                ? 'REFLECTION'
                : 'COMPLETE'}
            </Text>
          </View>

          <View style={styles.pageIndicatorContainer}>
            <Text style={styles.pageIndicatorText}>
              {page} <Text style={{ color: '#64748b' }}>/ 4</Text>
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
              {/* Hero Image Container */}
              <View style={styles.heroImageCard}>
                <Image
                  source={HERO_IMAGE_SOURCE}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(3, 7, 18, 0.85)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.heroBadgeOverlay}>
                  <Text style={styles.heroBadgeText}>MINDFUL NUTRITION</Text>
                </View>
              </View>

              {/* Task Title & Metadata */}
              <View style={styles.introContentSection}>
                <Text style={styles.taskTitle}>Eat One Bite Consciously</Text>

                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badgePill, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#38bdf8" />
                    <Text style={[styles.badgeText, { color: '#38bdf8' }]}>2 min</Text>
                  </View>

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
                    Slow down and give your full attention to just one bite of your food.
                  </Text>
                  <Text style={styles.explanationLine2} numberOfLines={1}>
                    Notice its taste, texture, smell, and how your body responds.
                  </Text>
                </View>
              </View>

              {/* Primary Action Button: "Start Task" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartTask}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
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
          {/* PAGE 2 — HOW TO EAT ONE SMALL BITE (VIDEO + 7 STEPS) */}
          {/* ==================================================== */}
          {page === 2 && (
            <ScrollView
              contentContainerStyle={styles.page2Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.page2Header}>
                <Text style={styles.page2Title}>How to Eat One Small Bite</Text>
                <Text style={styles.page2Subtitle}>
                  Follow these 7 mindful steps with your next bite.
                </Text>
              </View>

              {/* Video Player Container */}
              <View style={styles.videoPlayerCard}>
                <VideoView
                  player={videoPlayer}
                  style={styles.videoPlayer}
                  contentFit="cover"
                  nativeControls={false}
                />
              </View>

              {/* 7 Mindful Steps List */}
              <View style={styles.stepsCard}>
                {MINDFUL_STEPS.map((step, index) => (
                  <View key={index} style={styles.stepItemRow}>
                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                ))}
              </View>

              {/* Primary Button: "Continue" */}
              <View style={styles.bottomCtaContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleContinueToReflection}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Feather name="arrow-right" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — WRITE + UPLOAD                              */}
          {/* ==================================================== */}
          {page === 3 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={styles.page3Scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <View style={styles.page3Header}>
                  <Text style={styles.page3Title}>What did you notice?</Text>
                  <Text style={styles.page3Subtitle}>
                    Capture your sensory reflection while it's fresh.
                  </Text>
                </View>

                {/* Multiline Reflection Text Input Area */}
                <View style={styles.inputCard}>
                  <TextInput
                    style={styles.reflectionTextInput}
                    placeholder="Write what you noticed about the bite..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    textAlignVertical="top"
                  />
                  <View style={styles.charCountRow}>
                    <Text style={styles.charCountText}>
                      {reflectionText.trim().length > 0 ? '✓ Reflection ready' : 'Write your observation'}
                    </Text>
                    <Text style={styles.charCountNumber}>{reflectionText.length} chars</Text>
                  </View>
                </View>

                {/* Image Upload Area */}
                <View style={styles.uploadSectionCard}>
                  <View style={styles.uploadHeaderRow}>
                    <Feather name="camera" size={18} color="#34d399" />
                    <Text style={styles.uploadSectionTitle}>Upload a photo (Optional)</Text>
                  </View>

                  {photoUri ? (
                    <View style={styles.photoPreviewWrapper}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => setPhotoUri(null)}
                        activeOpacity={0.75}
                      >
                        <Feather name="x" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButtonDashed}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <Feather name="image" size={26} color="#34d399" style={{ marginBottom: 6 }} />
                      <Text style={styles.uploadButtonText}>Upload a photo</Text>
                      <Text style={styles.uploadButtonSub}>Select food image from library</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Primary Button: "Complete Task" */}
                <View style={styles.bottomCtaContainer}>
                  <TouchableOpacity
                    style={[
                      styles.primaryActionButton,
                      !reflectionText.trim() && styles.disabledActionButton,
                    ]}
                    onPress={handleCompleteTask}
                    disabled={isSubmitting || !reflectionText.trim()}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={
                        reflectionText.trim()
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
                          !reflectionText.trim() && { color: '#64748b' },
                        ]}
                      >
                        {isSubmitting ? 'Recording Experience...' : 'Complete Task'}
                      </Text>
                      <Feather
                        name="check"
                        size={19}
                        color={reflectionText.trim() ? '#ffffff' : '#64748b'}
                        style={{ marginLeft: 8 }}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* ==================================================== */}
          {/* PAGE 4 — COMPLETION / 100 POINTS                     */}
          {/* ==================================================== */}
          {page === 4 && (
            <ScrollView
              contentContainerStyle={styles.page4Scroll}
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
                <Text style={styles.completionHeading}>Mindful Bite Complete</Text>
                <Text style={styles.completionSubHeading}>
                  One mindful bite can change how you experience an entire meal.
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

                  {/* Backend Synchronization Status Badge */}
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

              {/* Recorded Reflection Confirmation Card */}
              <View style={styles.recordedCard}>
                <View style={styles.recordedHeader}>
                  <Feather name="feather" size={15} color="#34d399" />
                  <Text style={styles.recordedTitle}>Your Mindful Observation</Text>
                </View>
                <Text style={styles.recordedContent} numberOfLines={3}>
                  "{reflectionText.trim()}"
                </Text>
                {photoUri && (
                  <View style={styles.attachedPhotoRow}>
                    <Feather name="image" size={14} color="#38bdf8" />
                    <Text style={styles.attachedPhotoText}>Photo attached</Text>
                  </View>
                )}
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

  // Ambient Glow Orbs
  ambientOrbEmerald: {
    position: 'absolute',
    top: height * 0.1,
    left: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(16, 185, 129, 0.13)',
  },
  ambientOrbAmber: {
    position: 'absolute',
    bottom: height * 0.15,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
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
    backgroundColor: '#10b981',
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
  heroImageCard: {
    width: width * 0.88,
    height: height * 0.38,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginVertical: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  heroBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  introContentSection: {
    width: '100%',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
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
  badgeDuration: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
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

  twoLineCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
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

  bottomCtaContainer: {
    width: '100%',
    paddingTop: 16,
  },
  primaryActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
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
  page2Header: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  page2Title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  page2Subtitle: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  videoPlayerCard: {
    width: width * 0.88,
    height: height * 0.25,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    marginBottom: 14,
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  stepsCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 12,
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
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
  page3Header: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  page3Title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  page3Subtitle: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: 12,
  },
  reflectionTextInput: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
  uploadSectionCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  uploadSectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadButtonDashed: {
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.04)',
  },
  uploadButtonText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadButtonSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  photoPreviewWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==========================================
  // PAGE 4 STYLES
  // ==========================================
  page4Scroll: {
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

  recordedCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  recordedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recordedTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  recordedContent: {
    color: '#e2e8f0',
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  attachedPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  attachedPhotoText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
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
