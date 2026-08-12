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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 180; // 3 minutes = 180 seconds

// Sample Interests for the Second Line animation
const SAMPLE_INTERESTS = [
  'Loves photography & coffee',
  'Learning acoustic guitar',
  'Enjoys weekend hiking',
  'Coffee & tech enthusiast',
  'Passionate about design',
];

export default function NameBadgeTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sampleInterest] = useState(
    () => SAMPLE_INTERESTS[Math.floor(Math.random() * SAMPLE_INTERESTS.length)]
  );

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState('Every connection begins with a name.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Name Badge Animations
  const badgeFloatAnim = useRef(new Animated.Value(0)).current;
  const badgeRotateAnim = useRef(new Animated.Value(0)).current; // 0deg to 180deg flip
  const nameFadeAnim = useRef(new Animated.Value(0)).current; // Name appears at 0:45
  const interestFadeAnim = useRef(new Animated.Value(0)).current; // 2nd line appears at 1:30
  const jacketClipAnim = useRef(new Animated.Value(0)).current; // Clips to jacket at 2:15
  const badgeGoldenGlow = useRef(new Animated.Value(0.2)).current;

  // Final Cinematic Transformation (Badge -> Golden Circle)
  const goldenCircleScale = useRef(new Animated.Value(1)).current;
  const goldenCircleOpacity = useRef(new Animated.Value(0)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Continuous Badge Float & Gold Ambient Glow Loops
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeFloatAnim, {
          toValue: -12,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(badgeFloatAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeGoldenGlow, {
          toValue: 0.7,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(badgeGoldenGlow, {
          toValue: 0.2,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 3:00 / 180s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Blank name badge floats gently
      setDisplayText('Every connection begins with a name.');
      setSubDisplayText(null);
    } else if (elapsedTime === 45) {
      // 0:45 - Badge slowly rotates 180deg, first name appears
      setDisplayText('Names create familiarity.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(badgeRotateAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nameFadeAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 90) {
      // 1:30 - Second line fades onto badge, prompt to speak aloud
      setDisplayText('Say your simple introduction aloud.');
      setSubDisplayText('Name + One simple sentence');

      Animated.timing(interestFadeAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 135) {
      // 2:15 - Badge gently clips onto jacket, group smiles
      setDisplayText('You are no longer anonymous.');
      setSubDisplayText(null);

      Animated.timing(jacketClipAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime >= 180) {
      // 3:00 - Badge glows softly with golden light
      setDisplayText('Your introduction opened the door.');
      setSubDisplayText(null);

      setTimeout(() => {
        startFinalCinematic();
      }, 3500);
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

  // Start Challenge
  const startChallenge = () => {
    saveProgressBackend({ session_started: true });
    setPhase('active');

    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sceneFadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // FINAL CINEMATIC (Badge -> Golden Circle Transformation)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(goldenCircleOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(goldenCircleScale, {
        toValue: 2.2,
        duration: 3500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(shieldScaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(shieldOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // BACKEND INTEGRATION & COMPLETION
  // ----------------------------------------------------
  const saveProgressBackend = async (dataPayload: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/name-badge/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Introduce Yourself (Name + 1 Line)',
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
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Introduce Yourself (Name + 1 Line)',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '300',
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

    // MANDATORY: Navigate to shared Well Done completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You entered the circle.',
        difficulty: 'hard',
        taskName: 'Introduce Yourself (Name + 1 Line)',
        badge: 'Circle Member',
      },
    } as any);
  };

  // Developer Fast-Forward Helper
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__ || true) {
      const time = Date.now();
      if (time - lastPress.current < 350) {
        setTimeLeft(5); // Jump to 5s remaining
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

  const badgeRotateY = badgeRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const jacketScale = jacketClipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Modern Networking Lounge Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Deep Navy & Soft Silver Base Gradient */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1e3a8a', '#0f172a']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Warm Golden Ambient Glow Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: badgeGoldenGlow,
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
            },
          ]}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'active' && timeLeft > 0) {
                Alert.alert(
                  'Abort Challenge?',
                  'Are you sure you want to stop? Your progress will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
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
            <Feather name="chevron-left" size={24} color="#fbbf24" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE NAME BADGE' : 'NETWORKING LOUNGE'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ============================================================ */}
        {/* PHASE 1: TASK DETAIL PAGE (Onboarding & Visual Identity)     */}
        {/* ============================================================ */}
        <Animated.View
          style={[styles.detailsWrapper, { opacity: uiFadeAnim }]}
          pointerEvents={phase === 'details' ? 'auto' : 'none'}
        >
          {/* Top Hero: Conference Name Badge with Golden Lanyard */}
          <View style={styles.heroBadgeContainer}>
            <View style={styles.heroLanyardClip} />
            <View style={styles.heroBadgeFrame}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(30, 58, 138, 0.8)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Feather name="user-check" size={38} color="#fbbf24" />
              <Text style={styles.heroBadgeName}>YOUR NAME</Text>
              <Text style={styles.heroBadgeSub}>1 Simple Sentence</Text>
            </View>
          </View>

          {/* Central Glass Card */}
          <View style={styles.glassCard}>
            <Text style={styles.taskTitle}>Introduce Yourself</Text>
            <Text style={styles.taskSubTitle}>(Name + 1 Line)</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <Feather name="clock" size={13} color="#fbbf24" />
                <Text style={styles.badgeText}>3 Minutes</Text>
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
                  300 Points
                </Text>
              </View>
            </View>

            {/* Description Text */}
            <Text style={styles.descriptionText}>
              People don't remember perfect introductions. They remember genuine ones.{'\n\n'}
              Today, confidently introduce yourself using only your name and one simple sentence (e.g., 'Hi, I'm Alex. I enjoy photography.').{'\n'}
              Keep it natural. Keep it simple.
            </Text>

            {/* Quote Box */}
            <View style={styles.quoteBox}>
              <Feather name="award" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={styles.quoteText}>
                "People don't remember perfect introductions. They remember genuine ones."
              </Text>
            </View>

            {/* Circle Member Achievement Banner */}
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerEmoji}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeBannerTitle}>Circle Member</Text>
                <Text style={styles.badgeBannerSub}>
                  Unlock achievement by introducing yourself genuinely
                </Text>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={startChallenge}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#1d4ed8', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>ENTER THE CIRCLE</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN NAME BADGE SCENE & GOLDEN CIRCLE CINEMATIC */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Networking Lounge Stage */}
          <View style={styles.badgeStage}>
            {phase !== 'cinematic' ? (
              <Animated.View
                style={[
                  styles.floatingBadgeCard,
                  {
                    transform: [
                      { translateY: badgeFloatAnim },
                      { rotateY: badgeRotateY },
                      { scale: jacketScale },
                    ],
                  },
                ]}
              >
                {/* Silver & Metallic Conference Badge Card Surface */}
                <LinearGradient
                  colors={['#1e293b', '#0f172a', '#1e3a8a']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Top Metallic Lanyard Slot */}
                <View style={styles.badgeTopSlot} />

                {/* Badge Header Banner */}
                <View style={styles.badgeHeaderBanner}>
                  <Text style={styles.badgeHeaderBannerText}>COMMUNITY MEMBER</Text>
                </View>

                {/* First Name Field (Fades in at 0:45) */}
                <Animated.View
                  style={[
                    styles.nameFieldContainer,
                    { opacity: nameFadeAnim },
                  ]}
                >
                  <Text style={styles.nameFieldLabel}>HELLO, MY NAME IS</Text>
                  <Text style={styles.nameFieldValue}>YOUR NAME</Text>
                </Animated.View>

                {/* Second Interest Line Field (Fades in at 1:30) */}
                <Animated.View
                  style={[
                    styles.interestFieldContainer,
                    { opacity: interestFadeAnim },
                  ]}
                >
                  <Ionicons name="sparkles" size={14} color="#fbbf24" />
                  <Text style={styles.interestFieldValue}>{sampleInterest}</Text>
                </Animated.View>

                {/* Gold Lanyard Line Visual */}
                <View style={styles.lanyardStrapVisual} />
              </Animated.View>
            ) : (
              /* FINAL CINEMATIC: Badge transforms into Expanding Golden Circle */
              <View style={styles.goldenCircleStage}>
                <Animated.View
                  style={[
                    styles.goldenCircleRing,
                    {
                      transform: [{ scale: goldenCircleScale }],
                      opacity: goldenCircleOpacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#ffffff', '#fbbf24', '#1d4ed8']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>

                <Animated.View
                  style={[
                    styles.cinematicShieldIcon,
                    {
                      transform: [{ scale: shieldScaleAnim }],
                      opacity: shieldOpacityAnim,
                    },
                  ]}
                >
                  <Feather name="user-check" size={54} color="#ffffff" />
                </Animated.View>
              </View>
            )}
          </View>

          {/* Central Display Text */}
          <View style={styles.displayTextContainer}>
            <Text style={styles.mainDisplayText}>{displayText}</Text>
            {subDisplayText && (
              <Text style={styles.subDisplayText}>{subDisplayText}</Text>
            )}
          </View>

          {/* Footer Controls (No Timer Rings or Progress Bars, pure aesthetic digits) */}
          {phase === 'active' && (
            <View style={styles.footerControls}>
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
                      'Are you sure you want to stop? Your progress will be lost.',
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

          {/* Final Achievement Banner (Phase 3) */}
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
                    Circle Member
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "Every friendship begins with a simple introduction."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1d4ed8', '#fbbf24']}
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
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
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
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  headerTagText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding Details Page
  detailsWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadgeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroLanyardClip: {
    width: 14,
    height: 16,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
    marginBottom: -6,
    zIndex: 2,
  },
  heroBadgeFrame: {
    width: 120,
    height: 150,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroBadgeName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
  },
  heroBadgeSub: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    shadowColor: '#fbbf24',
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
    color: '#fbbf24',
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
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
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
    color: '#fbbf24',
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    color: '#fef3c7',
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
    marginBottom: 20,
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
    color: '#fbbf24',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
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

  // Phase 2 & 3: Main Scene
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  badgeStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  floatingBadgeCard: {
    width: width * 0.72,
    height: height * 0.38,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 12,
  },
  badgeTopSlot: {
    width: 44,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  badgeHeaderBanner: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgeHeaderBannerText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  nameFieldContainer: {
    alignItems: 'center',
  },
  nameFieldLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  nameFieldValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 1,
  },
  interestFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  interestFieldValue: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  lanyardStrapVisual: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.5)',
    borderRadius: 1.5,
  },

  // Final Golden Circle Cinematic
  goldenCircleStage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldenCircleRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#fbbf24',
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  cinematicShieldIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Display Text
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
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },

  // Footer Controls
  footerControls: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  timerText: {
    color: '#fbbf24',
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 14,
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
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
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
    color: '#fbbf24',
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
    color: '#cbd5e1',
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
