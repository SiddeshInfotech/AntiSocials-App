import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  Alert,
  Switch,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';
import DndModule from '../modules/dnd-module';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 300; // 5 minutes = 300 seconds

// Particle data for the final shield cinematic transition
const PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const radius = 60 + Math.random() * 50;
  return {
    id: i,
    startX: Math.cos(angle) * radius,
    startY: Math.sin(angle) * radius,
    color: i % 2 === 0 ? '#00d2ff' : '#38bdf8',
    size: 4 + Math.random() * 6,
  };
});

export default function NoEscapeTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Primary State
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus Mode / DND Native Integration State
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [hasDndPermission, setHasDndPermission] = useState(false);

  // Simulated Temptation State
  const [screenLit, setScreenLit] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<{
    title: string;
    sub: string;
    icon: string;
  } | null>(null);
  const [isMirrorState, setIsMirrorState] = useState(false);
  const [displayText, setDisplayText] = useState('Stay with this moment.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const mainSceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Phone Animations
  const phoneFloatAnim = useRef(new Animated.Value(0)).current;
  const phoneRotateAnim = useRef(new Animated.Value(0)).current;
  const phoneGlowAnim = useRef(new Animated.Value(0.4)).current;
  const phoneOpacityAnim = useRef(new Animated.Value(1)).current;
  const phoneScaleAnim = useRef(new Animated.Value(1)).current;
  const platformGlowAnim = useRef(new Animated.Value(0.3)).current;
  const roomLightAnim = useRef(new Animated.Value(0)).current;

  // Cinematic Shield Transformation Animations
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;
  const shieldGlowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  // Check DND native permissions on load
  useEffect(() => {
    try {
      if (DndModule && typeof DndModule.checkDndPermission === 'function') {
        const granted = DndModule.checkDndPermission();
        setHasDndPermission(granted);
      }
    } catch (e) {
      console.log('Native DND check unavailable');
    }
  }, []);

  // Continuous background ambient animations
  useEffect(() => {
    // Floating Phone Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(phoneFloatAnim, {
          toValue: -12,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(phoneFloatAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle platform pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(platformGlowAnim, {
          toValue: 0.8,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(platformGlowAnim, {
          toValue: 0.3,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 5:00)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    // Timeline triggers based on elapsed time (in seconds)
    if (elapsedTime === 0) {
      setDisplayText('Stay with this moment.');
      setSubDisplayText(null);
      setScreenLit(false);
      setCurrentNotification(null);
    } else if (elapsedTime === 20) {
      // 0:20 - Phone vibrates once, screen lights briefly
      triggerHaptics();
      setScreenLit(true);
      setDisplayText('You noticed it.');
      setSubDisplayText(null);
      setTimeout(() => setScreenLit(false), 2200);
    } else if (elapsedTime === 45) {
      // 0:45 - Lock screen lights up, fake notification appears & disappears
      triggerHaptics();
      setScreenLit(true);
      setCurrentNotification({
        title: '📩 New Message',
        sub: 'Are you free right now?',
        icon: 'message-circle',
      });
      setDisplayText("You don't have to respond.");

      setTimeout(() => {
        setCurrentNotification(null);
        setScreenLit(false);
      }, 4500);
    } else if (elapsedTime === 75) {
      // 1:15 - Multiple fake notifications sequence
      triggerHaptics();
      setScreenLit(true);
      setCurrentNotification({
        title: '❤️ Social Update',
        sub: 'Alex tagged you in a photo',
        icon: 'heart',
      });
      setDisplayText("You don't have to respond.");

      setTimeout(() => {
        setCurrentNotification({
          title: '📢 Reminder',
          sub: 'Daily digest is ready',
          icon: 'bell',
        });
      }, 3000);

      setTimeout(() => {
        setCurrentNotification(null);
        setScreenLit(false);
      }, 6000);
    } else if (elapsedTime === 105) {
      // 1:45 - Phone slowly rotates, soft blue light pulses
      setDisplayText('The urge is temporary.');
      setSubDisplayText(null);

      Animated.sequence([
        Animated.timing(phoneRotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(phoneRotateAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(phoneGlowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(phoneGlowAnim, {
          toValue: 0.4,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 135) {
      // 2:15 - Everything becomes quiet. No notifications, ambient focus.
      setScreenLit(false);
      setCurrentNotification(null);
      setDisplayText('Notice what happens when you don’t react.');
      setSubDisplayText(null);
    } else if (elapsedTime === 180) {
      // 3:00 - Phone glows again. Notification almost appears then vanishes
      setScreenLit(true);
      setDisplayText('Not every impulse deserves your attention.');

      setTimeout(() => {
        setScreenLit(false);
      }, 2500);
    } else if (elapsedTime === 240) {
      // 4:00 - Phone slowly fades into darkness, platform glows brighter, room brightens
      setDisplayText('Your attention is returning to you.');

      Animated.parallel([
        Animated.timing(phoneOpacityAnim, {
          toValue: 0.5,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(roomLightAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime >= 300) {
      // 5:00 - Phone screen transforms into a mirror silhouette
      setIsMirrorState(true);
      setScreenLit(true);
      setDisplayText('The phone was never the challenge.');

      setTimeout(() => {
        setSubDisplayText('The habit was.');
      }, 2200);

      // Initiate Final Cinematic after reflection pause
      setTimeout(() => {
        startFinalCinematic();
      }, 5500);
    }
  }, [elapsedTime, phase, isPaused]);

  // Main Timer Decrement Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'active' && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, isPaused, timeLeft]);

  // Haptic feedback trigger (with fallback)
  const triggerHaptics = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Ignore if not supported
    }
  };

  // Toggle Focus Mode / DND safely
  const handleToggleFocusMode = (val: boolean) => {
    setFocusModeEnabled(val);
    try {
      if (DndModule && typeof DndModule.setDndMode === 'function') {
        if (val && !hasDndPermission && typeof DndModule.requestDndPermission === 'function') {
          DndModule.requestDndPermission();
        }
        DndModule.setDndMode(val);
      }
    } catch (e) {
      console.log('Native DND set mode fallback:', e);
    }
  };

  // Start the Challenge (Transition to Temptation Lab)
  const startChallenge = async () => {
    // Notify backend session started
    saveProgressBackend({ session_started: true, timeline_step: 0 });

    setPhase('active');
    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(mainSceneFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // FINAL CINEMATIC TRANSFORMATION (Particles -> Shield)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    // Phone dissolves, particles gather, shield emerges
    Animated.parallel([
      Animated.timing(phoneScaleAnim, {
        toValue: 0,
        duration: 1500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(phoneOpacityAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Shield pop & glow
      Animated.parallel([
        Animated.spring(shieldScaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(shieldOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(shieldGlowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ----------------------------------------------------
  // BACKEND INTEGRATION & COMPLETION
  // ----------------------------------------------------
  const saveProgressBackend = async (dataPayload: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/no-escape/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'No Escape Behavior (Phone Avoidance)',
            focus_mode_enabled: focusModeEnabled,
            ...dataPayload,
          }),
        });
      }
    } catch (e) {
      console.log('saveProgressBackend error:', e);
    }
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);

    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        // Complete Task API
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'No Escape Behavior (Phone Avoidance)',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '600',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }

    // MANDARY: Navigate to shared Well Done completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You stayed.',
        difficulty: 'hard',
        taskName: 'No Escape Behavior (Phone Avoidance)',
        badge: 'Impulse Master',
      },
    } as any);
  };

  // Developer Fast-Forward Helper
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__ || true) {
      const time = Date.now();
      if (time - lastPress.current < 350) {
        setTimeLeft(5); // Jump to 5s left
        Alert.alert('Dev Skip Triggered', 'Skipped to final phase (5s remaining)');
      }
      lastPress.current = time;
    }
  };

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const interpolatedPhoneRotate = phoneRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '8deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Futuristic Background Layers */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#05050a', '#080c19', '#0d1326', '#05050a']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Dynamic Light Overlay when room brightens */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: roomLightAnim,
              backgroundColor: 'rgba(0, 162, 255, 0.08)',
            },
          ]}
          pointerEvents="none"
        />
        <View style={styles.radialGlow} pointerEvents="none" />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Minimal HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'active' && timeLeft > 0) {
                Alert.alert(
                  'Abort Session?',
                  'Leaving now will reset your progress.',
                  [
                    { text: 'Stay', style: 'cancel' },
                    {
                      text: 'Abort',
                      style: 'destructive',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#00d2ff" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <View style={styles.liveDot} />
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'TEMPTATION LAB' : 'ZONE ACTIVE'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ============================================================ */}
        {/* PHASE 1: TASK DETAIL PAGE (Onboarding & Configuration)       */}
        {/* ============================================================ */}
        <Animated.View
          style={[styles.detailsWrapper, { opacity: uiFadeAnim }]}
          pointerEvents={phase === 'details' ? 'auto' : 'none'}
        >
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Floating Smartphone Hero Icon */}
            <View style={styles.detailHeroContainer}>
              <Animated.View
                style={[
                  styles.heroPhoneWrapper,
                  { transform: [{ translateY: phoneFloatAnim }] },
                ]}
              >
                <LinearGradient
                  colors={['#1f2937', '#111827', '#030712']}
                  style={styles.heroPhoneBody}
                >
                  <View style={styles.heroPhoneNotch} />
                  <View style={styles.heroPhoneScreen}>
                    <Feather name="shield" size={32} color="#00d2ff" />
                    <Text style={styles.heroPhoneTitle}>TEMPTATION</Text>
                  </View>
                  <View style={styles.glassReflection} />
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Central Glass Card */}
            <View style={styles.glassCard}>
              <Text style={styles.taskTitle}>No Escape Behavior</Text>
              <Text style={styles.taskSubTitle}>(Phone Avoidance)</Text>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.badgePill}>
                  <Feather name="clock" size={13} color="#38bdf8" />
                  <Text style={styles.badgeText}>5 Minutes</Text>
                </View>
                <View style={[styles.badgePill, styles.badgeHard]}>
                  <Ionicons name="flame" size={13} color="#ef4444" />
                  <Text style={[styles.badgeText, { color: '#ef4444' }]}>
                    ⭐⭐⭐ Hard
                  </Text>
                </View>
                <View style={[styles.badgePill, styles.badgePoints]}>
                  <Ionicons name="trophy" size={13} color="#f59e0b" />
                  <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                    600 Points
                  </Text>
                </View>
              </View>

              {/* Description Text */}
              <Text style={styles.descriptionText}>
                Most people don't unlock their phone because they need to.{'\n'}
                They unlock it because they feel uncomfortable.{'\n\n'}
                Today's challenge is different.{'\n'}
                Notice the urge. Let it exist. Don't obey it. Stay present.
              </Text>

              {/* Quote Box */}
              <View style={styles.quoteBox}>
                <Feather name="shield" size={18} color="#00d2ff" style={{ marginRight: 8 }} />
                <Text style={styles.quoteText}>
                  "Real freedom begins when every notification no longer controls your attention."
                </Text>
              </View>

              {/* Impulse Master Badge Banner */}
              <View style={styles.badgeBanner}>
                <Text style={styles.badgeBannerEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeBannerTitle}>Impulse Master</Text>
                  <Text style={styles.badgeBannerSub}>
                    Unlock achievement by observing without reacting
                  </Text>
                </View>
              </View>

              {/* Focus Mode / DND Option Toggle */}
              <View style={styles.focusToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.focusToggleTitle}>
                    Focus Mode / DND Suppress
                  </Text>
                  <Text style={styles.focusToggleSub}>
                    {hasDndPermission
                      ? 'Native DND suppression enabled'
                      : 'Optionally suppresses native ringers during lab'}
                  </Text>
                </View>
                <Switch
                  value={focusModeEnabled}
                  onValueChange={handleToggleFocusMode}
                  trackColor={{ false: '#374151', true: '#0066ff' }}
                  thumbColor={focusModeEnabled ? '#00d2ff' : '#9ca3af'}
                />
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={startChallenge}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#0066ff', '#00d2ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>START EXPERIMENT</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN TEMPTATION LAB EXPERIENCE & FINAL CINEMATIC*/}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: mainSceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Arena */}
          <View style={styles.labCenterStage}>
            {/* Floating Platform Glow Ring */}
            <Animated.View
              style={[
                styles.platformGlowRing,
                { transform: [{ scale: platformGlowAnim }] },
              ]}
            />

            {/* Simulated 3D Premium Smartphone */}
            {phase !== 'cinematic' && (
              <Animated.View
                style={[
                  styles.labPhoneContainer,
                  {
                    transform: [
                      { translateY: phoneFloatAnim },
                      { rotateZ: interpolatedPhoneRotate },
                      { scale: phoneScaleAnim },
                    ],
                    opacity: phoneOpacityAnim,
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    screenLit
                      ? ['#1e293b', '#0f172a', '#1e293b']
                      : ['#0f172a', '#020617', '#090d16']
                  }
                  style={[
                    styles.labPhoneBody,
                    screenLit && styles.labPhoneBodyLit,
                  ]}
                >
                  {/* Phone Speaker Notch */}
                  <View style={styles.labPhoneNotch} />

                  {/* Phone Screen Display */}
                  <View style={styles.labPhoneScreen}>
                    {/* Simulated Notification Popup */}
                    {currentNotification && (
                      <Animated.View style={styles.notificationCard}>
                        <View style={styles.notifIconCircle}>
                          <Feather
                            name={currentNotification.icon as any}
                            size={16}
                            color="#00d2ff"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.notifTitle}>
                            {currentNotification.title}
                          </Text>
                          <Text style={styles.notifBody}>
                            {currentNotification.sub}
                          </Text>
                        </View>
                      </Animated.View>
                    )}

                    {/* Mirror Reflection State (at 5:00) */}
                    {isMirrorState && (
                      <View style={styles.mirrorContainer}>
                        <LinearGradient
                          colors={[
                            'rgba(0, 210, 255, 0.25)',
                            'rgba(255, 255, 255, 0.05)',
                          ]}
                          style={StyleSheet.absoluteFillObject}
                        />
                        <Ionicons
                          name="person-outline"
                          size={76}
                          color="rgba(255, 255, 255, 0.55)"
                        />
                      </View>
                    )}
                  </View>

                  {/* Phone Glass Shine */}
                  <View style={styles.phoneShine} />
                </LinearGradient>

                {/* Floating Glass Platform Base */}
                <View style={styles.platformBase} />
              </Animated.View>
            )}

            {/* FINAL CINEMATIC: Disintegrating Particles into Shield */}
            {phase === 'cinematic' && (
              <View style={styles.cinematicCenter}>
                {/* Floating Glow Particles */}
                {PARTICLES.map((p) => {
                  const pX = particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [p.startX, 0],
                  });
                  const pY = particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [p.startY, 0],
                  });
                  const pOpacity = particleAnim.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [1, 0.8, 0],
                  });

                  return (
                    <Animated.View
                      key={p.id}
                      style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        borderRadius: p.size / 2,
                        backgroundColor: p.color,
                        opacity: pOpacity,
                        transform: [{ translateX: pX }, { translateY: pY }],
                      }}
                    />
                  );
                })}

                {/* Emerge Shield Icon */}
                <Animated.View
                  style={[
                    styles.shieldContainer,
                    {
                      transform: [{ scale: shieldScaleAnim }],
                      opacity: shieldOpacityAnim,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#00d2ff', '#0066ff']}
                    style={styles.shieldGradient}
                  >
                    <Feather name="shield" size={64} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              </View>
            )}
          </View>

          {/* Central Psychological Display Text */}
          <View style={styles.displayTextContainer}>
            <Text style={styles.mainDisplayText}>{displayText}</Text>
            {subDisplayText && (
              <Text style={styles.subDisplayText}>{subDisplayText}</Text>
            )}
          </View>

          {/* Timer & Controls */}
          {phase === 'active' && (
            <View style={styles.labFooterControls}>
              <Pressable onPress={handleDevSkip}>
                <Text style={styles.timerText}>
                  {formatTimerDigits(timeLeft)}
                </Text>
              </Pressable>

              <View style={styles.footerBtnRow}>
                <TouchableOpacity
                  style={styles.pauseBtn}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseBtnText}>
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.abortBtn}
                  onPress={() => {
                    Alert.alert(
                      'Abort Challenge?',
                      'Are you sure you want to exit? Your progress will be lost.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Abort',
                          style: 'destructive',
                          onPress: () => router.back(),
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.abortBtnText}>ABORT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Final Achievement & Claim Button (Phase 3) */}
          {phase === 'cinematic' && (
            <Animated.View
              style={[
                styles.achievementBox,
                { opacity: shieldOpacityAnim },
              ]}
            >
              <View style={styles.achievementBadgeRow}>
                <Text style={styles.achievementBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={styles.achievementBadgeTag}>
                    ACHIEVEMENT UNLOCKED
                  </Text>
                  <Text style={styles.achievementBadgeTitle}>
                    Impulse Master
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "You proved that awareness is stronger than habit."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0066ff', '#00d2ff']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+600 PTS)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
  },
  safeArea: {
    flex: 1,
  },
  radialGlow: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(0, 102, 255, 0.06)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00d2ff',
    marginRight: 6,
  },
  headerTagText: {
    color: '#00d2ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding / Details Page
  detailsWrapper: {
    flex: 1,
    width: '100%',
  },
  detailsScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  detailHeroContainer: {
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'center',
  },
  heroPhoneWrapper: {
    width: 100,
    height: 160,
    borderRadius: 20,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#00d2ff',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  heroPhoneBody: {
    flex: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  heroPhoneNotch: {
    position: 'absolute',
    top: 8,
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroPhoneScreen: {
    alignItems: 'center',
    marginTop: 10,
  },
  heroPhoneTitle: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  glassReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ skewY: '-25deg' }],
  },

  glassCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 255, 0.25)',
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  taskSubTitle: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '600',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeHard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  badgePoints: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  descriptionText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#00d2ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    width: '100%',
  },
  badgeBannerEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  badgeBannerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeBannerSub: {
    color: '#64748b',
    fontSize: 11,
  },

  focusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  focusToggleTitle: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
  },
  focusToggleSub: {
    color: '#64748b',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Phase 2 & 3: Temptation Lab Arena
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  labCenterStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  platformGlowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(0, 210, 255, 0.4)',
    backgroundColor: 'rgba(0, 102, 255, 0.08)',
    shadowColor: '#00d2ff',
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  labPhoneContainer: {
    alignItems: 'center',
  },
  labPhoneBody: {
    width: 160,
    height: 290,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  labPhoneBodyLit: {
    borderColor: '#00d2ff',
    shadowColor: '#00d2ff',
    shadowOpacity: 0.7,
    shadowRadius: 25,
  },
  labPhoneNotch: {
    alignSelf: 'center',
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  labPhoneScreen: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.4)',
    width: '100%',
  },
  notifIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  notifBody: {
    color: '#94a3b8',
    fontSize: 10,
  },
  mirrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneShine: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 90,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '25deg' }],
  },
  platformBase: {
    width: 140,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.5)',
    marginTop: 15,
  },

  // Final Cinematic Shield
  cinematicCenter: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#00d2ff',
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 16,
  },
  shieldGradient: {
    flex: 1,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Psychological Text Display
  displayTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 15,
  },
  mainDisplayText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subDisplayText: {
    color: '#00d2ff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },

  // Footer Controls
  labFooterControls: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  timerText: {
    color: '#64748b',
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pauseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pauseBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  abortBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  abortBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Achievement Unlock Box (Phase 3)
  achievementBox: {
    width: '90%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 255, 0.4)',
    marginBottom: 10,
  },
  achievementBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  achievementBadgeEmoji: {
    fontSize: 36,
  },
  achievementBadgeTag: {
    color: '#00d2ff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  achievementBadgeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  achievementDescription: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
  },
  claimButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  claimBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
