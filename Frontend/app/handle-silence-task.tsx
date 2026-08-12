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
import Svg, { Rect, Path, G, Defs, LinearGradient as SvgGradient, Stop, Line } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const TOTAL_SILENCE_SECONDS = 180; // 3 minutes

// Guidance sentences for Screen 2
const ENTRANCE_GUIDANCE = [
  "Silence isn't awkward.",
  "It only feels unfamiliar.",
  "Stay here.",
  "Nothing is wrong.",
  "The pause belongs here.",
];

// Guidance sentences for Screen 3 (The Silence Experience)
const SILENCE_GUIDANCE = [
  "You don't need to rescue the silence.",
  "Confidence can be quiet.",
  "Let the moment breathe.",
  "You're still connected.",
  "Nothing needs to happen.",
];

export default function HandleSilenceTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Concert Hall & Spotlight Piano Intro
  // 2: Entrance & Fading Guidance (No Buttons)
  // 3: The Silence Experience (3-Minute Session with Glowing Musical Staff)
  // 4: Expanding Connection ("Silence isn't empty...")
  // 5: Final Celebration (Composed Presence Badge Unlock)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Screen 1 heading reveal state
  const [showSecondHeading, setShowSecondHeading] = useState(false);

  // Screen 2 entrance guidance index
  const [entranceIndex, setEntranceIndex] = useState(0);

  // Screen 3 silence timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [silenceGuidanceIndex, setSilenceGuidanceIndex] = useState(0);

  // Animations
  const spotlightScaleAnim = useRef(new Animated.Value(0.4)).current;
  const pianoGlowAnim = useRef(new Animated.Value(0.2)).current;
  const noteFloatAnim = useRef(new Animated.Value(0)).current;
  const progressStaffAnim = useRef(new Animated.Value(0)).current;
  const keyLightAnim = useRef(new Animated.Value(0)).current;

  // Initialize ambient animations
  useEffect(() => {
    // Piano key ambient glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pianoGlowAnim, { toValue: 0.85, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pianoGlowAnim, { toValue: 0.25, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Floating music notes loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(noteFloatAnim, { toValue: 1, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(noteFloatAnim, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Screen 1: 2-second pause before revealing "...needs moments of silence."
  useEffect(() => {
    if (screen === 1) {
      const timer = setTimeout(() => {
        setShowSecondHeading(true);
        // Key softly lights up
        Animated.timing(keyLightAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Screen 2: Rotating guidance every 3.5s then auto-advancing to silence experience
  useEffect(() => {
    let interval: any = null;
    if (screen === 2) {
      interval = setInterval(() => {
        setEntranceIndex((prev) => {
          if (prev >= ENTRANCE_GUIDANCE.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              handleEnterSilence();
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

  // Screen 3: Silence Timer & Musical Staff Progress
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds < TOTAL_SILENCE_SECONDS) {
      const step = isFastForward ? 20 : 1;
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + step;
          if (next >= TOTAL_SILENCE_SECONDS) {
            setIsTimerActive(false);
            return TOTAL_SILENCE_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds, isFastForward]);

  // Dynamically update musical staff progress & spotlight widening based on timer
  useEffect(() => {
    if (screen === 3) {
      const progressRatio = timerSeconds / TOTAL_SILENCE_SECONDS;
      Animated.timing(progressStaffAnim, {
        toValue: progressRatio,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      Animated.timing(spotlightScaleAnim, {
        toValue: 0.4 + progressRatio * 0.6, // Widens from 0.4 to 1.0
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
        setSilenceGuidanceIndex((prev) => (prev + 1) % SILENCE_GUIDANCE.length);
      }, 6000);
    }
    return () => {
      if (quoteInterval) clearInterval(quoteInterval);
    };
  }, [screen]);

  // Handlers
  const handleBeginIntro = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(2);
    saveProgressToBackend(false);
  };

  const handleEnterSilence = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setScreen(3);
    setIsTimerActive(true);
  };

  const handleFinishSilence = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    setScreen(4);
    Animated.timing(spotlightScaleAnim, {
      toValue: 1.0,
      duration: 1800,
      easing: Easing.out(Easing.ease),
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
            task_name: 'Handle Awkward Silence',
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
        taskName: 'Handle Awkward Silence',
        message: 'You stayed composed.',
        badge: 'Composed Presence',
        difficulty: 'hard',
      },
    } as any);
  };

  const saveProgressToBackend = async (completed: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/symphony-silence/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Handle Awkward Silence',
            session_started: true,
            silence_completed: completed,
            duration_seconds: TOTAL_SILENCE_SECONDS,
            completed,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to save Symphony of Silence progress:', err);
    }
  };

  // Interpolated animation values
  const glowOpacity = pianoGlowAnim.interpolate({
    inputRange: [0.25, 0.85],
    outputRange: [0.2, 0.75],
  });

  const noteY = noteFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const progressStaffWidth = progressStaffAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Deep Piano Black Background */}
      <LinearGradient
        colors={['#050508', '#0A0A0E', '#12121A']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Single Concert Hall Spotlight Glow */}
      <Animated.View
        style={[
          styles.spotlightCone,
          {
            opacity: glowOpacity,
            transform: [{ scale: spotlightScaleAnim }],
          },
        ]}
      />

      {/* Soft Floating Musical Notes */}
      <Animated.View style={[styles.notesContainer, { transform: [{ translateY: noteY }] }]}>
        <Text style={styles.noteParticle}>🎵</Text>
        <Text style={styles.noteParticle2}>🎶</Text>
        <Text style={styles.noteParticle3}>🎼</Text>
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="x" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Handle Awkward Silence</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🎼🤍 600 Pts • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 3 : 6)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'music-clef-treble' : 'view-dashboard-outline'}
            size={22}
            color="#CBD5E1"
          />
        </TouchableOpacity>
      </View>

      {/* ================================================= SCREEN 1: CONCERT HALL & SPOTLIGHT PIANO INTRO ================================================= */}
      {screen === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>SYMPHONY OF SILENCE • STAGE 1</Text>
          </View>

          {/* Grand Piano SVG Graphic */}
          <View style={styles.pianoDisplayCard}>
            <Svg width="180" height="150" viewBox="0 0 100 80">
              <Defs>
                <SvgGradient id="pianoBodyGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#1C1C26" stopOpacity="1" />
                  <Stop offset="1" stopColor="#0A0A0E" stopOpacity="1" />
                </SvgGradient>
                <SvgGradient id="ivoryKeyGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FAFAFC" stopOpacity="1" />
                  <Stop offset="1" stopColor="#CBD5E1" stopOpacity="1" />
                </SvgGradient>
              </Defs>

              {/* Piano Body */}
              <Path d="M15 30 Q45 10 85 30 L85 65 L15 65 Z" fill="url(#pianoBodyGrad)" stroke="#CBD5E1" strokeWidth="2" />
              {/* Keyboard Row */}
              <Rect x="20" y="50" width="60" height="15" rx="2" fill="url(#ivoryKeyGrad)" />
              <Rect x="28" y="50" width="4" height="9" fill="#0A0A0E" />
              <Rect x="38" y="50" width="4" height="9" fill="#0A0A0E" />
              <Rect x="52" y="50" width="4" height="9" fill="#0A0A0E" />
              <Rect x="62" y="50" width="4" height="9" fill="#0A0A0E" />
            </Svg>
            <View style={styles.spotlightBaseLight} />
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>"Every beautiful conversation..."</Text>
            {showSecondHeading && (
              <Animated.Text style={styles.largeHeadingTextAccent}>
                "...needs moments of silence."
              </Animated.Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleBeginIntro}
          >
            <LinearGradient
              colors={['#FAFAFC', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>🎼 Begin</Text>
              <Feather name="arrow-right" size={20} color="#0A0A0E" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 2: ENTRANCE & GUIDANCE (NO BUTTONS / OPTIONS) ================================================= */}
      {screen === 2 && (
        <View style={styles.fullScreenCenter}>
          <Text style={styles.quietStageLabel}>THE SYMPHONY OF SILENCE</Text>

          {/* Quiet Piano Graphic */}
          <Svg width="180" height="140" viewBox="0 0 100 80">
            <Defs>
              <SvgGradient id="pianoBodyGrad2" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#1C1C26" stopOpacity="1" />
                <Stop offset="1" stopColor="#0A0A0E" stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Path d="M15 30 Q45 10 85 30 L85 65 L15 65 Z" fill="url(#pianoBodyGrad2)" stroke="#FAFAFC" strokeWidth="2.5" />
            <Rect x="20" y="50" width="60" height="15" rx="2" fill="#FAFAFC" />
          </Svg>

          {/* Soft Fading Guidance */}
          <View style={styles.fadingGuidanceBox}>
            <Text style={styles.fadingGuidanceText}>
              {ENTRANCE_GUIDANCE[entranceIndex]}
            </Text>
          </View>

          <Text style={styles.silenceHint}>Entering quiet pause...</Text>
        </View>
      )}

      {/* ================================================= SCREEN 3: THE SILENCE EXPERIENCE (3-MIN SESSION) ================================================= */}
      {screen === 3 && (
        <View style={styles.silenceContainer}>
          {/* Top Indicator */}
          <View style={styles.silenceHeaderRow}>
            <View style={styles.stayPresentPill}>
              <Text style={styles.stayPresentText}>Stay Present</Text>
            </View>

            <View style={styles.ffContainer}>
              <Text style={styles.ffLabel}>⚡ Fast Test</Text>
              <Switch
                value={isFastForward}
                onValueChange={(val) => setIsFastForward(val)}
                trackColor={{ false: '#1C1C26', true: '#CBD5E1' }}
                thumbColor={isFastForward ? '#FAFAFC' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Central Concert Hall & Piano Stage */}
          <View style={styles.silenceStage}>
            <Svg width="220" height="160" viewBox="0 0 100 80">
              <Defs>
                <SvgGradient id="pianoBodyGrad3" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#272730" stopOpacity="1" />
                  <Stop offset="1" stopColor="#0A0A0E" stopOpacity="1" />
                </SvgGradient>
              </Defs>
              <Path d="M15 30 Q45 10 85 30 L85 65 L15 65 Z" fill="url(#pianoBodyGrad3)" stroke="#CBD5E1" strokeWidth="2" />
              <Rect x="20" y="50" width="60" height="15" rx="2" fill="#FAFAFC" />
            </Svg>

            {/* Natural Guidance Text */}
            <View style={styles.silenceGuidanceBox}>
              <Text style={styles.silenceGuidanceText}>
                {SILENCE_GUIDANCE[silenceGuidanceIndex]}
              </Text>
            </View>
          </View>

          {/* Floating Musical Staff Progress Line */}
          <View style={styles.staffContainer}>
            <Svg width="100%" height="20" viewBox="0 0 300 20">
              <Line x1="0" y1="2" x2="300" y2="2" stroke="rgba(203, 213, 225, 0.2)" strokeWidth="1" />
              <Line x1="0" y1="6" x2="300" y2="6" stroke="rgba(203, 213, 225, 0.2)" strokeWidth="1" />
              <Line x1="0" y1="10" x2="300" y2="10" stroke="rgba(203, 213, 225, 0.2)" strokeWidth="1" />
              <Line x1="0" y1="14" x2="300" y2="14" stroke="rgba(203, 213, 225, 0.2)" strokeWidth="1" />
              <Line x1="0" y1="18" x2="300" y2="18" stroke="rgba(203, 213, 225, 0.2)" strokeWidth="1" />
            </Svg>
            <View style={styles.progressStaffTrack}>
              <Animated.View style={[styles.progressStaffFill, { width: progressStaffWidth }]} />
            </View>
          </View>

          {/* Action CTA when complete or testing */}
          <View style={styles.bottomActionWrap}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                timerSeconds < TOTAL_SILENCE_SECONDS && !isFastForward && styles.disabledBtn,
              ]}
              activeOpacity={0.85}
              disabled={timerSeconds < TOTAL_SILENCE_SECONDS && !isFastForward}
              onPress={handleFinishSilence}
            >
              <LinearGradient
                colors={['#FAFAFC', '#CBD5E1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.primaryBtnText}>Complete Silence Session 🎼</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================================================= SCREEN 4: EXPANDING CONNECTION ("SILENCE ISN'T EMPTY...") ================================================= */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>EXPANDING CONNECTION</Text>
          </View>

          <View style={styles.glowingPianoStage}>
            <Svg width="200" height="150" viewBox="0 0 100 80">
              <Defs>
                <SvgGradient id="glowPianoGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FAFAFC" stopOpacity="0.9" />
                  <Stop offset="1" stopColor="#CBD5E1" stopOpacity="0.6" />
                </SvgGradient>
              </Defs>
              <Path d="M15 30 Q45 10 85 30 L85 65 L15 65 Z" fill="url(#glowPianoGrad)" stroke="#FAFAFC" strokeWidth="3" />
              <Rect x="20" y="50" width="60" height="15" rx="2" fill="#FAFAFC" />
            </Svg>
          </View>

          <View style={styles.headingBox}>
            <Text style={styles.largeHeadingText}>"Silence isn't empty."</Text>
            <Text style={styles.largeHeadingTextAccent}>
              "It's where connection has room to grow."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleGoToCelebration}
          >
            <LinearGradient
              colors={['#FAFAFC', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Light Concert Hall 🌟</Text>
              <Feather name="arrow-right" size={20} color="#0A0A0E" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 5: FINAL CELEBRATION (BADGE UNLOCK) ================================================= */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>FINAL CELEBRATION</Text>
          <Text style={styles.screenHeader}>"Spotlight widens."</Text>

          {/* Achievement Badge Unlock Card */}
          <View style={styles.badgeUnlockCard}>
            <View style={styles.badgeIconHalo}>
              <Text style={styles.badgeIconText}>🏅</Text>
            </View>
            <Text style={styles.badgeCategoryText}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={styles.badgeTitleText}>Composed Presence</Text>
            <Text style={styles.badgeSubtitleText}>
              "You embraced the pause instead of fearing it."
            </Text>
            <View style={styles.completionPill}>
              <Text style={styles.completionPillText}>Completion Message: "You stayed composed."</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleFinalCompletion}
          >
            <LinearGradient
              colors={['#FAFAFC', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Complete Challenge ✨</Text>
              <Feather name="check-circle" size={20} color="#0A0A0E" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 6: TASK DETAIL DASHBOARD ================================================= */}
      {screen === 6 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>TASK DETAIL DASHBOARD</Text>
          <Text style={styles.screenHeader}>Handle Awkward Silence</Text>

          {/* Top: Animated Grand Piano Illustration */}
          <View style={styles.dashboardPianoBox}>
            <Svg width="120" height="100" viewBox="0 0 100 80">
              <Path d="M15 30 Q45 10 85 30 L85 65 L15 65 Z" fill="#1C1C26" stroke="#CBD5E1" strokeWidth="2" />
              <Rect x="20" y="50" width="60" height="15" rx="2" fill="#FAFAFC" />
            </Svg>
            <Text style={styles.dashboardPianoLabel}>The Symphony of Silence Visual Identity</Text>
          </View>

          {/* Center: Growth Progress Visualization */}
          <View style={styles.dashboardProgressCard}>
            <Text style={styles.dashboardCardTitle}>SILENCE SESSION METRICS</Text>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Target Duration</Text>
                <Text style={styles.metricValue}>3 Minutes (300 Task Points)</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🎼🤍</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Core Objective</Text>
                <Text style={styles.metricValue}>Stay composed during natural conversational silence</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🎵</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Atmosphere</Text>
                <Text style={styles.metricValue}>Piano Black Hall & Floating Musical Staff</Text>
              </View>
            </View>
          </View>

          {/* Bottom: Composed Presence Badge */}
          <View style={styles.dashboardBadgeCard}>
            <Text style={styles.dashboardBadgeIcon}>🏅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashboardBadgeHeader}>REWARD BADGE</Text>
              <Text style={styles.dashboardBadgeName}>Composed Presence</Text>
            </View>
          </View>

          {/* Mandatory Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "The strongest people aren't afraid of silence. They know it has something to say."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => setScreen(1)}
          >
            <LinearGradient
              colors={['#1C1C26', '#0A0A0E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Return to Concert Hall 🎼</Text>
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
    backgroundColor: '#0A0A0E',
  },
  spotlightCone: {
    position: 'absolute',
    top: -80,
    left: width * 0.15,
    width: width * 0.7,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(250, 250, 252, 0.18)',
  },
  notesContainer: {
    position: 'absolute',
    top: height * 0.18,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteParticle: { fontSize: 20 },
  noteParticle2: { fontSize: 18 },
  noteParticle3: { fontSize: 22 },

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
    backgroundColor: 'rgba(28, 28, 38, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFC',
  },
  headerTag: {
    backgroundColor: 'rgba(250, 250, 252, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  dashboardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 28, 38, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },

  screenTagPill: {
    backgroundColor: 'rgba(250, 250, 252, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  screenTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.8,
  },
  screenSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#CBD5E1',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FAFAFC',
    textAlign: 'center',
    marginBottom: 12,
  },

  pianoDisplayCard: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  spotlightBaseLight: {
    width: 140,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(250, 250, 252, 0.25)',
    marginTop: -8,
  },

  headingBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  largeHeadingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FAFAFC',
    textAlign: 'center',
  },
  largeHeadingTextAccent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#CBD5E1',
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
    borderColor: '#FAFAFC',
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
    color: '#0A0A0E',
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
    color: '#64748B',
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
    color: '#FAFAFC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  silenceHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 20,
  },

  // Screen 3 Silence
  silenceContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  silenceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stayPresentPill: {
    backgroundColor: 'rgba(250, 250, 252, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(250, 250, 252, 0.2)',
  },
  stayPresentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FAFAFC',
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
    color: '#94A3B8',
  },

  silenceStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silenceGuidanceBox: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  silenceGuidanceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
  },

  staffContainer: {
    width: '100%',
    marginVertical: 16,
  },
  progressStaffTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(250, 250, 252, 0.15)',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressStaffFill: {
    height: '100%',
    backgroundColor: '#FAFAFC',
  },
  bottomActionWrap: {
    width: '100%',
  },

  // Screen 4 Glowing Piano
  glowingPianoStage: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },

  // Screen 5 Celebration
  badgeUnlockCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 250, 252, 0.2)',
    padding: 24,
    alignItems: 'center',
    marginVertical: 24,
  },
  badgeIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(250, 250, 252, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIconText: { fontSize: 32 },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#CBD5E1',
    letterSpacing: 1.2,
  },
  badgeTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FAFAFC',
    marginVertical: 4,
  },
  badgeSubtitleText: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 14,
  },
  completionPill: {
    backgroundColor: 'rgba(250, 250, 252, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 250, 252, 0.2)',
  },
  completionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FAFAFC',
  },

  // Screen 6 Dashboard
  dashboardPianoBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardPianoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 6,
  },
  dashboardProgressCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 250, 252, 0.15)',
    padding: 20,
    marginBottom: 16,
  },
  dashboardCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#CBD5E1',
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
    color: '#94A3B8',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FAFAFC',
  },

  dashboardBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 250, 252, 0.2)',
    padding: 16,
    marginBottom: 16,
  },
  dashboardBadgeIcon: { fontSize: 32, marginRight: 14 },
  dashboardBadgeHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#CBD5E1',
    letterSpacing: 1,
  },
  dashboardBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFC',
  },

  quoteCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#050508',
    borderWidth: 1,
    borderColor: 'rgba(250, 250, 252, 0.15)',
    padding: 18,
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
});
