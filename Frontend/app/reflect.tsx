import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Image,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Fonts } from '../constants/theme';
import { API_BASE_URL } from '../constants/Api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SAVE_KEY = '@weekly_reflection_progress';

// Category types for step 3
interface CategoryBubble {
  id: string;
  emoji: string;
  label: string;
  size: number;
}

const MOMENT_CATEGORIES: CategoryBubble[] = [
  { id: 'win', emoji: '🏆', label: 'Personal Win', size: 100 },
  { id: 'happy', emoji: '😊', label: 'Happy Moment', size: 105 },
  { id: 'memory', emoji: '💜', label: 'Special Memory', size: 100 },
  { id: 'achieve', emoji: '🎖', label: 'Achievement', size: 105 },
  { id: 'other', emoji: '➕', label: 'Others', size: 90 },
];

// Intention categories for step 8
interface IntentionItem {
  id: string;
  emoji: string;
  label: string;
}

const INTENTIONS: IntentionItem[] = [
  { id: 'exercise', emoji: '💪', label: 'Exercise' },
  { id: 'learning', emoji: '📚', label: 'Learning' },
  { id: 'career', emoji: '💼', label: 'Career' },
  { id: 'relationships', emoji: '❤️', label: 'Relationships' },
  { id: 'mindfulness', emoji: '🧘', label: 'Mindfulness' },
  { id: 'finance', emoji: '💰', label: 'Finance' },
  { id: 'growth', emoji: '🌱', label: 'Personal Growth' },
  { id: 'custom', emoji: '✨', label: 'Custom Goal' },
];

// Helper to render static ambient background stars
function StarBackground() {
  const stars = Array.from({ length: 22 }).map((_, i) => {
    const top = `${Math.random() * 80}%`;
    const left = `${Math.random() * 95}%`;
    const size = Math.random() * 2 + 1;
    const delay = Math.random() * 4000;
    return (
      <StarItem key={i} top={top} left={left} size={size} delay={delay} />
    );
  });
  return <View style={StyleSheet.absoluteFillObject}>{stars}</View>;
}

function StarItem({ top, left, size, delay }: { top: string; left: string; size: number; delay: number }) {
  const opacity = useSharedValue(Math.random() * 0.4 + 0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: delay + 1500 }),
        withTiming(0.9, { duration: delay + 1500 })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[
        styles.starPoint,
        { top, left, width: size, height: size, borderRadius: size / 2 } as any,
        style
      ]}
    />
  );
}

// Floating Particle implementation
function FloatingParticle({ idx }: { idx: number }) {
  const particleY = useSharedValue(screenHeight * (0.6 + Math.random() * 0.4));
  const particleX = useSharedValue(screenWidth * Math.random());
  const particleScale = useSharedValue(Math.random() * 0.8 + 0.4);
  const particleOpacity = useSharedValue(Math.random() * 0.4 + 0.2);

  useEffect(() => {
    const floatDuration = 14000 + Math.random() * 12000;
    const initialDelay = idx * 650;

    particleY.value = withDelay(
      initialDelay,
      withRepeat(
        withTiming(-50, {
          duration: floatDuration,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false
      )
    );

    particleOpacity.value = withDelay(
      initialDelay,
      withRepeat(
        withSequence(
          withTiming(Math.random() * 0.6 + 0.3, { duration: floatDuration * 0.4 }),
          withTiming(0, { duration: floatDuration * 0.6 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: particleY.value },
        { translateX: particleX.value },
        { scale: particleScale.value },
      ],
      opacity: particleOpacity.value,
    };
  });

  return <Animated.View style={[styles.dustParticle, animatedStyle]} />;
}

// Category selection bubble with float
function CategoryBubbleItem({
  bubble,
  isSelected,
  onPress
}: {
  bubble: CategoryBubble;
  isSelected: boolean;
  onPress: () => void;
}) {
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6 - Math.random() * 4, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(6 + Math.random() * 4, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1.0, { duration: 150 });
  };

  return (
    <Animated.View style={[animatedStyle, { margin: 8 }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={({ pressed }) => [
          styles.bubblePressable,
          { width: bubble.size, height: bubble.size, borderRadius: bubble.size / 2 },
          isSelected ? styles.bubbleSelected : styles.bubbleUnselected,
          pressed && { opacity: 0.95 }
        ]}
      >
        <Text style={styles.bubbleEmoji}>{bubble.emoji}</Text>
        <Text style={styles.bubbleText} numberOfLines={1} adjustsFontSizeToFit>
          {bubble.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}



export default function ReflectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Screen flow navigation: 1 to 10
  const [screen, setScreen] = useState(1);

  // Reflection data states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bestMomentText, setBestMomentText] = useState('');
  const [challengeText, setChallengeText] = useState('');
  const [lessonText, setLessonText] = useState('');
  
  // Gratitude Board notes
  const [gratitudeNotes, setGratitudeNotes] = useState<string[]>([
    "My family always supports me ❤️",
    "Good health 😊",
    "Small wins",
    "A friend who understands",
    "Peaceful mind"
  ]);
  
  // Next week intention
  const [selectedIntention, setSelectedIntention] = useState<string>('');
  const [customGoalText, setCustomGoalText] = useState('');

  // Sticky note editor state
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [noteInputValue, setNoteInputValue] = useState('');
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);

  // Points & Loader states
  const [isLoading, setIsLoading] = useState(false);

  // Background Ken Burns Zoom Animation
  const bgScale = useSharedValue(1.0);
  const bgTranslateY = useSharedValue(0);

  // Intro background opacity and feather animations
  const introBgOpacity = useSharedValue(1);
  const featherFloatY = useSharedValue(0);
  const featherScale = useSharedValue(1);

  useEffect(() => {
    if (screen === 1) {
      introBgOpacity.value = withTiming(1, { duration: 1000 });
    } else {
      introBgOpacity.value = withTiming(0, { duration: 1000 });
    }

    if (screen === 10) {
      featherFloatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      featherScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.97, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      featherFloatY.value = 0;
      featherScale.value = 1;
    }
  }, [screen]);

  useEffect(() => {
    bgScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    bgTranslateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Autosave when data states change
  useEffect(() => {
    if (screen > 1 && screen < 10) {
      saveProgressLocally();
    }
  }, [screen, selectedCategories, bestMomentText, challengeText, lessonText, gratitudeNotes, selectedIntention, customGoalText]);

  // Load progress on mount
  useEffect(() => {
    loadSavedProgress();
  }, []);

  const saveProgressLocally = async () => {
    try {
      const stateToSave = {
        screen,
        selectedCategories,
        bestMomentText,
        challengeText,
        lessonText,
        gratitudeNotes,
        selectedIntention,
        customGoalText,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to autosave progress:", e);
    }
  };

  const loadSavedProgress = async () => {
    try {
      const dataStr = await AsyncStorage.getItem(SAVE_KEY);
      if (dataStr) {
        const saved = JSON.parse(dataStr);
        // Check if saved state is recent (e.g. less than 4 days old)
        if (saved && Date.now() - saved.timestamp < 4 * 24 * 60 * 60 * 1000) {
          Alert.alert(
            "Resume Reflection?",
            "You have unsaved reflection progress from your current week. Would you like to resume?",
            [
              {
                text: "Start Fresh",
                style: "destructive",
                onPress: async () => {
                  await AsyncStorage.removeItem(SAVE_KEY);
                }
              },
              {
                text: "Resume",
                onPress: () => {
                  setScreen(saved.screen || 1);
                  setSelectedCategories(saved.selectedCategories || []);
                  setBestMomentText(saved.bestMomentText || '');
                  setChallengeText(saved.challengeText || '');
                  setLessonText(saved.lessonText || '');
                  setGratitudeNotes(saved.gratitudeNotes || []);
                  setSelectedIntention(saved.selectedIntention || '');
                  setCustomGoalText(saved.customGoalText || '');
                }
              }
            ]
          );
        }
      }
    } catch (e) {
      console.warn("Failed to restore progress:", e);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreen((prev) => prev + 1);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreen((prev) => Math.max(1, prev - 1));
  };

  const handleQuit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Exit Reflection?",
      "Are you sure you want to exit? Your progress will be saved, and you can resume next time.",
      [
        { text: "Continue reflecting", style: "cancel" },
        { 
          text: "Exit", 
          style: "destructive", 
          onPress: () => router.back() 
        }
      ]
    );
  };

  // Sticky Note Click
  const openNoteEditor = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingNoteIndex(index);
    setNoteInputValue(gratitudeNotes[index] || '');
    setIsNoteModalVisible(true);
  };

  const createNewNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingNoteIndex(gratitudeNotes.length); // Next index
    setNoteInputValue('');
    setIsNoteModalVisible(true);
  };

  const saveStickyNote = () => {
    if (noteInputValue.trim() === '') {
      setIsNoteModalVisible(false);
      return;
    }
    const updated = [...gratitudeNotes];
    if (editingNoteIndex !== null) {
      updated[editingNoteIndex] = noteInputValue.trim();
    }
    setGratitudeNotes(updated);
    setIsNoteModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Submit points to backend
  const completeReflection = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '500', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            task_name: 'Reflect on Week',
            selectedCategories,
            bestMoment: bestMomentText,
            challenge: challengeText,
            lesson: lessonText,
            gratitudeNotes,
            intention: selectedIntention,
            customGoal: customGoalText
          })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.pointsAdded?.toString() || "500", 
            totalPoints: data.totalPoints?.toString() || "0",
            streak: data.streak?.toString() || "0"
          };
        } else {
          Alert.alert("Error", data.error || "Failed to submit reflection completion");
        }
      }
      // Remove autosave once completed
      await AsyncStorage.removeItem(SAVE_KEY);
    } catch(e) { 
      console.error(e);
    } finally {
      setIsLoading(false);
    }

    router.replace({ 
      pathname: '/task-success', 
      params: { 
        points: pointsData.pointsAdded, 
        totalPoints: pointsData.totalPoints, 
        streak: pointsData.streak,
        message: "Reflection complete."
      } 
    } as any);
  };

  // Helper to determine the Step X of 5 index in the progress header
  const getStepProgressIndex = () => {
    if (screen === 3 || screen === 4) return 1;
    if (screen === 5) return 2;
    if (screen === 6) return 3;
    if (screen === 7) return 4;
    if (screen === 8) return 5;
    return 1;
  };

  const currentReflectStep = getStepProgressIndex();

  // Reanimated style for background camera
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: bgScale.value },
        { translateY: bgTranslateY.value }
      ]
    };
  });

  const introBgAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: introBgOpacity.value,
    };
  });

  const featherAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: featherFloatY.value },
        { scale: featherScale.value }
      ]
    };
  });

  const isLargeScreen = windowWidth > 768;
  const containerWidth = isLargeScreen ? 650 : windowWidth;
  const systemFonts = Fonts as any;
  const serifFont = systemFonts?.serif || 'Georgia';
  const roundedFont = systemFonts?.rounded || 'System';

  // 18 Floating particles on screen
  const particles = Array.from({ length: 18 }).map((_, i) => (
    <FloatingParticle key={i} idx={i} />
  ));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Immersive background with Ken Burns and particles ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['#07020E', '#16082E', '#2F0854']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Soft sunset lighting glow */}
        <LinearGradient
          colors={['rgba(219, 39, 119, 0.12)', 'rgba(168, 85, 247, 0.08)', 'rgba(0,0,0,0)']}
          style={styles.sunsetGlow}
        />
        {/* Floating Stars */}
        <StarBackground />
        {/* Dust Particles */}
        {particles}
      </Animated.View>

      {/* Screen 1 specific full-screen intro background with opacity fade out */}
      <Animated.View style={[StyleSheet.absoluteFillObject, introBgAnimatedStyle]} pointerEvents="none">
        <Image
          source={require('../assets/images/reflect_intro_bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Subtle dark overlay to keep text highly readable */}
        <LinearGradient
          colors={['rgba(7, 2, 14, 0.25)', 'rgba(7, 2, 14, 0.72)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* ── Header Navigation (Only shown on Step 1 to 5) ── */}
      {screen >= 3 && screen <= 8 && (
        <View style={[styles.progressHeader, { top: insets.top || 16 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBackBtn}>
            <Feather name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.progressBarWrapper}>
            <Text style={[styles.progressText, { fontFamily: roundedFont }]}>
              Step {currentReflectStep} of 5
            </Text>
            <View style={styles.dotsRow}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressDot,
                    idx + 1 === currentReflectStep && styles.progressDotActive,
                    idx + 1 < currentReflectStep && styles.progressDotCompleted,
                  ]}
                />
              ))}
            </View>
          </View>
          <TouchableOpacity onPress={handleQuit} style={styles.headerCloseBtn}>
            <Feather name="x" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Responsive Body Area */}
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={[styles.responsiveContent, { width: containerWidth }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 1: INTRODUCTION
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 1 && (
              <Animated.View style={styles.screenInner} entering={FadeIn.duration(800)}>
                <View style={styles.introContent}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoBadgeText}>📝 Reflection</Text>
                  </View>

                  <Text style={[styles.introTitle, { fontFamily: serifFont }]}>
                    Reflect on Week
                  </Text>
                  <Text style={styles.introSubtitle}>
                    Pause. Reflect. Realign.
                  </Text>

                  <View style={styles.glowingDivider}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerGlowIcon}>
                      <Text style={styles.glowingDot}>✨</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  <Text style={styles.introDesc}>
                    A weekly reflection to help you celebrate your wins, learn from challenges, and grow with clarity.
                  </Text>
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={handleNext} 
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Start Reflection</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.durationHint}>🕒 Takes 5–10 minutes</Text>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 2: WEEK TIMELINE
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 2 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    Your Week Timeline
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    Let's walk through your week mindfully.
                  </Text>
                </View>

                {/* Vertical Timeline component */}
                <View style={styles.timelineContainer}>
                  {/* Glowing Vertical Line */}
                  <View style={styles.timelineVerticalLine} />

                  {/* 5 Cards */}
                  <View style={styles.timelineList}>
                    {[
                      { num: 1, title: '⭐ Best Moments', desc: 'What made you smile?' },
                      { num: 2, title: '🏔 Challenges', desc: 'What tested you?' },
                      { num: 3, title: '📖 Lessons Learned', desc: 'What did you learn?' },
                      { num: 4, title: '❤️ Gratitude', desc: 'What are you grateful for?' },
                      { num: 5, title: '🎯 Next Week Intentions', desc: 'What will you focus on?' }
                    ].map((item, index) => (
                      <View key={item.num} style={styles.timelineItem}>
                        {/* Timeline node */}
                        <View style={[styles.timelineNode, index === 0 ? styles.nodeActive : styles.nodeInactive]}>
                          <Text style={styles.nodeNumber}>{item.num}</Text>
                        </View>
                        {/* Glass card */}
                        <View style={[styles.timelineCard, index === 0 && styles.cardActiveHighlight]}>
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc}>{item.desc}</Text>
                          </View>
                          <Feather name="chevron-right" size={16} color="rgba(255, 255, 255, 0.4)" />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Begin Journey</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.timelineHint}>You can skip any step.</Text>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 3: BEST MOMENTS
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 3 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    Best Moments
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    What were the highlights of your week? Tap to add.
                  </Text>
                </View>

                {/* Floating Bubbles Container */}
                <View style={styles.bubblesContainer}>
                  {MOMENT_CATEGORIES.map((bubble) => {
                    const isSelected = selectedCategories.includes(bubble.id);
                    return (
                      <CategoryBubbleItem
                        key={bubble.id}
                        bubble={bubble}
                        isSelected={isSelected}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          if (isSelected) {
                            setSelectedCategories(selectedCategories.filter(id => id !== bubble.id));
                          } else {
                            setSelectedCategories([...selectedCategories, bubble.id]);
                          }
                        }}
                      />
                    );
                  })}
                </View>

                {/* Book Illustration */}
                <Image
                  source={require('../assets/images/reflect_moments_book.png')}
                  style={styles.momentsBookImage}
                  resizeMode="contain"
                />

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={handleNext} 
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Write My Moment</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 4: WRITE YOUR MOMENT
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 4 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    What made you smile?
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    Write freely. No right or wrong.
                  </Text>
                </View>

                {/* Large Journal Card with Moon Backdrop */}
                <View style={styles.journalCard}>
                  {/* Sky & Moon Illustration Svg */}
                  <View style={styles.skyHeaderIllustration}>
                    <Svg width="100%" height="80" viewBox="0 0 300 80">
                      <Defs>
                        <RadialGradient id="moonGlow" cx="60%" cy="50%" r="50%">
                          <Stop offset="0%" stopColor="#FAE8FF" stopOpacity="0.4" />
                          <Stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
                        </RadialGradient>
                      </Defs>
                      {/* Clouds & Glow */}
                      <Circle cx="150" cy="40" r="40" fill="url(#moonGlow)" />
                      {/* Stars */}
                      <Circle cx="40" cy="20" r="1.5" fill="#FFFFFF" opacity="0.8" />
                      <Circle cx="80" cy="50" r="1" fill="#FFFFFF" opacity="0.6" />
                      <Circle cx="220" cy="25" r="1.5" fill="#FFFFFF" opacity="0.7" />
                      <Circle cx="260" cy="45" r="1" fill="#FFFFFF" opacity="0.5" />
                      
                      {/* Elegant Crescent Moon */}
                      <Path
                        d="M150,20 A18,18 0 1,0 168,38 A14,14 0 1,1 150,20 Z"
                        fill="#FAE8FF"
                      />
                    </Svg>
                  </View>

                  <TextInput
                    style={[styles.journalTextInput, { fontFamily: roundedFont }]}
                    placeholder="Start writing..."
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    multiline
                    value={bestMomentText}
                    onChangeText={setBestMomentText}
                    textAlignVertical="top"
                  />

                  {/* Toolbar */}
                  <View style={styles.journalToolbar}>
                    <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                      <Feather name="mic" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.toolbarIconText}>Voice</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                      <Feather name="camera" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.toolbarIconText}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                      <Feather name="smile" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.toolbarIconText}>Mood</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                      <Feather name="edit-2" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.toolbarIconText}>Draw</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Save & Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 5: CHALLENGES
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 5 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    What challenged you?
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    Every challenge teaches something valuable.
                  </Text>
                </View>

                <View style={styles.journalCard}>
                  <View style={styles.promptsContainer}>
                    <Text style={styles.promptBullet}>• What felt difficult?</Text>
                    <Text style={styles.promptBullet}>• What made you uncomfortable?</Text>
                    <Text style={styles.promptBullet}>• What can you learn from it?</Text>
                  </View>

                  <TextInput
                    style={[styles.journalTextInput, { height: 180, fontFamily: roundedFont }]}
                    placeholder="Reflect on this week's challenges..."
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    multiline
                    value={challengeText}
                    onChangeText={setChallengeText}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Save & Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 6: LESSONS LEARNED
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 6 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    What did you learn?
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    Growth begins with awareness.
                  </Text>
                </View>

                {/* Notebook Lined Paper styled card */}
                <View style={styles.notebookCard}>
                  <View style={styles.notebookGlowBorder} />
                  <TextInput
                    style={[styles.notebookTextInput, { fontFamily: roundedFont }]}
                    placeholder="This week taught me..."
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    multiline
                    value={lessonText}
                    onChangeText={setLessonText}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Save & Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 7: GRATITUDE
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 7 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    What are you grateful for?
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    Add the people, moments, and things you are thankful for.
                  </Text>
                </View>

                {/* Gratitude Notes Cork Board */}
                <View style={styles.corkBoard}>
                  <View style={styles.corkBoardPinsOverlay}>
                    {gratitudeNotes.map((note, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.stickyNoteCard}
                        onPress={() => openNoteEditor(index)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.stickyNotePin} />
                        <Text style={styles.stickyNoteText} numberOfLines={3}>
                          {note}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    {/* Add note card */}
                    <TouchableOpacity
                      style={[styles.stickyNoteCard, styles.stickyAddCard]}
                      onPress={createNewNote}
                      activeOpacity={0.9}
                    >
                      <Feather name="plus" size={24} color="rgba(255, 255, 255, 0.4)" />
                      <Text style={styles.stickyAddText}>Add More</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 8: NEXT WEEK INTENTIONS
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 8 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    Next Week Focus
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    Choose one intention for the coming week.
                  </Text>
                </View>

                {/* Selectable grid layout */}
                <View style={styles.intentionsGrid}>
                  {INTENTIONS.map((item) => {
                    const isSelected = selectedIntention === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.intentionCard,
                          isSelected && styles.intentionCardActive
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedIntention(item.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.intentionEmoji}>{item.emoji}</Text>
                        <Text style={[styles.intentionLabel, { fontFamily: roundedFont }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedIntention === 'custom' && (
                  <Animated.View style={styles.customGoalContainer} entering={FadeIn.duration(400)}>
                    <TextInput
                      style={[styles.customGoalInput, { fontFamily: roundedFont }]}
                      placeholder="Write your custom weekly intention..."
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={customGoalText}
                      onChangeText={setCustomGoalText}
                    />
                  </Animated.View>
                )}

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, !selectedIntention && { opacity: 0.5 }]}
                    onPress={handleNext}
                    disabled={!selectedIntention}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 9: WEEKLY INSIGHTS
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 9 && (
              <Animated.View style={styles.screenInner} entering={FadeInRight.duration(600)}>
                <View style={styles.headerSpacer} />
                <View style={styles.titleSection}>
                  <Text style={[styles.screenTitle, { fontFamily: serifFont }]}>
                    Your Weekly Insights
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    A glimpse of your beautiful week.
                  </Text>
                </View>

                {/* Staggered summary list of progress */}
                <View style={styles.insightsList}>
                  <View style={styles.insightItemCard}>
                    <View style={styles.insightIconBadge}>
                      <Text style={styles.insightIconText}>⭐</Text>
                    </View>
                    <View style={styles.insightItemContent}>
                      <Text style={styles.insightItemTitle}>Wins celebrated</Text>
                      <Text style={styles.insightItemText} numberOfLines={2}>
                        {bestMomentText.trim() ? bestMomentText : "You recorded happy moments and wins."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.insightItemCard}>
                    <View style={styles.insightIconBadge}>
                      <Text style={styles.insightIconText}>🏔</Text>
                    </View>
                    <View style={styles.insightItemContent}>
                      <Text style={styles.insightItemTitle}>Challenges faced</Text>
                      <Text style={styles.insightItemText} numberOfLines={2}>
                        {challengeText.trim() ? challengeText : "You faced obstacles with courage."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.insightItemCard}>
                    <View style={styles.insightIconBadge}>
                      <Text style={styles.insightIconText}>📖</Text>
                    </View>
                    <View style={styles.insightItemContent}>
                      <Text style={styles.insightItemTitle}>Lessons learned</Text>
                      <Text style={styles.insightItemText} numberOfLines={2}>
                        {lessonText.trim() ? lessonText : "You learned and grew with awareness."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.insightItemCard}>
                    <View style={styles.insightIconBadge}>
                      <Text style={styles.insightIconText}>❤️</Text>
                    </View>
                    <View style={styles.insightItemContent}>
                      <Text style={styles.insightItemTitle}>Gratitude notes</Text>
                      <Text style={styles.insightItemText}>
                        You documented {gratitudeNotes.length} things you are thankful for.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.insightItemCard}>
                    <View style={styles.insightIconBadge}>
                      <Text style={styles.insightIconText}>🎯</Text>
                    </View>
                    <View style={styles.insightItemContent}>
                      <Text style={styles.insightItemTitle}>Goal for next week</Text>
                      <Text style={styles.insightItemText}>
                        Focusing on: {selectedIntention === 'custom' ? customGoalText : selectedIntention.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Insights Lantern Illustration */}
                <Image
                  source={require('../assets/images/reflect_insights_lantern.png')}
                  style={styles.insightsLanternImage}
                  resizeMode="contain"
                />

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#C084FC', '#E879F9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { fontFamily: roundedFont }]}>See My Reflection</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SCREEN 10: COMPLETION
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {screen === 10 && (
              <Animated.View style={styles.screenInner} entering={FadeIn.duration(1000)}>
                <View style={styles.introContent}>
                  
                  {/* Glowing Feather Container */}
                  <View style={styles.featherWrapper}>
                    <Animated.Image
                      source={require('../assets/images/reflect_complete_feather.png')}
                      style={[styles.completeFeatherImage, featherAnimatedStyle]}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={[styles.introTitle, { fontFamily: serifFont, fontSize: 32 }]}>
                    Beautiful Reflection!
                  </Text>
                  <Text style={styles.introSubtitle}>
                    You took time for yourself and that's a win.
                  </Text>

                  {/* Reward Card */}
                  <View style={styles.rewardCard}>
                    <Text style={styles.rewardStar}>✨</Text>
                    <Text style={styles.rewardLabel}>You earned</Text>
                    <Text style={[styles.rewardPoints, { fontFamily: roundedFont }]}>500</Text>
                    <Text style={styles.rewardUnit}>Mind Points</Text>
                  </View>
                </View>

                <View style={styles.bottomButtonsWrapper}>
                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={completeReflection} 
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FCD34D', '#F59E0B']} // Gold Gradient
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={[styles.btnText, { color: '#080210', fontFamily: roundedFont }]}>
                        {isLoading ? "Saving Reflection..." : "Back to Home"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

          </ScrollView>
        </View>
      </SafeAreaView>

      {/* ── Sticky Note Modal Editor ── */}
      <Modal
        visible={isNoteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalPin} />
            <Text style={[styles.modalTitle, { fontFamily: roundedFont }]}>What are you grateful for?</Text>
            <TextInput
              style={[styles.modalInput, { fontFamily: roundedFont }]}
              multiline
              maxLength={80}
              placeholder="Type your gratitude note here..."
              placeholderTextColor="#9ca3af"
              value={noteInputValue}
              onChangeText={setNoteInputValue}
              autoFocus
            />
            <View style={styles.modalControls}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsNoteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveStickyNote}
              >
                <Text style={styles.modalSaveText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07020E',
  },
  safeArea: {
    flex: 1,
  },
  responsiveContent: {
    flex: 1,
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  screenInner: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: screenHeight * 0.76,
  },
  headerSpacer: {
    height: 70,
  },
  sunsetGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.6,
  },
  momentsBookImage: {
    width: '90%',
    height: 180,
    alignSelf: 'center',
    marginTop: 10,
    opacity: 0.85,
  },
  insightsLanternImage: {
    width: '85%',
    height: 150,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 16,
    opacity: 0.8,
  },
  completeFeatherImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  starPoint: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  dustParticle: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: 'rgba(232, 121, 249, 0.45)',
  },
  // Header styles
  progressHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 50,
    zIndex: 100,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#E879F9',
    width: 14,
  },
  progressDotCompleted: {
    backgroundColor: '#C084FC',
  },
  // Intro Screen
  introContent: {
    alignItems: 'center',
    marginTop: screenHeight * 0.12,
  },
  logoBadge: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  logoBadgeText: {
    color: '#E879F9',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  introTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 24,
  },
  glowingDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    justifyContent: 'center',
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerGlowIcon: {
    paddingHorizontal: 10,
  },
  glowingDot: {
    fontSize: 12,
    textShadowColor: '#E879F9',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  introDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomButtonsWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  primaryBtn: {
    width: '85%',
    borderRadius: 28,
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  durationHint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginTop: 14,
  },
  // Common Screen titles
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  // Timeline Screen
  timelineContainer: {
    position: 'relative',
    marginVertical: 20,
    paddingLeft: 12,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 20,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineList: {
    gap: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginRight: 16,
  },
  nodeActive: {
    backgroundColor: '#FB923C',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  nodeInactive: {
    backgroundColor: '#581C87',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nodeNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardActiveHighlight: {
    borderColor: 'rgba(251, 146, 60, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDesc: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
  },
  timelineHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    marginTop: 12,
  },
  // Floating Bubbles screen
  bubblesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  bubblePressable: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  bubbleUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
  },
  bubbleSelected: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: '#E879F9',
    shadowColor: '#E879F9',
    shadowOpacity: 0.3,
  },
  bubbleEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Journal text inputs
  journalCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  skyHeaderIllustration: {
    width: '100%',
    height: 80,
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 12,
  },
  journalTextInput: {
    width: '100%',
    height: 150,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  journalToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    marginTop: 12,
  },
  toolbarIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIconText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    marginTop: 4,
  },
  promptsContainer: {
    backgroundColor: 'rgba(192, 132, 252, 0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  promptBullet: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 22,
  },
  // Notebook Lined screen
  notebookCard: {
    width: '100%',
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 20,
    minHeight: 240,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.2)',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  notebookGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  notebookTextInput: {
    width: '100%',
    minHeight: 200,
    fontSize: 16,
    lineHeight: 28, // Matches notebook rules
    color: '#E0E7FF',
  },
  // Gratitude board and sticky notes
  corkBoard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 16,
    minHeight: 320,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  corkBoardPinsOverlay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  stickyNoteCard: {
    width: '46%',
    height: 100,
    backgroundColor: '#FEF08A', // Yellow post-it
    padding: 10,
    borderRadius: 4,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
  },
  stickyNotePin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
  },
  stickyNoteText: {
    color: '#854D0E', // Dark brown/yellow text
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  stickyAddCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    transform: [{ rotate: '1deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.05,
  },
  stickyAddText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  // Intentions Goal select
  intentionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 20,
  },
  intentionCard: {
    width: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentionCardActive: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  intentionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  intentionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customGoalContainer: {
    width: '94%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  customGoalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
  },
  // Summary analytics screen
  insightsList: {
    gap: 14,
    marginVertical: 16,
  },
  insightItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 12,
  },
  insightIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  insightIconText: {
    fontSize: 18,
  },
  insightItemContent: {
    flex: 1,
  },
  insightItemTitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  insightItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Completion screen
  featherWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.25)', // Soft gold border
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  rewardStar: {
    fontSize: 22,
    marginBottom: 6,
  },
  rewardLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rewardPoints: {
    color: '#FCD34D',
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 4,
  },
  rewardUnit: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  // Sticky note editor modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 2, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#FEF08A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    alignItems: 'center',
  },
  modalPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 8,
  },
  modalTitle: {
    color: '#854D0E',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: 90,
    borderColor: 'rgba(133, 77, 14, 0.15)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#451a03',
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
    gap: 14,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    color: '#854D0E',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSaveBtn: {
    backgroundColor: '#854D0E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalSaveText: {
    color: '#FEF08A',
    fontWeight: '700',
    fontSize: 14,
  },
});
