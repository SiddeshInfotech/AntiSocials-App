import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const TOTAL_OBSERVE_SECONDS = 300; // 5 minutes

// Guidance sentences for Screen 2
const ENTRANCE_GUIDANCE = [
  "Don't fix it.",
  "Don't judge it.",
  "Don't chase it away.",
  "Simply notice it.",
  "It is okay for it to exist.",
];

// Guidance sentences for Screen 3 (The Observation)
const OBSERVATION_GUIDANCE = [
  "Notice where you feel tension.",
  "You don't need answers.",
  "You are simply watching.",
  "Fear can exist.",
  "You can exist beside it.",
  "Nothing needs to change.",
  "Take your time.",
];

export default function ObserveFearTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Minimal Room & Moving Shadow Intro
  // 2: Room Entrance & Fading Guidance (No Buttons)
  // 3: The Observation (5-Minute Session with Glowing Progress Bar)
  // 4: Brighter Room & Expanding Awareness
  // 5: Shadow Blends into Light ("You stayed. That is courage.")
  // 6: Final Celebration (Silent Observer Badge Unlock)
  // 7: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Screen 1 heading reveal animation state
  const [showSecondHeading, setShowSecondHeading] = useState(false);

  // Screen 2 entrance guidance index
  const [entranceIndex, setEntranceIndex] = useState(0);

  // Screen 3 observation timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [observationGuidanceIndex, setObservationGuidanceIndex] = useState(0);

  // Animations
  const shadowMorphAnim = useRef(new Animated.Value(0)).current;
  const roomLightAnim = useRef(new Animated.Value(0)).current;
  const particleFloatAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(1)).current;
  const progressLineAnim = useRef(new Animated.Value(0)).current;

  // Initialize background ambient animations
  useEffect(() => {
    // Ambient shadow morphing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shadowMorphAnim, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shadowMorphAnim, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Light particle floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloatAnim, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(particleFloatAnim, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Screen 1: 2-second pause before revealing "...to be noticed."
  useEffect(() => {
    if (screen === 1) {
      const timer = setTimeout(() => {
        setShowSecondHeading(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Screen 2: Rotating guidance every 3.5s then auto-advancing to observation
  useEffect(() => {
    let interval: any = null;
    if (screen === 2) {
      interval = setInterval(() => {
        setEntranceIndex((prev) => {
          if (prev >= ENTRANCE_GUIDANCE.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              handleEnterObservation();
            }, 2000);
            return prev;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen]);

  // Screen 3: Observation Timer & Progress Line
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds < TOTAL_OBSERVE_SECONDS) {
      const step = isFastForward ? 25 : 1;
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + step;
          if (next >= TOTAL_OBSERVE_SECONDS) {
            setIsTimerActive(false);
            return TOTAL_OBSERVE_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds, isFastForward]);

  // Update progress line & room light dynamically based on timer
  useEffect(() => {
    if (screen === 3) {
      const progressRatio = timerSeconds / TOTAL_OBSERVE_SECONDS;
      Animated.timing(progressLineAnim, {
        toValue: progressRatio,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      Animated.timing(roomLightAnim, {
        toValue: progressRatio * 0.7,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [timerSeconds, screen]);

  // Rotating Screen 3 guidance sentences every 7s
  useEffect(() => {
    let quoteInterval: any = null;
    if (screen === 3) {
      quoteInterval = setInterval(() => {
        setObservationGuidanceIndex((prev) => (prev + 1) % OBSERVATION_GUIDANCE.length);
      }, 7000);
    }
    return () => {
      if (quoteInterval) clearInterval(quoteInterval);
    };
  }, [screen]);

  // Handlers
  const handleEnterQuietly = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(2);
    saveProgressToBackend(false);
  };

  const handleEnterObservation = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setScreen(3);
    setIsTimerActive(true);
  };

  const handleFinishObservation = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    setScreen(4);
    Animated.timing(roomLightAnim, {
      toValue: 0.85,
      duration: 2000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const handleGoToCourage = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(5);
    Animated.timing(roomLightAnim, {
      toValue: 1.0,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  };

  const handleGoToCelebration = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(6);
  };

  // Final Completion & redirect to shared Task Success component
  const handleFinalCompletion = async () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Observe Inner Fear',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '300',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error('Task complete fetch error:', e);
    }

    await saveProgressToBackend(true);

    // Redirect to shared completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Observe Inner Fear',
        message: "You didn't avoid it.",
        badge: 'Silent Observer',
        difficulty: 'hard',
      },
    } as any);
  };

  const saveProgressToBackend = async (completed: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/shadow-room/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Observe Inner Fear',
            session_started: true,
            observation_completed: completed,
            duration_seconds: TOTAL_OBSERVE_SECONDS,
            completed,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to save Shadow Room progress:', err);
    }
  };

  // Interpolated animation values
  const shadowTranslateX = shadowMorphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });

  const shadowScaleY = shadowMorphAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 0.95],
  });

  const particleY = particleFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const progressWidthPercent = progressLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Charcoal / Soft Black Ambient Background */}
      <LinearGradient
        colors={['#0A0A0C', '#121216', '#18181F']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Dynamic Warm Ambient Light Fill Layer */}
      <Animated.View
        style={[
          styles.ambientLightOverlay,
          {
            opacity: roomLightAnim,
          },
        ]}
      />

      {/* Soft Floating Light Particles */}
      <Animated.View style={[styles.particlesWrapper, { transform: [{ translateY: particleY }] }]}>
        <View style={styles.lightParticle1} />
        <View style={styles.lightParticle2} />
        <View style={styles.lightParticle3} />
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="x" size={22} color="#9E9EB0" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Observe Inner Fear</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🌑 600 Pts • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 7 ? 3 : 7)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={screen === 7 ? 'moon-waning-crescent' : 'view-dashboard-outline'}
            size={22}
            color="#9E9EB0"
          />
        </TouchableOpacity>
      </View>

      {/* ================================================= SCREEN 1: THE SHADOW ROOM INTRO ================================================= */}
      {screen === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>THE SHADOW ROOM • STAGE 1</Text>
          </View>

          {/* Room & Soft Silhouette Shadow Illustration */}
          <View style={styles.shadowRoomStage}>
            <Animated.View
              style={[
                styles.shadowSilhouette,
                {
                  transform: [{ translateX: shadowTranslateX }, { scaleY: shadowScaleY }],
                },
              ]}
            >
              <Svg width="160" height="160" viewBox="0 0 100 100">
                <Defs>
                  <SvgRadialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#646470" stopOpacity="0.6" />
                    <Stop offset="70%" stopColor="#18181F" stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                <Circle cx="50" cy="50" r="42" fill="url(#shadowGrad)" />
              </Svg>
            </Animated.View>
            <View style={styles.roomFloorLine} />
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>"Every fear wants one thing..."</Text>
            {showSecondHeading && (
              <Animated.Text style={styles.largeHeadingTextAccent}>
                "...to be noticed."
              </Animated.Text>
            )}
          </View>

          <Text style={styles.subtext}>You don't have to fight it.</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleEnterQuietly}
          >
            <LinearGradient
              colors={['#272730', '#121216']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>🌑 Enter Quietly</Text>
              <Feather name="arrow-right" size={20} color="#F9FAFB" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 2: QUIET ENTRANCE (NO BUTTONS / OPTIONS) ================================================= */}
      {screen === 2 && (
        <View style={styles.fullScreenCenter}>
          <Text style={styles.quietStageLabel}>THE SHADOW ROOM</Text>

          {/* Morphing Silhouette */}
          <Animated.View
            style={[
              styles.shadowSilhouetteCenter,
              {
                transform: [{ translateX: shadowTranslateX }, { scaleY: shadowScaleY }],
              },
            ]}
          >
            <Svg width="180" height="180" viewBox="0 0 100 100">
              <Defs>
                <SvgRadialGradient id="shadowGrad2" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#9E9EB0" stopOpacity="0.5" />
                  <Stop offset="70%" stopColor="#272730" stopOpacity="0.7" />
                  <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="44" fill="url(#shadowGrad2)" />
            </Svg>
          </Animated.View>

          {/* Fading Guidance Sentence */}
          <Animated.View style={styles.fadingGuidanceBox}>
            <Text style={styles.fadingGuidanceText}>
              {ENTRANCE_GUIDANCE[entranceIndex]}
            </Text>
          </Animated.View>

          <Text style={styles.silenceHint}>Entering observation space...</Text>
        </View>
      )}

      {/* ================================================= SCREEN 3: THE OBSERVATION (5-MIN SESSION) ================================================= */}
      {screen === 3 && (
        <View style={styles.observationContainer}>
          {/* Top Indicator */}
          <View style={styles.observationHeaderRow}>
            <View style={styles.stayPresentPill}>
              <Text style={styles.stayPresentText}>Stay Present</Text>
            </View>

            <View style={styles.ffContainer}>
              <Text style={styles.ffLabel}>⚡ Fast Test</Text>
              <Switch
                value={isFastForward}
                onValueChange={(val) => setIsFastForward(val)}
                trackColor={{ false: '#272730', true: '#646470' }}
                thumbColor={isFastForward ? '#F9FAFB' : '#9E9EB0'}
              />
            </View>
          </View>

          {/* Central Morphing Shadow */}
          <View style={styles.observationStage}>
            <Animated.View
              style={[
                styles.shadowSilhouetteCenter,
                {
                  transform: [{ translateX: shadowTranslateX }, { scaleY: shadowScaleY }],
                },
              ]}
            >
              <Svg width="220" height="220" viewBox="0 0 100 100">
                <Defs>
                  <SvgRadialGradient id="shadowGrad3" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#9E9EB0" stopOpacity="0.6" />
                    <Stop offset="65%" stopColor="#3F3F46" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                <Circle cx="50" cy="50" r="46" fill="url(#shadowGrad3)" />
              </Svg>
            </Animated.View>

            {/* Fading Guidance Message */}
            <View style={styles.observationGuidanceBox}>
              <Text style={styles.observationGuidanceText}>
                {OBSERVATION_GUIDANCE[observationGuidanceIndex]}
              </Text>
            </View>
          </View>

          {/* Bottom Thin Glowing Line Progress Bar */}
          <View style={styles.progressLineTrack}>
            <Animated.View style={[styles.progressLineFill, { width: progressWidthPercent }]} />
          </View>

          {/* Action CTA when complete or testing */}
          <View style={styles.bottomActionWrap}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                timerSeconds < TOTAL_OBSERVE_SECONDS && !isFastForward && styles.disabledBtn,
              ]}
              activeOpacity={0.85}
              disabled={timerSeconds < TOTAL_OBSERVE_SECONDS && !isFastForward}
              onPress={handleFinishObservation}
            >
              <LinearGradient
                colors={['#3F3F46', '#18181F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.primaryBtnText}>Complete Observation 🌑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================================================= SCREEN 4: EXPANDING AWARENESS ================================================= */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>AWARENESS EXPANDING</Text>
          </View>

          <View style={styles.shadowSoftRoomStage}>
            <Svg width="200" height="200" viewBox="0 0 100 100">
              <Defs>
                <SvgRadialGradient id="softShadowGrad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#E5E7EB" stopOpacity="0.4" />
                  <Stop offset="70%" stopColor="#9E9EB0" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="45" fill="url(#softShadowGrad)" />
            </Svg>
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>"Fear isn't becoming smaller."</Text>
            <Text style={styles.largeHeadingTextAccent}>
              "Your awareness is becoming larger."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleGoToCourage}
          >
            <LinearGradient
              colors={['#3F3F46', '#18181F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Step Forward 🕊️</Text>
              <Feather name="arrow-right" size={20} color="#F9FAFB" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 5: SHADOW BLENDS INTO LIGHT ("YOU STAYED") ================================================= */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>QUIET RESOLUTION</Text>
          </View>

          <View style={styles.peacefulLightStage}>
            <Svg width="220" height="220" viewBox="0 0 100 100">
              <Defs>
                <SvgRadialGradient id="lightBlendGrad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#F9FAFB" stopOpacity="0.7" />
                  <Stop offset="60%" stopColor="#E5E7EB" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="48" fill="url(#lightBlendGrad)" />
            </Svg>
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>"You stayed."</Text>
            <Text style={styles.largeHeadingTextAccent}>"That is courage."</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleGoToCelebration}
          >
            <LinearGradient
              colors={['#52525B', '#272730']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Blossom Awareness 🌑</Text>
              <Feather name="arrow-right" size={20} color="#F9FAFB" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 6: FINAL CELEBRATION (BADGE UNLOCK) ================================================= */}
      {screen === 6 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>FINAL CELEBRATION</Text>
          <Text style={styles.screenHeader}>"The room fills with light."</Text>

          {/* Achievement Badge Unlock Card */}
          <View style={styles.badgeUnlockCard}>
            <View style={styles.badgeIconHalo}>
              <Text style={styles.badgeIconText}>🏅</Text>
            </View>
            <Text style={styles.badgeCategoryText}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={styles.badgeTitleText}>Silent Observer</Text>
            <Text style={styles.badgeSubtitleText}>
              "You chose awareness instead of avoidance."
            </Text>
            <View style={styles.completionPill}>
              <Text style={styles.completionPillText}>Completion Message: "You didn't avoid it."</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleFinalCompletion}
          >
            <LinearGradient
              colors={['#3F3F46', '#18181F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Complete Challenge ✨</Text>
              <Feather name="check-circle" size={20} color="#F9FAFB" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 7: TASK DETAIL DASHBOARD ================================================= */}
      {screen === 7 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>TASK DETAIL DASHBOARD</Text>
          <Text style={styles.screenHeader}>Observe Inner Fear</Text>

          {/* Top: Animated Shadow Room Illustration */}
          <View style={styles.dashboardShadowBox}>
            <Svg width="120" height="120" viewBox="0 0 100 100">
              <Defs>
                <SvgRadialGradient id="dashShadow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#9E9EB0" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#18181F" stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="40" fill="url(#dashShadow)" />
            </Svg>
            <Text style={styles.dashboardShadowLabel}>The Shadow Room Visual Identity</Text>
          </View>

          {/* Center: Growth Progress Visualization */}
          <View style={styles.dashboardProgressCard}>
            <Text style={styles.dashboardCardTitle}>OBSERVATION METRICS</Text>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Session Duration</Text>
                <Text style={styles.metricValue}>5 Minutes (300 Task Points)</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🌑</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Core Objective</Text>
                <Text style={styles.metricValue}>Awareness without judgment or solving</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🧘</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Atmosphere</Text>
                <Text style={styles.metricValue}>Quiet Shadow Room & Soft Ambient Light</Text>
              </View>
            </View>
          </View>

          {/* Bottom: Silent Observer Badge */}
          <View style={styles.dashboardBadgeCard}>
            <Text style={styles.dashboardBadgeIcon}>🏅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashboardBadgeHeader}>REWARD BADGE</Text>
              <Text style={styles.dashboardBadgeName}>Silent Observer</Text>
            </View>
          </View>

          {/* Mandatory Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "Courage isn't always moving forward. Sometimes it's choosing not to run."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => setScreen(1)}
          >
            <LinearGradient
              colors={['#272730', '#121216']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Return to Shadow Room 🌑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  ambientLightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249, 250, 251, 0.08)',
  },
  particlesWrapper: {
    position: 'absolute',
    top: height * 0.2,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lightParticle1: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  lightParticle2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  lightParticle3: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(39, 39, 48, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  headerTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  dashboardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(39, 39, 48, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },

  screenTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  screenTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9EB0',
    letterSpacing: 0.8,
  },
  screenSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9E9EB0',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 12,
  },

  shadowRoomStage: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  shadowSilhouette: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomFloorLine: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },

  headingBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  largeHeadingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F9FAFB',
    textAlign: 'center',
  },
  largeHeadingTextAccent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 6,
  },
  subtext: {
    fontSize: 14,
    color: '#9E9EB0',
    textAlign: 'center',
    marginBottom: 28,
  },

  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
  },

  // Screen 2 Center
  fullScreenCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  quietStageLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#646470',
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  shadowSilhouetteCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  fadingGuidanceBox: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  fadingGuidanceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  silenceHint: {
    fontSize: 12,
    color: '#646470',
    marginTop: 20,
  },

  // Screen 3 Observation
  observationContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  observationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stayPresentPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stayPresentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: 0.8,
  },
  ffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ffLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9EB0',
  },

  observationStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationGuidanceBox: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  observationGuidanceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
  },

  progressLineTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginVertical: 16,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: '#F9FAFB',
  },
  bottomActionWrap: {
    width: '100%',
  },

  // Screen 4 Soft Room
  shadowSoftRoomStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  peacefulLightStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },

  // Screen 6 Celebration
  badgeUnlockCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#18181F',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 24,
    alignItems: 'center',
    marginVertical: 24,
  },
  badgeIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIconText: { fontSize: 32 },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9E9EB0',
    letterSpacing: 1.2,
  },
  badgeTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F9FAFB',
    marginVertical: 4,
  },
  badgeSubtitleText: {
    fontSize: 13,
    color: '#D1D5DB',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 14,
  },
  completionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  completionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F9FAFB',
  },

  // Screen 7 Dashboard
  dashboardShadowBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardShadowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9EB0',
    marginTop: 6,
  },
  dashboardProgressCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#18181F',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    marginBottom: 16,
  },
  dashboardCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#9E9EB0',
    letterSpacing: 1,
    marginBottom: 14,
  },
  dashboardMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: { fontSize: 24, marginRight: 12 },
  metricTextWrap: { flex: 1 },
  metricTitle: {
    fontSize: 11,
    color: '#9E9EB0',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F9FAFB',
  },

  dashboardBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#18181F',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    marginBottom: 16,
  },
  dashboardBadgeIcon: { fontSize: 32, marginRight: 14 },
  dashboardBadgeHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9E9EB0',
    letterSpacing: 1,
  },
  dashboardBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
  },

  quoteCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 20,
  },
});
