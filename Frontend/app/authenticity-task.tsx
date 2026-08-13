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
  ScrollView,
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

// Floating Glass Light Particles for Mirror Scene
const LIGHT_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * (width * 0.7) - width * 0.35,
  y: Math.random() * (height * 0.3) - height * 0.15,
  size: 3 + Math.random() * 5,
  delay: i * 200,
}));

export default function AuthenticityTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Display Text
  const [displayText, setDisplayText] = useState('People know your name.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Mirror Animations
  const fogOpacityAnim = useRef(new Animated.Value(1)).current; // 1 = fully fogged, 0 = crystal clear
  const glassShineAnim = useRef(new Animated.Value(0)).current;
  const backlightGlowAnim = useRef(new Animated.Value(0.2)).current;
  const warmRoomLightAnim = useRef(new Animated.Value(0)).current;
  const particleFloatAnim = useRef(new Animated.Value(0)).current;

  // Final Cinematic Transformation (Mirror -> Pure Light)
  const pureLightScaleAnim = useRef(new Animated.Value(1)).current;
  const pureLightOpacityAnim = useRef(new Animated.Value(0)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Ambient Mirror Glass Pulse & Reflection Drift
  useEffect(() => {
    // Glass reflection shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(glassShineAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glassShineAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating Starlight Particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloatAnim, {
          toValue: -15,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleFloatAnim, {
          toValue: 0,
          duration: 3500,
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
      // 0:00 - Mirror is slightly fogged
      setDisplayText('People know your name.');
      setSubDisplayText(null);

      setTimeout(() => {
        setSubDisplayText('They rarely know the real you.');
      }, 2500);
    } else if (elapsedTime === 45) {
      // 0:45 - Fog slowly begins to clear, soft light behind mirror
      setDisplayText('Authenticity begins with one honest moment.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(fogOpacityAnim, {
          toValue: 0.65,
          duration: 4000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backlightGlowAnim, {
          toValue: 0.55,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 90) {
      // 1:30 - Reflection becomes clearer, light particles drift
      setDisplayText("You don't need to impress.");
      setSubDisplayText(null);

      Animated.timing(fogOpacityAnim, {
        toValue: 0.3,
        duration: 4000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        setSubDisplayText('You only need to be real.');
      }, 2500);
    } else if (elapsedTime === 135) {
      // 2:15 - Mirror becomes almost completely clear, warm light fills room
      setDisplayText('Real connection begins when people meet the real you.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(fogOpacityAnim, {
          toValue: 0.05,
          duration: 4000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(warmRoomLightAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime >= 180) {
      // 3:00 - Mirror is perfectly clear, glowing with soft warm light
      setDisplayText('You chose authenticity.');
      setSubDisplayText(null);

      Animated.timing(fogOpacityAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        startFinalCinematic();
      }, 3000);
    }
  }, [elapsedTime, phase, isPaused]);

  // Main Timer Count-down
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
  // FINAL CINEMATIC (Mirror -> Pure Light Transformation)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(pureLightOpacityAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(pureLightScaleAnim, {
        toValue: 2,
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
        await apiFetch('/api/tasks/authenticity/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Share Something Real About Yourself',
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

    let pointsData = { pointsAdded: '600', totalPoints: '0', streak: '0' };
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
            task_name: 'Share Something Real About Yourself',
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

    // MANDATORY: Navigate to shared Well Done completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You were authentic.',
        difficulty: 'hard',
        taskName: 'Share Something Real About Yourself',
        badge: 'True Reflection',
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

  const glassShineX = glassShineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* The True Reflection Glassmorphic Background Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Soft Ivory & Pearl Silver & Gentle Blue Base */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155', '#0f172a']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Backlight Glow behind mirror */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: backlightGlowAnim,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Warm Room Light Overlay at 2:15 */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: warmRoomLightAnim,
              backgroundColor: 'rgba(254, 240, 138, 0.12)',
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
            <Feather name="chevron-left" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE TRUE REFLECTION' : 'AUTHENTIC SELF'}
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
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Hero: Elegant Mirror with Fogged & Clearing Preview */}
            <View style={styles.heroMirrorContainer}>
              <View style={styles.heroMirrorFrame}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.25)', 'rgba(56, 189, 248, 0.05)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="sparkles-outline" size={38} color="#e2e8f0" />
                <Text style={styles.heroMirrorLabel}>AUTHENTICITY</Text>
                <View style={styles.heroMirrorFogOverlay} />
              </View>
            </View>

            {/* Central Glass Panel */}
            <View style={styles.glassCard}>
              <Text style={styles.taskTitle}>Share Something Real</Text>
              <Text style={styles.taskSubTitle}>About Yourself</Text>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.badgePill}>
                  <Feather name="clock" size={13} color="#38bdf8" />
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
                    600 Points
                  </Text>
                </View>
              </View>

              {/* Description Text */}
              <Text style={styles.descriptionText}>
                Authenticity isn't about revealing everything. It's about revealing something real.{'\n\n'}
                Today, share one real thing about yourself with another person—a value, a hobby, a goal, or a challenge.{'\n'}
                The focus is authenticity, not perfection.
              </Text>

              {/* Quote Box */}
              <View style={styles.quoteBox}>
                <Feather name="sun" size={18} color="#38bdf8" style={{ marginRight: 8 }} />
                <Text style={styles.quoteText}>
                  "Authenticity isn't about revealing everything. It's about revealing something real."
                </Text>
              </View>

              {/* True Reflection Achievement Banner */}
              <View style={styles.badgeBanner}>
                <Text style={styles.badgeBannerEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeBannerTitle}>True Reflection</Text>
                  <Text style={styles.badgeBannerSub}>
                    Unlock achievement by allowing someone to meet the real you
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
                  colors={['#0284c7', '#38bdf8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>ENTER THE TRUE REFLECTION</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN MIRROR SCENE & FINAL LIGHT CINEMATIC       */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Arena: Fogged to Clear Mirror */}
          <View style={styles.mirrorStage}>
            {phase !== 'cinematic' ? (
              <View style={styles.mirrorFrame}>
                {/* Mirror Glass Surface */}
                <LinearGradient
                  colors={['#1e293b', '#0f172a', '#1e293b']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Shimmer Light Reflection Line */}
                <Animated.View
                  style={[
                    styles.shimmerLine,
                    { transform: [{ translateX: glassShineX }] },
                  ]}
                />

                {/* Floating Light Starlight Particles */}
                {LIGHT_PARTICLES.map((p) => (
                  <Animated.View
                    key={p.id}
                    style={{
                      position: 'absolute',
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: '#38bdf8',
                      opacity: 0.65,
                      transform: [
                        { translateX: p.x },
                        { translateY: Animated.add(p.y, particleFloatAnim) },
                      ],
                    }}
                  />
                ))}

                {/* Center Silhouette Reflection */}
                <View style={styles.silhouetteWrapper}>
                  <Ionicons
                    name="person"
                    size={110}
                    color="rgba(226, 232, 240, 0.45)"
                  />
                </View>

                {/* Fog Condensation Layer (Opacity fades from 1 -> 0 over 3 mins) */}
                <Animated.View
                  style={[
                    styles.mirrorFogLayer,
                    { opacity: fogOpacityAnim },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.45)', 'rgba(203, 213, 225, 0.6)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
            ) : (
              /* FINAL CINEMATIC: Mirror transforms into Pure Expanding Light */
              <View style={styles.pureLightStage}>
                <Animated.View
                  style={[
                    styles.pureLightCircle,
                    {
                      transform: [{ scale: pureLightScaleAnim }],
                      opacity: pureLightOpacityAnim,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#ffffff', '#38bdf8', '#0284c7']}
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
                  <Ionicons name="sparkles" size={64} color="#ffffff" />
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
                    True Reflection
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "You allowed someone to meet the real you."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0284c7', '#38bdf8']}
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
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  headerTagText: {
    color: '#38bdf8',
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
    alignItems: 'center',
  },
  heroMirrorContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroMirrorFrame: {
    width: 110,
    height: 150,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  heroMirrorLabel: {
    color: '#e2e8f0',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  heroMirrorFogOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    shadowColor: '#38bdf8',
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
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
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
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
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
    color: '#38bdf8',
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
  mirrorStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mirrorFrame: {
    width: width * 0.72,
    height: height * 0.42,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  shimmerLine: {
    position: 'absolute',
    top: -50,
    width: 60,
    height: height * 0.55,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '25deg' }],
  },
  silhouetteWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mirrorFogLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Final Cinematic Pure Light
  pureLightStage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pureLightCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#ffffff',
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
    color: '#38bdf8',
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
    color: '#38bdf8',
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
    borderColor: 'rgba(56, 189, 248, 0.4)',
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
    color: '#38bdf8',
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
