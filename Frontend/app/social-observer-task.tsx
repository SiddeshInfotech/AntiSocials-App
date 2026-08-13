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
const TOTAL_DURATION = 300; // 5 minutes = 300 seconds

// Group Members on stage (Speaker, Listener, Storyteller, Thinker)
const STAGE_NODES = [
  { id: 1, name: 'Speaker', x: -65, y: -35, role: 'Storyteller' },
  { id: 2, name: 'Listener', x: 65, y: -35, role: 'Active Listener' },
  { id: 3, name: 'Thinker', x: -50, y: 45, role: 'Contributor' },
  { id: 4, name: 'Observer', x: 50, y: 45, role: 'Welcomer' },
];

export default function SocialObserverTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState('Quiet observation reveals invisible connections.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Visual Atmosphere & Dynamic Node Connections
  const spotlightGlowAnim = useRef(new Animated.Value(0.3)).current;
  const nodePulseAnim = useRef(new Animated.Value(1)).current;
  const connectionLineAnim = useRef(new Animated.Value(0)).current; // Fades in shared flow lines
  const warmAmberFill = useRef(new Animated.Value(0)).current; // 5:00 full amber glow

  // Final Cinematic
  const finalZoomAnim = useRef(new Animated.Value(1)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Ambient Spotlight & Node Breath Loops
  useEffect(() => {
    // Spotlight Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(spotlightGlowAnim, {
          toValue: 0.8,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(spotlightGlowAnim, {
          toValue: 0.35,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle pulsing of communicative nodes
    Animated.loop(
      Animated.sequence([
        Animated.timing(nodePulseAnim, {
          toValue: 1.15,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(nodePulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 5:00 / 300s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Theater stage spotlight illuminates the social space
      setDisplayText('Quiet observation reveals invisible connections.');
      setSubDisplayText(null);
    } else if (elapsedTime === 60) {
      // 1:00 - Notice the flow of turns
      setDisplayText('Notice the conversational rhythm.');
      setSubDisplayText('Who speaks? Who listens? Where does attention flow?');

      Animated.timing(connectionLineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 120) {
      // 2:00 - Energy shifts
      setDisplayText('Observe subtle shifts in tone and posture.');
      setSubDisplayText(null);
    } else if (elapsedTime === 240) {
      // 4:00 - Calm understanding settles
      setDisplayText('You are attuned to the natural social rhythm.');
      setSubDisplayText(null);
    } else if (elapsedTime >= 300) {
      // 5:00 - Complete harmony illumination
      setDisplayText('Observation creates confidence.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(warmAmberFill, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(finalZoomAnim, {
          toValue: 1.12,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

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
  // FINAL CINEMATIC (Social Intuition Achievement)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
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
        await apiFetch('/api/tasks/social-observer/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Observe Group Dynamics',
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
            task_name: 'Observe Group Dynamics',
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
        message: 'You learned the rhythm of connection.',
        difficulty: 'medium',
        taskName: 'Observe Group Dynamics',
        badge: 'Social Intuition',
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Atmospheric Rich Burgundy & Golden Spotlight Atmosphere */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Wine & Dark Velvet Gradient */}
        <LinearGradient
          colors={['#180509', '#2d0612', '#4c0519', '#180509']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Ambient Golden Stage Light */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: spotlightGlowAnim,
              backgroundColor: 'rgba(251, 191, 36, 0.14)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Full Amber Light Saturation at 5:00 */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: warmAmberFill,
              backgroundColor: 'rgba(245, 158, 11, 0.22)',
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
              {phase === 'details' ? 'THE SOCIAL STAGE' : 'GROUP DYNAMICS'}
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
            {/* Top Hero: Theatre Stage Spotlight & Masks */}
            <View style={styles.heroStageContainer}>
              <View style={styles.heroStageFrame}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.35)', 'rgba(76, 5, 25, 0.9)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <MaterialCommunityIcons name="theater" size={48} color="#fbbf24" />
                <Text style={styles.heroStageLabel}>THE SOCIAL STAGE</Text>
              </View>
            </View>

            {/* Central Glass Card */}
            <View style={styles.glassCard}>
              <Text style={styles.taskTitle}>Observe Group Dynamics</Text>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.badgePill}>
                  <Feather name="clock" size={13} color="#fbbf24" />
                  <Text style={styles.badgeText}>5 Minutes</Text>
                </View>
                <View style={[styles.badgePill, styles.badgeMedium]}>
                  <Ionicons name="flame" size={13} color="#fbbf24" />
                  <Text style={[styles.badgeText, { color: '#fbbf24' }]}>
                    ⭐⭐ Medium
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
                Those who understand the rhythm of a group rarely feel out of place.{'\n\n'}
                Today, quietly observe how a small group naturally communicates—notice the rhythm, energy, body language, and turn-taking before participating.
              </Text>

              {/* Quote Box */}
              <View style={styles.quoteBox}>
                <Feather name="eye" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
                <Text style={styles.quoteText}>
                  "Those who understand the rhythm of a group rarely feel out of place."
                </Text>
              </View>

              {/* Social Intuition Achievement Banner */}
              <View style={styles.badgeBanner}>
                <Text style={styles.badgeBannerEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeBannerTitle}>Social Intuition</Text>
                  <Text style={styles.badgeBannerSub}>
                    Unlock achievement by observing group conversation dynamics
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
                  colors={['#b45309', '#f59e0b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>BEGIN OBSERVATION</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN SOCIAL STAGE SCENE & EQUAL LIGHT CINEMATIC */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Theatre Arena */}
          <View style={styles.theatreStageArena}>
            <View style={styles.theatreStageFrame}>
              <LinearGradient
                colors={['#4c0519', '#1c1917', '#881337']}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Dynamic Theatre Spotlight Beam */}
              {phase !== 'cinematic' && (
                <Animated.View
                  style={[
                    styles.spotlightBeamCone,
                    { opacity: spotlightOpacity },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(254, 240, 138, 0.45)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              )}

              {/* Group Members on Stage */}
              <View style={styles.stageNodesGrid}>
                {STAGE_NODES.map((node) => (
                  <View
                    key={node.id}
                    style={[
                      styles.stageNodeCard,
                      {
                        transform: [
                          { translateX: node.x },
                          { translateY: node.y },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.stageNodeAvatar}>
                      <Ionicons
                        name="person"
                        size={24}
                        color={node.id === 1 ? '#fbbf24' : '#f8fafc'}
                      />
                    </View>
                    <Text style={styles.stageNodeRole}>{node.role}</Text>
                  </View>
                ))}
              </View>
            </View>
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
                {
                  transform: [{ scale: shieldScaleAnim }],
                  opacity: shieldOpacityAnim,
                },
              ]}
            >
              <View style={styles.achievementBadgeRow}>
                <Text style={styles.achievementBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={styles.achievementBadgeTag}>
                    ACHIEVEMENT UNLOCKED
                  </Text>
                  <Text style={styles.achievementBadgeTitle}>
                    Social Observer
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "The best participants first become great observers."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#881337', '#fbbf24']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+300 PTS)'}
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
    backgroundColor: '#4c0519',
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
  heroStageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroStageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(76, 5, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroStageLabel: {
    color: '#fef08a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(76, 5, 25, 0.9)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 14,
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
  badgeMedium: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
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
  theatreStageArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  theatreStageFrame: {
    width: width * 0.82,
    height: height * 0.42,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(76, 5, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  spotlightBeamCone: {
    position: 'absolute',
    top: 0,
    width: 140,
    height: height * 0.42,
  },
  stageNodesGrid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageNodeCard: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  stageNodeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  stageNodeRole: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '700',
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
    backgroundColor: 'rgba(76, 5, 25, 0.95)',
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
