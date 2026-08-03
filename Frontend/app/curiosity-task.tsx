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

import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 420; // 7 minutes = 420 seconds

// Constellation Star Nodes (Dreams, Experiences, Memories, Values, Challenges)
const CONSTELLATION_NODES = [
  { id: 1, name: 'Dreams', x: -60, y: -45, color: '#3b82f6' },
  { id: 2, name: 'Experiences', x: 65, y: -40, color: '#60a5fa' },
  { id: 3, name: 'Memories', x: -80, y: 30, color: '#93c5fd' },
  { id: 4, name: 'Values', x: 75, y: 35, color: '#38bdf8' },
  { id: 5, name: 'Challenges', x: 0, y: 70, color: '#2563eb' },
];

export default function CuriosityTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState('Every person has a story.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Observatory Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Telescope Rotation & Lens Motion
  const telescopeRotateAnim = useRef(new Animated.Value(0)).current;
  const telescopeFocusAnim = useRef(new Animated.Value(1)).current;

  // Light & Constellation Animations
  const sapphireLightGlow = useRef(new Animated.Value(0.2)).current;
  const constellationFadeAnim = useRef(new Animated.Value(0)).current;
  const constellationConnectAnim = useRef(new Animated.Value(0)).current;
  const roofOpenAnim = useRef(new Animated.Value(0)).current;

  // Final Cinematic Transformation (Two Connected Circles)
  const connectedCirclesScale = useRef(new Animated.Value(0)).current;
  const connectedCirclesOpacity = useRef(new Animated.Value(0)).current;

  // Continuous background ambient telescoping & starlight breathing
  useEffect(() => {
    // Subtle telescope drift
    Animated.loop(
      Animated.sequence([
        Animated.timing(telescopeRotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(telescopeRotateAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Starlight pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(sapphireLightGlow, {
          toValue: 0.7,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sapphireLightGlow, {
          toValue: 0.2,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 7:00 / 420s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Observatory dark, telescope slowly turns
      setDisplayText('Every person has a story.');
      setSubDisplayText(null);
    } else if (elapsedTime === 60) {
      // 1:00 - Telescope points toward a glowing sapphire light
      setDisplayText("Don't search for answers.");
      setSubDisplayText(null);
    } else if (elapsedTime === 120) {
      // 2:00 - Light slowly becomes brighter
      setDisplayText('Search for understanding.');
      setSubDisplayText(null);
    } else if (elapsedTime === 180) {
      // 3:00 - Soft constellations begin forming (Dreams, Experiences, Memories, Values, Challenges)
      setDisplayText('Observe without judging.');
      setSubDisplayText('Dreams • Experiences • Memories • Values • Challenges');

      Animated.timing(constellationFadeAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 270) {
      // 4:30 - Telescope automatically focuses
      setDisplayText('Stay curious.');
      setSubDisplayText(null);

      Animated.timing(telescopeFocusAnim, {
        toValue: 1.25,
        duration: 3500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 360) {
      // 6:00 - Stars slowly connect together
      setDisplayText('The more you understand...');

      Animated.timing(constellationConnectAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        setSubDisplayText('...the closer you become.');
      }, 2500);
    } else if (elapsedTime >= 420) {
      // 7:00 - Roof opens, morning light fills room, Final Cinematic
      setDisplayText('You chose understanding.');
      setSubDisplayText(null);

      Animated.timing(roofOpenAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start();

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
  // FINAL CINEMATIC (Constellations -> Two Connected Circles)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.spring(connectedCirclesScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(connectedCirclesOpacity, {
        toValue: 1,
        duration: 1000,
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
        await fetch(`${API_BASE_URL}/api/tasks/curiosity/save-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Express Genuine Curiosity',
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
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Express Genuine Curiosity',
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
        message: 'You connected deeply.',
        difficulty: 'hard',
        taskName: 'Express Genuine Curiosity',
        badge: 'Deep Explorer',
      },
    } as any);
  };

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  const interpolatedTelescopeRotate = telescopeRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Modern Architectural Observatory Glass Ceiling Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Midnight Blue Gradient */}
        <LinearGradient
          colors={['#0a0f24', '#0b132b', '#1c2541', '#0a0f24']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Sapphire Light Beam overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: sapphireLightGlow,
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Dawn Roof Opening overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: roofOpenAnim,
              backgroundColor: 'rgba(224, 242, 254, 0.15)',
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
            <Feather name="chevron-left" size={24} color="#93c5fd" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE OBSERVATORY' : 'DEEP CURIOSITY'}
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
          {/* Top Animated Observatory Dome & Telescope Hero */}
          <View style={styles.heroDomeContainer}>
            <Animated.View
              style={[
                styles.heroDomeGlass,
                { transform: [{ rotateZ: interpolatedTelescopeRotate }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(11, 19, 43, 0.9)']}
                style={StyleSheet.absoluteFillObject}
              />
              <MaterialCommunityIcons name="telescope" size={48} color="#93c5fd" />
              <View style={styles.heroStarDot1} />
              <View style={styles.heroStarDot2} />
            </Animated.View>
          </View>

          {/* Central Glass Card */}
          <View style={styles.glassCard}>
            <Text style={styles.taskTitle}>Express Genuine Curiosity</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <Feather name="clock" size={13} color="#93c5fd" />
                <Text style={styles.badgeText}>7 Minutes</Text>
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
              Every person is like an unexplored world. Curiosity is the telescope.{'\n\n'}
              The goal isn't to search for answers. It's to keep looking.{'\n'}
              Become genuinely interested in another person's experiences, thoughts, and perspective.
            </Text>

            {/* Quote Box */}
            <View style={styles.quoteBox}>
              <Feather name="compass" size={18} color="#60a5fa" style={{ marginRight: 8 }} />
              <Text style={styles.quoteText}>
                "The deepest connections begin when we become more interested than impressive."
              </Text>
            </View>

            {/* Deep Explorer Achievement Banner */}
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerEmoji}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeBannerTitle}>Deep Explorer</Text>
                <Text style={styles.badgeBannerSub}>
                  Unlock achievement by choosing understanding
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
                colors={['#1d4ed8', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>ENTER THE OBSERVATORY</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN OBSERVATORY SCENE & FINAL CINEMATIC        */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Observatory Dome Arena */}
          <View style={styles.observatoryDomeStage}>
            {/* Glass Ceiling Dome Frame */}
            <View style={styles.glassDomeFrame}>
              {/* Rotating Telescope Lens */}
              <Animated.View
                style={[
                  styles.telescopeLensContainer,
                  {
                    transform: [
                      { rotateZ: interpolatedTelescopeRotate },
                      { scale: telescopeFocusAnim },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="telescope"
                  size={64}
                  color="#93c5fd"
                />
              </Animated.View>

              {/* Constellation Nodes (Dreams, Experiences, Memories, Values, Challenges) */}
              {phase !== 'cinematic' && (
                <Animated.View
                  style={[
                    styles.constellationContainer,
                    { opacity: constellationFadeAnim },
                  ]}
                >
                  {CONSTELLATION_NODES.map((node) => (
                    <View
                      key={node.id}
                      style={[
                        styles.starNodePill,
                        {
                          transform: [
                            { translateX: node.x },
                            { translateY: node.y },
                          ],
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.starDot,
                          { backgroundColor: node.color },
                        ]}
                      />
                      <Text style={styles.starNodeText}>{node.name}</Text>
                    </View>
                  ))}

                  {/* Connecting Star Lines when understanding emerges */}
                  <Animated.View
                    style={[
                      styles.connectingLineRing,
                      { opacity: constellationConnectAnim },
                    ]}
                  />
                </Animated.View>
              )}

              {/* FINAL CINEMATIC: Two Connected Glowing Circles */}
              {phase === 'cinematic' && (
                <Animated.View
                  style={[
                    styles.connectedCirclesWrapper,
                    {
                      transform: [{ scale: connectedCirclesScale }],
                      opacity: connectedCirclesOpacity,
                    },
                  ]}
                >
                  <View style={styles.connectedCircleLeft}>
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>
                  <View style={styles.connectedCircleRight}>
                    <LinearGradient
                      colors={['#60a5fa', '#38bdf8']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>
                  <View style={styles.connectedOverlapGlow} />
                </Animated.View>
              )}
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
                { opacity: connectedCirclesOpacity },
              ]}
            >
              <View style={styles.achievementBadgeRow}>
                <Text style={styles.achievementBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={styles.achievementBadgeTag}>
                    ACHIEVEMENT UNLOCKED
                  </Text>
                  <Text style={styles.achievementBadgeTitle}>
                    Deep Explorer
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "Curiosity creates connection."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1d4ed8', '#3b82f6']}
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
    backgroundColor: '#0a0f24',
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
    borderColor: 'rgba(147, 197, 253, 0.25)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  headerTagText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Details Page
  detailsWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDomeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroDomeGlass: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroStarDot1: {
    position: 'absolute',
    top: 25,
    left: 30,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  heroStarDot2: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#60a5fa',
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(28, 37, 65, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 197, 253, 0.25)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
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
    backgroundColor: 'rgba(147, 197, 253, 0.12)',
    borderColor: 'rgba(147, 197, 253, 0.35)',
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
    color: '#93c5fd',
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
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
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
    color: '#93c5fd',
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
  observatoryDomeStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  glassDomeFrame: {
    width: width * 0.82,
    height: height * 0.42,
    borderRadius: width * 0.41,
    borderWidth: 3,
    borderColor: 'rgba(147, 197, 253, 0.3)',
    backgroundColor: 'rgba(11, 19, 43, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  telescopeLensContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  constellationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starNodePill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  starDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  starNodeText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '700',
  },
  connectingLineRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    borderStyle: 'dashed',
  },

  // Final Cinematic: Two Connected Circles
  connectedCirclesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedCircleLeft: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginRight: -25,
    opacity: 0.85,
  },
  connectedCircleRight: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    opacity: 0.85,
  },
  connectedOverlapGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    opacity: 0.9,
    shadowColor: '#ffffff',
    shadowOpacity: 1,
    shadowRadius: 15,
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
    color: '#60a5fa',
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
    color: '#60a5fa',
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
    backgroundColor: 'rgba(28, 37, 65, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 197, 253, 0.4)',
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
    color: '#60a5fa',
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
