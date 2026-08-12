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
import Svg, { Rect, Path, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const TOTAL_SHARING_SECONDS = 180; // 3 minutes

// Guidance sentences for Screen 2
const ENTRANCE_GUIDANCE = [
  "Not everything.",
  "Just one small story.",
  "Something real.",
  "Something meaningful.",
  "Something only you know.",
];

// Guidance sentences for Screen 3 (The Sharing Moment)
const SHARING_GUIDANCE = [
  "Maybe it's a memory.",
  "Maybe it's a dream.",
  "Maybe it's something you're proud of.",
  "Maybe it's something that changed you.",
  "There is no right story.",
  "Only your story.",
];

export default function SharePersonalTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Quiet Room & Closed Treasure Chest Intro
  // 2: Entrance & Fading Guidance (Slightly Open Chest, No Buttons)
  // 3: The Sharing Moment (3-Minute Session with Expanding Golden Light Line)
  // 4: Treasures Shared (Chest Fully Opens & Memory Fragments Float)
  // 5: Final Celebration (Trust Builder Badge Unlock)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Screen 1 heading reveal state
  const [showSecondHeading, setShowSecondHeading] = useState(false);

  // Screen 2 entrance guidance index
  const [entranceIndex, setEntranceIndex] = useState(0);

  // Screen 3 sharing timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [sharingGuidanceIndex, setSharingGuidanceIndex] = useState(0);

  // Animations
  const chestLidAnim = useRef(new Animated.Value(0)).current; // 0 (closed) to 1 (fully open)
  const goldenGlowAnim = useRef(new Animated.Value(0.2)).current;
  const particleFloatAnim = useRef(new Animated.Value(0)).current;
  const progressLineAnim = useRef(new Animated.Value(0)).current;

  // Initialize background ambient animations
  useEffect(() => {
    // Golden glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldenGlowAnim, { toValue: 0.8, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(goldenGlowAnim, { toValue: 0.2, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Memory fragment particles float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloatAnim, { toValue: 1, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(particleFloatAnim, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Screen 1: 2-second pause before revealing "Trust begins when one story is shared."
  useEffect(() => {
    if (screen === 1) {
      const timer = setTimeout(() => {
        setShowSecondHeading(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Screen 2: Rotating guidance every 3.5s then auto-advancing to sharing moment
  useEffect(() => {
    let interval: any = null;
    if (screen === 2) {
      interval = setInterval(() => {
        setEntranceIndex((prev) => {
          if (prev >= ENTRANCE_GUIDANCE.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              handleEnterSharing();
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

  // Screen 3: Sharing Timer & Progress Line
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds < TOTAL_SHARING_SECONDS) {
      const step = isFastForward ? 20 : 1;
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + step;
          if (next >= TOTAL_SHARING_SECONDS) {
            setIsTimerActive(false);
            return TOTAL_SHARING_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds, isFastForward]);

  // Dynamically update chest lid opening & golden progress line based on timer
  useEffect(() => {
    if (screen === 3) {
      const progressRatio = timerSeconds / TOTAL_SHARING_SECONDS;
      Animated.timing(progressLineAnim, {
        toValue: progressRatio,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      Animated.timing(chestLidAnim, {
        toValue: 0.3 + progressRatio * 0.7, // Opens from 0.3 to 1.0
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [timerSeconds, screen]);

  // Rotating Screen 3 guidance sentences every 6s
  useEffect(() => {
    let quoteInterval: any = null;
    if (screen === 3) {
      quoteInterval = setInterval(() => {
        setSharingGuidanceIndex((prev) => (prev + 1) % SHARING_GUIDANCE.length);
      }, 6000);
    }
    return () => {
      if (quoteInterval) clearInterval(quoteInterval);
    };
  }, [screen]);

  // Handlers
  const handleOpenChestIntro = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(2);
    // Open lid slightly
    Animated.timing(chestLidAnim, {
      toValue: 0.3,
      duration: 1500,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
    saveProgressToBackend(false);
  };

  const handleEnterSharing = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setScreen(3);
    setIsTimerActive(true);
  };

  const handleFinishSharing = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    setScreen(4);
    Animated.timing(chestLidAnim, {
      toValue: 1.0,
      duration: 1800,
      easing: Easing.out(Easing.elastic(1.2)),
      useNativeDriver: true,
    }).start();
  };

  const handleGoToCelebration = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(5);
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
            task_name: 'Share Something Personal',
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
        taskName: 'Share Something Personal',
        message: 'You built trust.',
        badge: 'Trust Builder',
        difficulty: 'hard',
      },
    } as any);
  };

  const saveProgressToBackend = async (completed: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/treasure-chest/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Share Something Personal',
            session_started: true,
            sharing_completed: completed,
            duration_seconds: TOTAL_SHARING_SECONDS,
            completed,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to save Treasure Chest progress:', err);
    }
  };

  // Interpolated animation values
  const glowOpacity = goldenGlowAnim.interpolate({
    inputRange: [0.2, 0.8],
    outputRange: [0.3, 0.85],
  });

  const particleY = particleFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const lidRotateX = chestLidAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ['0deg', '-25deg', '-70deg'],
  });

  const progressWidthPercent = progressLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Rich Walnut Brown Ambient Background */}
      <LinearGradient
        colors={['#1E120D', '#2D1B13', '#3D261A']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Soft Amber Glow Overlay */}
      <Animated.View style={[styles.amberGlowOverlay, { opacity: glowOpacity }]} />

      {/* Floating Memory Fragments Particles */}
      <Animated.View style={[styles.particlesContainer, { transform: [{ translateY: particleY }] }]}>
        <Text style={styles.memoryParticle}>📜</Text>
        <Text style={styles.memoryParticle2}>✨</Text>
        <Text style={styles.memoryParticle3}>🌟</Text>
      </Animated.View>

      {/* Header Navigation */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="x" size={22} color="#E5C158" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Share Something Personal</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🗝️📦 600 Pts • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 3 : 6)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'archive-outline' : 'view-dashboard-outline'}
            size={22}
            color="#E5C158"
          />
        </TouchableOpacity>
      </View>

      {/* ================================================= SCREEN 1: CLOSED TREASURE CHEST INTRO ================================================= */}
      {screen === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>THE TREASURE CHEST • STAGE 1</Text>
          </View>

          {/* Treasure Chest SVG Graphic */}
          <View style={styles.chestDisplayCard}>
            <Animated.View style={{ transform: [{ perspective: 400 }, { rotateX: lidRotateX }] }}>
              <Svg width="180" height="150" viewBox="0 0 100 80">
                <Defs>
                  <SvgGradient id="chestWood" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#4A3022" stopOpacity="1" />
                    <Stop offset="1" stopColor="#2D1B13" stopOpacity="1" />
                  </SvgGradient>
                  <SvgGradient id="goldTrim" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#E5C158" stopOpacity="1" />
                    <Stop offset="1" stopColor="#D4AF37" stopOpacity="1" />
                  </SvgGradient>
                </Defs>

                {/* Chest Lid & Body */}
                <Rect x="10" y="25" width="80" height="48" rx="6" fill="url(#chestWood)" stroke="#D4AF37" strokeWidth="2" />
                <Path d="M10 25 Q50 5 90 25 Z" fill="url(#chestWood)" stroke="#D4AF37" strokeWidth="2" />

                {/* Gold Trims & Keyhole */}
                <Rect x="22" y="25" width="8" height="48" fill="url(#goldTrim)" />
                <Rect x="70" y="25" width="8" height="48" fill="url(#goldTrim)" />
                <Rect x="44" y="38" width="12" height="16" rx="3" fill="url(#goldTrim)" />
                <Path d="M50 43 L50 48" stroke="#2D1B13" strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
            </Animated.View>
            <View style={styles.chestGlowBase} />
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>"Everyone carries stories worth sharing."</Text>
            {showSecondHeading && (
              <Animated.Text style={styles.largeHeadingTextAccent}>
                "Trust begins when one story is shared."
              </Animated.Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleOpenChestIntro}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>🗝️ Open the Chest</Text>
              <Feather name="arrow-right" size={20} color="#1E120D" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 2: ENTRANCE & GUIDANCE (NO BUTTONS / OPTIONS) ================================================= */}
      {screen === 2 && (
        <View style={styles.fullScreenCenter}>
          <Text style={styles.quietStageLabel}>THE TREASURE CHEST</Text>

          {/* Slightly Open Chest Graphic */}
          <Animated.View style={{ transform: [{ perspective: 400 }, { rotateX: lidRotateX }] }}>
            <Svg width="200" height="160" viewBox="0 0 100 80">
              <Defs>
                <SvgGradient id="chestWood2" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#4A3022" stopOpacity="1" />
                  <Stop offset="1" stopColor="#2D1B13" stopOpacity="1" />
                </SvgGradient>
                <SvgGradient id="goldTrim2" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#E5C158" stopOpacity="1" />
                  <Stop offset="1" stopColor="#D4AF37" stopOpacity="1" />
                </SvgGradient>
              </Defs>
              <Rect x="10" y="25" width="80" height="48" rx="6" fill="url(#chestWood2)" stroke="#E5C158" strokeWidth="2.5" />
              <Path d="M10 25 Q50 5 90 25 Z" fill="url(#chestWood2)" stroke="#E5C158" strokeWidth="2.5" />
              <Rect x="44" y="38" width="12" height="16" rx="3" fill="url(#goldTrim2)" />
            </Svg>
          </Animated.View>

          {/* Soft Fading Guidance */}
          <View style={styles.fadingGuidanceBox}>
            <Text style={styles.fadingGuidanceText}>
              {ENTRANCE_GUIDANCE[entranceIndex]}
            </Text>
          </View>

          <Text style={styles.silenceHint}>Entering quiet sharing moment...</Text>
        </View>
      )}

      {/* ================================================= SCREEN 3: THE SHARING MOMENT (3-MIN SESSION) ================================================= */}
      {screen === 3 && (
        <View style={styles.sharingContainer}>
          {/* Top Indicator */}
          <View style={styles.sharingHeaderRow}>
            <View style={styles.shareReadyPill}>
              <Text style={styles.shareReadyText}>Share when you're ready.</Text>
            </View>

            <View style={styles.ffContainer}>
              <Text style={styles.ffLabel}>⚡ Fast Test</Text>
              <Switch
                value={isFastForward}
                onValueChange={(val) => setIsFastForward(val)}
                trackColor={{ false: '#3D261A', true: '#E5C158' }}
                thumbColor={isFastForward ? '#B8860B' : '#FFFDF7'}
              />
            </View>
          </View>

          {/* Chest Opening Stage */}
          <View style={styles.sharingStage}>
            <Animated.View style={{ transform: [{ perspective: 400 }, { rotateX: lidRotateX }] }}>
              <Svg width="220" height="180" viewBox="0 0 100 80">
                <Defs>
                  <SvgGradient id="chestWood3" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#4A3022" stopOpacity="1" />
                    <Stop offset="1" stopColor="#2D1B13" stopOpacity="1" />
                  </SvgGradient>
                  <SvgGradient id="goldTrim3" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#F5D77F" stopOpacity="1" />
                    <Stop offset="1" stopColor="#D4AF37" stopOpacity="1" />
                  </SvgGradient>
                </Defs>
                <Rect x="10" y="25" width="80" height="48" rx="6" fill="url(#chestWood3)" stroke="#F5D77F" strokeWidth="2.5" />
                <Path d="M10 25 Q50 5 90 25 Z" fill="url(#chestWood3)" stroke="#F5D77F" strokeWidth="2.5" />
                <Rect x="44" y="38" width="12" height="16" rx="3" fill="url(#goldTrim3)" />
              </Svg>
            </Animated.View>

            {/* Natural Guidance Text */}
            <View style={styles.sharingGuidanceBox}>
              <Text style={styles.sharingGuidanceText}>
                {SHARING_GUIDANCE[sharingGuidanceIndex]}
              </Text>
            </View>
          </View>

          {/* Expanding Golden Light Line Progress Bar */}
          <View style={styles.progressLineTrack}>
            <Animated.View style={[styles.progressLineFill, { width: progressWidthPercent }]} />
          </View>

          {/* Action CTA when complete or testing */}
          <View style={styles.bottomActionWrap}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                timerSeconds < TOTAL_SHARING_SECONDS && !isFastForward && styles.disabledBtn,
              ]}
              activeOpacity={0.85}
              disabled={timerSeconds < TOTAL_SHARING_SECONDS && !isFastForward}
              onPress={handleFinishSharing}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8860B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.primaryBtnText}>Complete Sharing 🗝️</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================================================= SCREEN 4: TREASURES SHARED (CHEST FULLY OPENS) ================================================= */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>TREASURES SHARED</Text>
          </View>

          {/* Fully Open Chest & Floating Memory Fragments */}
          <View style={styles.openChestStage}>
            <View style={styles.floatingMemoriesRow}>
              <Text style={styles.floatingPaper}>📜</Text>
              <Text style={styles.floatingPaper2}>✨</Text>
              <Text style={styles.floatingPaper3}>📜</Text>
            </View>

            <Animated.View style={{ transform: [{ perspective: 400 }, { rotateX: '-70deg' }] }}>
              <Svg width="220" height="180" viewBox="0 0 100 80">
                <Defs>
                  <SvgGradient id="chestWood4" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#4A3022" stopOpacity="1" />
                    <Stop offset="1" stopColor="#2D1B13" stopOpacity="1" />
                  </SvgGradient>
                  <SvgGradient id="goldTrim4" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#F5D77F" stopOpacity="1" />
                    <Stop offset="1" stopColor="#D4AF37" stopOpacity="1" />
                  </SvgGradient>
                </Defs>
                <Rect x="10" y="25" width="80" height="48" rx="6" fill="url(#chestWood4)" stroke="#F5D77F" strokeWidth="2.5" />
                <Path d="M10 25 Q50 5 90 25 Z" fill="url(#chestWood4)" stroke="#F5D77F" strokeWidth="2.5" />
                <Rect x="44" y="38" width="12" height="16" rx="3" fill="url(#goldTrim4)" />
              </Svg>
            </Animated.View>
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>
              "The greatest treasures are the ones we choose to share."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleGoToCelebration}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Gather Light 🌟</Text>
              <Feather name="arrow-right" size={20} color="#1E120D" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 5: FINAL CELEBRATION (BADGE UNLOCK) ================================================= */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>FINAL CELEBRATION</Text>
          <Text style={styles.screenHeader}>"Warm light fills the room."</Text>

          {/* Achievement Badge Unlock Card */}
          <View style={styles.badgeUnlockCard}>
            <View style={styles.badgeIconHalo}>
              <Text style={styles.badgeIconText}>🏅</Text>
            </View>
            <Text style={styles.badgeCategoryText}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={styles.badgeTitleText}>Trust Builder</Text>
            <Text style={styles.badgeSubtitleText}>
              "You chose openness over hiding."
            </Text>
            <View style={styles.completionPill}>
              <Text style={styles.completionPillText}>Completion Message: "You built trust."</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleFinalCompletion}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Complete Challenge ✨</Text>
              <Feather name="check-circle" size={20} color="#1E120D" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 6: TASK DETAIL DASHBOARD ================================================= */}
      {screen === 6 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>TASK DETAIL DASHBOARD</Text>
          <Text style={styles.screenHeader}>Share Something Personal</Text>

          {/* Top: Animated Treasure Chest Illustration */}
          <View style={styles.dashboardChestBox}>
            <Svg width="120" height="100" viewBox="0 0 100 80">
              <Defs>
                <SvgGradient id="dashChestWood" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#4A3022" stopOpacity="1" />
                  <Stop offset="1" stopColor="#2D1B13" stopOpacity="1" />
                </SvgGradient>
              </Defs>
              <Rect x="10" y="25" width="80" height="48" rx="6" fill="url(#dashChestWood)" stroke="#D4AF37" strokeWidth="2" />
            </Svg>
            <Text style={styles.dashboardChestLabel}>The Treasure Chest Visual Identity</Text>
          </View>

          {/* Center: Growth Progress Visualization */}
          <View style={styles.dashboardProgressCard}>
            <Text style={styles.dashboardCardTitle}>SHARING SESSION METRICS</Text>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Target Duration</Text>
                <Text style={styles.metricValue}>3 Minutes (300 Task Points)</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🗝️📦</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Core Objective</Text>
                <Text style={styles.metricValue}>Gently share one genuine personal story</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>📜</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Atmosphere</Text>
                <Text style={styles.metricValue}>Walnut Brown Room & Glowing Memory Fragments</Text>
              </View>
            </View>
          </View>

          {/* Bottom: Trust Builder Badge */}
          <View style={styles.dashboardBadgeCard}>
            <Text style={styles.dashboardBadgeIcon}>🏅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashboardBadgeHeader}>REWARD BADGE</Text>
              <Text style={styles.dashboardBadgeName}>Trust Builder</Text>
            </View>
          </View>

          {/* Mandatory Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "Trust grows when we choose to share what truly matters."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => setScreen(1)}
          >
            <LinearGradient
              colors={['#2D1B13', '#1E120D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Return to Chest 🗝️</Text>
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
    backgroundColor: '#1E120D',
  },
  amberGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  particlesContainer: {
    position: 'absolute',
    top: height * 0.18,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memoryParticle: { fontSize: 20 },
  memoryParticle2: { fontSize: 16 },
  memoryParticle3: { fontSize: 18 },

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
    backgroundColor: 'rgba(61, 38, 26, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFDF7',
  },
  headerTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5C158',
  },
  dashboardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(61, 38, 26, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },

  screenTagPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  screenTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5C158',
    letterSpacing: 0.8,
  },
  screenSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E5C158',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFDF7',
    textAlign: 'center',
    marginBottom: 12,
  },

  chestDisplayCard: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  chestGlowBase: {
    width: 140,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginTop: -10,
  },

  headingBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  largeHeadingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFDF7',
    textAlign: 'center',
  },
  largeHeadingTextAccent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E5C158',
    textAlign: 'center',
    marginTop: 6,
  },

  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5C158',
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
    color: '#1E120D',
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
    color: '#E5C158',
    letterSpacing: 1.2,
    marginBottom: 20,
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
    color: '#FFFDF7',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  silenceHint: {
    fontSize: 12,
    color: '#E5C158',
    marginTop: 20,
  },

  // Screen 3 Sharing
  sharingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  sharingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  shareReadyPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5C158',
  },
  shareReadyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFDF7',
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
    color: '#E5C158',
  },

  sharingStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharingGuidanceBox: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sharingGuidanceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5D77F',
    textAlign: 'center',
    lineHeight: 24,
  },

  progressLineTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginVertical: 16,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: '#E5C158',
  },
  bottomActionWrap: {
    width: '100%',
  },

  // Screen 4 Treasures Shared
  openChestStage: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  floatingMemoriesRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 10,
  },
  floatingPaper: { fontSize: 26 },
  floatingPaper2: { fontSize: 24 },
  floatingPaper3: { fontSize: 28 },

  // Screen 5 Celebration
  badgeUnlockCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#2D1B13',
    borderWidth: 2,
    borderColor: '#D4AF37',
    padding: 24,
    alignItems: 'center',
    marginVertical: 24,
  },
  badgeIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIconText: { fontSize: 32 },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E5C158',
    letterSpacing: 1.2,
  },
  badgeTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFDF7',
    marginVertical: 4,
  },
  badgeSubtitleText: {
    fontSize: 13,
    color: '#F5D77F',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 14,
  },
  completionPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5C158',
  },
  completionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFDF7',
  },

  // Screen 6 Dashboard
  dashboardChestBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardChestLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5C158',
    marginTop: 6,
  },
  dashboardProgressCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#2D1B13',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 20,
    marginBottom: 16,
  },
  dashboardCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E5C158',
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
    color: '#E5C158',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFDF7',
  },

  dashboardBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#2D1B13',
    borderWidth: 1.5,
    borderColor: '#E5C158',
    padding: 16,
    marginBottom: 16,
  },
  dashboardBadgeIcon: { fontSize: 32, marginRight: 14 },
  dashboardBadgeHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E5C158',
    letterSpacing: 1,
  },
  dashboardBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFDF7',
  },

  quoteCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#1E120D',
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 18,
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#F5D77F',
    textAlign: 'center',
    lineHeight: 20,
  },
});
