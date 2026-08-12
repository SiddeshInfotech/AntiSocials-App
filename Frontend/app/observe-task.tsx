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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, apiFetch } from '../constants/Api';

const TASK_DURATION = 300; // 5 minutes (300 seconds)

// Rating Options for Screen 4
const EXPERIENCE_RATINGS = [
  { id: 'easy', label: 'Easy', emoji: '😄' },
  { id: 'manageable', label: 'Manageable', emoji: '😌' },
  { id: 'difficult', label: 'Difficult', emoji: '😔' },
  { id: 'very_hard', label: 'Very Hard', emoji: '😤' },
];

export default function ObserveTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Screen Flow Step: 1: Intro | 2: Observe Together | 3: Your Mission (Timer) | 4: Share Experience | 5: Surprised Most | 6: Beautiful Reflection
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isLoading, setIsLoading] = useState(false);

  // User input states
  const [selectedRating, setSelectedRating] = useState<string>('easy');
  const [experienceText, setExperienceText] = useState<string>('');
  const [surpriseText, setSurpriseText] = useState<string>('');

  const lastPress = useRef(0);
  const endTimeRef = useRef<number>(0);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  }, []);

  // Floating Flame / Energy Animation for Screen 1 Glass Dome
  const flameFloatY = useSharedValue(0);
  const flameScale = useSharedValue(1);
  const flameGlowOpacity = useSharedValue(0.7);

  useEffect(() => {
    flameFloatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    flameGlowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: flameFloatY.value }, { scale: flameScale.value }],
    opacity: flameGlowOpacity.value,
  }));

  // Step 2 Sunset Landscape Floating Notif Particles
  const notifFloatY = useSharedValue(0);
  useEffect(() => {
    notifFloatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedNotifStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: notifFloatY.value }],
  }));

const JarOrbItem = ({ index }: { index: number }) => {
  const pY = useSharedValue(Math.random() * 40 - 20);
  const pX = useSharedValue(Math.random() * 30 - 15);
  useEffect(() => {
    pY.value = withRepeat(
      withSequence(
        withTiming(pY.value - 12, { duration: 2000 + index * 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(pY.value + 12, { duration: 2000 + index * 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: pX.value }, { translateY: pY.value }],
  }));
  return <Animated.View style={[styles.jarOrbParticle, style]} />;
};

  // Timer Tick Loop for Step 3
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 3 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            triggerHaptic('success');
            setStep(4); // Move to Screen 4 (Share Your Experience)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  const handleStartObservation = () => {
    triggerHaptic('medium');
    setStep(2);
  };

  const handleBeginMissionTimer = () => {
    triggerHaptic('medium');
    setIsActive(true);
    setIsPaused(false);
  };

  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 350) {
        triggerHaptic('warning');
        if (step === 3) setTimeLeft(3);
        else if (step < 6) setStep((step + 1) as any);
      }
    }
  };

  // Complete Task Backend Integration
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
            task_name: 'Observe urge to check phone',
            rating: selectedRating,
            experience_notes: experienceText,
            surprise_notes: surpriseText,
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

    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
      },
    } as any);
  };

  const formatTimerDigits = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Circular Timer calculations for Screen 3
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = timeLeft / TASK_DURATION;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dark Ambient Background */}
      <LinearGradient
        colors={['#0A0914', '#06050C', '#0B0918']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ========================================================
          SCREEN 1 — INTRO (GLASS DOME FLAME PHONE)
         ======================================================== */}
      {step === 1 && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFillObject}>
          {/* Ambient Warm Lamp Backlight */}
          <View pointerEvents="none" style={styles.lampBacklight} />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            {/* Top Navigation */}
            <View style={styles.navRow} />

            {/* Hero Visual: Glass Dome over Smartphone with Purple Flame */}
            <View style={styles.heroDomeContainer}>
              {/* Glass Dome Structure */}
              <View style={styles.glassDomeArch}>
                <LinearGradient
                  colors={['rgba(168, 85, 247, 0.25)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.glassDomeInner}
                >
                  {/* Floating Glowing Purple Flame */}
                  <Animated.View style={[styles.flameWrapper, animatedFlameStyle]}>
                    <MaterialCommunityIcons name="fire" size={68} color="#C084FC" style={styles.flameGlowShadow} />
                  </Animated.View>

                  {/* Smartphone lying flat on base */}
                  <View style={styles.flatPhoneMockup}>
                    <View style={styles.phoneScreenLine} />
                  </View>
                </LinearGradient>
              </View>
              {/* Wooden Pedestal Base */}
              <View style={styles.woodenBasePedestal} />
            </View>

            {/* Title & Subtitle */}
            <View style={styles.textCenterWrapper}>
              <Text style={styles.step1Title}>
                Observe <Text style={styles.titlePurpleHighlight}>Urge</Text>{"\n"}to Check Phone
              </Text>

              <View style={styles.eyeSubtitleRow}>
                <Feather name="eye" size={16} color="#F97316" style={{ marginRight: 6 }} />
                <Text style={styles.step1Subtitle}>
                  The urge will come.{"\n"}
                  Don't fight it. Don't follow it.{"\n"}
                  <Text style={styles.subtitleOrangeHighlight}>Just observe it.</Text>
                </Text>
              </View>
            </View>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.primaryGradientPill} onPress={handleStartObservation} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#8B5CF6', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>START OBSERVATION</Text>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 2 — CONVERSATION START ("LET'S OBSERVE TOGETHER")
         ======================================================== */}
      {step === 2 && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFillObject}>
          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            {/* Navigation Header */}
            <View style={styles.navRow} />

            {/* Center Visual: Sunset Path & Meditation Silhouette */}
            <View style={styles.step2CenterWrapper}>
              <Text style={styles.screenHeaderTitle}>Let's Observe Together</Text>
              <Text style={styles.screenHeaderSub}>This will take 5 minutes</Text>

              {/* Landscape & Silhouette Graphic */}
              <View style={styles.meditationLandscapeContainer}>
                {/* Sunset Sun */}
                <View style={styles.sunsetSunCore} />

                {/* Glowing Purple Path of Dots */}
                <View style={styles.dotPathContainer}>
                  {[0.3, 0.5, 0.7, 0.9, 1.1].map((scale, idx) => (
                    <View key={idx} style={[styles.dotPathPoint, { transform: [{ scale }] }]} />
                  ))}
                </View>

                {/* Floating Orbiting Notification Symbols */}
                <Animated.View style={[styles.landscapeNotifIcon, { top: 25, left: 25 }, animatedNotifStyle]}>
                  <Feather name="message-square" size={14} color="#C084FC" />
                </Animated.View>
                <Animated.View style={[styles.landscapeNotifIcon, { top: 45, right: 30 }, animatedNotifStyle]}>
                  <Feather name="bell" size={14} color="#F97316" />
                </Animated.View>
                <Animated.View style={[styles.landscapeNotifIcon, { top: 100, left: 30 }, animatedNotifStyle]}>
                  <Feather name="heart" size={14} color="#EC4899" />
                </Animated.View>
                <Animated.View style={[styles.landscapeNotifIcon, { top: 95, right: 25 }, animatedNotifStyle]}>
                  <Feather name="mail" size={14} color="#A855F7" />
                </Animated.View>

                {/* Silhouette Figure */}
                <View style={styles.silhouettedFigure}>
                  <View style={styles.figureHead} />
                  <View style={styles.figureBody} />
                </View>
              </View>

              {/* What to do? Card */}
              <TouchableOpacity
                style={styles.whatToDoGlassCard}
                onPress={() => {
                  triggerHaptic('light');
                  setStep(3);
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.whatToDoTitle}>What to do?</Text>
                <View style={styles.actionPillsRow}>
                  <View style={styles.actionPillItem}>
                    <View style={styles.pillIconCircle}>
                      <Feather name="eye" size={18} color="#C084FC" />
                    </View>
                    <Text style={styles.pillLabelText}>Notice{"\n"}the urge</Text>
                  </View>

                  <View style={styles.actionPillItem}>
                    <View style={styles.pillIconCircle}>
                      <Feather name="cloud" size={18} color="#C084FC" />
                    </View>
                    <Text style={styles.pillLabelText}>Observe your{"\n"}thoughts</Text>
                  </View>

                  <View style={styles.actionPillItem}>
                    <View style={styles.pillIconCircle}>
                      <Feather name="activity" size={18} color="#C084FC" />
                    </View>
                    <Text style={styles.pillLabelText}>Let it rise{"\n"}and fall</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.primaryGradientPill} onPress={() => setStep(3)} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#8B5CF6', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>NEXT</Text>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 3 — YOUR MISSION (5:00 TIMER & GUIDELINES)
         ======================================================== */}
      {step === 3 && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFillObject}>
          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            {/* Top Navigation */}
            <View style={styles.navRow} />

            {/* Center Mission Content */}
            <View style={styles.missionCenterWrapper}>
              {/* Mission Header */}
              <View style={styles.missionHeaderGroup}>
                <Feather name="target" size={20} color="#F97316" style={{ marginBottom: 6 }} />
                <Text style={styles.screenHeaderTitle}>Your Mission</Text>
              </View>

              {/* Circular SVG Timer Display */}
              <View style={styles.missionTimerContainer}>
                <Svg width={230} height={230} viewBox="0 0 230 230">
                  <Circle
                    cx={115}
                    cy={115}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth={8}
                    fill="transparent"
                  />
                  <Circle
                    cx={115}
                    cy={115}
                    r={radius}
                    stroke="#C084FC"
                    strokeWidth={8}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    transform="rotate(-90 115 115)"
                  />
                </Svg>

                <Pressable onPress={handleDevSkip} style={styles.timerDigitsWrapper}>
                  <Text style={styles.missionTimerDigits}>{formatTimerDigits(timeLeft)}</Text>
                  <Text style={styles.missionTimerSub}>MINUTES</Text>
                </Pressable>
              </View>

              {/* Mission Subtitle */}
              <Text style={styles.missionSubtitle}>
                Whenever you feel the urge to check your phone, stop and{" "}
                <Text style={styles.subtitleOrangeHighlight}>observe for 5 minutes.</Text>
              </Text>

              {/* "During this time" Rules Glass Card */}
              <View style={styles.duringThisTimeCard}>
                <Text style={styles.duringTimeTitle}>During this time</Text>
                <View style={styles.ruleItemRow}>
                  <Feather name="smartphone" size={16} color="#C084FC" style={styles.ruleIcon} />
                  <Text style={styles.ruleItemText}>Don't pick up your phone</Text>
                </View>
                <View style={styles.ruleItemRow}>
                  <Feather name="activity" size={16} color="#C084FC" style={styles.ruleIcon} />
                  <Text style={styles.ruleItemText}>Watch the urge come and go</Text>
                </View>
                <View style={styles.ruleItemRow}>
                  <Feather name="shield" size={16} color="#C084FC" style={styles.ruleIcon} />
                  <Text style={styles.ruleItemText}>You are in control</Text>
                </View>
              </View>
            </View>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.primaryGradientPill}
                onPress={isActive ? () => setIsPaused(!isPaused) : handleBeginMissionTimer}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>
                    {isActive ? (isPaused ? "RESUME ▶" : "PAUSE ❚❚") : "BEGIN NOW ▶"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 4 — SHARE YOUR EXPERIENCE (PURPLE JAR & RATINGS)
         ======================================================== */}
      {step === 4 && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFillObject}>
          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollWrapperContent} showsVerticalScrollIndicator={false}>
                {/* Navigation Header */}
                <View style={styles.navRow} />

                {/* Header Title */}
                <View style={styles.centerHeaderGroup}>
                  <Ionicons name="sparkles" size={20} color="#F97316" style={{ marginBottom: 4 }} />
                  <Text style={styles.screenHeaderTitle}>Share Your Experience</Text>
                  <Text style={styles.screenHeaderSub}>Welcome back! How was it?</Text>
                </View>

                {/* Hero Visual: Glowing Magical Purple Jar */}
                <View style={styles.magicalJarContainer}>
                  <View style={styles.glassJarBody}>
                    <LinearGradient
                      colors={['rgba(192, 132, 252, 0.4)', 'rgba(139, 92, 246, 0.15)']}
                      style={styles.glassJarInner}
                    >
                      {/* Floating Orbs */}
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <JarOrbItem key={idx} index={idx} />
                      ))}
                    </LinearGradient>
                  </View>
                  <View style={styles.jarWoodenPedestal} />
                </View>

                {/* Question */}
                <Text style={styles.sectionQuestionText}>How was your experience observing the urge?</Text>

                {/* 4 Experience Rating Choices */}
                <View style={styles.ratingsGridRow}>
                  {EXPERIENCE_RATINGS.map((item) => {
                    const isSelected = selectedRating === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.ratingChoiceCard, isSelected && styles.ratingCardSelected]}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedRating(item.id);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.ratingEmojiText}>{item.emoji}</Text>
                        <Text style={[styles.ratingLabelText, isSelected && styles.ratingLabelSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Optional Input Box */}
                <View style={styles.glassTextInputCard}>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="Anything you'd like to add..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    maxLength={500}
                    value={experienceText}
                    onChangeText={setExperienceText}
                  />
                  <Text style={styles.charCounterText}>{experienceText.length}/500</Text>
                </View>
              </ScrollView>

              {/* Bottom Button */}
              <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.primaryGradientPill} onPress={() => setStep(5)} activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#8B5CF6', '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtnInner}
                  >
                    <Text style={styles.primaryBtnText}>NEXT</Text>
                    <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 5 — WHAT SURPRISED YOU MOST? (PORTAL & REFLECTION)
         ======================================================== */}
      {step === 5 && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFillObject}>
          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollWrapperContent} showsVerticalScrollIndicator={false}>
                {/* Navigation Header */}
                <View style={styles.navRow} />

                {/* Header Title */}
                <View style={styles.centerHeaderGroup}>
                  <MaterialCommunityIcons name="brain" size={22} color="#F97316" style={{ marginBottom: 4 }} />
                  <Text style={styles.screenHeaderTitle}>What Surprised You Most?</Text>
                  <Text style={styles.screenHeaderSub}>Reflect a little deeper.</Text>
                </View>

                {/* Hero Visual: Glowing Purple Portal with Meditation Figure */}
                <View style={styles.portalVisualContainer}>
                  <View style={styles.outerPortalRing}>
                    <LinearGradient
                      colors={['rgba(192, 132, 252, 0.5)', 'rgba(139, 92, 246, 0.15)']}
                      style={styles.innerPortalCore}
                    >
                      {/* Floating Phone in Portal */}
                      <View style={styles.portalPhoneIcon}>
                        <Feather name="smartphone" size={20} color="#FFFFFF" />
                      </View>

                      {/* Silhouette Figure */}
                      <View style={styles.portalFigureSilhouette} />
                    </LinearGradient>
                  </View>
                </View>

                {/* Question */}
                <Text style={styles.sectionQuestionText}>What surprised you the most during these 5 minutes?</Text>

                {/* Multiline Reflection Text Input */}
                <View style={styles.glassTextInputCard}>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="Write your thoughts..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    value={surpriseText}
                    onChangeText={setSurpriseText}
                  />
                  <Text style={styles.charCounterText}>{surpriseText.length}/500</Text>
                </View>
              </ScrollView>

              {/* Bottom Button */}
              <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.primaryGradientPill} onPress={() => setStep(6)} activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#8B5CF6', '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtnInner}
                  >
                    <Text style={styles.primaryBtnText}>CONTINUE</Text>
                    <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 6 — BEAUTIFUL REFLECTION (LOTUS & COMPLETE TASK)
         ======================================================== */}
      {step === 6 && (
        <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFillObject}>
          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.navRow} />

            {/* Header Title */}
            <View style={styles.centerHeaderGroup}>
              <Feather name="heart" size={20} color="#EC4899" style={{ marginBottom: 4 }} />
              <Text style={styles.screenHeaderTitle}>Beautiful Reflection</Text>
            </View>

            {/* Large Glowing Reflection Glass Card */}
            <View style={styles.reflectionCardOuter}>
              <LinearGradient
                colors={['rgba(192, 132, 252, 0.22)', 'rgba(15, 23, 42, 0.6)']}
                style={styles.reflectionCardInner}
              >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reflectionCardScroll}>
                  <Text style={styles.reflectionParagraph}>
                    Every time you pause to observe, you create a space between the urge and your action.
                  </Text>

                  <Text style={styles.heartDivider}>🩷</Text>

                  <Text style={styles.reflectionParagraph}>
                    That space is your power. You are not your impulse. You are your awareness.
                  </Text>

                  <Text style={styles.heartDivider}>🩷</Text>

                  <Text style={styles.reflectionParagraph}>
                    Keep going. You're building a better relationship with yourself.
                  </Text>

                  {/* Ambient Lotus Flower Visual */}
                  <View style={styles.lotusFlowerContainer}>
                    <Text style={{ fontSize: 42 }}>🪷</Text>
                  </View>
                </ScrollView>
              </LinearGradient>
            </View>

            {/* Bottom Complete Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.primaryGradientPill}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtnInner}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>COMPLETE TASK</Text>
                      <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0914',
  },
  lampBacklight: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  screenWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    zIndex: 2,
  },
  scrollWrapperContent: {
    paddingBottom: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    height: 48,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerHeaderGroup: {
    alignItems: 'center',
    marginBottom: 20,
  },
  screenHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  screenHeaderSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    textAlign: 'center',
  },

  // Screen 1: Dome & Flame
  heroDomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  glassDomeArch: {
    width: 170,
    height: 220,
    borderTopLeftRadius: 85,
    borderTopRightRadius: 85,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  glassDomeInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  flameGlowShadow: {
    textShadowColor: 'rgba(192, 132, 252, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  flatPhoneMockup: {
    width: 110,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneScreenLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C084FC',
  },
  woodenBasePedestal: {
    width: 190,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2A1B14',
    borderWidth: 1,
    borderColor: '#4A3225',
    marginTop: -4,
  },
  textCenterWrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  step1Title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  titlePurpleHighlight: {
    color: '#C084FC',
  },
  eyeSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  step1Subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleOrangeHighlight: {
    color: '#F97316',
    fontWeight: '700',
  },

  // Screen 2: Observe Together
  step2CenterWrapper: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  meditationLandscapeContainer: {
    width: '100%',
    height: 190,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sunsetSunCore: {
    position: 'absolute',
    top: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  dotPathContainer: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    gap: 8,
  },
  dotPathPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C084FC',
  },
  landscapeNotifIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  silhouettedFigure: {
    alignItems: 'center',
    marginBottom: 12,
  },
  figureHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
  },
  figureBody: {
    width: 32,
    height: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#0F172A',
    marginTop: 2,
  },
  whatToDoGlassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  whatToDoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  actionPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionPillItem: {
    alignItems: 'center',
    width: '30%',
  },
  pillIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    marginBottom: 8,
  },
  pillLabelText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },

  // Screen 3: Your Mission
  missionCenterWrapper: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  missionHeaderGroup: {
    alignItems: 'center',
    marginBottom: 16,
  },
  missionTimerContainer: {
    position: 'relative',
    width: 230,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerDigitsWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  missionTimerDigits: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  missionTimerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  missionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  duringThisTimeCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  duringTimeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  ruleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleIcon: {
    marginRight: 10,
  },
  ruleItemText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Screen 4: Share Experience Jar
  magicalJarContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  glassJarBody: {
    width: 140,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  glassJarInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarOrbParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E9D5FF',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  jarWoodenPedestal: {
    width: 160,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2A1B14',
    marginTop: -2,
  },
  sectionQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
  },
  ratingsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingChoiceCard: {
    width: '23%',
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  ratingCardSelected: {
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
    borderColor: '#C084FC',
  },
  ratingEmojiText: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratingLabelText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  ratingLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  glassTextInputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
  },
  multilineInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCounterText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },

  // Screen 5: Portal
  portalVisualContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  outerPortalRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 3,
    backgroundColor: 'rgba(192, 132, 252, 0.3)',
  },
  innerPortalCore: {
    flex: 1,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalPhoneIcon: {
    marginBottom: 8,
  },
  portalFigureSilhouette: {
    width: 24,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
  },

  // Screen 6: Reflection & Lotus Card
  reflectionCardOuter: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    marginVertical: 16,
  },
  reflectionCardInner: {
    flex: 1,
    padding: 22,
  },
  reflectionCardScroll: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  reflectionParagraph: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  heartDivider: {
    fontSize: 16,
    marginVertical: 16,
  },
  lotusFlowerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },

  // Global Buttons & Utilities
  bottomBar: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  primaryGradientPill: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  gradientBtnInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
